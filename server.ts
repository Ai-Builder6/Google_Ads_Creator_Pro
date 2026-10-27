import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
app.use(express.json({ limit: "15mb" }));

// In-memory store for OAuth tokens connected during session
let connectedGoogleAdsSession: {
  accessToken: string | null;
  refreshToken?: string | null;
  connectedAt?: string | null;
  email?: string | null;
} = {
  accessToken: null,
  refreshToken: null,
  connectedAt: null,
  email: null,
};

// Endpoint 1: Generate a complete Google Ads Responsive Search Ad (RSA) campaign
app.post("/api/rsa/generate", async (req, res) => {
  try {
    const {
      serviceType = "Move-Out & Deep Cleaning",
      location = "Edmonton & South Edmonton",
      promoOffer = "Call 780-718-5092 or Book Online at app.tidyupscleaning.com/booking",
      targetKeywords = [
        "move out cleaning edmonton",
        "deep cleaning edmonton",
        "end of tenancy cleaning edmonton",
        "professional house cleaning edmonton",
      ],
      negativeKeywords = [],
      brandTone = "Trustworthy, Warm & Action-Oriented",
      finalUrl = "https://app.tidyupscleaning.com/booking",
      phoneNumber = "780-718-5092",
      pinBrandOrCta = false,
    } = req.body || {};

    const keywordList = Array.isArray(targetKeywords)
      ? targetKeywords.join(", ")
      : String(targetKeywords);

    const prompt = `You are a Senior Google Ads Search Architect and Direct-Response Copywriter creating a high-converting Google Ads Responsive Search Ad (RSA) for "TidyUps Cleaning" (Edmonton, AB).
Customer Booking App Final URL: ${finalUrl}
Business Phone Number: ${phoneNumber}
Service Focus: ${serviceType}
Target Location / Service Area: ${location}
Promotional Offer / Value Prop: ${promoOffer}
Target Search Keywords: ${keywordList}
Brand Tone: ${brandTone}
Pinning Preference: ${
      pinBrandOrCta
        ? "Pin 1 primary service/brand headline to HEADLINE_1 and 1 direct booking CTA headline to HEADLINE_2; leave all others UNSPECIFIED."
        : "Leave all headlines and descriptions as UNSPECIFIED (unpinned) to maximize Google Ads machine learning combinations."
    }

STRICT CONSTRAINTS:
1. Generate between 12 and 15 distinct Headlines. EVERY headline MUST be 30 characters or fewer (including spaces and punctuation). Count characters carefully! Never exceed 30 characters.
2. Diversify headline angles across:
   - "Keyword" (naturally incorporates Edmonton move-out & deep cleaning search terms)
   - "Booking CTA" (drives immediate booking or quote, e.g., "Get Your Move-Out Quote", "Book Deep Cleaning Today", "Call 780-718-5092 Today")
   - "Trust" (thorough kitchen, bath, baseboards, satisfaction guaranteed)
   - "Offer" (transparent pricing, stress-free moving & deep clean)
   - "Location" (Edmonton & South Edmonton relevance)
3. Generate EXACTLY 5 distinct Descriptions. EVERY description MUST be 90 characters or fewer (including spaces and punctuation). Count characters carefully! Never exceed 90 characters. Include at least one description referencing ${phoneNumber} or getting a quote today.
4. Generate path1 (max 15 characters, URL-safe lowercase slug like "edmonton" or "move-out") and path2 (max 15 characters, URL-safe lowercase slug like "deep-clean" or "booking").
5. Generate 4 Sitelink Extensions (linkText <= 25 chars, description1 <= 35 chars, description2 <= 35 chars) and 4 Callout Extensions (<= 25 chars each).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert Google Ads API engineer and PPC specialist for TidyUps Cleaning. You strictly obey character limits: Headlines <= 30 characters, Descriptions <= 90 characters (always provide 5 descriptions <= 90 chars), Path1 <= 15 characters, Path2 <= 15 characters.",
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            campaignName: { type: Type.STRING },
            adGroupName: { type: Type.STRING },
            path1: { type: Type.STRING },
            path2: { type: Type.STRING },
            headlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  pinnedField: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ["text", "pinnedField", "category"],
              },
            },
            descriptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  pinnedField: { type: Type.STRING },
                  angle: { type: Type.STRING },
                },
                required: ["text", "pinnedField", "angle"],
              },
            },
            sitelinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  linkText: { type: Type.STRING },
                  description1: { type: Type.STRING },
                  description2: { type: Type.STRING },
                  finalUrl: { type: Type.STRING },
                },
                required: ["linkText", "description1", "description2", "finalUrl"],
              },
            },
            callouts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            strategySummary: { type: Type.STRING },
          },
          required: [
            "campaignName",
            "adGroupName",
            "path1",
            "path2",
            "headlines",
            "descriptions",
            "sitelinks",
            "callouts",
            "strategySummary",
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini model.");
    }

    const parsed = JSON.parse(rawText.trim());
    res.json({
      ...parsed,
      negativeKeywords,
    });
  } catch (error: any) {
    console.error("Error in /api/rsa/generate:", error);
    res.status(500).json({
      error:
        error?.message ||
        "Failed to generate Responsive Search Ad assets. Please try again.",
    });
  }
});

// Endpoint 2: Smart Paste & Sort Dump Pad
app.post("/api/rsa/parse-and-sort", async (req, res) => {
  try {
    const {
      rawInput = "",
      finalUrl = "https://app.tidyupscleaning.com/booking",
      phoneNumber = "780-718-5092",
    } = req.body || {};

    const prompt = `You are a Google Ads Search Architect for "TidyUps Cleaning" (Edmonton, AB | Booking URL: ${finalUrl} | Phone: ${phoneNumber}).
The user pasted a raw dump of keywords, negative keywords, and ad descriptions below.

RAW USER PASTE:
"""
${rawInput}
"""

YOUR TASK:
1. Extract and clean all POSITIVE search keywords. Group them into 2 or 3 tightly themed Ad Group clusters (for example: "Move-Out & End of Tenancy Edmonton", "Deep House & Apartment Cleaning Edmonton", etc.).
2. Extract and clean all NEGATIVE keywords and organize them into logical negative keyword categories (e.g., "Jobs & Employment", "DIY & Training", "Supplies & Equipment", "Unrelated Cleaning Services").
3. Extract any user-provided descriptions AND/OR generate/polish so there are EXACTLY 5 high-converting Descriptions for TidyUps Cleaning, each STRICTLY 90 characters or fewer (<= 90 characters including spaces and punctuation). Preserve the user's pasted descriptions if they are <= 90 characters!
4. Generate a primary Responsive Search Ad with 14 Headlines (each STRICTLY <= 30 characters) that match the user's pasted positive keywords, location (Edmonton / South Edmonton), and TidyUps Cleaning value propositions, plus path1 (<= 15 chars) and path2 (<= 15 chars).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You parse messy PPC keyword/copy dumps and organize them into structured Google Ads campaigns. Every headline MUST be <= 30 characters. Every description MUST be <= 90 characters (always output 5 descriptions).",
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            campaignName: { type: Type.STRING },
            adGroupName: { type: Type.STRING },
            detectedLocation: { type: Type.STRING },
            detectedPhone: { type: Type.STRING },
            path1: { type: Type.STRING },
            path2: { type: Type.STRING },
            positiveKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            keywordClusters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clusterName: { type: Type.STRING },
                  suggestedPath1: { type: Type.STRING },
                  suggestedPath2: { type: Type.STRING },
                  keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  "clusterName",
                  "suggestedPath1",
                  "suggestedPath2",
                  "keywords",
                ],
              },
            },
            negativeKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            negativeCategories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: { type: Type.STRING },
                  terms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["categoryName", "terms"],
              },
            },
            headlines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  pinnedField: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ["text", "pinnedField", "category"],
              },
            },
            descriptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  pinnedField: { type: Type.STRING },
                  angle: { type: Type.STRING },
                },
                required: ["text", "pinnedField", "angle"],
              },
            },
            strategySummary: { type: Type.STRING },
          },
          required: [
            "campaignName",
            "adGroupName",
            "detectedLocation",
            "detectedPhone",
            "path1",
            "path2",
            "positiveKeywords",
            "keywordClusters",
            "negativeKeywords",
            "negativeCategories",
            "headlines",
            "descriptions",
            "strategySummary",
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini model.");
    }
    const parsed = JSON.parse(rawText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/rsa/parse-and-sort:", error);
    res.status(500).json({
      error:
        error?.message ||
        "Failed to parse and sort raw input with AI. Using instant local sorter.",
    });
  }
});

