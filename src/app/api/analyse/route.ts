import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { parseDataUrl } from "@/lib/data-url";
import { type AnalysisResult, type StylePresentation } from "@/lib/analysis-types";
import { clothingPaletteInstruction, getPalette, PALETTES, type PaletteId } from "@/lib/palettes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type AnalyseRequest = {
  image: string;
  debugAnalysisOnly?: boolean;
};

type GeminiPaletteResponse = {
  celebrityName: string;
  confidence: number;
  evidence: {
    skin: string;
    eyes: string;
    hair: string;
  };
  rationale: string;
  stylePresentation: StylePresentation;
};

type CelebrityArchetype = {
  name: string;
  gender: "feminine" | "masculine";
  paletteId: PaletteId;
};

const CELEBRITY_ARCHETYPES: CelebrityArchetype[] = [
  // Feminine
  { name: "Anne Hathaway", gender: "feminine", paletteId: 0 },
  { name: "Viola Davis", gender: "feminine", paletteId: 1 },
  { name: "Megan Fox", gender: "feminine", paletteId: 2 },
  { name: "Gigi Hadid", gender: "feminine", paletteId: 3 },
  { name: "Beyoncé", gender: "feminine", paletteId: 4 },
  { name: "Zendaya", gender: "feminine", paletteId: 5 },
  { name: "Nicole Kidman", gender: "feminine", paletteId: 6 },
  { name: "Taylor Swift", gender: "feminine", paletteId: 7 },
  { name: "Emma Stone", gender: "feminine", paletteId: 8 },
  { name: "Bella Hadid", gender: "feminine", paletteId: 9 },
  { name: "Margot Robbie", gender: "feminine", paletteId: 10 },
  { name: "Emily Blunt", gender: "feminine", paletteId: 11 },
  // Masculine
  { name: "Keanu Reeves", gender: "masculine", paletteId: 0 },
  { name: "Idris Elba", gender: "masculine", paletteId: 1 },
  { name: "Cillian Murphy", gender: "masculine", paletteId: 2 },
  { name: "Brad Pitt", gender: "masculine", paletteId: 3 },
  { name: "Ewan McGregor", gender: "masculine", paletteId: 4 },
  { name: "Ryan Reynolds", gender: "masculine", paletteId: 5 },
  { name: "Chris Evans", gender: "masculine", paletteId: 6 },
  { name: "Owen Wilson", gender: "masculine", paletteId: 7 },
  { name: "Tom Hiddleston", gender: "masculine", paletteId: 8 },
  { name: "Chris Hemsworth", gender: "masculine", paletteId: 9 },
  { name: "Daniel Craig", gender: "masculine", paletteId: 10 },
  { name: "Henry Cavill", gender: "masculine", paletteId: 11 },
];

const MAX_EVIDENCE_LENGTH = 32;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
const OPENAI_IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE ?? "1024x1024";
const OPENAI_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? "high";
const ENV_ANALYSIS_ONLY = process.env.HUE_ANALYSIS_ONLY === "true";

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

function normaliseConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.6;
  }

  return Math.min(1, Math.max(0, value));
}

