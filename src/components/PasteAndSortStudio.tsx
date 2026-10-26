import React, { useState } from "react";
import {
  Wand2,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  SlidersHorizontal,
  ShieldAlert,
  Sparkles,
  Phone,
  RotateCcw,
} from "lucide-react";
import {
  RsaCampaign,
  DEFAULT_USER_RAW_DUMP,
  TIDY_UP_PRESETS,
  instantParseAndSortDump,
  HeadlineCategory,
  HeadlinePinnedField,
  DescriptionPinnedField,
} from "../data/tidyUpPresets";

interface PasteAndSortStudioProps {
  campaign: RsaCampaign;
  onUpdateCampaign: (updated: RsaCampaign) => void;
  onOpenInBuilder: (targetCampaign?: RsaCampaign) => void;
}

export const PasteAndSortStudio: React.FC<PasteAndSortStudioProps> = ({
  campaign,
  onUpdateCampaign,
  onOpenInBuilder,
}) => {
  const [rawText, setRawText] = useState<string>(DEFAULT_USER_RAW_DUMP);
  const [isAiSorting, setIsAiSorting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [positiveMatchFormat, setPositiveMatchFormat] = useState<
    "phrase" | "exact" | "broad"
  >("phrase");
  const [negativeMatchFormat, setNegativeMatchFormat] = useState<
    "quoted" | "minus" | "plain"
  >("quoted");

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  // Instant deterministic sort & ad builder
  const handleInstantSort = () => {
    setErrorMsg(null);
    const parsed = instantParseAndSortDump(rawText);

    const updated: RsaCampaign = {
      ...campaign,
      id: `sorted-${Date.now()}`,
      campaignName: `Search - TidyUps ${parsed.detectedLocation} - Sorted Campaign`,
      adGroupName: "Edmonton Move-Out & Deep Cleaning",
      location: parsed.detectedLocation,
      phoneNumber: parsed.detectedPhone,
      targetKeywords:
        parsed.positiveKeywords.length > 0
          ? parsed.positiveKeywords
          : campaign.targetKeywords,
      negativeKeywords:
        parsed.negativeKeywords.length > 0
          ? parsed.negativeKeywords
          : campaign.negativeKeywords,
      keywordClusters: parsed.keywordClusters,
      negativeCategories: parsed.negativeCategories,
      descriptions: parsed.descriptions,
      headlines: parsed.headlines,
      updatedAt: new Date().toISOString(),
    };

    onUpdateCampaign(updated);
  };

  // AI-Powered Smart Sort & Ad Generation via /api/rsa/parse-and-sort
  const handleAiSmartSort = async () => {
    setIsAiSorting(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/rsa/parse-and-sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawInput: rawText,
          finalUrl: campaign.finalUrl,
          phoneNumber: campaign.phoneNumber || "780-718-5092",
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "AI Sort failed. Using instant sorter.");
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

      const updated: RsaCampaign = {
        ...campaign,
        id: `ai-sorted-${Date.now()}`,
        campaignName: data.campaignName || campaign.campaignName,
        adGroupName: data.adGroupName || campaign.adGroupName,
        location: data.detectedLocation || campaign.location,
        phoneNumber: data.detectedPhone || campaign.phoneNumber,
        path1: String(data.path1 || "edmonton").slice(0, 15),
        path2: String(data.path2 || "move-out").slice(0, 15),
        targetKeywords: Array.isArray(data.positiveKeywords)
          ? data.positiveKeywords
          : campaign.targetKeywords,
        negativeKeywords: Array.isArray(data.negativeKeywords)
          ? data.negativeKeywords
          : campaign.negativeKeywords,
        keywordClusters: Array.isArray(data.keywordClusters)
          ? data.keywordClusters
          : campaign.keywordClusters,
        negativeCategories: Array.isArray(data.negativeCategories)
          ? data.negativeCategories
          : campaign.negativeCategories,
        headlines: (data.headlines || []).slice(0, 15).map((h: any, i: number) => ({
          id: `ais-h-${Date.now()}-${i}`,
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
            id: `ais-d-${Date.now()}-${i}`,
            text: String(d.text || "").trim(),
            pinnedField: validDPins.includes(d.pinnedField)
              ? d.pinnedField
              : "UNSPECIFIED",
            angle: String(d.angle || `Description #${i + 1}`),
          })),
        strategySummary: data.strategySummary || campaign.strategySummary,
        updatedAt: new Date().toISOString(),
      };

      onUpdateCampaign(updated);
    } catch (err: any) {
      handleInstantSort();
      setErrorMsg(
        err?.message ||
          "Sorted locally using instant rule engine."
      );
    } finally {
      setIsAiSorting(false);
    }
  };

  const formatPositiveKeyword = (kw: string) => {
    const clean = kw.replace(/^["'[\]]+|["'[\]]+$/g, "").trim();
    if (positiveMatchFormat === "phrase") return `"${clean}"`;
    if (positiveMatchFormat === "exact") return `[${clean}]`;
    return clean;
  };

  const formatNegativeKeyword = (kw: string) => {
    const clean = kw.replace(/^[-"'[\]]+|["'[\]]+$/g, "").trim();
    if (negativeMatchFormat === "quoted") return `"${clean}"`;
    if (negativeMatchFormat === "minus")
      return clean.includes(" ") ? `-"${clean}"` : `-${clean}`;
    return clean;
  };

  const clusters =
    campaign.keywordClusters && campaign.keywordClusters.length > 0
      ? campaign.keywordClusters
      : instantParseAndSortDump(rawText).keywordClusters;

  const negCategories =
    campaign.negativeCategories && campaign.negativeCategories.length > 0
      ? campaign.negativeCategories
      : instantParseAndSortDump(rawText).negativeCategories;

  return (
    <div className="space-y-6">
      {/* Top Split: Raw Dump Input (Left) + 5 Descriptions & Generated Ads (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Raw Paste Box */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-medium text-teal-700">
                Raw Keyword & Ad Copy Dump Pad
              </div>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                Paste Keywords, Negatives & Descriptions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste any unorganized list below. We automatically separate positive keywords, negative keywords, phone numbers, and 5 descriptions (≤90 chars).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRawText(DEFAULT_USER_RAW_DUMP);
                onUpdateCampaign(TIDY_UP_PRESETS.edmonton_combined);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md whitespace-nowrap shrink-0"
              title="Restore your Edmonton Move-Out & Deep Cleaning dump"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Sample
            </button>
          </div>

          <textarea
            rows={18}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Paste your keywords, "negative keywords", and draft descriptions here...`}
            className="w-full p-3.5 text-xs font-mono leading-relaxed bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white text-slate-800"
          />

          {errorMsg && (
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleInstantSort}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Instant Sort & Build Ads
            </button>

            <button
              type="button"
              onClick={handleAiSmartSort}
              disabled={isAiSorting}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {isAiSorting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  AI Sorting & Writing...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  AI Deep Sort & Refresh Ads
                </>
              )}
            </button>
          </div>

          {/* Summary Counts Strip */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono tabular-nums">
            <span>{campaign.targetKeywords.length} Positive Keywords</span>
            <span aria-hidden="true">·</span>
            <span>{campaign.negativeKeywords.length} Negative Keywords</span>
            <span aria-hidden="true">·</span>
            <span>{campaign.descriptions.length} Descriptions (≤90c)</span>
          </div>
        </div>

        {/* Right Column (7 cols): Sorted 5 Descriptions + Generated Ad Group Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Five TidyUps Cleaning Descriptions (<= 90 characters each) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-medium text-teal-700">
                  TidyUps Cleaning · Character-Verified Description Pool
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  Five Descriptions (Strictly ≤ 90 Characters Each)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All 5 descriptions are verified under the 90-character Google Ads limit. Edit any line below or copy all 5 at once.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    "copy-5-desc",
                    campaign.descriptions.map((d) => d.text).join("\n")
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                {copiedId === "copy-5-desc" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied All 5
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy All 5 Descriptions
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5">
              {campaign.descriptions.map((desc, idx) => {
                const charCount = desc.text.length;
                const isOver = charCount > 90;
                return (
                  <div
                    key={desc.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isOver
                        ? "border-rose-300 bg-rose-50/40"
                        : "border-slate-200 bg-slate-50/60 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums font-semibold text-slate-700">
                          Description #{idx + 1}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-slate-500">{desc.angle}</span>
                        {idx < 4 ? (
                          <span className="text-[11px] text-teal-700 font-medium">
                            · Active in Primary RSA
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            · Active in Ad Variation B
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono tabular-nums text-xs ${
                            isOver
                              ? "text-rose-600 font-bold"
                              : charCount >= 86
                              ? "text-amber-600 font-semibold"
                              : "text-emerald-700 font-medium"
                          }`}
                        >
                          {charCount}/90 chars
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(`desc-${idx}`, desc.text)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="Copy description"
                        >
                          {copiedId === `desc-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={desc.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateCampaign({
                          ...campaign,
                          descriptions: campaign.descriptions.map((d) =>
                            d.id === desc.id ? { ...d, text: val } : d
                          ),
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-teal-600"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Ready-to-Use Ads Created From Your Pasted Keywords */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Auto-Built Responsive Search Ads · Edmonton & South Edmonton
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                  Generated Ads from Your Sorted Keywords
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onOpenInBuilder()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
              >
                Open Active Ad in SERP Builder
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generated Ad 1: Move-Out Cleaning Edmonton */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="font-semibold text-slate-800">
                      Ad Group 1: Move-Out & Tenancy
                    </span>
                    <span className="font-mono">11 Keywords · 5 Desc</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-md p-3 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-900">
                      Sponsored · TidyUps Cleaning
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      https://app.tidyupscleaning.com › move-out › edmonton
                    </div>
                    <div className="text-sm font-medium text-[#1A0DAB] leading-snug">
                      Move Out Cleaning Edmonton | End of Tenancy Clean Edmonton | Get Your Move-Out Quote Today
                    </div>
                    <div className="text-xs text-[#4D5156] leading-relaxed">
                      Moving out? Leave the cleaning to Tidyups. Get your Edmonton move-out quote today. Make moving easier with thorough kitchen, bathroom and floor cleaning. Get a quote.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Phone className="w-3 h-3 text-teal-700" />
                      <span>Call TidyUps: 780-718-5092</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenInBuilder(TIDY_UP_PRESETS.move_out)}
                  className="w-full py-2 px-3 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  Load Move-Out Ad (12 Headlines)
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Generated Ad 2: Deep Cleaning Edmonton */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="font-semibold text-slate-800">
                      Ad Group 2: Deep Cleaning Edmonton
                    </span>
                    <span className="font-mono">9 Keywords · 5 Desc</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-md p-3 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-900">
                      Sponsored · TidyUps Cleaning
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      https://app.tidyupscleaning.com › deep-clean › edmonton
                    </div>
                    <div className="text-sm font-medium text-[#1A0DAB] leading-snug">
                      Deep Cleaning Edmonton | Deep House Cleaning Edmonton | Baseboards to Bathroom Buildup
                    </div>
                    <div className="text-xs text-[#4D5156] leading-relaxed">
                      Built-up dirt and grime? Our deep cleaning gives your home a fresh start. Book today. From baseboards to bathroom buildup, we handle the details. Book your deep clean.
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Phone className="w-3 h-3 text-teal-700" />
                      <span>Call TidyUps: 780-718-5092</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenInBuilder(TIDY_UP_PRESETS.deep_clean)}
                  className="w-full py-2 px-3 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  Load Deep Clean Ad (12 Headlines)
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Split: Sorted Positive Keyword Clusters + Negative Keyword Shield */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 cols: Sorted Positive Keywords by Ad Group */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-teal-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sorted Positive Keywords ({campaign.targetKeywords.length})</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                Grouped by High-Intent Ad Group Theme
              </h3>
            </div>

            {/* Match Type Formatter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: "phrase", label: '"Phrase"' },
                  { id: "exact", label: "[Exact]" },
                  { id: "broad", label: "Broad" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPositiveMatchFormat(m.id)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    positiveMatchFormat === m.id
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {clusters.map((cluster, cIdx) => {
              const formattedList = cluster.keywords
                .map(formatPositiveKeyword)
                .join("\n");
              const copyKey = `cluster-${cIdx}`;

              return (
                <div
                  key={cIdx}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">
                        {cluster.clusterName}
                      </h4>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Suggested Path: /{cluster.suggestedPath1}/
                        {cluster.suggestedPath2} · {cluster.keywords.length}{" "}
                        keywords
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyText(copyKey, formattedList)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      {copiedId === copyKey ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied ({cluster.keywords.length})
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Ad Group Keywords
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {cluster.keywords.map((kw, kIdx) => (
                      <span
                        key={kIdx}
                        className="px-2 py-1 text-xs font-mono bg-white border border-slate-200/90 rounded text-slate-800"
                      >
                        {formatPositiveKeyword(kw)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 6 cols: Sorted Negative Keywords Shield */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  Negative Keyword Shield ({campaign.negativeKeywords.length} Excluded Terms)
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                Blocks Job Seekers, DIY & Unrelated Cleaning Clicks
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: "quoted", label: '"term"' },
                    { id: "minus", label: '-"term"' },
                    { id: "plain", label: "plain" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setNegativeMatchFormat(m.id)}
                    className={`px-2 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      negativeMatchFormat === m.id
                        ? "bg-white text-slate-900 shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    "all-negatives",
                    campaign.negativeKeywords
                      .map(formatNegativeKeyword)
                      .join("\n")
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                {copiedId === "all-negatives" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied All {campaign.negativeKeywords.length}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy All {campaign.negativeKeywords.length}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {negCategories.map((cat, idx) => {
              const catFormatted = cat.terms
                .map(formatNegativeKeyword)
                .join("\n");
              const copyKey = `neg-cat-${idx}`;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800">
                      {cat.categoryName} ({cat.terms.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(copyKey, catFormatted)}
                      className="text-[11px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      {copiedId === copyKey ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Group
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {cat.terms.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 text-xs font-mono bg-white border border-rose-200/80 text-rose-900 rounded"
                      >
                        {formatNegativeKeyword(t)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
