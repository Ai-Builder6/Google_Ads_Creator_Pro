import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Code2,
  FileSpreadsheet,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { RsaCampaign } from "../data/tidyUpPresets";
import {
  buildGoogleAdsRestPayload,
  buildNodeJsApiSnippet,
  buildPythonApiSnippet,
  buildGoogleAdsEditorCsv,
} from "../utils/googleAdsGenerators";

interface ApiPayloadViewProps {
  campaign: RsaCampaign;
  savedCampaigns: RsaCampaign[];
  onUpdateCampaignMeta: (updates: Partial<RsaCampaign>) => void;
}

export const ApiPayloadView: React.FC<ApiPayloadViewProps> = ({
  campaign,
  savedCampaigns,
  onUpdateCampaignMeta,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<
    "json" | "nodejs" | "python" | "csv"
  >("json");
  const [copied, setCopied] = useState(false);

  const restJson = buildGoogleAdsRestPayload(campaign);
  const nodeJsCode = buildNodeJsApiSnippet(campaign);
  const pythonCode = buildPythonApiSnippet(campaign);
  const csvContent = buildGoogleAdsEditorCsv(
    savedCampaigns.length > 0 ? savedCampaigns : [campaign]
  );

  const displayedCode =
    activeCodeTab === "json"
      ? restJson
      : activeCodeTab === "nodejs"
      ? nodeJsCode
      : activeCodeTab === "python"
      ? pythonCode
      : csvContent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
    }
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* API Resource Configuration Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Google Ads API v18 · AdGroupAdService · ResponsiveSearchAdInfo
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">
              Google Ads API Payload & Bulk Export
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Use the generated <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">ResponsiveSearchAdInfo</code>{" "}
              payload directly with the Google Ads API{" "}
              <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">adGroupAds:mutate</code>{" "}
              endpoint, or download the CSV file to import your Tidy Up Cleaning campaigns into Google Ads Editor immediately.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                handleDownloadFile(
                  restJson,
                  `tidy-up-rsa-${campaign.path1 || "booking"}.json`,
                  "application/json"
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
            <button
              type="button"
              onClick={() =>
                handleDownloadFile(
                  csvContent,
                  "tidy-up-google-ads-editor-import.csv",
                  "text/csv;charset=utf-8;"
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Google Ads CSV
            </button>
          </div>
        </div>

        {/* Resource IDs Form */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Google Ads Customer ID
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
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Target Ad Group ID
            </label>
            <input
              type="text"
              value={campaign.adGroupId}
              onChange={(e) =>
                onUpdateCampaignMeta({ adGroupId: e.target.value })
              }
              placeholder="9876543210"
              className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Initial AdGroupAd Status
            </label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => onUpdateCampaignMeta({ adStatus: "ENABLED" })}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  campaign.adStatus === "ENABLED"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ENABLED
              </button>
              <button
                type="button"
                onClick={() => onUpdateCampaignMeta({ adStatus: "PAUSED" })}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  campaign.adStatus === "PAUSED"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                PAUSED
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code & Schema Inspector */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveCodeTab("json")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCodeTab === "json"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              REST JSON (v18)
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("nodejs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCodeTab === "nodejs"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Node.js / TypeScript
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("python")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCodeTab === "python"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Python GoogleAdsClient
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("csv")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCodeTab === "csv"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Google Ads Editor CSV
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://developers.google.com/google-ads/api/docs/responsive-search-ads/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              Official RSA Docs
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>

        <pre className="p-5 bg-[#0F172A] text-slate-100 text-xs font-mono leading-relaxed overflow-x-auto max-h-[540px]">
          <code>{displayedCode}</code>
        </pre>
      </div>
    </div>
  );
};