function shortenEvidence(value: string | undefined, fallback: string): string {
  const normalized = (value ?? fallback)
    .replace(/\s+/g, " ")
    .replace(/\s*[,;:]\s*$/g, "")
    .trim();

  if (normalized.length <= MAX_EVIDENCE_LENGTH) {
    return normalized;
  }

  const clipped = normalized.slice(0, MAX_EVIDENCE_LENGTH + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const shortened = clipped.slice(0, lastSpace > 18 ? lastSpace : MAX_EVIDENCE_LENGTH).trim();

  return shortened.replace(/\s*[,;:]\s*$/g, "");
}

function mockResult(image: string): AnalysisResult {
  const digest = createHash("sha256").update(image.slice(0, 4096)).digest();
  const palette = getPalette(digest[0] % PALETTES.length);

  return {
    paletteId: palette.id,
    paletteName: palette.name,
    confidence: 0.72,
    evidence: {
      skin: "Demo undertone evidence.",
      eyes: "Demo eye contrast.",
      hair: "Demo hair value.",
    },
    rationale: `Demo mode selected ${palette.name}. Add GEMINI_API_KEY to run real colour analysis and image generation.`,
    stylePresentation: "neutral",
    generatedImage: image,
    generatedImageMimeType: parseDataUrl(image).mimeType,
    warnings: ["GEMINI_API_KEY is not configured, so this is a deterministic demo response."],
  };
}

function buildAnalysisPrompt(): string {
  const feminineList = CELEBRITY_ARCHETYPES.filter((c) => c.gender === "feminine")
    .map((c) => `- ${c.name}`)
    .join("\n");
  const masculineList = CELEBRITY_ARCHETYPES.filter((c) => c.gender === "masculine")
    .map((c) => `- ${c.name}`)
    .join("\n");

  return `You are a careful 12-season colour analysis assistant for an event photo booth.

Analyze the single person in the image. First determine their gender (masculine or feminine) based on visible styling cues and presentation.

Then, choose exactly one celebrity from the corresponding list below who the person most closely resembles in terms of natural colouring (skin tone, hair colour, eye colour, and overall contrast). Do not base your choice on facial structure or attractiveness, but strictly on their colour palette.

Feminine options:
${feminineList}

Masculine options:
${masculineList}

Ignore clothing colours, lanyards, signage, background lighting, filters, heavy shadows, and obvious makeup where possible.
Use the same decision rubric every time. Do not use randomness, aesthetic preference, clothing colour, or generated styling preference.
Keep evidence strings short enough for a printed report: each of skin, eyes, and hair must be 2-5 words and under 32 characters. Use compact fragments like "neutral-cool undertone", "clear blue eyes", or "deep brown hair".
For stylePresentation, choose "feminine", "masculine", or "neutral" from visible styling cues only. Do not claim gender identity.

Return JSON only.`;
}

function buildImagePrompt(paletteId: PaletteId, stylePresentation: StylePresentation): string {
  const palette = getPalette(paletteId);
  const paletteLine = clothingPaletteInstruction(palette);
  const stylingInstruction =
    stylePresentation === "feminine"
      ? "Style the visible neckline/collar area in elevated smart-casual womenswear with a refined, fashion-forward edge: fine knits, silk camisoles, crisp relaxed shirts, premium tees, or light jacket collars. Keep the visible styling modern, chic, and polished."
      : stylePresentation === "masculine"
        ? "Style the visible neckline/collar area in elevated smart-casual menswear with a refined, fashion-forward edge: fine knit polos, crisp open-collar shirts, premium tees, or light jacket collars. Keep the visible styling modern, minimal, and polished."
        : "Style the visible neckline/collar area in elevated smart-casual clothing with a refined, fashion-forward edge: fine knits, crisp relaxed shirts, premium tees, or light jacket collars. Keep the visible styling modern, chic, and polished.";

  return `Use the uploaded selfie only as the facial identity reference but recreate the face. Create a realistic single close-up portrait of the same person, designed for a square 2048 x 2048 image, centered on a pure white background.

Framing requirement: tight head-and-shoulders portrait framed just above the shoulders. The composition should show the head, hair, face, neck, and only the top edge of the shoulders or collar area. Do not show the chest, torso, arms, hands, waist, beltline, or lower body.

Use a consistent fashion editorial camera setup: square 1:1 composition, camera at eye height, camera level, 85-90mm portrait lens compression to eliminate wide-angle distortion. The face must remain natural scale, not enlarged or distorted to preserve identity.

Composition requirement: keep the subject centered in the square frame, with the face, neck, and visible shoulder/collar area aligned to the central vertical axis. Preserve equal visual breathing room on the left and right sides. Do not shift the subject toward either edge.

Expression and pose should feel natural, calm, confident, and editorial, with subtle head angle allowed. Avoid rigid passport styling while keeping the subject clearly centered.

${stylingInstruction}

[${paletteLine}]

Optional minimal sunglasses. Soft directional studio lighting, high-resolution detail, editorial lookbook style.

The background must be a completely pure solid white seamless studio background (#FFFFFF only), with no grey tones, no gradient, no texture, and no environmental detail. The subject should appear fully isolated on white. There must be absolutely no visible shadows of any kind, including no cast shadow, no wall shadow, and no background gradient.

Framing must strictly be a square close-up head-and-shoulders crop, hiding the torso and lower body completely. The subject must be fully visible and centered within frame with no cropping of the head, hair, face, neck, or visible shoulder/collar edge. No logos, no text, no formalwear, no extreme streetwear, no sloppy casualwear, no eveningwear.

Negative instruction: no waist-up framing, no full torso, no visible arms, no visible hands, no off-center subject, no subject shifted left or right, no rigid front-facing passport pose, no cropped head or hair, no side cropping, no oversized head, no shrunken neck, no childlike proportions, no bobblehead effect, no warped face, no selfie lens distortion, no off-white background, no grey background, no gradient background, and no shadows.`;
}

function parseGeminiJson(text: string | undefined): GeminiPaletteResponse {
  if (!text) {
    throw new Error("Palette analysis returned no text.");
  }

  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned) as GeminiPaletteResponse;
}

async function analysePalette(
  ai: GoogleGenAI,
  imageBase64: string,
  mimeType: string,
): Promise<GeminiPaletteResponse> {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_ANALYSIS_MODEL ?? "gemini-2.5-flash",
    contents: [
      { text: buildAnalysisPrompt() },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ],
    config: {
      temperature: 0,
      topP: 0.1,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["celebrityName", "confidence", "evidence", "rationale", "stylePresentation"],
        properties: {
          celebrityName: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidence: {
            type: "object",
            additionalProperties: false,
            required: ["skin", "eyes", "hair"],
            properties: {
              skin: { type: "string" },
              eyes: { type: "string" },
              hair: { type: "string" },
            },
          },
          rationale: { type: "string" },
          stylePresentation: { type: "string", enum: ["feminine", "masculine", "neutral"] },
        },
      },
    },
  });

  return parseGeminiJson(response.text);
}

