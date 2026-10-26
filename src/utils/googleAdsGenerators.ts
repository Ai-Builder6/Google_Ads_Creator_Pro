import {
  RsaCampaign,
  HeadlineAsset,
  DescriptionAsset,
} from "../data/tidyUpPresets";

export interface SimulatedAdPreview {
  headline1: HeadlineAsset;
  headline2: HeadlineAsset;
  headline3?: HeadlineAsset;
  description1: DescriptionAsset;
  description2?: DescriptionAsset;
  displayDomain: string;
  finalResolvedUrl: string;
}

export function buildResolvedFinalUrl(campaign: RsaCampaign): string {
  const base = campaign.finalUrl.trim() || "https://app.tidyupscleaning.com/booking";
  if (!campaign.enableUtm) return base;
  try {
    const url = new URL(base);
    if (campaign.utmSource) url.searchParams.set("utm_source", campaign.utmSource);
    if (campaign.utmMedium) url.searchParams.set("utm_medium", campaign.utmMedium);
    if (campaign.utmCampaign)
      url.searchParams.set("utm_campaign", campaign.utmCampaign);
    return url.toString();
  } catch {
    return base;
  }
}

export function extractDisplayDomain(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname;
  } catch {
    return "app.tidyupscleaning.com";
  }
}

/**
 * Generates realistic Google Ads SERP combinations while respecting HEADLINE_1, HEADLINE_2,
 * HEADLINE_3 and DESCRIPTION_1, DESCRIPTION_2 pin constraints per Google Ads API rules.
 * Rotates through all 5 descriptions across combinations.
 */
export function generateAdCombinations(
  campaign: RsaCampaign,
  maxPermutations = 6
): SimulatedAdPreview[] {
  const validHeadlines = campaign.headlines.filter(
    (h) => h.text.trim().length > 0
  );
  const validDescriptions = campaign.descriptions.filter(
    (d) => d.text.trim().length > 0
  );

  const fallbackHeadline: HeadlineAsset = {
    id: "fallback-h",
    text: "TidyUps Cleaning Service",
    pinnedField: "UNSPECIFIED",
    category: "Keyword",
  };

  const fallbackDesc: DescriptionAsset = {
    id: "fallback-d",
    text: "Moving out? Leave the cleaning to Tidyups. Get your Edmonton move-out quote today.",
    pinnedField: "UNSPECIFIED",
    angle: "Default",
  };

  const hPool = validHeadlines.length >= 2 ? validHeadlines : [fallbackHeadline, fallbackHeadline];
  const dPool = validDescriptions.length >= 1 ? validDescriptions : [fallbackDesc];

  const h1Pinned = hPool.filter((h) => h.pinnedField === "HEADLINE_1");
  const h2Pinned = hPool.filter((h) => h.pinnedField === "HEADLINE_2");
  const h3Pinned = hPool.filter((h) => h.pinnedField === "HEADLINE_3");
  const hUnpinned = hPool.filter((h) => h.pinnedField === "UNSPECIFIED");

  const d1Pinned = dPool.filter((d) => d.pinnedField === "DESCRIPTION_1");
  const d2Pinned = dPool.filter((d) => d.pinnedField === "DESCRIPTION_2");
  const dUnpinned = dPool.filter((d) => d.pinnedField === "UNSPECIFIED");

  const displayDomain = extractDisplayDomain(campaign.finalUrl);
  const finalResolvedUrl = buildResolvedFinalUrl(campaign);

  const results: SimulatedAdPreview[] = [];

  for (let i = 0; i < maxPermutations; i++) {
    const usedHIds = new Set<string>();

    const pickHeadline = (pinnedList: HeadlineAsset[], offset: number): HeadlineAsset => {
      if (pinnedList.length > 0) {
        const picked = pinnedList[offset % pinnedList.length];
        usedHIds.add(picked.id);
        return picked;
      }
      const available = hUnpinned.filter((h) => !usedHIds.has(h.id));
      const pool = available.length > 0 ? available : hPool;
      const picked = pool[offset % pool.length];
      usedHIds.add(picked.id);
      return picked;
    };

    const headline1 = pickHeadline(h1Pinned, i);
    const headline2 = pickHeadline(h2Pinned, i * 2 + 1);
    const headline3 =
      hPool.length >= 3 ? pickHeadline(h3Pinned, i * 3 + 2) : undefined;

    const usedDIds = new Set<string>();
    const pickDesc = (pinnedList: DescriptionAsset[], offset: number): DescriptionAsset => {
      if (pinnedList.length > 0) {
        const picked = pinnedList[offset % pinnedList.length];
        usedDIds.add(picked.id);
        return picked;
      }
      const available = dUnpinned.filter((d) => !usedDIds.has(d.id));
      const pool = available.length > 0 ? available : dPool;
      const picked = pool[offset % pool.length];
      usedDIds.add(picked.id);
      return picked;
    };

    const description1 = pickDesc(d1Pinned, i);
    const description2 =
      dPool.length >= 2 ? pickDesc(d2Pinned, i + 1) : undefined;

    results.push({
      headline1,
      headline2,
      headline3,
      description1,
      description2,
      displayDomain,
      finalResolvedUrl,
    });
  }

  return results;
}

