export type HeadlinePinnedField =
  | "UNSPECIFIED"
  | "HEADLINE_1"
  | "HEADLINE_2"
  | "HEADLINE_3";

export type DescriptionPinnedField =
  | "UNSPECIFIED"
  | "DESCRIPTION_1"
  | "DESCRIPTION_2";

export type HeadlineCategory =
  | "Keyword"
  | "Booking CTA"
  | "Trust"
  | "Offer"
  | "Location";

export interface HeadlineAsset {
  id: string;
  text: string;
  pinnedField: HeadlinePinnedField;
  category: HeadlineCategory;
}

export interface DescriptionAsset {
  id: string;
  text: string;
  pinnedField: DescriptionPinnedField;
  angle: string;
}

export interface SitelinkAsset {
  id: string;
  linkText: string;
  description1: string;
  description2: string;
  finalUrl: string;
}

export interface KeywordCluster {
  clusterName: string;
  suggestedPath1: string;
  suggestedPath2: string;
  keywords: string[];
}

export interface NegativeCategory {
  categoryName: string;
  terms: string[];
}

export interface GeneratedCleaningImage {
  id: string;
  sceneTitle: string;
  prompt: string;
  aspectRatio: "1:1" | "16:9" | "4:3" | "9:16";
  imageUrl: string;
  attachedToAd: boolean;
  createdAt: string;
}

export const CLEANING_IMAGE_SCENE_PRESETS: {
  id: string;
  title: string;
  category: string;
  aspectRatio: "1:1" | "16:9" | "4:3";
  prompt: string;
}[] = [
  {
    id: "scene-moveout-living",
    title: "Move-Out Empty Apartment & Gleaming Floors",
    category: "Move-Out Cleaning",
    aspectRatio: "1:1",
    prompt:
      "Bright sunlit empty modern apartment living room and open kitchen in Edmonton after a professional move-out cleaning, gleaming hardwood floors, spotless white baseboards, sparkling windows, inspection-ready real estate interior photography, natural daylight, 8k",
  },
  {
    id: "scene-deep-kitchen",
    title: "Deep-Cleaned Kitchen & Stainless Appliances",
    category: "Deep Cleaning",
    aspectRatio: "1:1",
    prompt:
      "Spotless modern residential kitchen interior after a deep house cleaning, sparkling white quartz countertops, polished stainless steel stove and sink, zero clutter, warm natural morning sunlight, high-end interior architectural photography",
  },
  {
    id: "scene-bathroom-tile",
    title: "Sanitized Bathroom, Glass Shower & Tile",
    category: "Bathroom Buildup",
    aspectRatio: "1:1",
    prompt:
      "Sparkling clean modern home bathroom after professional deep cleaning, crystal clear glass shower door with zero water spots, gleaming white subway tile and grout, polished chrome faucet, neatly folded fresh white towels, bright clean lighting",
  },
  {
    id: "scene-baseboards-detail",
    title: "Crisp Baseboards, Corners & Fresh Floors",
    category: "Detail & Baseboards",
    aspectRatio: "16:9",
    prompt:
      "Close-up editorial interior view of spotless white wooden baseboards and freshly mopped warm oak floors in a bright home hallway, immaculate dust-free trim, soft natural window shadows, commercial cleaning photography",
  },
  {
    id: "scene-cleaner-action",
    title: "TidyUps Pro Cleaner Wiping Kitchen Island",
    category: "Service in Action",
    aspectRatio: "16:9",
    prompt:
      "Professional residential house cleaner in neat teal polo shirt wiping down a sunlit marble kitchen island with a microfiber cloth and eco-friendly spray bottle, warm welcoming Canadian home interior, authentic commercial photography",
  },
];

export interface RsaCampaign {
  id: string;
  campaignName: string;
  adGroupName: string;
  serviceType: string;
  location: string;
  promoOffer: string;
  brandTone: string;
  finalUrl: string;
  phoneNumber: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  enableUtm: boolean;
  path1: string;
  path2: string;
  targetKeywords: string[];
  negativeKeywords: string[];
  keywordClusters?: KeywordCluster[];
  negativeCategories?: NegativeCategory[];
  headlines: HeadlineAsset[];
  descriptions: DescriptionAsset[];
  sitelinks: SitelinkAsset[];
  callouts: string[];
  strategySummary: string;
  customerId: string;
  adGroupId: string;
  adStatus: "ENABLED" | "PAUSED";
  dailyBudgetCad?: number;
  biddingStrategy?: "MAXIMIZE_CLICKS" | "MAXIMIZE_CONVERSIONS";
  maxCpcBidCad?: number;
  attachedImageUrl?: string;
  generatedImages?: GeneratedCleaningImage[];
  updatedAt: string;
}

