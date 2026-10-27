import React, { useState, useEffect, useMemo } from "react";
import {
  Rocket,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  KeyRound,
  Code2,
  LogOut,
  RefreshCw,
  FolderUp,
  Download,
  ExternalLink,
  FileArchive,
  FileSpreadsheet,
  Palette,
  Users,
  FolderInput,
  Phone,
  MapPin,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  RsaCampaign,
  applyPhoneAndLocationToCampaign,
} from "../data/tidyUpPresets";
import {
  buildFullAtomicLaunchPayload,
  buildGoogleAdsEditorCsv,
} from "../utils/googleAdsGenerators";
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  logout,
} from "../lib/googleAuth";
import { PublicPageRoute } from "./PublicSitePages";

interface GoogleAdsLauncherViewProps {
  campaign: RsaCampaign;
  onUpdateCampaignMeta: (updates: Partial<RsaCampaign>) => void;
  onOpenPublicPage?: (page: PublicPageRoute) => void;
}

const DRIVE_FOLDER_COLORS = [
  { name: "Emerald Green", hex: "#16a765", badgeBg: "bg-emerald-600" },
  { name: "Royal Blue", hex: "#4986e7", badgeBg: "bg-blue-600" },
  { name: "Amber Gold", hex: "#ffad46", badgeBg: "bg-amber-500" },
  { name: "Crimson Red", hex: "#f83a22", badgeBg: "bg-rose-600" },
  { name: "Violet Purple", hex: "#a47ae2", badgeBg: "bg-purple-600" },
];