/**
 * Builds the full atomic Google Ads API v18 `googleAds:mutate` payload that creates:
 * 1. CampaignBudget (in micros)
 * 2. Search Campaign
 * 3. Geo-Target (Edmonton, AB) + Negative Keywords (campaignCriterionOperation)
 * 4. AdGroup
 * 5. Positive Keywords (adGroupCriterionOperation)
 * 6. Responsive Search Ads (adGroupAdOperation)
 */
export function buildFullAtomicLaunchPayload(
  campaign: RsaCampaign,
  options?: {
    dailyBudgetCad?: number;
    biddingStrategy?: "MAXIMIZE_CLICKS" | "MAXIMIZE_CONVERSIONS";
    maxCpcBidCad?: number;
    keywordMatchType?: "PHRASE" | "EXACT" | "BROAD";
  }
) {
  const cleanCustomerId = (campaign.customerId || "1234567890").replace(/-/g, "");
  const dailyBudget = options?.dailyBudgetCad ?? campaign.dailyBudgetCad ?? 25;
  const amountMicros = Math.round(dailyBudget * 1_000_000);
  const maxCpcCad = options?.maxCpcBidCad ?? campaign.maxCpcBidCad ?? 3.5;
  const cpcBidMicros = Math.round(maxCpcCad * 1_000_000);
  const bidding =
    options?.biddingStrategy ?? campaign.biddingStrategy ?? "MAXIMIZE_CLICKS";
  const matchType = options?.keywordMatchType ?? "PHRASE";
  const finalUrl = buildResolvedFinalUrl(campaign);

  const budgetTempResource = `customers/${cleanCustomerId}/campaignBudgets/-1`;
  const campaignTempResource = `customers/${cleanCustomerId}/campaigns/-2`;
  const adGroupTempResource = `customers/${cleanCustomerId}/adGroups/-3`;

  const mutateOperations: any[] = [];

  // 1. CampaignBudgetOperation
  mutateOperations.push({
    campaignBudgetOperation: {
      create: {
        resourceName: budgetTempResource,
        name: `${campaign.campaignName} - Budget #${Date.now().toString().slice(-4)}`,
        amountMicros: String(amountMicros),
        deliveryMethod: "STANDARD",
        explicitlyShared: false,
      },
    },
  });

  // 2. CampaignOperation
  mutateOperations.push({
    campaignOperation: {
      create: {
        resourceName: campaignTempResource,
        name: campaign.campaignName,
        advertisingChannelType: "SEARCH",
        status: campaign.adStatus,
        campaignBudget: budgetTempResource,
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: true,
          targetContentNetwork: false,
        },
        ...(bidding === "MAXIMIZE_CLICKS"
          ? {
              targetSpend: {
                cpcBidCeilingMicros: String(cpcBidMicros),
              },
            }
          : {
              maximizeConversions: {},
            }),
      },
    },
  });

  // 3a. Location Targeting: Edmonton, Alberta (GeoTargetConstant 1001801)
  mutateOperations.push({
    campaignCriterionOperation: {
      create: {
        campaign: campaignTempResource,
        location: {
          geoTargetConstant: "geoTargetConstants/1001801",
        },
      },
    },
  });

  // 3b. Campaign-Level Negative Keywords (All 37 negative terms)
  for (const neg of campaign.negativeKeywords || []) {
    const cleanNeg = neg.trim();
    if (!cleanNeg) continue;
    mutateOperations.push({
      campaignCriterionOperation: {
        create: {
          campaign: campaignTempResource,
          negative: true,
          keyword: {
            text: cleanNeg,
            matchType: "PHRASE",
          },
        },
      },
    });
  }

  // 4. AdGroupOperation
  mutateOperations.push({
    adGroupOperation: {
      create: {
        resourceName: adGroupTempResource,
        name: campaign.adGroupName,
        campaign: campaignTempResource,
        status: "ENABLED",
        type: "SEARCH_STANDARD",
        cpcBidMicros: String(cpcBidMicros),
      },
    },
  });

  // 5. AdGroupCriterionOperations (Positive Search Keywords)
  for (const kw of campaign.targetKeywords || []) {
    const cleanKw = kw.trim();
    if (!cleanKw) continue;
    mutateOperations.push({
      adGroupCriterionOperation: {
        create: {
          adGroup: adGroupTempResource,
          status: "ENABLED",
          keyword: {
            text: cleanKw,
            matchType,
          },
        },
      },
    });
  }

  // 6. AdGroupAdOperations (Responsive Search Ads with all headlines & 5 descriptions)
  const nonEmptyHeadlines = campaign.headlines
    .filter((h) => h.text.trim().length > 0)
    .slice(0, 15)
    .map((h) => {
      const asset: Record<string, string> = { text: h.text.trim() };
      if (h.pinnedField !== "UNSPECIFIED") {
        asset.pinnedField = h.pinnedField;
      }
      return asset;
    });

  const nonEmptyDescriptions = campaign.descriptions.filter(
    (d) => d.text.trim().length > 0
  );

  const buildRsaOp = (descSlice: DescriptionAsset[]) => ({
    adGroupAdOperation: {
      create: {
        adGroup: adGroupTempResource,
        status: campaign.adStatus,
        ad: {
          finalUrls: [finalUrl],
          responsiveSearchAd: {
            headlines: nonEmptyHeadlines,
            descriptions: descSlice.slice(0, 4).map((d) => {
              const asset: Record<string, string> = { text: d.text.trim() };
              if (d.pinnedField !== "UNSPECIFIED") {
                asset.pinnedField = d.pinnedField;
              }
              return asset;
            }),
            ...(campaign.path1.trim() ? { path1: campaign.path1.trim() } : {}),
            ...(campaign.path2.trim() ? { path2: campaign.path2.trim() } : {}),
          },
        },
      },
    },
  });

  mutateOperations.push(buildRsaOp(nonEmptyDescriptions.slice(0, 4)));
  if (nonEmptyDescriptions.length >= 5) {
    mutateOperations.push(buildRsaOp(nonEmptyDescriptions.slice(1, 5)));
  }

  return {
    mutateOperations,
  };
}

