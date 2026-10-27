import React, { useState, useEffect, useMemo } from "react";
import {
  Rocket,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  KeyRound,
  Code2,
} from "lucide-react";
import { RsaCampaign } from "../data/tidyUpPresets";
import { buildFullAtomicLaunchPayload } from "../utils/googleAdsGenerators";

interface GoogleAdsLauncherViewProps {
  campaign: RsaCampaign;
  onUpdateCampaignMeta: (updates: Partial<RsaCampaign>) => void;
}

export const GoogleAdsLauncherView: React.FC<GoogleAdsLauncherViewProps> = ({
  campaign,
  onUpdateCampaignMeta,
}) => {
  const [dailyBudgetCad, setDailyBudgetCad] = useState<number>(
    campaign.dailyBudgetCad || 25
  );
  const [biddingStrategy, setBiddingStrategy] = useState<
    "MAXIMIZE_CLICKS" | "MAXIMIZE_CONVERSIONS"
  >(campaign.biddingStrategy || "MAXIMIZE_CLICKS");
  const [maxCpcBidCad, setMaxCpcBidCad] = useState<number>(
    campaign.maxCpcBidCad || 3.5
  );
  const [keywordMatchType, setKeywordMatchType] = useState<
    "PHRASE" | "EXACT" | "BROAD"
  >("PHRASE");
  const [launchMode, setLaunchMode] = useState<
    "simulate" | "validate_only" | "live"
  >("simulate");

  // OAuth & API Token States
  const [oauthConnected, setOauthConnected] = useState(false);
  const [developerToken, setDeveloperToken] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loginCustomerId, setLoginCustomerId] = useState("");
  const [showCredentialsDrawer, setShowCredentialsDrawer] = useState(false);

  // Launch Execution States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchResult, setLaunchResult] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const callbackUrl = `${window.location.origin}/auth/callback`;

  useEffect(() => {
    fetch("/api/google-ads/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.connected) setOauthConnected(true);
      })
      .catch(() => {});

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        setOauthConnected(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const atomicPayload = useMemo(
    () =>
      buildFullAtomicLaunchPayload(campaign, {
        dailyBudgetCad,
        biddingStrategy,
        maxCpcBidCad,
        keywordMatchType,
      }),
    [campaign, dailyBudgetCad, biddingStrategy, maxCpcBidCad, keywordMatchType]
  );

  const handleConnectGoogleOAuth = async () => {
    setLaunchError(null);
    try {
      const response = await fetch("/api/google-ads/auth-url");
      const data = await response.json();
      if (!response.ok || data.error) {
        setShowCredentialsDrawer(true);
        setLaunchError(data.error);
        return;
      }
      window.open(data.url, "google_ads_oauth_popup", "width=600,height=700");
    } catch (err: any) {
      setLaunchError(err?.message || "Could not start Google OAuth flow.");
    }
  };

  const handleExecuteLaunch = async () => {
    setShowConfirmModal(false);
    setIsLaunching(true);
    setLaunchError(null);
    setLaunchResult(null);

    try {
      const response = await fetch("/api/google-ads/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: campaign.customerId,
          loginCustomerId,
          accessToken,
          developerToken,
          mode: launchMode,
          mutatePayload: atomicPayload,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Campaign launch failed.");
      }

      setLaunchResult(data);
    } catch (err: any) {
      setLaunchError(err?.message || "Failed to execute campaign launch.");
    } finally {
      setIsLaunching(false);
    }
  };

  const monthlyEstimateCad = Math.round(dailyBudgetCad * 30.4);
  const estMonthlyClicksMin = Math.max(
    1,
    Math.round(monthlyEstimateCad / Math.max(1.5, maxCpcBidCad * 1.15))
  );
  const estMonthlyClicksMax = Math.max(
    estMonthlyClicksMin + 5,
    Math.round(monthlyEstimateCad / Math.max(1.2, maxCpcBidCad * 0.75))
  );

  return (
    <div className="space-y-6">
      {/* Top Row: Google Ads Account Connection & Daily Budget Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Budget, Bidding & Account Setup */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Connect Google Ads Account */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div>
                <div className="text-xs font-medium text-teal-700">
                  Step 1 · Google Ads Account & Customer ID
                </div>
                <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                  Connect Your TidyUps Google Ads Account
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCredentialsDrawer((v) => !v)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {showCredentialsDrawer ? "Hide API Keys" : "API Tokens & OAuth Setup"}
                </button>
                <button
                  type="button"
                  onClick={handleConnectGoogleOAuth}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    oauthConnected
                      ? "bg-emerald-50 border border-emerald-600 text-emerald-800"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {oauthConnected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Google Ads Connected
                    </>
                  ) : (
                    "Connect Google Ads OAuth"
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Google Ads Customer ID (10 digits)
                </label>
                <input
                  type="text"
                  value={campaign.customerId}
                  onChange={(e) =>
                    onUpdateCampaignMeta({ customerId: e.target.value })
                  }
                  placeholder="123-456-7890"
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Initial Campaign Launch State
                </label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => onUpdateCampaignMeta({ adStatus: "PAUSED" })}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      campaign.adStatus === "PAUSED"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    PAUSED (Safe Review)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateCampaignMeta({ adStatus: "ENABLED" })}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      campaign.adStatus === "ENABLED"
                        ? "bg-white text-emerald-800 shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ENABLED (Go Live)
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Credentials & OAuth Redirect URI Drawer */}
            {showCredentialsDrawer && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="font-semibold text-slate-800">
                  Direct Google Ads API v18 Credentials (Optional for Sandbox Dry-Run)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  To push live campaigns directly via the Google Ads REST API, Google requires a{" "}
                  <strong>Google Ads Developer Token</strong> (from your Google Ads Manager Account under{" "}
                  <em>Tools & Settings → Setup → API Center</em>) and an OAuth 2.0 Client configured with this Redirect URI:
                </p>
                <div className="p-2.5 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-700 break-all">
                  {callbackUrl}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Developer Token
                    </label>
                    <input
                      type="password"
                      value={developerToken}
                      onChange={(e) => setDeveloperToken(e.target.value)}
                      placeholder="Enter developer-token"
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      OAuth Access Token (Bearer)
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="ya29.a0..."
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      MCC Login Customer ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={loginCustomerId}
                      onChange={(e) => setLoginCustomerId(e.target.value)}
                      placeholder="Optional MCC ID"
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Set Daily Budget & Bidding Strategy */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="pb-3.5 border-b border-slate-100">
              <div className="text-xs font-medium text-teal-700">
                Step 2 · CampaignBudget & Bidding Strategy
              </div>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                Set Your Daily Edmonton Ad Budget & Bid Cap
              </h2>
            </div>

            {/* Daily Budget Slider & Input */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-teal-700" />
                    Daily Budget (CAD / day)
                  </label>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                    Google Ads API amountMicros:{" "}
                    {(dailyBudgetCad * 1_000_000).toLocaleString()} micros
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">$</span>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    step={5}
                    value={dailyBudgetCad}
                    onChange={(e) => {
                      const val = Math.max(5, Number(e.target.value) || 5);
                      setDailyBudgetCad(val);
                      onUpdateCampaignMeta({ dailyBudgetCad: val });
                    }}
                    className="w-24 px-3 py-1.5 text-base font-bold font-mono tabular-nums text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                  <span className="text-xs font-medium text-slate-500">
                    CAD / day
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={10}
                max={150}
                step={5}
                value={Math.min(150, dailyBudgetCad)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDailyBudgetCad(val);
                  onUpdateCampaignMeta({ dailyBudgetCad: val });
                }}
                className="w-full accent-teal-700 cursor-pointer"
              />

              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums text-slate-600">
                <span>
                  Max Monthly Cap: <strong>${monthlyEstimateCad} CAD/mo</strong>
                </span>
                <span>
                  Est. Traffic:{" "}
                  <strong>
                    {estMonthlyClicksMin}–{estMonthlyClicksMax} Edmonton clicks/mo
                  </strong>
                </span>
              </div>
            </div>

            {/* Bidding Strategy & Keyword Match Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Bidding Strategy
                </label>
                <select
                  value={biddingStrategy}
                  onChange={(e) => {
                    const val = e.target.value as
                      | "MAXIMIZE_CLICKS"
                      | "MAXIMIZE_CONVERSIONS";
                    setBiddingStrategy(val);
                    onUpdateCampaignMeta({ biddingStrategy: val });
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                >
                  <option value="MAXIMIZE_CLICKS">
                    Maximize Clicks (Recommended to Start)
                  </option>
                  <option value="MAXIMIZE_CONVERSIONS">
                    Maximize Booking Conversions
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Max CPC Bid Ceiling (CAD)
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={25}
                  step={0.25}
                  value={maxCpcBidCad}
                  onChange={(e) => {
                    const val = Math.max(0.5, Number(e.target.value) || 2.5);
                    setMaxCpcBidCad(val);
                    onUpdateCampaignMeta({ maxCpcBidCad: val });
                  }}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Positive Keyword Match Type
                </label>
                <select
                  value={keywordMatchType}
                  onChange={(e) =>
                    setKeywordMatchType(
                      e.target.value as "PHRASE" | "EXACT" | "BROAD"
                    )
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                >
                  <option value="PHRASE">PHRASE ("move out cleaning")</option>
                  <option value="EXACT">EXACT ([move out cleaning])</option>
                  <option value="BROAD">BROAD</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Pre-Launch Summary & 1-Click Launch Trigger */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="pb-3.5 border-b border-slate-100">
            <div className="text-xs font-medium text-teal-700">
              Step 3 · Atomic Google Ads Pipeline Summary
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">
              Ready to Create & Launch ({atomicPayload.mutateOperations.length} API Operations)
            </h3>
          </div>

          {/* 6-Step Pipeline Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-medium text-slate-800">
                1. CampaignBudget (Standard)
              </span>
              <span className="font-mono tabular-nums font-semibold text-teal-800">
                ${dailyBudgetCad.toFixed(2)} CAD/day
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-medium text-slate-800">
                2. Search Campaign + Edmonton Geo
              </span>
              <span className="font-mono text-slate-600">
                {campaign.adStatus}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-medium text-slate-800">
                3. Negative Keyword Shield
              </span>
              <span className="font-mono tabular-nums text-rose-700 font-semibold">
                {campaign.negativeKeywords?.length || 0} excluded terms
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-medium text-slate-800">
                4. Positive Search Keywords
              </span>
              <span className="font-mono tabular-nums text-slate-700 font-semibold">
                {campaign.targetKeywords.length} ({keywordMatchType})
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="font-medium text-slate-800">
                5. Responsive Search Ads (RSAs)
              </span>
              <span className="font-mono tabular-nums text-slate-700 font-semibold">
                {campaign.headlines.length}H · {campaign.descriptions.length}D (≤90c)
              </span>
            </div>
          </div>

          {/* Execution Mode Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Select Execution Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: "simulate", label: "Sandbox Test" },
                  { id: "validate_only", label: "API Validate" },
                  { id: "live", label: "Live Mutate" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLaunchMode(m.id)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    launchMode === m.id
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {launchError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{launchError}</span>
            </div>
          )}

          {/* Launch Receipt if Executed */}
          {launchResult && (
            <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-2 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {launchResult.mode === "simulate"
                    ? "Sandbox Campaign Pipeline Verified & Created!"
                    : "Google Ads API Mutate Completed Successfully!"}
                </span>
              </div>
              {launchResult.receipt && (
                <div className="font-mono text-[11px] space-y-1 pt-1 text-emerald-900 tabular-nums">
                  <div>Budget: {launchResult.receipt.budgetResource} (${launchResult.receipt.dailyBudgetCad}/day)</div>
                  <div>Campaign: {launchResult.receipt.campaignResource} ({launchResult.receipt.campaignStatus})</div>
                  <div>
                    Keywords: {launchResult.receipt.positiveKeywordsAttached} Positive · {launchResult.receipt.negativeKeywordsAttached} Negatives
                  </div>
                  <div>
                    Ads Created: {launchResult.receipt.responsiveSearchAdsCreated} Responsive Search Ads (All 5 Descriptions Active)
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isLaunching}
            className="w-full py-3 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {isLaunching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Google Ads Pipeline...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Create Budget, Keywords & Ads ({atomicPayload.mutateOperations.length} Ops)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Google Tag (AW-18539302675) Conversion Tracking Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Google Tag Installed in App Header · ID: AW-18539302675</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
              Google Ads Conversion Tracking (AW-18539302675)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your global <code className="font-mono">gtag.js</code> snippet (<code className="font-mono">AW-18539302675</code>) is active in <code className="font-mono">index.html</code>. Make sure the same tag is also placed on <code className="font-mono">https://app.tidyupscleaning.com/booking</code> to track completed cleaning bookings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
                (window as any).gtag("event", "conversion", {
                  send_to: "AW-18539302675",
                  value: dailyBudgetCad,
                  currency: "CAD",
                });
              }
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            Send Test Conversion Ping
          </button>
        </div>
      </div>

      {/* Bottom Card: Full Atomic Google Ads API googleAds:mutate Inspector */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Code2 className="w-4 h-4 text-teal-700" />
            <span>
              Atomic Google Ads API Request (POST /v18/customers/
              {campaign.customerId.replace(/-/g, "")}/googleAds:mutate)
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(
                JSON.stringify(atomicPayload, null, 2)
              );
              setCopiedJson(true);
              setTimeout(() => setCopiedJson(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied Full Pipeline JSON
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy All {atomicPayload.mutateOperations.length} Mutate Operations
              </>
            )}
          </button>
        </div>

        <pre className="p-5 bg-[#0F172A] text-slate-100 text-xs font-mono leading-relaxed overflow-x-auto max-h-[380px]">
          <code>{JSON.stringify(atomicPayload, null, 2)}</code>
        </pre>
      </div>

      {/* Explicit User Confirmation Modal before Mutating Campaign Data */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Google Ads Campaign Creation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please review the campaign parameters that will be created for{" "}
              <strong>TidyUps Cleaning</strong>:
            </p>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono tabular-nums text-slate-800">
              <div>Customer ID: {campaign.customerId}</div>
              <div>Campaign: {campaign.campaignName}</div>
              <div>Daily Budget: ${dailyBudgetCad.toFixed(2)} CAD/day</div>
              <div>Max CPC Ceiling: ${maxCpcBidCad.toFixed(2)} CAD</div>
              <div>Positive Keywords: {campaign.targetKeywords.length} ({keywordMatchType})</div>
              <div>Negative Keywords: {campaign.negativeKeywords?.length || 0} excluded</div>
              <div>Headlines: {campaign.headlines.length} (≤30 chars)</div>
              <div>Descriptions: {campaign.descriptions.length} (≤90 chars)</div>
              <div>Initial Status: {campaign.adStatus}</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteLaunch}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800"
              >
                Confirm & Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