// Endpoint 3: Trim or rewrite a single headline (<=30 chars) or description (<=90 chars)
app.post("/api/rsa/trim", async (req, res) => {
  try {
    const {
      text = "",
      assetType = "headline",
      serviceContext = "TidyUps Cleaning Edmonton move-out and deep cleaning",
    } = req.body || {};

    const maxChars = assetType === "description" ? 90 : 30;

    const prompt = `Rewrite and tighten the following Google Ads ${assetType} for "TidyUps Cleaning" (${serviceContext}) so that it is STRICTLY ${maxChars} characters or fewer (including all spaces and punctuation).
Original text (${text.length} chars): "${text}"

Provide 3 punchy, high-converting alternatives that each have <= ${maxChars} characters.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are a precision Google Ads copywriter. Every returned candidate MUST be ${maxChars} characters or fewer.`,
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ["alternatives"],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini model.");
    }
    const parsed = JSON.parse(rawText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/rsa/trim:", error);
    res.status(500).json({
      error: error?.message || "Failed to rewrite asset within character limit.",
    });
  }
});

// Endpoint 4: Generate additional targeted assets for a specific angle
app.post("/api/rsa/expand-angle", async (req, res) => {
  try {
    const {
      assetType = "headline",
      angle = "Booking CTA",
      serviceType = "Move-Out & Deep Cleaning",
      location = "Edmonton",
      existingTexts = [],
    } = req.body || {};

    const maxChars = assetType === "description" ? 90 : 30;
    const count = assetType === "description" ? 2 : 3;

    const prompt = `Generate ${count} NEW, distinct Google Ads RSA ${assetType}s for "TidyUps Cleaning" (Final URL: https://app.tidyupscleaning.com/booking | Phone: 780-718-5092).
Focus Angle: ${angle}
Service: ${serviceType}
Location: ${location}
Do NOT duplicate these existing assets: ${JSON.stringify(existingTexts)}

STRICT RULE: Every ${assetType} MUST be ${maxChars} characters or fewer (including spaces).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: `You generate Google Ads RSA ${assetType}s that are strictly <= ${maxChars} characters.`,
        temperature: 0.75,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ["text", "category"],
              },
            },
          },
          required: ["items"],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini model.");
    }
    const parsed = JSON.parse(rawText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/rsa/expand-angle:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate additional assets.",
    });
  }
});

// Endpoint 5: AI Cleaning & Home Interior Image Generator (gemini-3.1-flash-lite-image)
app.post("/api/images/generate", async (req, res) => {
  try {
    const {
      prompt = "Spotless modern Edmonton home kitchen after a professional deep clean, gleaming quartz countertops, stainless steel appliances, bright natural daylight, commercial architectural photography",
      aspectRatio = "1:1",
    } = req.body || {};

    const supportedRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    const validRatio = supportedRatios.includes(aspectRatio)
      ? aspectRatio
      : "1:1";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: validRatio,
        },
      },
    });

    let imageUrl: string | null = null;
    let captionText = "";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        captionText += part.text;
      }
    }

    if (!imageUrl) {
      throw new Error("No image data returned from Gemini image model.");
    }

    res.json({
      imageUrl,
      captionText,
      aspectRatio: validRatio,
    });
  } catch (error: any) {
    console.error("Error in /api/images/generate:", error);
    res.status(500).json({
      error:
        error?.message ||
        "Failed to generate cleaning image. Please try again.",
    });
  }
});

// Endpoint 6: AI Image Editing for Cleaning Photos (gemini-3.1-flash-lite-image)
app.post("/api/images/edit", async (req, res) => {
  try {
    const {
      imageDataUrl = "",
      editPrompt = "Make the room brighter with warm morning sunlight and extra sparkle on the floors",
      aspectRatio = "1:1",
    } = req.body || {};

    const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({
        error: "Valid base64 image data URL is required for editing.",
      });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: editPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio)
            ? aspectRatio
            : "1:1",
        },
      },
    });

    let editedImageUrl: string | null = null;
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const outMime = part.inlineData.mimeType || "image/png";
        editedImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
      }
    }

    if (!editedImageUrl) {
      throw new Error("Model did not return an edited image.");
    }

    res.json({ imageUrl: editedImageUrl });
  } catch (error: any) {
    console.error("Error in /api/images/edit:", error);
    res.status(500).json({
      error: error?.message || "Failed to edit image.",
    });
  }
});

// Endpoint 7: Google Ads OAuth 2.0 Popup Flow & Connection Status
function getRedirectUri(req: express.Request): string {
  const baseUrl =
    process.env.APP_URL?.replace(/\/$/, "") ||
    `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/auth/callback`;
}

app.get("/api/google-ads/status", (_req, res) => {
  res.json({
    oauthConfigured: Boolean(
      process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_CLIENT_SECRET
    ),
    developerTokenConfigured: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
    connected: Boolean(connectedGoogleAdsSession.accessToken),
    connectedAt: connectedGoogleAdsSession.connectedAt,
  });
});

app.get("/api/google-ads/auth-url", (req, res) => {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const redirectUri = getRedirectUri(req);

  if (!clientId) {
    return res.status(400).json({
      error:
        "GOOGLE_ADS_CLIENT_ID is not set in environment secrets yet. You can still use Token Connect or Dry-Run Launch Mode, or add GOOGLE_ADS_CLIENT_ID & GOOGLE_ADS_CLIENT_SECRET in Settings > Secrets.",
      redirectUri,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/adwords",
    access_type: "offline",
    prompt: "consent",
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url, redirectUri });
});

const oauthCallbackHandler = async (
  req: express.Request,
  res: express.Response
) => {
  const { code, error } = req.query;
  if (error || !code) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 24px;">
          <h3>Google Ads Authorization Cancelled</h3>
          <p>${String(error || "No authorization code returned.")}</p>
          <script>
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  }

  try {
    const redirectUri = getRedirectUri(req);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_ADS_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      connectedGoogleAdsSession = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        connectedAt: new Date().toISOString(),
      };
    }

    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 24px;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Google Ads account connected successfully. This window will close automatically.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 24px;">
          <p>Failed to exchange OAuth code: ${err?.message || "Unknown error"}</p>
        </body>
      </html>
    `);
  }
};