export const DEFAULT_USER_RAW_DUMP = `"move out cleaning edmonton"
"move out cleaners edmonton"
"move out cleaning services edmonton"
"end of tenancy cleaning edmonton"
"rental cleaning edmonton"
"apartment move out cleaning edmonton"
"house move out cleaning edmonton"
"move in cleaning edmonton"
"move in move out cleaning edmonton"
"deep cleaning edmonton"
"deep house cleaning edmonton"
"deep cleaning services edmonton"
"deep cleaners edmonton"
"house deep cleaning edmonton"
"apartment deep cleaning edmonton"
"professional house cleaning edmonton"
"move out cleaning near me"
"deep cleaning near me"
"move out cleaning south edmonton"
"deep cleaning south edmonton"

also negative keywords
"jobs"
"job"
"hiring"
"careers"
"career"
"salary"
"wages"
"employment"
"resume"
" Indeed"
"training"
"course"
"courses"
"certification"
"how to"
"do it yourself"
"diy"
"free"
"cleaning supplies"
"cleaning products"
"cleaning equipment"
"equipment rental"
"vacuum repair"
"car cleaning"
"auto detailing"
"car wash"
"dry cleaning"
"laundry service"
"duct cleaning"
"chimney cleaning"
"gutter cleaning"
"pool cleaning"
"teeth cleaning"
"dental cleaning"
"office cleaning"
"commercial cleaning"
"janitorial"
Moving out? Leave the cleaning to Tidyups. Get your Edmonton move-out quote today.
Built-up dirt and grime? Our deep cleaning gives your home a fresh start. Book today.
Make moving easier with thorough kitchen, bathroom and floor cleaning. Get a quote.
From baseboards to bathroom buildup, we handle the details. Book your deep clean.
Need move-out or deep cleaning in Edmonton? Call Tidyups at 587-742-2500 today.`;

export const USER_NEGATIVE_KEYWORDS = [
  "jobs",
  "job",
  "hiring",
  "careers",
  "career",
  "salary",
  "wages",
  "employment",
  "resume",
  "Indeed",
  "training",
  "course",
  "courses",
  "certification",
  "how to",
  "do it yourself",
  "diy",
  "free",
  "cleaning supplies",
  "cleaning products",
  "cleaning equipment",
  "equipment rental",
  "vacuum repair",
  "car cleaning",
  "auto detailing",
  "car wash",
  "dry cleaning",
  "laundry service",
  "duct cleaning",
  "chimney cleaning",
  "gutter cleaning",
  "pool cleaning",
  "teeth cleaning",
  "dental cleaning",
  "office cleaning",
  "commercial cleaning",
  "janitorial",
];

export const USER_FIVE_DESCRIPTIONS: DescriptionAsset[] = [
  {
    id: "ud-1",
    text: "Moving out? Leave the cleaning to Tidyups. Get your Edmonton move-out quote today.",
    pinnedField: "UNSPECIFIED",
    angle: "Move-Out Quote CTA",
  },
  {
    id: "ud-2",
    text: "Built-up dirt and grime? Our deep cleaning gives your home a fresh start. Book today.",
    pinnedField: "UNSPECIFIED",
    angle: "Deep Clean Reset",
  },
  {
    id: "ud-3",
    text: "Make moving easier with thorough kitchen, bathroom and floor cleaning. Get a quote.",
    pinnedField: "UNSPECIFIED",
    angle: "Kitchen, Bath & Floors",
  },
  {
    id: "ud-4",
    text: "From baseboards to bathroom buildup, we handle the details. Book your deep clean.",
    pinnedField: "UNSPECIFIED",
    angle: "Baseboards & Details",
  },
  {
    id: "ud-5",
    text: "Need move-out or deep cleaning in Edmonton? Call Tidyups at 587-742-2500 today.",
    pinnedField: "UNSPECIFIED",
    angle: "Edmonton Direct Call CTA",
  },
];

export const DEFAULT_NEGATIVE_CATEGORIES: NegativeCategory[] = [
  {
    categoryName: "Jobs, Hiring & Employment",
    terms: [
      "jobs",
      "job",
      "hiring",
      "careers",
      "career",
      "salary",
      "wages",
      "employment",
      "resume",
      "Indeed",
    ],
  },
  {
    categoryName: "DIY, Courses & Freebies",
    terms: [
      "training",
      "course",
      "courses",
      "certification",
      "how to",
      "do it yourself",
      "diy",
      "free",
    ],
  },
  {
    categoryName: "Supplies, Products & Equipment Rental",
    terms: [
      "cleaning supplies",
      "cleaning products",
      "cleaning equipment",
      "equipment rental",
      "vacuum repair",
    ],
  },
  {
    categoryName: "Unrelated Cleaning Services (Auto, Duct, Dental, Commercial)",
    terms: [
      "car cleaning",
      "auto detailing",
      "car wash",
      "dry cleaning",
      "laundry service",
      "duct cleaning",
      "chimney cleaning",
      "gutter cleaning",
      "pool cleaning",
      "teeth cleaning",
      "dental cleaning",
      "office cleaning",
      "commercial cleaning",
      "janitorial",
    ],
  },
];

export const DEFAULT_KEYWORD_CLUSTERS: KeywordCluster[] = [
  {
    clusterName: "Ad Group 1: Move-Out & End of Tenancy Edmonton",
    suggestedPath1: "move-out",
    suggestedPath2: "edmonton",
    keywords: [
      "move out cleaning edmonton",
      "move out cleaners edmonton",
      "move out cleaning services edmonton",
      "end of tenancy cleaning edmonton",
      "rental cleaning edmonton",
      "apartment move out cleaning edmonton",
      "house move out cleaning edmonton",
      "move in cleaning edmonton",
      "move in move out cleaning edmonton",
      "move out cleaning near me",
      "move out cleaning south edmonton",
    ],
  },
  {
    clusterName: "Ad Group 2: Deep House & Apartment Cleaning Edmonton",
    suggestedPath1: "deep-clean",
    suggestedPath2: "edmonton",
    keywords: [
      "deep cleaning edmonton",
      "deep house cleaning edmonton",
      "deep cleaning services edmonton",
      "deep cleaners edmonton",
      "house deep cleaning edmonton",
      "apartment deep cleaning edmonton",
      "professional house cleaning edmonton",
      "deep cleaning near me",
      "deep cleaning south edmonton",
    ],
  },
];