/**
 * Generates the official Google Ads API v18 REST MutateAdGroupAdsRequest JSON payload
 * Reference: https://developers.google.com/google-ads/api/docs/responsive-search-ads/overview
 */
export function buildGoogleAdsRestPayload(campaign: RsaCampaign): string {
  const cleanCustomerId = (campaign.customerId || "1234567890").replace(/-/g, "");
  const cleanAdGroupId = (campaign.adGroupId || "9876543210").replace(/-/g, "");
  const finalUrl = buildResolvedFinalUrl(campaign);

  const nonEmptyDescriptions = campaign.descriptions.filter(
    (d) => d.text.trim().length > 0
  );

  const buildOperation = (descSlice: DescriptionAsset[]) => ({
    create: {
      adGroup: `customers/${cleanCustomerId}/adGroups/${cleanAdGroupId}`,
      status: campaign.adStatus,
      ad: {
        finalUrls: [finalUrl],
        responsiveSearchAd: {
          headlines: campaign.headlines
            .filter((h) => h.text.trim().length > 0)
            .slice(0, 15)
            .map((h) => {
              const asset: Record<string, string> = {
                text: h.text.trim(),
              };
              if (h.pinnedField !== "UNSPECIFIED") {
                asset.pinnedField = h.pinnedField;
              }
              return asset;
            }),
          descriptions: descSlice.slice(0, 4).map((d) => {
            const asset: Record<string, string> = {
              text: d.text.trim(),
            };
            if (d.pinnedField !== "UNSPECIFIED") {
              asset.pinnedField = d.pinnedField;
            }
            return asset;
          }),
          ...(campaign.path1.trim() ? { path1: campaign.path1.trim() } : {}),
          ...(campaign.path2.trim() ? { path2: campaign.path2.trim() } : {}),
        },
      },
    },
  });

  const operations = [buildOperation(nonEmptyDescriptions.slice(0, 4))];

  if (nonEmptyDescriptions.length >= 5) {
    operations.push(buildOperation(nonEmptyDescriptions.slice(1, 5)));
  }

  const payload = {
    operations,
    _tidyUpsCampaignMeta: {
      fiveDescriptionsPool: nonEmptyDescriptions.map((d) => ({
        text: d.text,
        charLength: d.text.length,
      })),
      positiveKeywordsCount: campaign.targetKeywords.length,
      negativeKeywordsCount: campaign.negativeKeywords?.length || 0,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function buildNodeJsApiSnippet(campaign: RsaCampaign): string {
  const cleanCustomerId = (campaign.customerId || "1234567890").replace(/-/g, "");
  const cleanAdGroupId = (campaign.adGroupId || "9876543210").replace(/-/g, "");
  const jsonBody = buildGoogleAdsRestPayload(campaign);

  return `/**
 * Google Ads API — Create Responsive Search Ad for TidyUps Cleaning
 * Docs: https://developers.google.com/google-ads/api/docs/responsive-search-ads/overview
 */

const CUSTOMER_ID = "${cleanCustomerId}";
const AD_GROUP_ID = "${cleanAdGroupId}";

async function createTidyUpResponsiveSearchAd(accessToken: string, developerToken: string) {
  const endpoint = \`https://googleads.googleapis.com/v18/customers/\${CUSTOMER_ID}/adGroupAds:mutate\`;

  const payload = ${jsonBody};

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${accessToken}\`,
      "developer-token": developerToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ operations: payload.operations }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(\`Google Ads API Error (\${response.status}): \${errorDetails}\`);
  }

  const result = await response.json();
  console.log("Created RSA resourceNames:", result.results);
  return result;
}`;
}

export function buildPythonApiSnippet(campaign: RsaCampaign): string {
  const cleanCustomerId = (campaign.customerId || "1234567890").replace(/-/g, "");
  const cleanAdGroupId = (campaign.adGroupId || "9876543210").replace(/-/g, "");
  const finalUrl = buildResolvedFinalUrl(campaign);

  const headlinesPython = campaign.headlines
    .filter((h) => h.text.trim().length > 0)
    .slice(0, 15)
    .map((h) => {
      const escaped = h.text.replace(/"/g, '\\"');
      if (h.pinnedField !== "UNSPECIFIED") {
        return `        create_ad_text_asset(client, "${escaped}", pinned_field_enum.${h.pinnedField}),`;
      }
      return `        create_ad_text_asset(client, "${escaped}"),`;
    })
    .join("\n");

  const descriptionsPython = campaign.descriptions
    .filter((d) => d.text.trim().length > 0)
    .slice(0, 4)
    .map((d) => {
      const escaped = d.text.replace(/"/g, '\\"');
      if (d.pinnedField !== "UNSPECIFIED") {
        return `        create_ad_text_asset(client, "${escaped}", pinned_field_enum.${d.pinnedField}),`;
      }
      return `        create_ad_text_asset(client, "${escaped}"),`;
    })
    .join("\n");

  return `# Official Google Ads Python SDK — Create Responsive Search Ad for TidyUps Cleaning
# Docs: https://developers.google.com/google-ads/api/docs/responsive-search-ads/create-responsive-search-ad

from google.ads.googleads.client import GoogleAdsClient

def create_ad_text_asset(client, text, pinned_field=None):
    ad_text_asset = client.get_type("AdTextAsset")
    ad_text_asset.text = text
    if pinned_field:
        ad_text_asset.pinned_field = pinned_field
    return ad_text_asset

def add_tidy_up_rsa(client: GoogleAdsClient, customer_id: str = "${cleanCustomerId}", ad_group_id: str = "${cleanAdGroupId}"):
    ad_group_ad_service = client.get_service("AdGroupAdService")
    ad_group_service = client.get_service("AdGroupService")
    pinned_field_enum = client.enums.ServedAssetFieldTypeEnum

    ad_group_ad_operation = client.get_type("AdGroupAdOperation")
    ad_group_ad = ad_group_ad_operation.create
    ad_group_ad.status = client.enums.AdGroupAdStatusEnum.${campaign.adStatus}
    ad_group_ad.ad_group = ad_group_service.ad_group_path(customer_id, ad_group_id)

    # Final URL pointing to TidyUps Cleaning customer booking app
    ad_group_ad.ad.final_urls.append("${finalUrl}")

    # Set ResponsiveSearchAdInfo headlines (3 to 15 assets, <= 30 chars each)
    ad_group_ad.ad.responsive_search_ad.headlines.extend([
${headlinesPython}
    ])

    # Set ResponsiveSearchAdInfo descriptions (<= 90 chars each)
    ad_group_ad.ad.responsive_search_ad.descriptions.extend([
${descriptionsPython}
    ])

    ad_group_ad.ad.responsive_search_ad.path1 = "${campaign.path1}"
    ad_group_ad.ad.responsive_search_ad.path2 = "${campaign.path2}"

    response = ad_group_ad_service.mutate_ad_group_ads(
        customer_id=customer_id, operations=[ad_group_ad_operation]
    )
    print(f"Created Responsive Search Ad: {response.results[0].resource_name}")`;
}

export function buildGoogleAdsEditorCsv(campaigns: RsaCampaign[]): string {
  const headers = [
    "Campaign",
    "Ad Group",
    "Ad type",
    "Status",
    "Final URL",
    "Path 1",
    "Path 2",
  ];

  for (let i = 1; i <= 15; i++) {
    headers.push(`Headline ${i}`);
    headers.push(`Headline ${i} position`);
  }
  for (let i = 1; i <= 5; i++) {
    headers.push(`Description ${i}`);
    headers.push(`Description ${i} position`);
  }

  const escapeCsv = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const pinToPositionNumber = (pin: string): string => {
    if (pin === "HEADLINE_1" || pin === "DESCRIPTION_1") return "1";
    if (pin === "HEADLINE_2" || pin === "DESCRIPTION_2") return "2";
    if (pin === "HEADLINE_3") return "3";
    return "";
  };

  const rows = campaigns.map((c) => {
    const row: string[] = [
      c.campaignName,
      c.adGroupName,
      "Responsive search ad",
      c.adStatus === "ENABLED" ? "Enabled" : "Paused",
      buildResolvedFinalUrl(c),
      c.path1,
      c.path2,
    ];

    for (let i = 0; i < 15; i++) {
      const h = c.headlines[i];
      row.push(h ? h.text : "");
      row.push(h ? pinToPositionNumber(h.pinnedField) : "");
    }

    for (let i = 0; i < 5; i++) {
      const d = c.descriptions[i];
      row.push(d ? d.text : "");
      row.push(d ? pinToPositionNumber(d.pinnedField) : "");
    }

    return row.map(escapeCsv).join(",");
  });

  return [headers.map(escapeCsv).join(","), ...rows].join("\n");
}