app.get(["/auth/callback", "/auth/callback/"], oauthCallbackHandler);

// Endpoint 7b: List Accessible Google Ads Customer Accounts using OAuth Bearer token
app.post("/api/google-ads/accessible-customers", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const { developerToken = "" } = req.body || {};

    const effectiveToken =
      bearerToken || connectedGoogleAdsSession.accessToken || "";
    const effectiveDevToken =
      developerToken.trim() || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";

    if (!effectiveToken) {
      return res.status(401).json({
        error: "Please sign in with Google first to list your Google Ads accounts.",
      });
    }

    if (!effectiveDevToken) {
      return res.status(400).json({
        error:
          "Google Ads API requires a Developer Token (from Google Ads > Tools & Settings > Setup > API Center) to query customer accounts.",
      });
    }

    const response = await fetch(
      "https://googleads.googleapis.com/v18/customers:listAccessibleCustomers",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
          "developer-token": effectiveDevToken,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          `Google Ads API returned ${response.status}`,
        details: data,
      });
    }

    // resourceNames looks like ["customers/1234567890", ...]
    res.json({
      resourceNames: data.resourceNames || [],
    });
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || "Failed to list accessible Google Ads customers.",
    });
  }
});

// Endpoint 8: Execute Atomic Google Ads Campaign + Budget + Keywords + RSA Launch
app.post("/api/google-ads/launch", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const headerBearer = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    const {
      customerId = "1234567890",
      loginCustomerId = "",
      accessToken = "",
      developerToken = "",
      mode = "simulate", // "live" | "validate_only" | "simulate"
      mutatePayload,
    } = req.body || {};

    const cleanCustomerId = String(customerId).replace(/-/g, "").trim();
    const effectiveAccessToken =
      headerBearer ||
      accessToken.trim() ||
      connectedGoogleAdsSession.accessToken ||
      "";
    const effectiveDeveloperToken =
      developerToken.trim() || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
    const effectiveLoginCustomerId =
      loginCustomerId.replace(/-/g, "").trim() ||
      (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "").trim();

    if (!mutatePayload || !Array.isArray(mutatePayload.mutateOperations)) {
      return res.status(400).json({
        error: "Missing valid mutateOperations payload.",
      });
    }

    const opsCount = mutatePayload.mutateOperations.length;

    if (mode === "live" || mode === "validate_only") {
      if (!effectiveAccessToken) {
        return res.status(401).json({
          error:
            "Please click 'Sign in with Google' in Step 1 to authorize your Google Ads account before running Live or Validate mode.",
        });
      }
      if (!effectiveDeveloperToken) {
        return res.status(400).json({
          error:
            "To push directly to a live Google Ads account, please enter your Google Ads Developer Token (found in Google Ads under Tools & Settings > Setup > API Center), or switch to Sandbox Test mode.",
        });
      }

      const endpoint = `https://googleads.googleapis.com/v18/customers/${cleanCustomerId}/googleAds:mutate`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${effectiveAccessToken}`,
        "developer-token": effectiveDeveloperToken,
        "Content-Type": "application/json",
      };
      if (effectiveLoginCustomerId) {
        headers["login-customer-id"] = effectiveLoginCustomerId;
      }

      const bodyPayload = {
        mutateOperations: mutatePayload.mutateOperations,
        validateOnly: mode === "validate_only",
        partialFailure: false,
      };

      const googleRes = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const googleData = await googleRes.json();
      if (!googleRes.ok) {
        return res.status(googleRes.status).json({
          error:
            googleData?.error?.message ||
            `Google Ads API returned status ${googleRes.status}`,
          details: googleData,
        });
      }

      return res.json({
        mode,
        success: true,
        timestamp: new Date().toISOString(),
        operationsExecuted: opsCount,
        customerId: cleanCustomerId,
        googleAdsResponse: googleData,
      });
    }

    // Validated Sandbox Simulation Receipt (verifies payload schema & returns resource receipt)
    const budgetOp = mutatePayload.mutateOperations.find(
      (o: any) => o.campaignBudgetOperation
    );
    const campaignOp = mutatePayload.mutateOperations.find(
      (o: any) => o.campaignOperation
    );
    const adGroupOps = mutatePayload.mutateOperations.filter(
      (o: any) => o.adGroupOperation
    );
    const negativeOps = mutatePayload.mutateOperations.filter(
      (o: any) => o.campaignCriterionOperation
    );
    const keywordOps = mutatePayload.mutateOperations.filter(
      (o: any) => o.adGroupCriterionOperation
    );
    const adOps = mutatePayload.mutateOperations.filter(
      (o: any) => o.adGroupAdOperation
    );

    const budgetMicros =
      budgetOp?.campaignBudgetOperation?.create?.amountMicros || 25000000;

    res.json({
      mode: "simulate",
      success: true,
      timestamp: new Date().toISOString(),
      operationsExecuted: opsCount,
      customerId: cleanCustomerId,
      receipt: {
        budgetResource: `customers/${cleanCustomerId}/campaignBudgets/${Math.floor(
          100000000 + Math.random() * 900000000
        )}`,
        dailyBudgetCad: (Number(budgetMicros) / 1_000_000).toFixed(2),
        campaignResource: `customers/${cleanCustomerId}/campaigns/${Math.floor(
          100000000 + Math.random() * 900000000
        )}`,
        campaignStatus:
          campaignOp?.campaignOperation?.create?.status || "PAUSED",
        adGroupsCreated: adGroupOps.length,
        positiveKeywordsAttached: keywordOps.length,
        negativeKeywordsAttached: negativeOps.length,
        responsiveSearchAdsCreated: adOps.length,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/google-ads/launch:", error);
    res.status(500).json({
      error: error?.message || "Failed to execute campaign launch pipeline.",
    });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tidy Up RSA Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