async function generateLookbookImage(
  imageBase64: string,
  mimeType: string,
  paletteId: PaletteId,
  stylePresentation: StylePresentation,
): Promise<{ dataUrl: string; mimeType: string }> {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const prompt = buildImagePrompt(paletteId, stylePresentation);

  console.info("[hue] OpenAI image prompt", {
    model: OPENAI_IMAGE_MODEL,
    size: OPENAI_IMAGE_SIZE,
    quality: OPENAI_IMAGE_QUALITY,
    paletteId,
    paletteName: getPalette(paletteId).name,
    stylePresentation,
    prompt,
  });

  const formData = new FormData();
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const imageBlob = new Blob([imageBuffer], { type: mimeType });

  formData.append("model", OPENAI_IMAGE_MODEL);
  formData.append("image[]", imageBlob, `selfie.${mimeType.split("/")[1] ?? "jpg"}`);
  formData.append("prompt", prompt);
  formData.append("size", OPENAI_IMAGE_SIZE);
  formData.append("quality", OPENAI_IMAGE_QUALITY);
  formData.append("background", "opaque");
  formData.append("output_format", "png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI image generation failed: ${errorText}`);
  }

  const body = (await response.json()) as { data?: Array<{ b64_json?: string }> };
  const generatedBase64 = body.data?.[0]?.b64_json;

  if (!generatedBase64) {
    throw new Error("OpenAI image generation did not return an image.");
  }

  return {
    dataUrl: `data:image/png;base64,${generatedBase64}`,
    mimeType: "image/png",
  };
}

export async function POST(request: NextRequest) {
  let payload: AnalyseRequest;

  try {
    payload = (await request.json()) as AnalyseRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.image) {
    return Response.json({ error: "Missing image data URL." }, { status: 400 });
  }

  const parsed = parseDataUrl(payload.image);
  const ai = getAiClient();

  if (!ai) {
    return Response.json(mockResult(payload.image));
  }

  const paletteAnalysis = await analysePalette(ai, parsed.base64, parsed.mimeType);

  const matchedCelebrity =
    CELEBRITY_ARCHETYPES.find(
      (c) => c.name.toLowerCase() === paletteAnalysis.celebrityName.toLowerCase()
    ) ?? CELEBRITY_ARCHETYPES[11];

  const paletteId = matchedCelebrity.paletteId;
  const palette = getPalette(paletteId);
  const confidence = normaliseConfidence(paletteAnalysis.confidence);
  const stylePresentation = ["feminine", "masculine", "neutral"].includes(paletteAnalysis.stylePresentation)
    ? paletteAnalysis.stylePresentation
    : "neutral";

  console.info("[hue] Gemini palette decision", {
    celebrityName: paletteAnalysis.celebrityName,
    matchedCelebrity: matchedCelebrity.name,
    paletteId,
    paletteName: palette.name,
    confidence,
    stylePresentation,
    rationale: paletteAnalysis.rationale,
    evidence: paletteAnalysis.evidence,
    imageGeneration: {
      provider: "openai",
      model: OPENAI_IMAGE_MODEL,
      size: OPENAI_IMAGE_SIZE,
      quality: OPENAI_IMAGE_QUALITY,
      requestedAspectRatio: "1:1",
      riveTargetWidth: 2048,
      riveTargetHeight: 2048,
    },
  });

  const analysisOnly = ENV_ANALYSIS_ONLY || payload.debugAnalysisOnly === true;
  let generatedImage = payload.image;
  let generatedImageMimeType = parsed.mimeType;
  const warnings: string[] = [];

  if (analysisOnly) {
    warnings.push("Analysis-only debug mode skipped image generation.");
    console.info("[hue] Analysis-only debug mode enabled; skipping OpenAI image generation.", {
      paletteId,
      paletteName: palette.name,
      stylePresentation,
    });
  } else {
    try {
      const image = await generateLookbookImage(parsed.base64, parsed.mimeType, paletteId, stylePresentation);
      generatedImage = image.dataUrl;
      generatedImageMimeType = image.mimeType;
    } catch (error) {
      console.error("[hue] OpenAI image generation failed", {
        message: error instanceof Error ? error.message : String(error),
        model: OPENAI_IMAGE_MODEL,
        size: OPENAI_IMAGE_SIZE,
        quality: OPENAI_IMAGE_QUALITY,
      });

      return Response.json(
        { error: "Image generation is temporarily unavailable. Please try again." },
        { status: 503 },
      );
    }
  }

  const result: AnalysisResult = {
    paletteId,
    paletteName: palette.name,
    confidence,
    evidence: {
      skin: shortenEvidence(paletteAnalysis.evidence?.skin, "Skin tone unclear."),
      eyes: shortenEvidence(paletteAnalysis.evidence?.eyes, "Eye contrast unclear."),
      hair: shortenEvidence(paletteAnalysis.evidence?.hair, "Hair value unclear."),
    },
    rationale: paletteAnalysis.rationale ?? `Selected ${palette.name}.`,
    stylePresentation,
    generatedImage,
    generatedImageMimeType,
    warnings: warnings.length > 0 ? warnings : undefined,
  };

  return Response.json(result);
}