export const TIDY_UP_PRESETS: Record<string, RsaCampaign> = {
  edmonton_combined: {
    id: "preset-edmonton-combined",
    campaignName: "Search - TidyUps Edmonton - Move-Out & Deep Clean",
    adGroupName: "Edmonton Move-Out & Deep Cleaning",
    serviceType: "Move-Out, End of Tenancy & Deep Cleaning",
    location: "Edmonton & South Edmonton",
    promoOffer: "Instant Online Quote or Call 587-742-2500 Today",
    brandTone: "Trustworthy, Warm & Action-Oriented",
    finalUrl: "https://app.tidyupscleaning.com/booking",
    phoneNumber: "587-742-2500",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "tidyups_edmonton_moveout_deep",
    enableUtm: false,
    path1: "edmonton",
    path2: "move-out-deep",
    targetKeywords: [
      "move out cleaning edmonton",
      "move out cleaners edmonton",
      "move out cleaning services edmonton",
      "end of tenancy cleaning edmonton",
      "rental cleaning edmonton",
      "apartment move out cleaning edmonton",
      "house move out cleaning edmonton",
      "move in cleaning edmonton",
      "move in move out cleaning edmonton",
      "deep cleaning edmonton",
      "deep house cleaning edmonton",
      "deep cleaning services edmonton",
      "deep cleaners edmonton",
      "house deep cleaning edmonton",
      "apartment deep cleaning edmonton",
      "professional house cleaning edmonton",
      "move out cleaning near me",
      "deep cleaning near me",
      "move out cleaning south edmonton",
      "deep cleaning south edmonton",
    ],
    negativeKeywords: USER_NEGATIVE_KEYWORDS,
    keywordClusters: DEFAULT_KEYWORD_CLUSTERS,
    negativeCategories: DEFAULT_NEGATIVE_CATEGORIES,
    headlines: [
      {
        id: "ec-h1",
        text: "Move Out Cleaning Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "ec-h2",
        text: "Deep House Cleaning Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "ec-h3",
        text: "TidyUps Cleaning Service",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "ec-h4",
        text: "End of Tenancy Clean Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "ec-h5",
        text: "Get Your Move-Out Quote Today",
        pinnedField: "UNSPECIFIED",
        category: "Booking CTA",
      },
      {
        id: "ec-h6",
        text: "Call TidyUps: 587-742-2500",
        pinnedField: "UNSPECIFIED",
        category: "Booking CTA",
      },
      {
        id: "ec-h7",
        text: "Book Online in 60 Seconds",
        pinnedField: "UNSPECIFIED",
        category: "Booking CTA",
      },
      {
        id: "ec-h8",
        text: "House & Apartment Move-Out",
        pinnedField: "UNSPECIFIED",
        category: "Offer",
      },
      {
        id: "ec-h9",
        text: "Baseboards, Kitchens & Baths",
        pinnedField: "UNSPECIFIED",
        category: "Trust",
      },
      {
        id: "ec-h10",
        text: "South Edmonton & All YEG",
        pinnedField: "UNSPECIFIED",
        category: "Location",
      },
      {
        id: "ec-h11",
        text: "Move-In & Rental Cleaning Pros",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "ec-h12",
        text: "Tough Grime & Buildup Gone",
        pinnedField: "UNSPECIFIED",
        category: "Trust",
      },
      {
        id: "ec-h13",
        text: "100% Satisfaction Guaranteed",
        pinnedField: "UNSPECIFIED",
        category: "Trust",
      },
      {
        id: "ec-h14",
        text: "Upfront Flat-Rate Quotes",
        pinnedField: "UNSPECIFIED",
        category: "Offer",
      },
    ],
    descriptions: USER_FIVE_DESCRIPTIONS,
    sitelinks: [
      {
        id: "sl-1",
        linkText: "Get Move-Out Quote Online",
        description1: "House & apartment move-out clean",
        description2: "Book in 60s at TidyUps Cleaning",
        finalUrl: "https://app.tidyupscleaning.com/booking?service=moveout",
      },
      {
        id: "sl-2",
        linkText: "Edmonton Deep Cleaning",
        description1: "Baseboards, kitchen & bath grime",
        description2: "Give your home a fresh start",
        finalUrl: "https://app.tidyupscleaning.com/booking?service=deep",
      },
      {
        id: "sl-3",
        linkText: "End of Tenancy Checklist",
        description1: "Rental & landlord inspection ready",
        description2: "Thorough floors, ovens & baths",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
      {
        id: "sl-4",
        linkText: "South Edmonton Cleaners",
        description1: "Serving South Edmonton & all YEG",
        description2: "Call 587-742-2500 or book online",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
    ],
    callouts: [
      "Call 587-742-2500 Today",
      "Edmonton & South Edmonton",
      "Baseboards to Bathrooms",
      "Book Online in 60 Seconds",
    ],
    strategySummary:
      "Built directly from your 20 Edmonton Move-Out & Deep Cleaning keywords, 37 negative keywords, and 5 TidyUps descriptions (all ≤90 chars).",
    customerId: "1234567890",
    adGroupId: "9876543210",
    adStatus: "ENABLED",
    updatedAt: new Date().toISOString(),
  },

  move_out: {
    id: "preset-move-out",
    campaignName: "Search - TidyUps Edmonton - Move Out & Tenancy",
    adGroupName: "Ad Group 1: Move-Out & Rental Cleaning Edmonton",
    serviceType: "Move-In / Move-Out & End of Tenancy Cleaning",
    location: "Edmonton & South Edmonton",
    promoOffer: "Landlord Inspection Checklist & Instant Quote (587-742-2500)",
    brandTone: "Reliable, Thorough & Urgency-Focused",
    finalUrl: "https://app.tidyupscleaning.com/booking",
    phoneNumber: "587-742-2500",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "tidyups_move_out_edmonton",
    enableUtm: false,
    path1: "move-out",
    path2: "edmonton",
    targetKeywords: DEFAULT_KEYWORD_CLUSTERS[0].keywords,
    negativeKeywords: USER_NEGATIVE_KEYWORDS,
    keywordClusters: DEFAULT_KEYWORD_CLUSTERS,
    negativeCategories: DEFAULT_NEGATIVE_CATEGORIES,
    headlines: [
      {
        id: "mo-h1",
        text: "Move Out Cleaning Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "mo-h2",
        text: "End of Tenancy Clean Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "mo-h3",
        text: "Move Out Cleaners Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "mo-h4",
        text: "TidyUps Cleaning Service",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "mo-h5",
        text: "Get Your Move-Out Quote Today",
        pinnedField: "UNSPECIFIED",
        category: "Booking CTA",
      },
      {
        id: "mo-h6",
        text: "House & Apartment Move-Out",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "mo-h7",
        text: "Rental Cleaning Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "mo-h8",
        text: "Move In Move Out Cleaning YEG",
        pinnedField: "UNSPECIFIED",
        category: "Location",
      },
      {
        id: "mo-h9",
        text: "Move Out Clean South Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Location",
      },
      {
        id: "mo-h10",
        text: "Call TidyUps: 587-742-2500",
        pinnedField: "UNSPECIFIED",
        category: "Booking CTA",
      },
      {
        id: "mo-h11",
        text: "Kitchens, Bathrooms & Floors",
        pinnedField: "UNSPECIFIED",
        category: "Trust",
      },
      {
        id: "mo-h12",
        text: "Pass Your Final Inspection",
        pinnedField: "UNSPECIFIED",
        category: "Offer",
      },
    ],
    descriptions: USER_FIVE_DESCRIPTIONS,
    sitelinks: [
      {
        id: "sl-1",
        linkText: "Instant Move-Out Quote",
        description1: "Enter home size for exact rate",
        description2: "Book your moving date in 60s",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
      {
        id: "sl-2",
        linkText: "End of Tenancy Package",
        description1: "Inside oven, fridge & cabinets",
        description2: "Full landlord checklist coverage",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
      {
        id: "sl-3",
        linkText: "Move-In Cleaning Edmonton",
        description1: "Start fresh in your new home",
        description2: "Every surface sanitized",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
      {
        id: "sl-4",
        linkText: "South Edmonton Move-Out",
        description1: "Fast crews across South YEG",
        description2: "Call 587-742-2500 or book online",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
    ],
    callouts: [
      "End of Tenancy Specialists",
      "House & Apartment Move-Out",
      "Call 587-742-2500 Today",
      "Edmonton & South Edmonton",
    ],
    strategySummary:
      "Dedicated Move-Out & End of Tenancy Ad Group matching your 11 move-out/rental keywords and 5 TidyUps descriptions.",
    customerId: "1234567890",
    adGroupId: "9876543210",
    adStatus: "ENABLED",
    updatedAt: new Date().toISOString(),
  },

  deep_clean: {
    id: "preset-deep-clean",
    campaignName: "Search - TidyUps Edmonton - Deep Cleaning",
    adGroupName: "Ad Group 2: Deep House & Apartment Cleaning Edmonton",
    serviceType: "Top-to-Bottom Deep House & Apartment Cleaning",
    location: "Edmonton & South Edmonton",
    promoOffer: "Baseboards, Kitchens & Bathroom Buildup Handled (587-742-2500)",
    brandTone: "Detail-Obsessed, Premium & Refreshing",
    finalUrl: "https://app.tidyupscleaning.com/booking",
    phoneNumber: "587-742-2500",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "tidyups_deep_clean_edmonton",
    enableUtm: false,
    path1: "deep-clean",
    path2: "edmonton",
    targetKeywords: DEFAULT_KEYWORD_CLUSTERS[1].keywords,
    negativeKeywords: USER_NEGATIVE_KEYWORDS,
    keywordClusters: DEFAULT_KEYWORD_CLUSTERS,
    negativeCategories: DEFAULT_NEGATIVE_CATEGORIES,
    headlines: [
      {
        id: "dc-h1",
        text: "Deep Cleaning Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "dc-h2",
        text: "Deep House Cleaning Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "dc-h3",
        text: "Deep Cleaners Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "dc-h4",
        text: "TidyUps Cleaning Service",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "dc-h5",
        text: "Book Your Deep Clean Today",
        pinnedField: "UNSPECIFIED",
        category: "Booking CTA",
      },
      {
        id: "dc-h6",
        text: "Apartment Deep Clean Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "dc-h7",
        text: "Deep Cleaning South Edmonton",
        pinnedField: "UNSPECIFIED",
        category: "Location",
      },
      {
        id: "dc-h8",
        text: "Baseboards to Bathroom Buildup",
        pinnedField: "UNSPECIFIED",
        category: "Trust",
      },
      {
        id: "dc-h9",
        text: "Erase Built-Up Dirt & Grime",
        pinnedField: "UNSPECIFIED",
        category: "Offer",
      },
      {
        id: "dc-h10",
        text: "Call TidyUps: 587-742-2500",
        pinnedField: "UNSPECIFIED",
        category: "Booking CTA",
      },
      {
        id: "dc-h11",
        text: "Professional House Cleaning",
        pinnedField: "UNSPECIFIED",
        category: "Keyword",
      },
      {
        id: "dc-h12",
        text: "Give Your Home a Fresh Start",
        pinnedField: "UNSPECIFIED",
        category: "Offer",
      },
    ],
    descriptions: USER_FIVE_DESCRIPTIONS,
    sitelinks: [
      {
        id: "sl-1",
        linkText: "Book Deep Clean Online",
        description1: "Instant pricing by bedroom count",
        description2: "Give your home a fresh start",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
      {
        id: "sl-2",
        linkText: "Baseboards & Bath Scrub",
        description1: "Hand-wiped baseboards & doors",
        description2: "Sanitized sinks, tubs & tile",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
      {
        id: "sl-3",
        linkText: "Kitchen Grime Removal",
        description1: "Inside oven, fridge & cabinets",
        description2: "Add to any online booking",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
      {
        id: "sl-4",
        linkText: "South Edmonton Deep Clean",
        description1: "Serving South Edmonton & all YEG",
        description2: "Call 587-742-2500 or book online",
        finalUrl: "https://app.tidyupscleaning.com/booking",
      },
    ],
    callouts: [
      "Baseboards to Bathrooms",
      "Built-Up Grime Removed",
      "Call 587-742-2500 Today",
      "Book Online in 60 Seconds",
    ],
    strategySummary:
      "Dedicated Deep Cleaning Ad Group matching your 9 Edmonton & South Edmonton deep cleaning keywords and 5 TidyUps descriptions.",
    customerId: "1234567890",
    adGroupId: "9876543210",
    adStatus: "ENABLED",
    updatedAt: new Date().toISOString(),
  },
};

const KNOWN_NEGATIVE_PATTERNS = {
  jobs: [
    "job",
    "jobs",
    "hiring",
    "career",
    "careers",
    "salary",
    "wages",
    "employment",
    "resume",
    "indeed",
    "work",
    "vacancy",
  ],
  diy: [
    "training",
    "course",
    "courses",
    "certification",
    "how to",
    "do it yourself",
    "diy",
    "free",
    "tutorial",
    "tips",
  ],
  supplies: [
    "supplies",
    "products",
    "equipment",
    "rental",
    "vacuum",
    "repair",
    "chemical",
    "detergent",
  ],
  unrelated: [
    "car",
    "auto",
    "detailing",
    "wash",
    "dry cleaning",
    "laundry",
    "duct",
    "chimney",
    "gutter",
    "pool",
    "teeth",
    "dental",
    "office",
    "commercial",
    "janitorial",
    "window",
  ],
};

/**
 * Instant deterministic parser that sorts a raw mixed paste of positive keywords,
 * negative keywords, and descriptions into structured Ad Group clusters, Negative Categories,
 * 5 Descriptions (<=90 chars), and 12-15 Headlines (<=30 chars).
 */
export function instantParseAndSortDump(rawInput: string): {
  positiveKeywords: string[];
  negativeKeywords: string[];
  descriptions: DescriptionAsset[];
  keywordClusters: KeywordCluster[];
  negativeCategories: NegativeCategory[];
  detectedPhone: string;
  detectedLocation: string;
  headlines: HeadlineAsset[];
} {
  const lines = rawInput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const positiveKeywords: string[] = [];
  const negativeKeywords: string[] = [];
  const extractedDescriptions: string[] = [];

  let inNegativeSection = false;
  let detectedPhone = "587-742-2500";
  let detectedLocation = "Edmonton";

  const phoneRegex = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;

  for (const rawLine of lines) {
    const phoneMatch = rawLine.match(phoneRegex);
    if (phoneMatch) {
      detectedPhone = phoneMatch[0];
    }

    const lower = rawLine.toLowerCase();

    // Detect transition header like "also negative keywords" or "negative keywords:"
    if (
      lower.includes("negative keyword") ||
      lower === "negatives" ||
      lower === "negative:"
    ) {
      inNegativeSection = true;
      continue;
    }
    if (
      lower.includes("positive keyword") ||
      lower === "keywords:" ||
      lower === "descriptions:"
    ) {
      if (!lower.includes("negative")) {
        inNegativeSection = false;
      }
      continue;
    }

    // Remove surrounding quotes or leading bullets/hyphens
    const isExplicitNegative = rawLine.startsWith("-") && rawLine.length > 2;
    const unquoted = rawLine
      .replace(/^[-•*]\s*/, "")
      .replace(/^["']+|["']+$/g, "")
      .trim();

    if (!unquoted) continue;

    // Check if this line is a full ad description sentence (has punctuation like . or ? and length >= 38)
    const looksLikeSentence =
      (unquoted.includes(".") ||
        unquoted.includes("?") ||
        unquoted.includes("!")) &&
      unquoted.length >= 35;

    if (looksLikeSentence) {
      extractedDescriptions.push(unquoted);
      continue;
    }

    // Check if it belongs to negative keywords
    const unquotedLower = unquoted.toLowerCase();
    const matchesKnownNegative =
      Object.values(KNOWN_NEGATIVE_PATTERNS)
        .flat()
        .some((term) => unquotedLower === term) &&
      !unquotedLower.includes("edmonton") &&
      !unquotedLower.includes("move out") &&
      !unquotedLower.includes("deep clean") &&
      !unquotedLower.includes("house");

    if (inNegativeSection || isExplicitNegative || matchesKnownNegative) {
      if (!negativeKeywords.includes(unquoted)) {
        negativeKeywords.push(unquoted);
      }
    } else {
      if (!positiveKeywords.includes(unquoted)) {
        positiveKeywords.push(unquoted);
      }
      if (unquotedLower.includes("south edmonton")) {
        detectedLocation = "Edmonton & South Edmonton";
      }
    }
  }

  // Group positive keywords into themed Ad Group clusters
  const moveOutKw = positiveKeywords.filter((k) => {
    const l = k.toLowerCase();
    return (
      l.includes("move") ||
      l.includes("tenancy") ||
      l.includes("rental") ||
      l.includes("lease")
    );
  });

  const deepCleanKw = positiveKeywords.filter((k) => {
    const l = k.toLowerCase();
    return l.includes("deep") || l.includes("professional");
  });

  const otherPositiveKw = positiveKeywords.filter(
    (k) => !moveOutKw.includes(k) && !deepCleanKw.includes(k)
  );

  const keywordClusters: KeywordCluster[] = [];
  if (moveOutKw.length > 0) {
    keywordClusters.push({
      clusterName: "Ad Group 1: Move-Out & End of Tenancy Cleaning",
      suggestedPath1: "move-out",
      suggestedPath2: "edmonton",
      keywords: moveOutKw,
    });
  }
  if (deepCleanKw.length > 0) {
    keywordClusters.push({
      clusterName: "Ad Group 2: Deep House & Apartment Cleaning",
      suggestedPath1: "deep-clean",
      suggestedPath2: "edmonton",
      keywords: deepCleanKw,
    });
  }
  if (otherPositiveKw.length > 0) {
    keywordClusters.push({
      clusterName: "Ad Group 3: General Home Cleaning",
      suggestedPath1: "cleaning",
      suggestedPath2: "edmonton",
      keywords: otherPositiveKw,
    });
  }

  // Group negative keywords into categories
  const jobsTerms: string[] = [];
  const diyTerms: string[] = [];
  const suppliesTerms: string[] = [];
  const unrelatedTerms: string[] = [];

  for (const neg of negativeKeywords) {
    const l = neg.toLowerCase();
    if (KNOWN_NEGATIVE_PATTERNS.jobs.some((p) => l.includes(p))) {
      jobsTerms.push(neg);
    } else if (KNOWN_NEGATIVE_PATTERNS.diy.some((p) => l.includes(p))) {
      diyTerms.push(neg);
    } else if (KNOWN_NEGATIVE_PATTERNS.supplies.some((p) => l.includes(p))) {
      suppliesTerms.push(neg);
    } else {
      unrelatedTerms.push(neg);
    }
  }

  const negativeCategories: NegativeCategory[] = [
    { categoryName: "Jobs, Hiring & Employment", terms: jobsTerms },
    { categoryName: "DIY, Courses & Freebies", terms: diyTerms },
    {
      categoryName: "Supplies, Products & Equipment Rental",
      terms: suppliesTerms,
    },
    {
      categoryName: "Other Cleaning Industries (Auto, Duct, Dental, Commercial)",
      terms: unrelatedTerms,
    },
  ].filter((c) => c.terms.length > 0);

  // Ensure we have 5 descriptions <= 90 chars
  const finalDescTexts =
    extractedDescriptions.length > 0
      ? [...extractedDescriptions]
      : USER_FIVE_DESCRIPTIONS.map((d) => d.text);

  while (finalDescTexts.length < 5) {
    const fallback =
      USER_FIVE_DESCRIPTIONS[finalDescTexts.length % USER_FIVE_DESCRIPTIONS.length]
        .text;
    if (!finalDescTexts.includes(fallback)) {
      finalDescTexts.push(fallback);
    } else {
      break;
    }
  }

  const descriptions: DescriptionAsset[] = finalDescTexts
    .slice(0, 5)
    .map((text, idx) => ({
      id: `parsed-d-${idx + 1}`,
      text: text.trim(),
      pinnedField: "UNSPECIFIED",
      angle:
        idx === 0
          ? "Move-Out Quote CTA"
          : idx === 1
          ? "Deep Clean Reset"
          : idx === 2
          ? "Kitchen, Bath & Floors"
          : idx === 3
          ? "Baseboards & Details"
          : "Direct Phone / Booking CTA",
    }));

  // Build headlines from positive keywords + TidyUps CTAs (all <= 30 chars)
  const headlines: HeadlineAsset[] = [
    {
      id: "ph-1",
      text: "Move Out Cleaning Edmonton",
      pinnedField: "UNSPECIFIED",
      category: "Keyword",
    },
    {
      id: "ph-2",
      text: "Deep Cleaning Edmonton",
      pinnedField: "UNSPECIFIED",
      category: "Keyword",
    },
    {
      id: "ph-3",
      text: "TidyUps Cleaning Service",
      pinnedField: "UNSPECIFIED",
      category: "Keyword",
    },
    {
      id: "ph-4",
      text: "End of Tenancy Clean Edmonton",
      pinnedField: "UNSPECIFIED",
      category: "Keyword",
    },
    {
      id: "ph-5",
      text: "Get Your Move-Out Quote Today",
      pinnedField: "UNSPECIFIED",
      category: "Booking CTA",
    },
    {
      id: "ph-6",
      text: `Call TidyUps: ${detectedPhone}`.slice(0, 30),
      pinnedField: "UNSPECIFIED",
      category: "Booking CTA",
    },
    {
      id: "ph-7",
      text: "Book Your Deep Clean Today",
      pinnedField: "UNSPECIFIED",
      category: "Booking CTA",
    },
    {
      id: "ph-8",
      text: "House & Apartment Move-Out",
      pinnedField: "UNSPECIFIED",
      category: "Offer",
    },
    {
      id: "ph-9",
      text: "Baseboards, Kitchens & Baths",
      pinnedField: "UNSPECIFIED",
      category: "Trust",
    },
    {
      id: "ph-10",
      text: "South Edmonton & All YEG",
      pinnedField: "UNSPECIFIED",
      category: "Location",
    },
    {
      id: "ph-11",
      text: "Rental & Move-In Cleaning",
      pinnedField: "UNSPECIFIED",
      category: "Keyword",
    },
    {
      id: "ph-12",
      text: "Built-Up Dirt & Grime Gone",
      pinnedField: "UNSPECIFIED",
      category: "Trust",
    },
    {
      id: "ph-13",
      text: "100% Satisfaction Guaranteed",
      pinnedField: "UNSPECIFIED",
      category: "Trust",
    },
    {
      id: "ph-14",
      text: "Book Online in 60 Seconds",
      pinnedField: "UNSPECIFIED",
      category: "Booking CTA",
    },
  ];

  return {
    positiveKeywords,
    negativeKeywords,
    descriptions,
    keywordClusters,
    negativeCategories,
    detectedPhone,
    detectedLocation,
    headlines,
  };
}

export interface AdStrengthAudit {
  score: number; // 0 to 100
  rating: "Incomplete" | "Poor" | "Average" | "Good" | "Excellent";
  validHeadlinesCount: number;
  overLimitHeadlinesCount: number;
  validDescriptionsCount: number;
  overLimitDescriptionsCount: number;
  keywordCoverageCount: number;
  coveredCategories: HeadlineCategory[];
  pinningHealthy: boolean;
  pathValid: boolean;
  checks: {
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

export function calculateAdStrength(campaign: RsaCampaign): AdStrengthAudit {
  const nonEmptyHeadlines = campaign.headlines.filter(
    (h) => h.text.trim().length > 0
  );
  const validHeadlines = nonEmptyHeadlines.filter((h) => h.text.length <= 30);
  const overLimitHeadlines = nonEmptyHeadlines.filter(
    (h) => h.text.length > 30
  );

  const nonEmptyDescriptions = campaign.descriptions.filter(
    (d) => d.text.trim().length > 0
  );
  const validDescriptions = nonEmptyDescriptions.filter(
    (d) => d.text.length <= 90
  );
  const overLimitDescriptions = nonEmptyDescriptions.filter(
    (d) => d.text.length > 90
  );

  const pathValid =
    campaign.path1.length <= 15 && campaign.path2.length <= 15;

  const uniqueHeadlineTexts = new Set(
    validHeadlines.map((h) => h.text.trim().toLowerCase())
  );

  const allHeadlineTextLower = validHeadlines
    .map((h) => h.text.toLowerCase())
    .join(" ");
  let keywordMatches = 0;
  for (const kw of campaign.targetKeywords) {
    const words = kw
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    if (words.some((w) => allHeadlineTextLower.includes(w))) {
      keywordMatches++;
    }
  }

  const categoriesSet = new Set<HeadlineCategory>(
    validHeadlines.map((h) => h.category)
  );
  const coveredCategories = Array.from(categoriesSet);

  const pinnedHeadlines = validHeadlines.filter(
    (h) => h.pinnedField !== "UNSPECIFIED"
  );
  const unpinnedHeadlines = validHeadlines.filter(
    (h) => h.pinnedField === "UNSPECIFIED"
  );
  const pinningHealthy =
    unpinnedHeadlines.length >= 5 || pinnedHeadlines.length <= 3;

  const checks = [
    {
      id: "min_limits",
      label: "Asset Volume (3–15 Headlines, Up to 5 Descriptions ≤90 chars)",
      passed:
        validHeadlines.length >= 3 &&
        validHeadlines.length <= 15 &&
        validDescriptions.length >= 2 &&
        validDescriptions.length <= 5,
      detail: `${validHeadlines.length}/15 valid headlines · ${validDescriptions.length}/5 valid descriptions`,
    },
    {
      id: "char_compliance",
      label: "Character Limit Compliance (≤30 Headline, ≤90 Description, ≤15 Path)",
      passed:
        overLimitHeadlines.length === 0 &&
        overLimitDescriptions.length === 0 &&
        pathValid,
      detail:
        overLimitHeadlines.length === 0 &&
        overLimitDescriptions.length === 0 &&
        pathValid
          ? "All headlines (≤30) and all 5 descriptions (≤90) strictly fit limits"
          : `${overLimitHeadlines.length} headline(s) and ${overLimitDescriptions.length} description(s) exceed limit`,
    },
    {
      id: "headline_depth",
      label: "Headline Volume (10+ Distinct Headlines Recommended)",
      passed: uniqueHeadlineTexts.size >= 10,
      detail: `${uniqueHeadlineTexts.size} unique headlines provided`,
    },
    {
      id: "keyword_coverage",
      label: "Positive Keyword & Negative Shield Coverage",
      passed:
        campaign.targetKeywords.length === 0 ||
        keywordMatches >= Math.min(2, campaign.targetKeywords.length),
      detail: `${keywordMatches}/${campaign.targetKeywords.length} positive keywords matched · ${campaign.negativeKeywords?.length || 0} negatives active`,
    },
    {
      id: "angle_diversity",
      label: "Messaging Diversity (Keywords, Booking CTA, Trust, Offer)",
      passed: coveredCategories.length >= 4,
      detail: `${coveredCategories.length}/5 strategic angles active (${coveredCategories.join(", ")})`,
    },
    {
      id: "pinning_flexibility",
      label: "Combination Flexibility (Unpinned Assets)",
      passed: pinningHealthy,
      detail:
        pinnedHeadlines.length === 0
          ? "All headlines unpinned for maximum Google Ads ML combinations"
          : `${pinnedHeadlines.length} pinned · ${unpinnedHeadlines.length} unpinned`,
    },
  ];

  if (validHeadlines.length < 3 || validDescriptions.length < 2) {
    return {
      score: 20,
      rating: "Incomplete",
      validHeadlinesCount: validHeadlines.length,
      overLimitHeadlinesCount: overLimitHeadlines.length,
      validDescriptionsCount: validDescriptions.length,
      overLimitDescriptionsCount: overLimitDescriptions.length,
      keywordCoverageCount: keywordMatches,
      coveredCategories,
      pinningHealthy,
      pathValid,
      checks,
    };
  }

  let score = 0;
  score += Math.min(35, Math.round((uniqueHeadlineTexts.size / 12) * 35));
  score += Math.min(20, Math.round((Math.min(4, validDescriptions.length) / 4) * 20));
  if (
    overLimitHeadlines.length === 0 &&
    overLimitDescriptions.length === 0 &&
    pathValid
  ) {
    score += 15;
  } else {
    score -= (overLimitHeadlines.length + overLimitDescriptions.length) * 8;
  }
  score += Math.min(15, coveredCategories.length * 3);
  if (keywordMatches >= 2) score += 10;
  else if (keywordMatches === 1) score += 5;
  if (pinningHealthy) score += 5;

  score = Math.max(10, Math.min(100, score));

  let rating: AdStrengthAudit["rating"] = "Poor";
  if (score >= 88) rating = "Excellent";
  else if (score >= 72) rating = "Good";
  else if (score >= 50) rating = "Average";

  return {
    score,
    rating,
    validHeadlinesCount: validHeadlines.length,
    overLimitHeadlinesCount: overLimitHeadlines.length,
    validDescriptionsCount: validDescriptions.length,
    overLimitDescriptionsCount: overLimitDescriptions.length,
    keywordCoverageCount: keywordMatches,
    coveredCategories,
    pinningHealthy,
    pathValid,
    checks,
  };
}

/**
 * Updates the phone number and target city/location across the entire campaign
 * (Headlines, 5 Descriptions, Positive Keywords, Sitelinks, Callouts, Display Paths, and Campaign Name)
 * while preserving Google Ads character limits (Headlines <= 30c, Descriptions <= 90c).
 */
export function applyPhoneAndLocationToCampaign(
  campaign: RsaCampaign,
  newPhoneRaw: string,
  newLocationRaw: string
): RsaCampaign {
  const newPhone = newPhoneRaw.trim() || "587-742-2500";
  const newLocation = newLocationRaw.trim() || "Edmonton";

  // Extract primary city name (e.g., "Edmonton & South Edmonton" -> "Edmonton", "Calgary & Area" -> "Calgary")
  const extractPrimaryCity = (loc: string) =>
    loc
      .split(/[,&|/]/)[0]
      .replace(/\b(south|north|east|west|greater|area|all)\b/gi, "")
      .trim() || loc.trim();

  const oldPrimaryCity = extractPrimaryCity(campaign.location || "Edmonton");
  const newPrimaryCity = extractPrimaryCity(newLocation);

  const phoneRegex = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const cityRegex =
    oldPrimaryCity.length >= 3
      ? new RegExp(
          oldPrimaryCity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi"
        )
      : null;

  const swapText = (input: string, maxLen?: number): string => {
    let out = input.replace(phoneRegex, newPhone);
    if (
      campaign.phoneNumber &&
      campaign.phoneNumber.trim() &&
      out.includes(campaign.phoneNumber.trim())
    ) {
      out = out.split(campaign.phoneNumber.trim()).join(newPhone);
    }
    if (cityRegex && oldPrimaryCity.toLowerCase() !== newPrimaryCity.toLowerCase()) {
      out = out.replace(cityRegex, (match) => {
        // Preserve lowercase if original was all lowercase (e.g., in keywords)
        if (match === match.toLowerCase()) {
          return newPrimaryCity.toLowerCase();
        }
        return newPrimaryCity;
      });
    }
    if (maxLen && out.length > maxLen) {
      out = out.slice(0, maxLen).trim();
    }
    return out;
  };

  const slugifyCity = newPrimaryCity
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 15);

  const oldCitySlug = oldPrimaryCity
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    ...campaign,
    phoneNumber: newPhone,
    location: newLocation,
    campaignName: swapText(campaign.campaignName),
    adGroupName: swapText(campaign.adGroupName),
    promoOffer: swapText(campaign.promoOffer),
    path1:
      campaign.path1.toLowerCase() === oldCitySlug && slugifyCity
        ? slugifyCity
        : campaign.path1,
    path2:
      campaign.path2.toLowerCase() === oldCitySlug && slugifyCity
        ? slugifyCity
        : campaign.path2,
    targetKeywords: campaign.targetKeywords.map((kw) => swapText(kw)),
    headlines: campaign.headlines.map((h) => ({
      ...h,
      text: swapText(h.text, 30),
    })),
    descriptions: campaign.descriptions.map((d) => ({
      ...d,
      text: swapText(d.text, 90),
    })),
    callouts: campaign.callouts.map((c) => swapText(c, 25)),
    sitelinks: campaign.sitelinks.map((s) => ({
      ...s,
      linkText: swapText(s.linkText, 25),
      description1: swapText(s.description1, 35),
      description2: swapText(s.description2, 35),
    })),
    updatedAt: new Date().toISOString(),
  };
}