export const GoogleAdsLauncherView: React.FC<GoogleAdsLauncherViewProps> = ({
  campaign,
  onUpdateCampaignMeta,
  onOpenPublicPage,
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
  >("live");

  // Firebase Google OAuth States (with adwords + drive + spreadsheets scopes)
  const [user, setUser] = useState<User | null>(null);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Google Ads Developer Token & Optional MCC
  const [developerToken, setDeveloperToken] = useState("");
  const [loginCustomerId, setLoginCustomerId] = useState("");
  const [showCredentialsDrawer, setShowCredentialsDrawer] = useState(false);
  const [accessibleAccounts, setAccessibleAccounts] = useState<string[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Launch Execution States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchResult, setLaunchResult] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Auto-Zip, Colored Drive Folder & Color-Coded Google Sheets States
  const [driveFolderName, setDriveFolderName] = useState("Leads-Creator");
  const [driveFolderColor, setDriveFolderColor] = useState("#16a765");
  const [zipFileName, setZipFileName] = useState(
    `TidyUps-Cleaning-Google-Ads-Project-${new Date()
      .toISOString()
      .slice(0, 10)}.zip`
  );
  const [sheetTitle, setSheetTitle] = useState(
    `TidyUps Cleaning — Edmonton Google Ads Master Sheet (${new Date()
      .toISOString()
      .slice(0, 10)})`
  );

  // Modals & Progress for Drive ZIP and Styled Google Sheet
  const [showDriveConfirmModal, setShowDriveConfirmModal] = useState(false);
  const [showSheetConfirmModal, setShowSheetConfirmModal] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  const [driveUploadResult, setDriveUploadResult] = useState<{
    fileId: string;
    fileName: string;
    fileWebViewLink: string;
    folderId: string;
    folderName: string;
    folderColorRgb?: string;
    folderWebViewLink: string;
    folderCreatedNew: boolean;
    coloredSubfolders?: { name: string; color: string; link: string }[];
    sizeBytes: number;
    fileCount: number;
    filePaths: string[];
  } | null>(null);

  const [createdSheetResult, setCreatedSheetResult] = useState<{
    spreadsheetId: string;
    sheetTitle: string;
    spreadsheetUrl: string;
    folderName: string;
    folderWebViewLink: string;
    tabsCreated: string[];
  } | null>(null);

  // Import Keywords from Existing Google Sheet (Across Any Account)
  const [showImportSheetDrawer, setShowImportSheetDrawer] = useState(false);
  const [userSheets, setUserSheets] = useState<
    { id: string; name: string; webViewLink: string; modifiedTime: string }[]
  >([]);
  const [isLoadingUserSheets, setIsLoadingUserSheets] = useState(false);
  const [importSheetInput, setImportSheetInput] = useState("");
  const [isImportingSheet, setIsImportingSheet] = useState(false);
  const [importedSheetSummary, setImportedSheetSummary] = useState<
    string | null
  >(null);

  // Quick Phone Number (587-742-2500) & Location / City Sync States
  const [phoneInput, setPhoneInput] = useState(
    campaign.phoneNumber || "587-742-2500"
  );
  const [locationInput, setLocationInput] = useState(
    campaign.location || "Edmonton & South Edmonton"
  );
  const [syncedPhoneLocFeedback, setSyncedPhoneLocFeedback] = useState(false);

  useEffect(() => {
    setPhoneInput(campaign.phoneNumber || "587-742-2500");
    setLocationInput(campaign.location || "Edmonton & South Edmonton");
  }, [campaign.phoneNumber, campaign.location]);

  const handleApplyPhoneAndLocation = (
    overridePhone?: string,
    overrideLocation?: string
  ) => {
    const nextPhone = (overridePhone ?? phoneInput).trim() || "587-742-2500";
    const nextLocation =
      (overrideLocation ?? locationInput).trim() || "Edmonton";
    setPhoneInput(nextPhone);
    setLocationInput(nextLocation);

    const updated = applyPhoneAndLocationToCampaign(
      campaign,
      nextPhone,
      nextLocation
    );
    onUpdateCampaignMeta(updated);
    setSyncedPhoneLocFeedback(true);
    setTimeout(() => setSyncedPhoneLocFeedback(false), 2500);
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setOauthToken(token);
      },
      () => {
        setUser(null);
        setOauthToken(null);
      }
    );
    return () => unsubscribe();
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

  const editorCsvContent = useMemo(
    () => buildGoogleAdsEditorCsv([campaign]),
    [campaign]
  );

  const buildExtraArchiveFiles = () => {
    const readme = `# TidyUps Cleaning — Google Ads RSA & Campaign Studio
Generated: ${new Date().toISOString()}
Business: TidyUps Cleaning (${campaign.location || "Edmonton, AB"})
Phone: ${campaign.phoneNumber || "587-742-2500"}
Booking App Final URL: ${campaign.finalUrl}
Google Tag ID: AW-18539302675

## Included Campaign Exports (in /campaign-exports/)
- tidyups-google-ads-mutate-payload.json (${atomicPayload.mutateOperations.length} atomic operations)
- tidyups-google-ads-editor-import.csv (Ready for 1-click import in Google Ads Editor)

## How to Run Locally
1. npm install
2. Copy .env.example to .env and add GEMINI_API_KEY
3. npm run dev
`;

    return {
      "campaign-exports/tidyups-google-ads-mutate-payload.json": JSON.stringify(
        atomicPayload,
        null,
        2
      ),
      "campaign-exports/tidyups-google-ads-editor-import.csv": editorCsvContent,
      "campaign-exports/README-TIDYUPS-CAMPAIGN.md": readme,
    };
  };

  const handleGoogleLogin = async (
    forceAccountPicker = false
  ): Promise<string | null> => {
    setIsSigningIn(true);
    setLaunchError(null);
    setDriveError(null);
    try {
      const result = await googleSignIn(forceAccountPicker);
      if (result) {
        setUser(result.user);
        setOauthToken(result.accessToken);
        setAccessibleAccounts([]);
        setUserSheets([]);
        return result.accessToken;
      }
      return null;
    } catch (err: any) {
      const msg =
        err?.message ||
        "Google sign-in was cancelled or failed. Please try again.";
      setLaunchError(msg);
      setDriveError(msg);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setOauthToken(null);
    setAccessibleAccounts([]);
    setUserSheets([]);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([editorCsvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tidyups-edmonton-google-ads-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadProjectZipLocally = async () => {
    setIsDownloadingZip(true);
    setDriveError(null);
    try {
      const res = await fetch("/api/project/zip-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraFiles: buildExtraArchiveFiles(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate project zip.");
      }

      const binaryStr = window.atob(data.base64Zip);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipFileName || data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDriveError(err?.message || "Could not download project zip.");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleConfirmAndUploadToDrive = async () => {
    setShowDriveConfirmModal(false);
    setIsUploadingDrive(true);
    setDriveError(null);
    setDriveUploadResult(null);

    try {
      let token = oauthToken || (await getAccessToken());
      if (!token) {
        token = await handleGoogleLogin(false);
      }
      if (!token) {
        throw new Error(
          "Please sign in with Google to authorize uploading to your 'Leads-Creator' Google Drive folder."
        );
      }

      const res = await fetch("/api/drive/upload-project-zip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          folderName: driveFolderName.trim() || "Leads-Creator",
          folderColorRgb: driveFolderColor,
          createColoredSubfolders: true,
          zipFileName:
            zipFileName.trim() || "TidyUps-Cleaning-Google-Ads-Project.zip",
          extraFiles: buildExtraArchiveFiles(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error ||
            "Failed to upload project zip to Google Drive 'Leads-Creator' folder."
        );
      }

      setDriveUploadResult(data);
    } catch (err: any) {
      setDriveError(
        err?.message || "Failed to upload project zip to Google Drive."
      );
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const handleConfirmAndCreateMasterSheet = async () => {
    setShowSheetConfirmModal(false);
    setIsCreatingSheet(true);
    setDriveError(null);
    setCreatedSheetResult(null);

    try {
      let token = oauthToken || (await getAccessToken());
      if (!token) {
        token = await handleGoogleLogin(false);
      }
      if (!token) {
        throw new Error(
          "Please sign in with Google so the app can create your styled Google Sheet."
        );
      }

      const res = await fetch("/api/sheets/create-master-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaign,
          dailyBudgetCad,
          biddingStrategy,
          maxCpcBidCad,
          keywordMatchType,
          folderName: driveFolderName.trim() || "Leads-Creator",
          folderColorRgb: driveFolderColor,
          sheetTitle:
            sheetTitle.trim() ||
            "TidyUps Cleaning — Edmonton Google Ads Master Sheet",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error || "Failed to create color-coded Google Sheet."
        );
      }

      setCreatedSheetResult(data);
    } catch (err: any) {
      setDriveError(
        err?.message || "Failed to create color-coded Google Sheet."
      );
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleListUserSheets = async () => {
    setIsLoadingUserSheets(true);
    setDriveError(null);
    try {
      let token = oauthToken || (await getAccessToken());
      if (!token) {
        token = await handleGoogleLogin(false);
      }
      if (!token) return;

      const res = await fetch("/api/sheets/list-user-sheets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Could not list Google Sheets.");
      }
      setUserSheets(data.files || []);
    } catch (err: any) {
      setDriveError(err?.message || "Could not list Google Sheets.");
    } finally {
      setIsLoadingUserSheets(false);
    }
  };

  const handleImportFromGoogleSheet = async (targetIdOrUrl?: string) => {
    const sheetRef = (targetIdOrUrl || importSheetInput).trim();
    if (!sheetRef) {
      setDriveError("Please select a Google Sheet or paste its URL/ID first.");
      return;
    }

    setIsImportingSheet(true);
    setDriveError(null);
    setImportedSheetSummary(null);

    try {
      let token = oauthToken || (await getAccessToken());
      if (!token) {
        token = await handleGoogleLogin(false);
      }
      if (!token) return;

      const res = await fetch("/api/sheets/import-from-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ spreadsheetIdOrUrl: sheetRef }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to read Google Sheet.");
      }

      // Now parse the raw rows into Positive Keywords & Negative Keywords
      const rawLines: string[] = String(data.rawTextDump || "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const newPositives = new Set<string>(campaign.targetKeywords);
      const newNegatives = new Set<string>(campaign.negativeKeywords || []);
      let addedPos = 0;
      let addedNeg = 0;

      for (const line of rawLines) {
        const parts = line
          .split("|")
          .map((p) => p.replace(/^["'\[\]]+|["'\[\]]+$/g, "").trim());
        for (const cell of parts) {
          const lower = cell.toLowerCase();
          if (
            !cell ||
            cell.length < 3 ||
            cell.length > 60 ||
            lower.includes("keyword #") ||
            lower.includes("raw search") ||
            lower.includes("negative #") ||
            lower.startsWith("http") ||
            lower.startsWith("kw-") ||
            lower.startsWith("neg-")
          ) {
            continue;
          }
          if (
            lower.includes("cleaning") ||
            lower.includes("cleaners") ||
            lower.includes("edmonton") ||
            lower.includes("move out") ||
            lower.includes("tenancy")
          ) {
            if (!newPositives.has(lower)) {
              newPositives.add(lower);
              addedPos++;
            }
          } else if (
            [
              "jobs",
              "job",
              "hiring",
              "diy",
              "free",
              "training",
              "supplies",
              "carpet",
              "duct",
              "car wash",
              "auto detailing",
            ].some((n) => lower.includes(n))
          ) {
            if (!newNegatives.has(lower)) {
              newNegatives.add(lower);
              addedNeg++;
            }
          }
        }
      }

      onUpdateCampaignMeta({
        targetKeywords: Array.from(newPositives),
        negativeKeywords: Array.from(newNegatives),
      });

      setImportedSheetSummary(
        `Synced "${data.sheetTitle}" (${data.discoveredTabs.join(
          ", "
        )}) — ${
          addedPos > 0 || addedNeg > 0
            ? `Added ${addedPos} new positive keywords & ${addedNeg} negative keywords`
            : `Verified ${newPositives.size} positive & ${newNegatives.size} negative keywords`
        }.`
      );
    } catch (err: any) {
      setDriveError(err?.message || "Failed to import from Google Sheet.");
    } finally {
      setIsImportingSheet(false);
    }
  };

  const handleFetchAccessibleCustomers = async () => {
    const token = oauthToken || (await getAccessToken());
    if (!token) {
      setLaunchError("Please sign in with Google first.");
      return;
    }
    setIsLoadingAccounts(true);
    setLaunchError(null);
    try {
      const res = await fetch("/api/google-ads/accessible-customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ developerToken }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to list Google Ads accounts.");
      }
      const ids = (data.resourceNames || []).map((rn: string) =>
        rn.replace("customers/", "")
      );
      setAccessibleAccounts(ids);
      if (ids.length > 0) {
        onUpdateCampaignMeta({ customerId: ids[0] });
      }
    } catch (err: any) {
      setShowCredentialsDrawer(true);
      setLaunchError(err?.message || "Could not fetch accessible accounts.");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleExecuteLaunch = async () => {
    setShowConfirmModal(false);
    setIsLaunching(true);
    setLaunchError(null);
    setLaunchResult(null);

    try {
      const token = oauthToken || (await getAccessToken()) || "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/google-ads/launch", {
        method: "POST",
        headers,
        body: JSON.stringify({
          customerId: campaign.customerId,
          loginCustomerId,
          accessToken: token,
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
      {/* Google Drive Colored Folders + Color-Coded Google Sheets + Full Project Auto-Zip Hub */}
      <div className="bg-white border-2 border-teal-600/30 rounded-xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                <span>Color-Coded Google Sheets & Colored Drive Folders</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                <Users className="w-3 h-3 text-slate-500" />
                <span>
                  Connected Account:{" "}
                  <strong className="text-slate-900">
                    {user?.email || "Sign in with any Google account"}
                  </strong>
                </span>
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900">
              Google Drive &ldquo;{driveFolderName}&rdquo; Hub — Color-Coded Google Sheet & Project Auto-Zip
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl">
              Creates a <strong>5-Tab Color-Coded Google Sheet</strong> (Deep
              Teal Overview, Royal Blue 15 Headlines & 5 Descriptions, Emerald
              Green Positive Keywords, Crimson Rose Negative Keywords, and Amber
              Gold Bulk Export), applies vibrant{" "}
              <strong>Google Drive folder colors</strong> to{" "}
              <strong>&ldquo;{driveFolderName}&rdquo;</strong> and its
              subfolders so everything stands out visually, and packages the
              entire project into a <code className="font-mono">.zip</code>{" "}
              backup. You can switch to any Google account anytime.
            </p>
          </div>

          {/* Action Buttons: Create Color-Coded Sheet | Auto-Zip to Drive | Download ZIP | Import Sheet */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSheetConfirmModal(true)}
              disabled={isCreatingSheet}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs"
            >
              {isCreatingSheet ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building Color-Coded Sheet...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Create Color-Coded Google Sheet
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowDriveConfirmModal(true)}
              disabled={isUploadingDrive}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs"
            >
              {isUploadingDrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Zipping & Coloring Drive...
                </>
              ) : (
                <>
                  <FolderUp className="w-4 h-4" />
                  Auto-Zip Project to &ldquo;{driveFolderName}&rdquo;
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadProjectZipLocally}
              disabled={isDownloadingZip}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              {isDownloadingZip ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Zipping...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download .ZIP
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowImportSheetDrawer((v) => !v);
                if (!showImportSheetDrawer && oauthToken) {
                  handleListUserSheets();
                }
              }}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FolderInput className="w-3.5 h-3.5 text-teal-700" />
              Import Keywords from Sheet
            </button>
          </div>
        </div>

        {/* Visual Color Preview of the 5 Sheet Tabs + Folder Color Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-100 items-center">
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Target Google Drive Folder Name
            </label>
            <input
              type="text"
              value={driveFolderName}
              onChange={(e) => setDriveFolderName(e.target.value)}
              placeholder="Leads-Creator"
              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div className="lg:col-span-4">
            <label className="block text-[11px] font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Palette className="w-3 h-3 text-teal-700" />
              <span>Google Drive Folder Highlight Color</span>
            </label>
            <div className="flex items-center gap-1.5">
              {DRIVE_FOLDER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setDriveFolderColor(c.hex)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 border transition-all ${
                    driveFolderColor === c.hex
                      ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  title={`Color Google Drive folder ${c.name}`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${c.badgeBg} shrink-0`}
                  />
                  <span className="hidden sm:inline">
                    {c.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="text-[11px] font-medium text-slate-700 mb-1">
              5 Color-Coded Google Sheet Tabs Included:
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-teal-700 text-white">
                1. Budget & Overview
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-700 text-white">
                2. 15H & 5 Descriptions
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-700 text-white">
                3. Positive Keywords
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-700 text-white">
                4. Negative Shield
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-600 text-white">
                5. Bulk Import
              </span>
            </div>
          </div>
        </div>

        {/* Optional Import Keywords from Existing Google Sheet Drawer */}
        {showImportSheetDrawer && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900">
                  Import Keywords from Any Google Sheet in Your Signed-In Account
                </div>
                <p className="text-slate-600 mt-0.5">
                  Paste any Google Sheet link or pick one from{" "}
                  <strong>{user?.email || "your Google account"}</strong> below.
                  Want to pull from another Google account? Click{" "}
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin(true)}
                    className="text-teal-700 font-semibold underline"
                  >
                    Switch Google Account
                  </button>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={handleListUserSheets}
                disabled={isLoadingUserSheets}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium inline-flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoadingUserSheets ? "animate-spin" : ""
                  }`}
                />
                Refresh My Google Sheets
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={importSheetInput}
                onChange={(e) => setImportSheetInput(e.target.value)}
                placeholder="Paste Google Sheet URL (https://docs.google.com/spreadsheets/d/...) or Spreadsheet ID"
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
              />
              <button
                type="button"
                onClick={() => handleImportFromGoogleSheet()}
                disabled={isImportingSheet}
                className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                {isImportingSheet ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Reading Sheet...
                  </>
                ) : (
                  <>
                    <FolderInput className="w-3.5 h-3.5" />
                    Import Keywords from Sheet
                  </>
                )}
              </button>
            </div>

            {userSheets.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-medium text-slate-600">
                  Recent Google Sheets in {user?.email}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {userSheets.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setImportSheetInput(s.id);
                        handleImportFromGoogleSheet(s.id);
                      }}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-teal-600 text-slate-800 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[220px]">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {importedSheetSummary && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importedSheetSummary}</span>
              </div>
            )}
          </div>
        )}

        {driveError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{driveError}</span>
          </div>
        )}

        {/* Created Color-Coded Google Sheet Success Banner */}
        {createdSheetResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Created Color-Coded Google Sheet:{" "}
                    <strong>{createdSheetResult.sheetTitle}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 pl-6">
                  Saved inside colored Drive folder{" "}
                  <strong>&ldquo;{createdSheetResult.folderName}&rdquo;</strong>{" "}
                  with 5 color-styled tabs:{" "}
                  {createdSheetResult.tabsCreated.join(" · ")}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={createdSheetResult.folderWebViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold hover:bg-emerald-100/50 transition-colors"
                >
                  <span>
                    Open Colored &ldquo;{createdSheetResult.folderName}&rdquo;
                    Folder
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={createdSheetResult.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Open Color-Coded Google Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Project ZIP + Colored Subfolders Success Banner */}
        {driveUploadResult && (
          <div className="p-4 rounded-xl bg-teal-50/90 border border-teal-200 space-y-2.5 text-xs text-teal-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Uploaded{" "}
                  <code className="font-mono">{driveUploadResult.fileName}</code>{" "}
                  ({Math.round(driveUploadResult.sizeBytes / 1024)} KB ·{" "}
                  {driveUploadResult.fileCount} files) & Colored{" "}
                  <strong>&ldquo;{driveUploadResult.folderName}&rdquo;</strong>!
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={driveUploadResult.folderWebViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-900 font-semibold hover:bg-teal-100/50 transition-colors"
                >
                  <span>
                    Open &ldquo;{driveUploadResult.folderName}&rdquo; Folder
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={driveUploadResult.fileWebViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors"
                >
                  <span>View .ZIP in Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {driveUploadResult.coloredSubfolders &&
              driveUploadResult.coloredSubfolders.length > 0 && (
                <div className="pt-1.5 border-t border-teal-200/70 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-teal-800">
                    Colored Drive Subfolders Ready:
                  </span>
                  {driveUploadResult.coloredSubfolders.map((sub) => (
                    <a
                      key={sub.name}
                      href={sub.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-teal-200 text-[11px] font-medium text-slate-800 hover:bg-teal-50"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span>{sub.name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Top Row: Google Ads Account Connection & Daily Budget Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Budget, Bidding & Account Setup */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Connect Google Account (With 1-Click Account Switcher) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div>
                <div className="text-xs font-medium text-teal-700">
                  Step 1 · Multi-Account Google Ads, Drive & Sheets Sign-In
                </div>
                <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                  Connect Any Google Account
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCredentialsDrawer((v) => !v)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {showCredentialsDrawer
                    ? "Hide Developer Token"
                    : "Developer Token (Optional)"}
                </button>

                {!oauthToken ? (
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin(true)}
                    disabled={isSigningIn}
                    className="inline-flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs border border-slate-300 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0"
                  >
                    <div className="w-4 h-4 shrink-0">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-full h-full block"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                      </svg>
                    </div>
                    <span>
                      {isSigningIn ? "Signing in..." : "Sign in with Google"}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{user?.email || "Google Connected"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGoogleLogin(true)}
                      disabled={isSigningIn}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      title="Switch to a different Google account"
                    >
                      Switch Account
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      title="Sign out of Google"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">
                    Google Ads Customer ID (10 digits)
                  </label>
                  {oauthToken && (
                    <button
                      type="button"
                      onClick={handleFetchAccessibleCustomers}
                      disabled={isLoadingAccounts}
                      className="text-[11px] text-teal-700 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${
                          isLoadingAccounts ? "animate-spin" : ""
                        }`}
                      />
                      Auto-Detect ID
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={campaign.customerId}
                  onChange={(e) =>
                    onUpdateCampaignMeta({ customerId: e.target.value })
                  }
                  placeholder="e.g. 123-456-7890"
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                />
                {accessibleAccounts.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {accessibleAccounts.map((accId) => (
                      <button
                        key={accId}
                        type="button"
                        onClick={() =>
                          onUpdateCampaignMeta({ customerId: accId })
                        }
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-teal-50 text-teal-800 border border-teal-200"
                      >
                        Use {accId}
                      </button>
                    ))}
                  </div>
                )}
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

            {/* Quick Phone Number (587-742-2500) & Target City / Location Updater */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-700" />
                  <span>
                    Quick Phone Number & Target City / Location Updater
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Automatically updates Headlines, 5 Descriptions (≤90c) &
                  Keywords
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Business Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="587-742-2500"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-teal-700" />
                    <span>Target City / Service Area</span>
                  </label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Edmonton & South Edmonton"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => handleApplyPhoneAndLocation()}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {syncedPhoneLocFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Synced All Ads!
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Sync Phone & City
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-500">
                  Quick City Swap:
                </span>
                {[
                  "Edmonton & South Edmonton",
                  "St. Albert",
                  "Sherwood Park",
                  "Leduc",
                  "Calgary",
                  "Red Deer",
                ].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() =>
                      handleApplyPhoneAndLocation(phoneInput, city)
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      campaign.location === city
                        ? "bg-teal-700 text-white border-teal-700"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Developer Token & MCC Drawer */}
            {showCredentialsDrawer && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="font-semibold text-slate-800">
                  Optional: Google Ads API Developer Token (For Direct REST Mutate)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  If you have a <strong>22-character Developer Token</strong>{" "}
                  (from a Google Ads Manager account under{" "}
                  <em>Tools & Settings → Setup → API Center</em>), paste it
                  below to push directly via REST. If left blank, clicking{" "}
                  <strong>Launch</strong> will still compile and verify all 61
                  operations and give you a 1-click Google Ads Editor CSV import
                  file.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Google Ads Developer Token (Optional)
                    </label>
                    <input
                      type="password"
                      value={developerToken}
                      onChange={(e) => setDeveloperToken(e.target.value)}
                      placeholder="Enter 22-char developer-token"
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Manager (MCC) Login Customer ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={loginCustomerId}
                      onChange={(e) => setLoginCustomerId(e.target.value)}
                      placeholder="Only if accessing via MCC"
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

          {/* 5-Step Pipeline Breakdown */}
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
                  { id: "live", label: "Live Account" },
                  { id: "validate_only", label: "API Validate" },
                  { id: "simulate", label: "Sandbox Test" },
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
            <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-2.5 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {launchResult.mode === "live"
                    ? "Live Google Ads API Mutate Completed!"
                    : "Campaign Pipeline Verified & Ready to Import!"}
                </span>
              </div>

              {launchResult.apiNotice && (
                <p className="text-[11px] text-emerald-900 bg-white/80 p-2.5 rounded-lg border border-emerald-200 leading-relaxed">
                  {launchResult.apiNotice}
                </p>
              )}

              {launchResult.receipt && (
                <div className="font-mono text-[11px] space-y-1 pt-1 text-emerald-900 tabular-nums">
                  <div>
                    Budget: {launchResult.receipt.budgetResource} ($
                    {launchResult.receipt.dailyBudgetCad}/day)
                  </div>
                  <div>
                    Campaign: {launchResult.receipt.campaignResource} (
                    {launchResult.receipt.campaignStatus})
                  </div>
                  <div>
                    Keywords: {launchResult.receipt.positiveKeywordsAttached}{" "}
                    Positive · {launchResult.receipt.negativeKeywordsAttached}{" "}
                    Negatives
                  </div>
                  <div>
                    Ads Created:{" "}
                    {launchResult.receipt.responsiveSearchAdsCreated} Responsive
                    Search Ads (All 5 Descriptions Active)
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Google Ads Editor CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowSheetConfirmModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Save to Color-Coded Google Sheet
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
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
                  {launchMode === "live"
                    ? `Launch Campaign (${atomicPayload.mutateOperations.length} Operations)`
                    : `Run Campaign Pipeline (${atomicPayload.mutateOperations.length} Ops)`}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="w-full py-2 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Ready-to-Import Google Ads CSV
            </button>
          </div>
        </div>
      </div>

      {/* Google Tag (AW-18539302675) & AdSense (ca-pub-8415242080067854) Verification Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Tag Active · ID: AW-18539302675</span>
              </div>
              <div className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Google AdSense Meta Active · ca-pub-8415242080067854
                </span>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mt-1">
              Google Ads Tag (AW-18539302675) & AdSense Account (ca-pub-8415242080067854)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Both <code className="font-mono">gtag.js (AW-18539302675)</code>{" "}
              and{" "}
              <code className="font-mono">
                &lt;meta name=&quot;google-adsense-account&quot;
                content=&quot;ca-pub-8415242080067854&quot;&gt;
              </code>{" "}
              are installed inside the <code className="font-mono">&lt;head&gt;</code>{" "}
              of <code className="font-mono">index.html</code> (and bundled into
              your Google Drive project <code className="font-mono">.zip</code>).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                typeof (window as any).gtag === "function"
              ) {
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

        {/* Public Routes on ads.tidyupscleaning.com (/booking, /support, /privacy, /T&C) */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-800">
              Active Public Endpoints on{" "}
              <code className="font-mono text-teal-800">
                ads.tidyupscleaning.com
              </code>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateCampaignMeta({
                  finalUrl: "https://ads.tidyupscleaning.com/booking",
                  sitelinks: [
                    {
                      id: "sl-ads-1",
                      linkText: "Book Cleaning Online",
                      description1: "Instant flat-rate quote in 60s",
                      description2: "Move-out & deep clean booking",
                      finalUrl: "https://ads.tidyupscleaning.com/booking",
                    },
                    {
                      id: "sl-ads-2",
                      linkText: "Customer Support Center",
                      description1: `Call ${
                        campaign.phoneNumber || "587-742-2500"
                      } or message us`,
                      description2: "7 days a week local support",
                      finalUrl: "https://ads.tidyupscleaning.com/support",
                    },
                    {
                      id: "sl-ads-3",
                      linkText: "Terms & Guarantee",
                      description1: "24-hour re-clean guarantee",
                      description2: "Transparent service terms",
                      finalUrl: "https://ads.tidyupscleaning.com/T&C",
                    },
                    {
                      id: "sl-ads-4",
                      linkText: "Privacy & Security",
                      description1: "Protected customer booking data",
                      description2: "Official TidyUps privacy policy",
                      finalUrl: "https://ads.tidyupscleaning.com/privacy",
                    },
                  ],
                })
              }
              className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold hover:bg-teal-100/70 transition-colors"
            >
              Set Campaign & Sitelink URLs to ads.tidyupscleaning.com
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {(
              [
                {
                  id: "booking" as PublicPageRoute,
                  path: "/booking",
                  url: "https://ads.tidyupscleaning.com/booking",
                  desc: "Instant Quote & Booking Page",
                },
                {
                  id: "support" as PublicPageRoute,
                  path: "/support",
                  url: "https://ads.tidyupscleaning.com/support",
                  desc: "Customer Support & FAQ Center",
                },
                {
                  id: "privacy" as PublicPageRoute,
                  path: "/privacy",
                  url: "https://ads.tidyupscleaning.com/privacy",
                  desc: "OAuth, Ads & AdSense Privacy Policy",
                },
                {
                  id: "tc" as PublicPageRoute,
                  path: "/T&C",
                  url: "https://ads.tidyupscleaning.com/T&C",
                  desc: "Terms, Cancellation & Guarantee",
                },
              ] as const
            ).map((route) => (
              <div
                key={route.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold font-mono text-slate-900">
                    ads.tidyupscleaning.com{route.path}
                  </div>
                  <div className="text-[11px] text-slate-500">{route.desc}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenPublicPage && onOpenPublicPage(route.id)}
                    className="flex-1 py-1 px-2 rounded bg-white border border-slate-300 hover:border-teal-600 text-[11px] font-semibold text-slate-800"
                  >
                    Open {route.path}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(route.url)}
                    className="py-1 px-2 rounded bg-slate-200/70 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
                    title={`Copy ${route.url}`}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              <strong>TidyUps Cleaning</strong> in mode{" "}
              <strong className="uppercase">{launchMode}</strong>:
            </p>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono tabular-nums text-slate-800">
              <div>Customer ID: {campaign.customerId}</div>
              <div>Campaign: {campaign.campaignName}</div>
              <div>Daily Budget: ${dailyBudgetCad.toFixed(2)} CAD/day</div>
              <div>Max CPC Ceiling: ${maxCpcBidCad.toFixed(2)} CAD</div>
              <div>
                Positive Keywords: {campaign.targetKeywords.length} (
                {keywordMatchType})
              </div>
              <div>
                Negative Keywords: {campaign.negativeKeywords?.length || 0}{" "}
                excluded
              </div>
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

      {/* Explicit User Confirmation Modal before Creating Color-Coded Google Sheet */}
      {showSheetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Color-Coded Google Sheet Creation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will create a new formatted, color-coded Google Sheet and
              apply high-visibility folder colors inside your Google Drive:
            </p>
            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-slate-700">
                Google Sheet Title
              </label>
              <input
                type="text"
                value={sheetTitle}
                onChange={(e) => setSheetTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono text-slate-800">
              <div>
                Drive Folder: &ldquo;{driveFolderName}&rdquo; (Colored{" "}
                {driveFolderColor})
              </div>
              <div>
                Tabs (5): Budget Overview (Teal) · 15H & 5D Copy (Blue) ·{" "}
                {campaign.targetKeywords.length} Positive KWs (Emerald) ·{" "}
                {campaign.negativeKeywords?.length || 0} Negative KWs (Rose) ·
                Bulk Import (Gold)
              </div>
              <div>
                Google Account:{" "}
                {user?.email || "Will prompt Google Sign-In on confirm"}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSheetConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndCreateMasterSheet}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Confirm & Create Google Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Modal before Creating/Uploading Zip in Google Drive */}
      {showDriveConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Project .ZIP & Colored Folders in Google Drive
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action will color-code your{" "}
              <strong>&ldquo;{driveFolderName}&rdquo;</strong> folder (and 3
              organized subfolders) and upload a complete{" "}
              <code className="font-mono">.zip</code> archive of the project:
            </p>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono text-slate-800">
              <div>
                Target Drive Folder: {driveFolderName} (Color: {driveFolderColor})
              </div>
              <div>Archive Filename: {zipFileName}</div>
              <div>
                Colored Subfolders: 01 Sheets (Emerald) · 02 ZIP Backups (Blue)
                · 03 CSV/JSON Exports (Gold)
              </div>
              <div>
                Google Account:{" "}
                {user?.email || "Will prompt Google Sign-In on confirm"}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDriveConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndUploadToDrive}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 flex items-center gap-1.5"
              >
                <FolderUp className="w-3.5 h-3.5" />
                Confirm & Upload to Google Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
