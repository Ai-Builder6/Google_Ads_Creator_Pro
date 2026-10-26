import React, { useState } from "react";
import {
  Search,
  Trash2,
  FolderOpen,
  FileSpreadsheet,
  Plus,
  Copy,
} from "lucide-react";
import { RsaCampaign, calculateAdStrength } from "../data/tidyUpPresets";
import { buildGoogleAdsEditorCsv } from "../utils/googleAdsGenerators";

interface SavedCampaignsViewProps {
  savedCampaigns: RsaCampaign[];
  activeCampaignId: string;
  onSelectCampaign: (campaign: RsaCampaign) => void;
  onDeleteCampaign: (id: string) => void;
  onDuplicateCampaign: (campaign: RsaCampaign) => void;
  onSaveCurrent: () => void;
}

export const SavedCampaignsView: React.FC<SavedCampaignsViewProps> = ({
  savedCampaigns,
  activeCampaignId,
  onSelectCampaign,
  onDeleteCampaign,
  onDuplicateCampaign,
  onSaveCurrent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "PAUSED">(
    "ALL"
  );

  const filtered = savedCampaigns.filter((c) => {
    const matchesStatus =
      statusFilter === "ALL" || c.adStatus === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;
    return (
      matchesStatus &&
      (c.campaignName.toLowerCase().includes(q) ||
        c.adGroupName.toLowerCase().includes(q) ||
        c.serviceType.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q))
    );
  });

  const handleExportAllCsv = () => {
    if (savedCampaigns.length === 0) return;
    const csv = buildGoogleAdsEditorCsv(savedCampaigns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tidy-up-all-campaigns-google-ads.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="text-xs font-medium text-slate-500">
            Campaign Repository · Multi-Ad Group Management
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mt-1">
            Saved Tidy Up Cleaning RSA Campaigns
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveCurrent}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Save Current Snapshot
          </button>
          <button
            type="button"
            onClick={handleExportAllCsv}
            disabled={savedCampaigns.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export All ({savedCampaigns.length}) to CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by campaign, ad group, service, or area..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(["ALL", "ENABLED", "PAUSED"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st === "ALL" ? "All Statuses" : st}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Data Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
          <p className="text-sm font-medium text-slate-800">
            No matching Responsive Search Ad campaigns found
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Save your current Tidy Up Cleaning Ad Group configuration to build a multi-service Google Ads library ready for bulk export.
          </p>
          <button
            type="button"
            onClick={onSaveCurrent}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Save Active Campaign
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-4">Campaign / Ad Group</th>
                <th className="py-2.5 px-4">Service Focus</th>
                <th className="py-2.5 px-4">Display Path</th>
                <th className="py-2.5 px-4 text-right">Assets</th>
                <th className="py-2.5 px-4 text-right">Ad Strength</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filtered.map((item) => {
                const audit = calculateAdStrength(item);
                const isActive = item.id === activeCampaignId;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isActive ? "bg-teal-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {item.campaignName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.adGroupName} · {item.adStatus}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{item.serviceType}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.location}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      /{item.path1}
                      {item.path2 ? `/${item.path2}` : ""}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {audit.validHeadlinesCount}H · {audit.validDescriptionsCount}D
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          audit.rating === "Excellent"
                            ? "text-emerald-700"
                            : audit.rating === "Good"
                            ? "text-teal-700"
                            : "text-amber-700"
                        }`}
                      >
                        {audit.rating} ({audit.score}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectCampaign(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-white transition-colors whitespace-nowrap shrink-0"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateCampaign(item)}
                          className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                          title="Duplicate campaign"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCampaign(item.id)}
                          className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-white transition-colors"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
