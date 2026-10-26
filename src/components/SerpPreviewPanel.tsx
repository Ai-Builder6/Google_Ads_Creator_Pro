import React, { useState } from "react";
import {
  Shuffle,
  Smartphone,
  Monitor,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import {
  RsaCampaign,
  AdStrengthAudit,
} from "../data/tidyUpPresets";
import {
  SimulatedAdPreview,
  buildResolvedFinalUrl,
} from "../utils/googleAdsGenerators";

interface SerpPreviewPanelProps {
  campaign: RsaCampaign;
  combinations: SimulatedAdPreview[];
  audit: AdStrengthAudit;
  onReshuffle: () => void;
}

export const SerpPreviewPanel: React.FC<SerpPreviewPanelProps> = ({
  campaign,
  combinations,
  audit,
  onReshuffle,
}) => {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [activeComboIndex, setActiveComboIndex] = useState(0);
  const [show3rdHeadline, setShow3rdHeadline] = useState(true);

  const safeIndex =
    combinations.length > 0 ? activeComboIndex % combinations.length : 0;
  const activeCombo = combinations[safeIndex];
  const resolvedUrl = buildResolvedFinalUrl(campaign);

  const handlePrevCombo = () => {
    setActiveComboIndex((prev) =>
      prev === 0 ? combinations.length - 1 : prev - 1
    );
  };

  const handleNextCombo = () => {
    setActiveComboIndex((prev) => (prev + 1) % combinations.length);
  };

  const ratingColorText =
    audit.rating === "Excellent"
      ? "text-emerald-700"
      : audit.rating === "Good"
      ? "text-teal-700"
      : audit.rating === "Average"
      ? "text-amber-700"
      : "text-rose-700";

  const ratingBarColor =
    audit.rating === "Excellent"
      ? "bg-emerald-600"
      : audit.rating === "Good"
      ? "bg-teal-600"
      : audit.rating === "Average"
      ? "bg-amber-500"
      : "bg-rose-600";

  return (
    <div className="space-y-6">
      {/* Google Ads Ad Strength Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Google Ads RSA Diagnostic · Real-Time Validation
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-base font-semibold text-slate-900">
                Ad Strength:
              </h3>
              <span className={`text-base font-bold ${ratingColorText}`}>
                {audit.rating}
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                ({audit.score}/100)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono tabular-nums text-slate-600">
            <span>{audit.validHeadlinesCount}/15 Headlines</span>
            <span aria-hidden="true">·</span>
            <span>{audit.validDescriptionsCount}/5 Descriptions</span>
            <span aria-hidden="true">·</span>
            <span>{campaign.negativeKeywords?.length || 0} Negatives</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-transform duration-200 origin-left ${ratingBarColor}`}
              style={{ transform: `scaleX(${audit.score / 100})` }}
            />
          </div>
        </div>

        {/* 6 Official RSA Checklist Items */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {audit.checks.map((check) => (
            <div
              key={check.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/70"
            >
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-800 leading-snug">
                  {check.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                  {check.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Google Search SERP Simulator */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Google Search SERP Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rotates across your headlines and all 5 descriptions (≤90 chars)
            </p>
          </div>

          {/* Device Segmented Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                device === "mobile"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile SERP
            </button>
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                device === "desktop"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop SERP
            </button>
          </div>
        </div>

        {/* Permutation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevCombo}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Previous combination"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono tabular-nums text-slate-700 font-medium">
              Combination {safeIndex + 1} of {combinations.length}
            </span>
            <button
              type="button"
              onClick={handleNextCombo}
              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Next combination"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShow3rdHeadline((v) => !v)}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {show3rdHeadline ? "Showing 3 Headlines" : "Showing 2 Headlines"}
            </button>
            <button
              type="button"
              onClick={() => {
                onReshuffle();
                setActiveComboIndex(0);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Shuffle Assets
            </button>
          </div>
        </div>

        {/* Simulated Google Search Canvas */}
        {activeCombo && (
          <div className="mt-4 bg-[#F1F5F9] rounded-lg p-4 sm:p-6">
            <div
              className={`mx-auto bg-white rounded-lg border border-slate-200/90 p-4 sm:p-5 transition-all ${
                device === "mobile" ? "max-w-[390px]" : "w-full"
              }`}
            >
              {/* Sponsored Label */}
              <div className="text-[11px] font-bold text-slate-900 mb-2">
                Sponsored
              </div>

              {/* Site Identity & Display URL Path */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  TU
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-900 truncate">
                    TidyUps Cleaning
                  </div>
                  <div className="text-[11px] text-slate-600 truncate font-mono">
                    https://{activeCombo.displayDomain}
                    {campaign.path1 ? ` › ${campaign.path1}` : ""}
                    {campaign.path2 ? ` › ${campaign.path2}` : ""}
                  </div>
                </div>
              </div>

              {/* Combined Headline, Description & Optional Image Asset Extension */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[18px] sm:text-[19px] leading-snug font-medium text-[#1A0DAB] hover:underline break-words"
                  >
                    {activeCombo.headline1.text}
                    {" | "}
                    {activeCombo.headline2.text}
                    {show3rdHeadline && activeCombo.headline3
                      ? ` | ${activeCombo.headline3.text}`
                      : ""}
                  </a>

                  {/* Combined Descriptions */}
                  <p className="mt-1.5 text-[13px] sm:text-[14px] leading-relaxed text-[#4D5156]">
                    {activeCombo.description1.text}
                    {activeCombo.description2
                      ? ` ${activeCombo.description2.text}`
                      : ""}
                  </p>
                </div>

                {campaign.attachedImageUrl && (
                  <img
                    src={campaign.attachedImageUrl}
                    alt="TidyUps Cleaning Google Ads Image Asset"
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5"
                  />
                )}
              </div>

              {/* Callout Extensions */}
              {campaign.callouts.length > 0 && (
                <div className="mt-1.5 text-[12px] text-[#4D5156]">
                  {campaign.callouts.filter(Boolean).join(" · ")}
                </div>
              )}

              {/* Google Ads Call Asset Extension (780-718-5092) */}
              {campaign.phoneNumber && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#1A0DAB] font-medium">
                  <a
                    href={`tel:${campaign.phoneNumber.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-2 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call {campaign.phoneNumber}</span>
                  </a>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Edmonton, AB
                  </span>
                </div>
              )}

              {/* Sitelink Extensions */}
              {campaign.sitelinks.length > 0 && (
                <div
                  className={`mt-3 pt-3 border-t border-slate-100 ${
                    device === "mobile"
                      ? "flex flex-wrap gap-2"
                      : "grid grid-cols-2 gap-x-6 gap-y-2.5"
                  }`}
                >
                  {campaign.sitelinks.slice(0, 4).map((sl) =>
                    device === "mobile" ? (
                      <a
                        key={sl.id}
                        href={sl.finalUrl || resolvedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-[#1A0DAB] hover:bg-slate-50 transition-colors"
                      >
                        {sl.linkText}
                      </a>
                    ) : (
                      <div key={sl.id} className="min-w-0">
                        <a
                          href={sl.finalUrl || resolvedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-medium text-[#1A0DAB] hover:underline block truncate"
                        >
                          {sl.linkText}
                        </a>
                        <div className="text-[11px] text-[#4D5156] truncate">
                          {sl.description1}
                        </div>
                        <div className="text-[11px] text-[#4D5156] truncate">
                          {sl.description2}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Active Asset Attribution Bar */}
            <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono tabular-nums">
                <span className="font-sans font-medium text-slate-800">
                  Active lengths:
                </span>
                <span>H1 ({activeCombo.headline1.text.length}/30)</span>
                <span aria-hidden="true">·</span>
                <span>H2 ({activeCombo.headline2.text.length}/30)</span>
                <span aria-hidden="true">·</span>
                <span>D1 ({activeCombo.description1.text.length}/90)</span>
                {activeCombo.description2 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>D2 ({activeCombo.description2.text.length}/90)</span>
                  </>
                )}
              </div>

              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-medium"
              >
                Test Booking App
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Quick Combination Matrix Table */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold text-slate-800">
              Sampled Google Ads Combination Matrix
            </h4>
            <span className="text-[11px] text-slate-500">
              Click any row to preview in SERP
            </span>
          </div>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {combinations.map((combo, idx) => {
              const isSelected = idx === safeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveComboIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 transition-colors flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-teal-50/70 text-slate-900"
                      : "bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[#1A0DAB] truncate">
                      {combo.headline1.text} | {combo.headline2.text}
                      {show3rdHeadline && combo.headline3
                        ? ` | ${combo.headline3.text}`
                        : ""}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {combo.description1.text}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                    #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
