import React, { useState } from "react";
import {
  Wand2,
  Loader2,
  Download,
  Check,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import {
  RsaCampaign,
  CLEANING_IMAGE_SCENE_PRESETS,
  GeneratedCleaningImage,
} from "../data/tidyUpPresets";

interface CleaningImageStudioProps {
  campaign: RsaCampaign;
  onUpdateCampaignMeta: (updates: Partial<RsaCampaign>) => void;
  onOpenSerpPreview: () => void;
}

const INTERIOR_DETAIL_ADDONS = [
  "Gleaming hardwood floors",
  "Spotless white baseboards",
  "Sparkling stainless steel oven & fridge",
  "Crystal-clear glass shower door",
  "Bright natural Edmonton morning sunlight",
  "Zero clutter, move-out inspection ready",
];

export const CleaningImageStudio: React.FC<CleaningImageStudioProps> = ({
  campaign,
  onUpdateCampaignMeta,
  onOpenSerpPreview,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    CLEANING_IMAGE_SCENE_PRESETS[0].id
  );
  const [sceneTitle, setSceneTitle] = useState<string>(
    CLEANING_IMAGE_SCENE_PRESETS[0].title
  );
  const [prompt, setPrompt] = useState<string>(
    CLEANING_IMAGE_SCENE_PRESETS[0].prompt
  );
  const [aspectRatio, setAspectRatio] = useState<
    "1:1" | "16:9" | "4:3" | "9:16"
  >("1:1");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generatedImages = campaign.generatedImages || [];
  const activeImage =
    generatedImages.find((img) => img.id === activeImageId) ||
    generatedImages[0] ||
    null;

  const handleSelectPreset = (preset: (typeof CLEANING_IMAGE_SCENE_PRESETS)[0]) => {
    setSelectedPresetId(preset.id);
    setSceneTitle(preset.title);
    setPrompt(preset.prompt);
    setAspectRatio(preset.aspectRatio);
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Failed to generate cleaning interior photo."
        );
      }

      const newImg: GeneratedCleaningImage = {
        id: `img-${Date.now()}`,
        sceneTitle: sceneTitle || "TidyUps Interior Cleaning Scene",
        prompt: prompt.trim(),
        aspectRatio,
        imageUrl: data.imageUrl,
        attachedToAd: true,
        createdAt: new Date().toISOString(),
      };

      const updatedList = [
        newImg,
        ...generatedImages.map((img) => ({ ...img, attachedToAd: false })),
      ];

      onUpdateCampaignMeta({
        generatedImages: updatedList,
        attachedImageUrl: newImg.imageUrl,
      });
      setActiveImageId(newImg.id);
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Could not generate image. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditActiveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeImage || !editPrompt.trim()) return;

    setIsEditing(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/images/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: activeImage.imageUrl,
          editPrompt: editPrompt.trim(),
          aspectRatio: activeImage.aspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to edit image.");
      }

      const editedImg: GeneratedCleaningImage = {
        id: `img-edit-${Date.now()}`,
        sceneTitle: `${activeImage.sceneTitle} (Edited)`,
        prompt: `${activeImage.prompt} — Edit: ${editPrompt.trim()}`,
        aspectRatio: activeImage.aspectRatio,
        imageUrl: data.imageUrl,
        attachedToAd: true,
        createdAt: new Date().toISOString(),
      };

      const updatedList = [
        editedImg,
        ...generatedImages.map((img) => ({ ...img, attachedToAd: false })),
      ];

      onUpdateCampaignMeta({
        generatedImages: updatedList,
        attachedImageUrl: editedImg.imageUrl,
      });
      setActiveImageId(editedImg.id);
      setEditPrompt("");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to edit image.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleAttachToAd = (target: GeneratedCleaningImage) => {
    const updatedList = generatedImages.map((img) => ({
      ...img,
      attachedToAd: img.id === target.id,
    }));
    onUpdateCampaignMeta({
      generatedImages: updatedList,
      attachedImageUrl: target.imageUrl,
    });
  };

  const handleDeleteImage = (id: string) => {
    const remaining = generatedImages.filter((img) => img.id !== id);
    const nextAttached = remaining.find((img) => img.attachedToAd) || remaining[0];
    onUpdateCampaignMeta({
      generatedImages: remaining,
      attachedImageUrl: nextAttached ? nextAttached.imageUrl : undefined,
    });
    if (activeImageId === id) {
      setActiveImageId(remaining[0]?.id || null);
    }
  };

  const handleDownloadImage = (img: GeneratedCleaningImage) => {
    const a = document.createElement("a");
    a.href = img.imageUrl;
    a.download = `tidyups-${img.sceneTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (6 cols): Interior Cleaning Scene Builder */}
      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="pb-3.5 border-b border-slate-100">
          <div className="text-xs font-medium text-teal-700">
            AI Visual Asset Studio · Powered by Gemini 3.1 Flash Image
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
            Home Interior & Cleaning Image Generator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate photorealistic inside-the-home cleaning visuals for Google Ads Image Extensions, Performance Max, and your TidyUps booking page.
          </p>
        </div>

        {/* Preset Scene Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            1. Choose an Interior Cleaning Scene Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CLEANING_IMAGE_SCENE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/50 text-slate-900"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                    <span>{preset.category}</span>
                    <span className="font-mono">{preset.aspectRatio}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 leading-snug">
                    {preset.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Scene Prompt & Interior Detail Add-ons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-800">
              2. Customize Room & Cleaning Details
            </label>
            <span className="text-[11px] text-slate-500">
              Click any detail below to append
            </span>
          </div>

          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the inside-the-home cleaning scene (e.g., spotless kitchen, empty move-out apartment, sparkling bathroom tile)..."
            className="w-full p-3 text-xs leading-relaxed bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white text-slate-900"
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {INTERIOR_DETAIL_ADDONS.map((addon) => (
              <button
                key={addon}
                type="button"
                onClick={() => {
                  if (!prompt.toLowerCase().includes(addon.toLowerCase())) {
                    setPrompt((prev) => `${prev.replace(/,\s*$/, "")}, ${addon}`);
                  }
                }}
                className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-md transition-colors"
              >
                + {addon}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            3. Google Ads Image Format & Aspect Ratio
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                {
                  ratio: "1:1",
                  name: "1:1 Square",
                  desc: "Google Search Image Asset",
                },
                {
                  ratio: "16:9",
                  name: "16:9 Landscape",
                  desc: "Display & PMax Banner",
                },
                {
                  ratio: "4:3",
                  name: "4:3 Standard",
                  desc: "Booking Service Card",
                },
                {
                  ratio: "9:16",
                  name: "9:16 Vertical",
                  desc: "Mobile Story / Reel",
                },
              ] as const
            ).map((item) => (
              <button
                key={item.ratio}
                type="button"
                onClick={() => setAspectRatio(item.ratio)}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  aspectRatio === item.ratio
                    ? "border-teal-600 bg-teal-50/50 text-slate-900"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="text-xs font-mono font-semibold">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerateImage}
          disabled={isGenerating}
          className="w-full py-3 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Interior Cleaning Photo...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate Cleaning Image with AI
            </>
          )}
        </button>
      </div>

      {/* Right Column (6 cols): Generated Image Canvas, AI Editor & Ad Attachment */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Generated Interior Visual & Ad Extension Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach any generated image to your Google Search Ad to boost click-through rate
              </p>
            </div>

            {activeImage && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAttachToAd(activeImage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    campaign.attachedImageUrl === activeImage.imageUrl
                      ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {campaign.attachedImageUrl === activeImage.imageUrl
                    ? "Attached to Search Ad"
                    : "Attach to Search Ad"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadImage(activeImage)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PNG
                </button>
              </div>
            )}
          </div>

          {!activeImage ? (
            <div className="py-16 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="max-w-sm mx-auto">
                <p className="text-sm font-medium text-slate-800">
                  No interior cleaning photos generated yet
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Select a scene preset on the left (like "Move-Out Empty Apartment" or "Deep-Cleaned Kitchen") and click Generate to create your first visual asset.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Image Viewport */}
              <div className="bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center max-h-[420px]">
                <img
                  src={activeImage.imageUrl}
                  alt={activeImage.sceneTitle}
                  referrerPolicy="no-referrer"
                  className="max-h-[420px] w-auto object-contain mx-auto"
                />
              </div>

              {/* AI Image Edit Form */}
              <form
                onSubmit={handleEditActiveImage}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
              >
                <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
                  Refine or Edit This Interior Image with AI
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g. Add warm sunlight on the hardwood floors, or make countertops white quartz..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                  <button
                    type="submit"
                    disabled={isEditing || !editPrompt.trim()}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                  >
                    {isEditing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Edit Photo
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Live Mini Google Search Ad Preview with Image Extension */}
              <div className="p-4 rounded-lg bg-[#F1F5F9] border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Google Search Ad + Image Asset Extension Preview
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSerpPreview}
                    className="text-teal-700 hover:underline font-medium"
                  >
                    Open Full SERP Simulator →
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-slate-900">
                      Sponsored · TidyUps Cleaning
                    </div>
                    <div className="text-sm font-medium text-[#1A0DAB] leading-snug mt-0.5">
                      {campaign.headlines[0]?.text || "Move Out Cleaning Edmonton"}{" "}
                      | {campaign.headlines[1]?.text || "Deep Cleaning Edmonton"}
                    </div>
                    <div className="text-xs text-[#4D5156] mt-1 line-clamp-2">
                      {campaign.descriptions[0]?.text ||
                        "Moving out? Leave the cleaning to Tidyups. Get your Edmonton move-out quote today."}
                    </div>
                  </div>
                  <img
                    src={activeImage.imageUrl}
                    alt="Google Ads Image Extension"
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Gallery of Generated Cleaning Visuals */}
          {generatedImages.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="text-xs font-semibold text-slate-800">
                Session Image Asset Library ({generatedImages.length})
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {generatedImages.map((img) => {
                  const isCurrent = activeImage?.id === img.id;
                  return (
                    <div
                      key={img.id}
                      className={`group relative rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isCurrent
                          ? "border-teal-600 ring-2 ring-teal-600/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => setActiveImageId(img.id)}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.sceneTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(img.id);
                        }}
                        className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
