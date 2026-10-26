import React, { useState, useMemo, useEffect } from "react";
import {
  Wand2,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  BookmarkPlus,
  RotateCcw,
  Copy,
  Image as ImageIcon,
  Rocket,
} from "lucide-react";
import {
  RsaCampaign,
  TIDY_UP_PRESETS,
  HeadlineCategory,
  HeadlinePinnedField,
  DescriptionPinnedField,
  calculateAdStrength,
} from "./data/tidyUpPresets";
import {
  generateAdCombinations,
  buildResolvedFinalUrl,
} from "./utils/googleAdsGenerators";
import { SerpPreviewPanel } from "./components/SerpPreviewPanel";
import { ApiPayloadView } from "./components/ApiPayloadView";
import { SavedCampaignsView } from "./components/SavedCampaignsView";
import { PasteAndSortStudio } from "./components/PasteAndSortStudio";
import { CleaningImageStudio } from "./components/CleaningImageStudio";
import { GoogleAdsLauncherView } from "./components/GoogleAdsLauncherView";

const STORAGE_KEY = "tidy_up_rsa_saved_campaigns_v3";

export default function App() {
  const [activeView, setActiveView] = useState<
    "paste_sort" | "builder" | "images" | "launch" | "api"
  >("paste_sort");

  const [campaign, setCampaign] = useState<RsaCampaign>(
    () => TIDY_UP_PRESETS.edmonton_combined
  );

  const [savedCampaigns, setSavedCampaigns] = useState<RsaCampaign[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [
      TIDY_UP_PRESETS.edmonton_combined,
      TIDY_UP_PRESETS.move_out,
      TIDY_UP_PRESETS.deep_clean,
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCampaigns));
    } catch {
      // ignore storage errors
    }
  }, [savedCampaigns]);

  // AI Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [pinBrandOrCta, setPinBrandOrCta] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [copiedDescAll, setCopiedDescAll] = useState(false);

  // Asset filter & AI trim states
  const [headlineFilter, setHeadlineFilter] = useState<
    "ALL" | HeadlineCategory
  >("ALL");
  const [trimmingAssetId, setTrimmingAssetId] = useState<string | null>(null);
  const [trimSuggestions, setTrimSuggestions] = useState<{
    assetId: string;
    assetType: "headline" | "description";
    options: string[];
  } | null>(null);
  const [expandingAngle, setExpandingAngle] = useState<string | null>(null);

  // Shuffle seed for SERP combinations
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [newNegativeInput, setNewNegativeInput] = useState("");

  const audit = useMemo(() => calculateAdStrength(campaign), [campaign]);

  const combinations = useMemo(() => {
    const rotatedCampaign: RsaCampaign =
      shuffleSeed === 0
        ? campaign
        : {
            ...campaign,
            headlines: [
              ...campaign.headlines.slice(
                shuffleSeed % Math.max(1, campaign.headlines.length)
              ),
              ...campaign.headlines.slice(
                0,
                shuffleSeed % Math.max(1, campaign.headlines.length)
              ),
            ],
            descriptions: [
              ...campaign.descriptions.slice(
                shuffleSeed % Math.max(1, campaign.descriptions.length)
              ),
              ...campaign.descriptions.slice(
                0,
                shuffleSeed % Math.max(1, campaign.descriptions.length)
              ),
            ],
          };
    return generateAdCombinations(rotatedCampaign, 6);
  }, [campaign, shuffleSeed]);

  const updateCampaignMeta = (updates: Partial<RsaCampaign>) => {
    setCampaign((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Handler: Generate full RSA campaign via Server-Side Gemini
  const handleGenerateWithAi = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const response = await fetch("/api/rsa/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: campaign.serviceType,
          location: campaign.location,
          promoOffer: campaign.promoOffer,
          targetKeywords: campaign.targetKeywords,
          negativeKeywords: campaign.negativeKeywords,
          brandTone: campaign.brandTone,
          finalUrl: campaign.finalUrl,
          phoneNumber: campaign.phoneNumber || "780-718-5092",
          pinBrandOrCta,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Failed to generate Responsive Search Ad."
        );
      }

      const validCategories: HeadlineCategory[] = [
        "Keyword",
        "Booking CTA",
        "Trust",
        "Offer",
        "Location",
      ];

      const validHPins: HeadlinePinnedField[] = [
        "UNSPECIFIED",
        "HEADLINE_1",
        "HEADLINE_2",
        "HEADLINE_3",
      ];

      const validDPins: DescriptionPinnedField[] = [
        "UNSPECIFIED",
        "DESCRIPTION_1",
        "DESCRIPTION_2",
      ];

      setCampaign((prev) => ({
        ...prev,
        id: `ai-${Date.now()}`,
        campaignName: data.campaignName || prev.campaignName,
        adGroupName: data.adGroupName || prev.adGroupName,
        path1: (data.path1 || "edmonton").slice(0, 15),
        path2: (data.path2 || "move-out").slice(0, 15),
        headlines: (data.headlines || []).slice(0, 15).map((h: any, i: number) => ({
          id: `ai-h-${Date.now()}-${i}`,
          text: String(h.text || "").trim(),
          pinnedField: validHPins.includes(h.pinnedField)
            ? h.pinnedField
            : "UNSPECIFIED",
          category: validCategories.includes(h.category)
            ? h.category
            : "Keyword",
        })),
        descriptions: (data.descriptions || [])
          .slice(0, 5)
          .map((d: any, i: number) => ({
            id: `ai-d-${Date.now()}-${i}`,
            text: String(d.text || "").trim(),
            pinnedField: validDPins.includes(d.pinnedField)
              ? d.pinnedField
              : "UNSPECIFIED",
            angle: String(d.angle || `Description #${i + 1}`),
          })),
        sitelinks:
          Array.isArray(data.sitelinks) && data.sitelinks.length > 0
            ? data.sitelinks.slice(0, 4).map((sl: any, i: number) => ({
                id: `ai-sl-${i}`,
                linkText: String(sl.linkText || "Book Online").slice(0, 25),
                description1: String(sl.description1 || "").slice(0, 35),
                description2: String(sl.description2 || "").slice(0, 35),
                finalUrl: String(sl.finalUrl || prev.finalUrl),
              }))
            : prev.sitelinks,
        callouts:
          Array.isArray(data.callouts) && data.callouts.length > 0
            ? data.callouts.slice(0, 4).map((c: any) => String(c).slice(0, 25))
            : prev.callouts,
        strategySummary: data.strategySummary || prev.strategySummary,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err: any) {
      setAiError(
        err?.message || "Could not reach AI generator. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: AI Trim / Rewrite single asset to fit <=30 or <=90 chars
  const handleTrimAsset = async (
    assetId: string,
    text: string,
    assetType: "headline" | "description"
  ) => {
    setTrimmingAssetId(assetId);
    setAiError(null);
    try {
      const response = await fetch("/api/rsa/trim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          assetType,
          serviceContext: `${campaign.serviceType} in ${campaign.location} (${campaign.phoneNumber})`,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to rewrite asset.");
      }
      setTrimSuggestions({
        assetId,
        assetType,
        options: Array.isArray(data.alternatives) ? data.alternatives : [],
      });
    } catch (err: any) {
      setAiError(err?.message || "Failed to rewrite asset.");
    } finally {
      setTrimmingAssetId(null);
    }
  };

  // Handler: Expand angle with AI
  const handleExpandAngle = async (
    assetType: "headline" | "description",
    angle: HeadlineCategory
  ) => {
    if (assetType === "headline" && campaign.headlines.length >= 15) return;
    if (assetType === "description" && campaign.descriptions.length >= 5) return;

    setExpandingAngle(angle);
    setAiError(null);
    try {
      const response = await fetch("/api/rsa/expand-angle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetType,
          angle,
          serviceType: campaign.serviceType,
          location: campaign.location,
          existingTexts:
            assetType === "headline"
              ? campaign.headlines.map((h) => h.text)
              : campaign.descriptions.map((d) => d.text),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate additional assets.");
      }

      const items = Array.isArray(data.items) ? data.items : [];
      if (assetType === "headline") {
        const remainingSlots = 15 - campaign.headlines.length;
        const newHeadlines = items.slice(0, remainingSlots).map((item: any, idx: number) => ({
          id: `exp-h-${Date.now()}-${idx}`,
          text: String(item.text || "").trim(),
          pinnedField: "UNSPECIFIED" as HeadlinePinnedField,
          category: angle,
        }));
        updateCampaignMeta({
          headlines: [...campaign.headlines, ...newHeadlines],
        });
      }
    } catch (err: any) {
      setAiError(err?.message || "Failed to expand assets.");
    } finally {
      setExpandingAngle(null);
    }
  };

  const handleSaveCurrentSnapshot = () => {
    setSavedCampaigns((prev) => {
      const exists = prev.some((c) => c.id === campaign.id);
      if (exists) {
        return prev.map((c) => (c.id === campaign.id ? campaign : c));
      }
      return [{ ...campaign, id: `saved-${Date.now()}` }, ...prev];
    });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleCopyAllDescriptions = async () => {
    try {
      await navigator.clipboard.writeText(
        campaign.descriptions.map((d) => d.text).join("\n")
      );
      setCopiedDescAll(true);
      setTimeout(() => setCopiedDescAll(false), 2000);
    } catch {
      // ignore
    }
  };

  const filteredHeadlines = campaign.headlines.filter(
    (h) => headlineFilter === "ALL" || h.category === headlineFilter
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView("paste_sort");
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            TidyUps RSA Studio
          </a>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveView("paste_sort")}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeView === "paste_sort"
                  ? "text-slate-900 border-b-2 border-teal-700 font-semibold"
                  : ""
              }`}
            >
              Paste & Sort
            </button>
            <button
              type="button"
              onClick={() => setActiveView("builder")}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeView === "builder"
                  ? "text-slate-900 border-b-2 border-teal-700 font-semibold"
                  : ""
              }`}
            >
              Ad Builder & SERP
            </button>
            <button
              type="button"
              onClick={() => setActiveView("images")}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeView === "images"
                  ? "text-slate-900 border-b-2 border-teal-700 font-semibold"
                  : ""
              }`}
            >
              AI Image Studio
            </button>
            <button
              type="button"
              onClick={() => setActiveView("launch")}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeView === "launch"
                  ? "text-slate-900 border-b-2 border-teal-700 font-semibold"
                  : ""
              }`}
            >
              Budget & Launch
            </button>
            <button
              type="button"
              onClick={() => setActiveView("api")}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeView === "api"
                  ? "text-slate-900 border-b-2 border-teal-700 font-semibold"
                  : ""
              }`}
            >
              Saved & Export ({savedCampaigns.length})
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating RSA...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate RSA with AI
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Strip */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {(
          [
            { id: "paste_sort", label: "Paste & Sort" },
            { id: "builder", label: "Ad Builder" },
            { id: "images", label: "AI Images" },
            { id: "launch", label: "Budget & Launch" },
            { id: "api", label: `Saved (${savedCampaigns.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveView(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeView === tab.id
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Banner if AI call fails */}
        {aiError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{aiError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAiError(null)}
              className="font-medium underline whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Preset Switcher & Campaign Context Toolbar */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-500">
                TidyUps Cleaning (Edmonton, AB) · Phone:{" "}
                <span className="font-mono font-medium text-slate-800">
                  {campaign.phoneNumber || "780-718-5092"}
                </span>{" "}
                · Booking App:{" "}
                <a
                  href={buildResolvedFinalUrl(campaign)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-teal-700 hover:underline inline-flex items-center gap-1"
                >
                  {campaign.finalUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                {campaign.campaignName}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Preset Segmented Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCampaign(TIDY_UP_PRESETS.edmonton_combined)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    campaign.id === TIDY_UP_PRESETS.edmonton_combined.id
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Edmonton (20 KW)
                </button>
                <button
                  type="button"
                  onClick={() => setCampaign(TIDY_UP_PRESETS.move_out)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    campaign.id === TIDY_UP_PRESETS.move_out.id
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Move-Out & Tenancy (11 KW)
                </button>
                <button
                  type="button"
                  onClick={() => setCampaign(TIDY_UP_PRESETS.deep_clean)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    campaign.id === TIDY_UP_PRESETS.deep_clean.id
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Deep Cleaning (9 KW)
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveCurrentSnapshot}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                {saveFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Saved to Library
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Save Ad Group
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Action Strip for Image Generator & Budget Launch */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
              <span>{campaign.headlines.length}/15 Headlines (≤30c)</span>
              <span aria-hidden="true">·</span>
              <span>{campaign.descriptions.length}/5 Descriptions (≤90c)</span>
              <span aria-hidden="true">·</span>
              <span>{campaign.targetKeywords.length} Positive KW</span>
              <span aria-hidden="true">·</span>
              <span>{campaign.negativeKeywords?.length || 0} Negative KW</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("images")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5 text-teal-700" />
                Generate Home Cleaning Images
              </button>
              <button
                type="button"
                onClick={() => setActiveView("launch")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Rocket className="w-3.5 h-3.5" />
                Set Budget & Launch to Google Ads
              </button>
            </div>
          </div>
        </section>

        {/* View 0: Paste & Sort Studio */}
        {activeView === "paste_sort" && (
          <PasteAndSortStudio
            campaign={campaign}
            onUpdateCampaign={(updated) => setCampaign(updated)}
            onOpenInBuilder={(target) => {
              if (target) setCampaign(target);
              setActiveView("builder");
            }}
          />
        )}

        {/* View 1: Ad Builder & SERP Simulator (2-Column Split) */}
        {activeView === "builder" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): RSA Asset Editor */}
            <div className="lg:col-span-7 space-y-6">
              {/* Final URL & Display Path Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      1. Booking Destination, Phone & Display Path
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configured for TidyUps Cleaning booking app and Edmonton call asset
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateCampaignMeta({ enableUtm: !campaign.enableUtm })
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      campaign.enableUtm
                        ? "bg-teal-50 border-teal-600 text-teal-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {campaign.enableUtm
                      ? "UTM Tracking: Active"
                      : "Enable UTM Tracking"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Final URL (<code className="font-mono">finalUrls[0]</code>)
                    </label>
                    <input
                      type="url"
                      value={campaign.finalUrl}
                      onChange={(e) =>
                        updateCampaignMeta({ finalUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={campaign.phoneNumber || "780-718-5092"}
                      onChange={(e) =>
                        updateCampaignMeta({ phoneNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        Path 1
                      </label>
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          campaign.path1.length > 15
                            ? "text-rose-600 font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        {campaign.path1.length}/15
                      </span>
                    </div>
                    <input
                      type="text"
                      value={campaign.path1}
                      onChange={(e) =>
                        updateCampaignMeta({ path1: e.target.value })
                      }
                      placeholder="move-out"
                      className={`w-full px-2.5 py-2 text-xs font-mono bg-slate-50 border rounded-lg focus:outline-none focus:bg-white ${
                        campaign.path1.length > 15
                          ? "border-rose-500 text-rose-700"
                          : "border-slate-200 focus:border-teal-600"
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        Path 2
                      </label>
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          campaign.path2.length > 15
                            ? "text-rose-600 font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        {campaign.path2.length}/15
                      </span>
                    </div>
                    <input
                      type="text"
                      value={campaign.path2}
                      onChange={(e) =>
                        updateCampaignMeta({ path2: e.target.value })
                      }
                      placeholder="edmonton"
                      className={`w-full px-2.5 py-2 text-xs font-mono bg-slate-50 border rounded-lg focus:outline-none focus:bg-white ${
                        campaign.path2.length > 15
                          ? "border-rose-500 text-rose-700"
                          : "border-slate-200 focus:border-teal-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions Section (Up to 5 Descriptions, <= 90 chars each) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">
                        2. Five TidyUps Descriptions (≤ 90 Characters Each)
                      </h2>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        ({campaign.descriptions.length}/5 assets · Max 90 chars)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Each description is validated against the 90-character limit.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAllDescriptions}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                    >
                      {copiedDescAll ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied All 5
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy All 5
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={campaign.descriptions.length >= 5}
                      onClick={() =>
                        updateCampaignMeta({
                          descriptions: [
                            ...campaign.descriptions,
                            {
                              id: `d-manual-${Date.now()}`,
                              text: "Need move-out or deep cleaning in Edmonton? Call Tidyups at 780-718-5092 today.",
                              pinnedField: "UNSPECIFIED",
                              angle: "Booking CTA",
                            },
                          ],
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Description
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {campaign.descriptions.map((d, index) => {
                    const isOverLimit = d.text.length > 90;
                    const isTrimmingThis = trimmingAssetId === d.id;
                    const activeTrimBox =
                      trimSuggestions?.assetId === d.id ? trimSuggestions : null;

                    return (
                      <div
                        key={d.id}
                        className={`p-3.5 rounded-lg border transition-colors ${
                          isOverLimit
                            ? "border-rose-300 bg-rose-50/30"
                            : "border-slate-200 bg-slate-50/50 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono tabular-nums text-slate-500 font-semibold">
                              Description #{index + 1}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="text-slate-600 font-medium">
                              {d.angle}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-mono tabular-nums ${
                                isOverLimit
                                  ? "text-rose-600 font-bold"
                                  : d.text.length >= 86
                                  ? "text-amber-600 font-medium"
                                  : "text-emerald-700 font-medium"
                              }`}
                            >
                              {d.text.length}/90 chars
                            </span>

                            <select
                              value={d.pinnedField}
                              onChange={(e) =>
                                updateCampaignMeta({
                                  descriptions: campaign.descriptions.map(
                                    (item) =>
                                      item.id === d.id
                                        ? {
                                            ...item,
                                            pinnedField: e.target
                                              .value as DescriptionPinnedField,
                                          }
                                        : item
                                  ),
                                })
                              }
                              className={`px-2 py-1 text-[11px] font-mono rounded-md border focus:outline-none ${
                                d.pinnedField !== "UNSPECIFIED"
                                  ? "bg-teal-50 border-teal-600 text-teal-800 font-semibold"
                                  : "bg-white border-slate-200 text-slate-600"
                              }`}
                            >
                              <option value="UNSPECIFIED">Unpinned</option>
                              <option value="DESCRIPTION_1">Pin: D1</option>
                              <option value="DESCRIPTION_2">Pin: D2</option>
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                handleTrimAsset(d.id, d.text, "description")
                              }
                              disabled={isTrimmingThis}
                              className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                                isOverLimit
                                  ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700"
                                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              {isTrimmingThis ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isOverLimit ? (
                                "AI Trim ≤90"
                              ) : (
                                "AI Rewrite"
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={campaign.descriptions.length <= 2}
                              onClick={() =>
                                updateCampaignMeta({
                                  descriptions: campaign.descriptions.filter(
                                    (item) => item.id !== d.id
                                  ),
                                })
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                              title="Remove description (min 2 required)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={d.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCampaignMeta({
                              descriptions: campaign.descriptions.map((item) =>
                                item.id === d.id
                                  ? { ...item, text: val }
                                  : item
                              ),
                            });
                          }}
                          className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-teal-600 resize-none"
                        />

                        {activeTrimBox && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-teal-800">
                                Select a ≤90 char description alternative:
                              </span>
                              <button
                                type="button"
                                onClick={() => setTrimSuggestions(null)}
                                className="text-[11px] text-slate-400 hover:text-slate-600"
                              >
                                Close
                              </button>
                            </div>
                            {activeTrimBox.options.map((opt, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  updateCampaignMeta({
                                    descriptions: campaign.descriptions.map(
                                      (item) =>
                                        item.id === d.id
                                          ? { ...item, text: opt }
                                          : item
                                    ),
                                  });
                                  setTrimSuggestions(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs bg-white border border-teal-300 rounded-md hover:bg-teal-50 text-slate-800 transition-colors flex items-center justify-between gap-2"
                              >
                                <span>{opt}</span>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {opt.length}/90
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Headlines Section (3 to 15 assets, <= 30 chars each) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">
                        3. Responsive Search Ad Headlines
                      </h2>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        ({campaign.headlines.length}/15 assets · Max 30 chars)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Google Ads combines up to 3 headlines at a time. Leave unpinned or pin to H1, H2, or H3.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={campaign.headlines.length >= 15}
                    onClick={() =>
                      updateCampaignMeta({
                        headlines: [
                          ...campaign.headlines,
                          {
                            id: `h-manual-${Date.now()}`,
                            text: "Call TidyUps: 780-718-5092",
                            pinnedField: "UNSPECIFIED",
                            category: "Booking CTA",
                          },
                        ],
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Headline
                  </button>
                </div>

                {/* Category Filter & AI Angle Expansion Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(
                      [
                        "ALL",
                        "Keyword",
                        "Booking CTA",
                        "Trust",
                        "Offer",
                        "Location",
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setHeadlineFilter(cat)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          headlineFilter === cat
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {cat === "ALL" ? "All Angles" : cat}
                      </button>
                    ))}
                  </div>

                  {campaign.headlines.length < 15 && (
                    <div className="flex items-center gap-1.5">
                      {(["Booking CTA", "Trust", "Offer"] as const).map(
                        (angle) => (
                          <button
                            key={angle}
                            type="button"
                            disabled={expandingAngle !== null}
                            onClick={() => handleExpandAngle("headline", angle)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-teal-200 bg-teal-50/60 text-teal-800 hover:bg-teal-100/70 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                          >
                            {expandingAngle === angle ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            +AI {angle}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Headline Rows */}
                <div className="space-y-2.5">
                  {filteredHeadlines.map((h, index) => {
                    const isOverLimit = h.text.length > 30;
                    const isTrimmingThis = trimmingAssetId === h.id;
                    const activeTrimBox =
                      trimSuggestions?.assetId === h.id ? trimSuggestions : null;

                    return (
                      <div
                        key={h.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isOverLimit
                            ? "border-rose-300 bg-rose-50/30"
                            : "border-slate-200 bg-slate-50/50 hover:bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                          <span className="text-xs font-mono tabular-nums text-slate-400 w-6 shrink-0">
                            #{index + 1}
                          </span>

                          <div className="flex-1 min-w-[180px]">
                            <input
                              type="text"
                              value={h.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateCampaignMeta({
                                  headlines: campaign.headlines.map((item) =>
                                    item.id === h.id
                                      ? { ...item, text: val }
                                      : item
                                  ),
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-teal-600"
                            />
                          </div>

                          <span
                            className={`text-xs font-mono tabular-nums w-12 text-right shrink-0 ${
                              isOverLimit
                                ? "text-rose-600 font-bold"
                                : h.text.length >= 28
                                ? "text-amber-600 font-medium"
                                : "text-slate-500"
                            }`}
                          >
                            {h.text.length}/30
                          </span>

                          <select
                            value={h.category}
                            onChange={(e) =>
                              updateCampaignMeta({
                                headlines: campaign.headlines.map((item) =>
                                  item.id === h.id
                                    ? {
                                        ...item,
                                        category: e.target
                                          .value as HeadlineCategory,
                                      }
                                    : item
                                ),
                              })
                            }
                            className="px-2 py-1.5 text-[11px] text-slate-600 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-teal-600 shrink-0"
                          >
                            <option value="Keyword">Keyword</option>
                            <option value="Booking CTA">Booking CTA</option>
                            <option value="Trust">Trust</option>
                            <option value="Offer">Offer</option>
                            <option value="Location">Location</option>
                          </select>

                          <select
                            value={h.pinnedField}
                            onChange={(e) =>
                              updateCampaignMeta({
                                headlines: campaign.headlines.map((item) =>
                                  item.id === h.id
                                    ? {
                                        ...item,
                                        pinnedField: e.target
                                          .value as HeadlinePinnedField,
                                      }
                                    : item
                                ),
                              })
                            }
                            className={`px-2 py-1.5 text-[11px] font-mono rounded-md border focus:outline-none shrink-0 ${
                              h.pinnedField !== "UNSPECIFIED"
                                ? "bg-teal-50 border-teal-600 text-teal-800 font-semibold"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <option value="UNSPECIFIED">Unpinned</option>
                            <option value="HEADLINE_1">Pin: H1</option>
                            <option value="HEADLINE_2">Pin: H2</option>
                            <option value="HEADLINE_3">Pin: H3</option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              handleTrimAsset(h.id, h.text, "headline")
                            }
                            disabled={isTrimmingThis}
                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                              isOverLimit
                                ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700"
                                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {isTrimmingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isOverLimit ? (
                              "AI Trim ≤30"
                            ) : (
                              "AI Rewrite"
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={campaign.headlines.length <= 3}
                            onClick={() =>
                              updateCampaignMeta({
                                headlines: campaign.headlines.filter(
                                  (item) => item.id !== h.id
                                ),
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {activeTrimBox && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-medium text-teal-800">
                                Pick ≤30 char alternative:
                              </span>
                              {activeTrimBox.options.map((opt, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    updateCampaignMeta({
                                      headlines: campaign.headlines.map(
                                        (item) =>
                                          item.id === h.id
                                            ? { ...item, text: opt }
                                            : item
                                      ),
                                    });
                                    setTrimSuggestions(null);
                                  }}
                                  className="px-2.5 py-1 text-xs bg-white border border-teal-300 rounded-md hover:bg-teal-50 text-slate-800 transition-colors"
                                >
                                  {opt}{" "}
                                  <span className="font-mono text-[10px] text-slate-400">
                                    ({opt.length})
                                  </span>
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setTrimSuggestions(null)}
                              className="text-[11px] text-slate-400 hover:text-slate-600"
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Positive & Negative Keywords Editor Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">
                  4. Positive & Negative Keywords ({campaign.targetKeywords.length} Positive · {campaign.negativeKeywords?.length || 0} Negative)
                </h2>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">
                      Positive Target Keywords
                    </span>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = newKeywordInput.trim().toLowerCase();
                        if (
                          trimmed &&
                          !campaign.targetKeywords.includes(trimmed)
                        ) {
                          updateCampaignMeta({
                            targetKeywords: [
                              ...campaign.targetKeywords,
                              trimmed,
                            ],
                          });
                          setNewKeywordInput("");
                        }
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        placeholder="Add positive keyword..."
                        className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md"
                      >
                        + Add
                      </button>
                    </form>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.targetKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded"
                      >
                        <span>"{kw}"</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCampaignMeta({
                              targetKeywords: campaign.targetKeywords.filter(
                                (_, i) => i !== idx
                              ),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-rose-700">
                      Negative Keywords (Excluded Search Terms)
                    </span>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = newNegativeInput.trim().toLowerCase();
                        const currentNegs = campaign.negativeKeywords || [];
                        if (trimmed && !currentNegs.includes(trimmed)) {
                          updateCampaignMeta({
                            negativeKeywords: [...currentNegs, trimmed],
                          });
                          setNewNegativeInput("");
                        }
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="text"
                        value={newNegativeInput}
                        onChange={(e) => setNewNegativeInput(e.target.value)}
                        placeholder="Add negative keyword..."
                        className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs font-medium bg-rose-700 text-white rounded-md"
                      >
                        + Exclude
                      </button>
                    </form>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(campaign.negativeKeywords || []).map((neg, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-rose-800 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded"
                      >
                        <span>-{neg}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCampaignMeta({
                              negativeKeywords: (
                                campaign.negativeKeywords || []
                              ).filter((_, i) => i !== idx),
                            })
                          }
                          className="text-rose-400 hover:text-rose-700 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Sticky Live Google Search Preview & Ad Strength */}
            <div className="lg:col-span-5 lg:sticky lg:top-20">
              <SerpPreviewPanel
                campaign={campaign}
                combinations={combinations}
                audit={audit}
                onReshuffle={() => setShuffleSeed((s) => s + 1)}
              />
            </div>
          </div>
        )}

        {/* View 2: AI Home Interior & Cleaning Image Studio */}
        {activeView === "images" && (
          <CleaningImageStudio
            campaign={campaign}
            onUpdateCampaignMeta={updateCampaignMeta}
            onOpenSerpPreview={() => setActiveView("builder")}
          />
        )}

        {/* View 3: Connect Google Ads Account, Set Daily Budget & 1-Click Launch */}
        {activeView === "launch" && (
          <GoogleAdsLauncherView
            campaign={campaign}
            onUpdateCampaignMeta={updateCampaignMeta}
          />
        )}

        {/* View 4: Saved Campaigns Library & Google Ads Code/CSV Export */}
        {activeView === "api" && (
          <div className="space-y-8">
            <SavedCampaignsView
              savedCampaigns={savedCampaigns}
              activeCampaignId={campaign.id}
              onSelectCampaign={(selected) => {
                setCampaign(selected);
                setActiveView("builder");
              }}
              onDeleteCampaign={(id) =>
                setSavedCampaigns((prev) => prev.filter((c) => c.id !== id))
              }
              onDuplicateCampaign={(source) =>
                setSavedCampaigns((prev) => [
                  {
                    ...source,
                    id: `dup-${Date.now()}`,
                    adGroupName: `${source.adGroupName} (Copy)`,
                    updatedAt: new Date().toISOString(),
                  },
                  ...prev,
                ])
              }
              onSaveCurrent={handleSaveCurrentSnapshot}
            />

            <ApiPayloadView
              campaign={campaign}
              savedCampaigns={savedCampaigns}
              onUpdateCampaignMeta={updateCampaignMeta}
            />
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-4 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            TidyUps Cleaning (Edmonton, AB · 780-718-5092) · Responsive Search Ad Studio ·{" "}
            <a
              href="https://app.tidyupscleaning.com/booking"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-700 hover:underline font-mono"
            >
              app.tidyupscleaning.com/booking
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCampaign(TIDY_UP_PRESETS.edmonton_combined)}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Edmonton Preset
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
