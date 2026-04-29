import { GoogleGenAI, Type } from "@google/genai";

const SEASONS = [
  "True (Warm) Spring",
  "Light Spring",
  "Bright Spring",
  "True (Cool) Summer",
  "Light Summer",
  "Soft Summer",
  "True (Warm) Autumn",
  "Deep Autumn",
  "Soft Autumn",
  "True (Cool) Winter",
  "Deep Winter",
  "Bright Winter",
] as const;

const HUES = ["Warm", "Cool", "Neutral"] as const;
const VALUES = ["Light", "Medium", "Deep"] as const;
const CHROMAS = ["Bright", "Neutral", "Muted"] as const;
const AXES = ["Warm", "Cool", "Light", "Deep", "Bright", "Muted"] as const;
const CONTRASTS = ["High", "Medium-High", "Medium", "Low"] as const;

const SEASON_BY_SIGNATURE = {
  "Warm|Bright": "True (Warm) Spring",
  "Warm|Muted": "True (Warm) Autumn",
  "Warm|Light": "Light Spring",
  "Warm|Deep": "Deep Autumn",
  "Cool|Bright": "True (Cool) Winter",
  "Cool|Muted": "True (Cool) Summer",
  "Cool|Light": "Light Summer",
  "Cool|Deep": "Deep Winter",
  "Light|Warm": "Light Spring",
  "Light|Cool": "Light Summer",
  "Deep|Warm": "Deep Autumn",
  "Deep|Cool": "Deep Winter",
  "Bright|Warm": "Bright Spring",
  "Bright|Cool": "Bright Winter",
  "Muted|Warm": "Soft Autumn",
  "Muted|Cool": "Soft Summer",
} as const;

const ANALYSIS_PROMPT = `You are performing a rigorous 12-season color analysis on the person in
the provided image, using the dominant + secondary methodology from The
Concept Wardrobe's seasonal system. The output must be DETERMINISTIC:
the same person under the same conditions must always produce the same
season. Apply the steps below in order. Do not skip steps. Do not weight
features outside the rubric. Do not let styling, makeup, hair dye, or
clothing influence the analysis - assess natural pigmentation only.

STEP 1 - IMAGE QUALITY GATE
Check for any of these blockers and record them:
- Heavy beauty filter, color-shifted lighting, or strong ambient color
  cast (tungsten orange, neon, blue shade, golden hour).
- Subject in deep shadow or blown-out highlight.
- Heavy makeup masking the natural skin undertone (foundation, blush,
  bronzer, contouring).
- Visibly dyed/bleached hair where the natural color cannot be inferred
  from roots or brows.
- Sunglasses, colored contacts, or eyes not clearly visible.
- Resolution too low to resolve iris pattern, hair strand color, or
  skin surface quality.

These do not stop the analysis - they cap the confidence score in Step 6.

STEP 2 - FEATURE-BY-FEATURE EVIDENCE
Record specific observations for each feature. Do NOT name a season yet.

A) SKIN
   - Undertone - pick one: golden, peach, yellow, olive-warm (WARM) /
     pink, rose, red, blue-pink (COOL) / olive-neutral, balanced beige,
     mixed (NEUTRAL). Read the unblushed cheek, jawline, and neck.
     Ignore forehead (more sun-exposed) and ignore makeup.
   - Depth: very fair / fair / light-medium / medium / tan / deep / very deep.
   - Surface quality: luminous and translucent (BRIGHT-leaning) vs
     veiled, powdery, diffused (SOFT-leaning).

B) HAIR (natural; use roots/brows if dyed)
   - Base color: black / dark brown / medium brown / light brown /
     dark blonde / medium blonde / light blonde / red / auburn /
     strawberry / gray / white.
   - Undertone: ashy/cool, golden/warm, neutral.
   - Depth: light / medium / deep.
   - Saturation: vivid (BRIGHT-leaning) vs dusty (SOFT-leaning).

C) EYES
   - Iris base color: brown / hazel / green / blue / gray / amber.
   - Depth: light / medium / deep.
   - Clarity: clear with visible iris patterning and a defined limbal
     ring (BRIGHT-leaning) vs veiled, blended, low-pattern (SOFT-leaning).
   - Notable features: warm gold flecks, cool gray rings, central
     heterochromia, dark limbal ring.

D) CONTRAST between hair, eyes, and skin
   - High: deep hair + fair skin + bright eyes (Winter-leaning).
   - Medium-high: noticeable separation between features.
   - Medium: features balanced, no extremes.
   - Low: features blend softly into each other (Summer/Autumn-leaning).

STEP 3 - SCORE EACH AXIS
From Step 2 evidence, assign exactly one label on each axis:

HUE     -> Warm / Cool / Neutral
VALUE   -> Light / Medium / Deep
CHROMA  -> Bright / Neutral / Muted
            (Bright = Clear; Muted = Soft. Use Neutral only when
             chroma is genuinely unresolved.)

A signal is "strong" only if the majority of features (>= 2 of skin,
hair, eyes) point the same direction on that axis.

STEP 4 - DOMINANT AND SECONDARY
The 12-season system is built on the SINGLE most pronounced trait
(dominant) plus the next most pronounced (secondary).

- Rank the three axes by signal strength using the evidence in Step 2.
- Dominant = the axis whose label is most unambiguous across features.
- Secondary = the next strongest axis.
- If two axes tie for dominance, prefer the axis with the most
  feature-level evidence (skin > eyes > hair, in that order, because
  skin undertone is the most stable indicator).

STEP 5 - MAP TO SEASON (FIXED DECISION TABLE)
Use this table strictly. No improvisation.

DOMINANT     SECONDARY     SEASON
Warm         Bright        True (Warm) Spring
Warm         Muted         True (Warm) Autumn
Warm         Light         Light Spring
Warm         Deep          Deep Autumn
Cool         Bright        True (Cool) Winter
Cool         Muted         True (Cool) Summer
Cool         Light         Light Summer
Cool         Deep          Deep Winter
Light        Warm          Light Spring
Light        Cool          Light Summer
Deep         Warm          Deep Autumn
Deep         Cool          Deep Winter
Bright       Warm          Bright Spring
Bright       Cool          Bright Winter
Muted        Warm          Soft Autumn
Muted        Cool          Soft Summer

TIE-BREAKING (deterministic, apply in order):
1. If Hue is Neutral, choose between sister seasons using Value + Chroma.
2. If Value and Chroma are equally borderline, default to the season
   whose dominant trait is more conservative (Soft over Bright, Medium
   over Light/Deep) - this minimizes false positives on extreme seasons.
3. Hair dye, makeup, and styling never influence the choice.

STEP 6 - CONFIDENCE CALIBRATION
0.90-0.99 - All three axes resolve clearly; no image quality blockers;
            features point unambiguously to one season.
0.75-0.89 - Two axes clear, one borderline; minor image issues.
0.60-0.74 - One axis clear, two borderline; or moderate image issues
            (mild filter, partial shadow, light makeup).
0.40-0.59 - Multiple borderline axes; or significant blockers (heavy
            filter, dyed hair without visible roots, heavy makeup).
< 0.40    - Image too compromised; return best-guess season and flag.

OUTPUT - return ONLY valid JSON, no prose before or after
{
  "season": "Light Spring | True (Warm) Spring | Bright Spring | Light Summer | True (Cool) Summer | Soft Summer | Soft Autumn | True (Warm) Autumn | Deep Autumn | Bright Winter | True (Cool) Winter | Deep Winter",
  "hue": "Warm | Cool | Neutral",
  "value": "Light | Medium | Deep",
  "chroma": "Bright | Neutral | Muted",
  "dominant": "Warm | Cool | Light | Deep | Bright | Muted",
  "secondary": "Warm | Cool | Light | Deep | Bright | Muted",
  "contrast": "High | Medium-High | Medium | Low",
  "evidence": {
    "skin": "<undertone + depth + surface quality, one sentence>",
    "hair": "<base color + undertone + depth + saturation, one sentence>",
    "eyes": "<iris color + depth + clarity + notable features, one sentence>"
  },
  "image_quality_issues": "<list blockers found, or 'None'>",
  "confidence": <0.00-1.00>,
  "reasoning": "<2-3 sentences: dominant axis -> secondary axis -> why the decision table maps to this season, citing the specific features observed>"
}`;

type Season = (typeof SEASONS)[number];
type Hue = (typeof HUES)[number];
type Value = (typeof VALUES)[number];
type Chroma = (typeof CHROMAS)[number];
type Axis = (typeof AXES)[number];
type Contrast = (typeof CONTRASTS)[number];

interface RawPaletteAnalysisResult {
  season: Season;
  hue: Hue;
  value: Value;
  chroma: Chroma;
  dominant: Axis;
  secondary: Axis;
  contrast: Contrast;
  evidence: {
    skin: string;
    hair: string;
    eyes: string;
  };
  image_quality_issues: string;
  confidence: number;
  reasoning: string;
}

interface PaletteAnalysisResult {
  season: Season;
  hue: Hue;
  value: Value;
  chroma: Chroma;
  dominant: Axis;
  secondary: Axis;
  contrast: Contrast;
  evidence: {
    skin: string;
    hair: string;
    eyes: string;
  };
  imageQualityIssues: string;
  confidence: number;
  reasoning: string;
}

function includesValue<T extends readonly string[]>(items: T, value: unknown): value is T[number] {
  return typeof value === "string" && (items as readonly string[]).includes(value);
}

function validateAnalysisResult(result: unknown): PaletteAnalysisResult {
  if (!result || typeof result !== "object") {
    throw new Error("Analysis response was not an object.");
  }

  const candidate = result as Partial<RawPaletteAnalysisResult>;
  const evidence = candidate.evidence;

  if (
    !includesValue(SEASONS, candidate.season) ||
    !includesValue(HUES, candidate.hue) ||
    !includesValue(VALUES, candidate.value) ||
    !includesValue(CHROMAS, candidate.chroma) ||
    !includesValue(AXES, candidate.dominant) ||
    !includesValue(AXES, candidate.secondary) ||
    !includesValue(CONTRASTS, candidate.contrast) ||
    typeof candidate.confidence !== "number" ||
    typeof candidate.reasoning !== "string" ||
    typeof candidate.image_quality_issues !== "string" ||
    !evidence ||
    typeof evidence.skin !== "string" ||
    typeof evidence.hair !== "string" ||
    typeof evidence.eyes !== "string"
  ) {
    throw new Error("Analysis response did not match the expected schema.");
  }

  const expectedSeason = SEASON_BY_SIGNATURE[`${candidate.dominant}|${candidate.secondary}` as keyof typeof SEASON_BY_SIGNATURE];
  if (!expectedSeason || expectedSeason !== candidate.season) {
    throw new Error("Analysis response returned an invalid season signature.");
  }

  return {
    season: candidate.season,
    hue: candidate.hue,
    value: candidate.value,
    chroma: candidate.chroma,
    dominant: candidate.dominant,
    secondary: candidate.secondary,
    contrast: candidate.contrast,
    evidence: evidence,
    imageQualityIssues: candidate.image_quality_issues,
    confidence: Math.max(0, Math.min(1, candidate.confidence)),
    reasoning: candidate.reasoning.trim(),
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image64 } = req.body ?? {};
    if (typeof image64 !== "string" || !image64) {
      return res.status(400).json({ error: "Missing image64 payload." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY environment variable." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image64.split(",")[1] || image64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            season: { type: Type.STRING },
            hue: { type: Type.STRING },
            value: { type: Type.STRING },
            chroma: { type: Type.STRING },
            dominant: { type: Type.STRING },
            secondary: { type: Type.STRING },
            contrast: { type: Type.STRING },
            evidence: {
              type: Type.OBJECT,
              properties: {
                skin: { type: Type.STRING },
                hair: { type: Type.STRING },
                eyes: { type: Type.STRING },
              },
              required: ["skin", "hair", "eyes"],
            },
            image_quality_issues: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: [
            "season",
            "hue",
            "value",
            "chroma",
            "dominant",
            "secondary",
            "contrast",
            "evidence",
            "image_quality_issues",
            "confidence",
            "reasoning",
          ],
        },
      },
    });

    const rawResult = JSON.parse(response.text);
    const result = validateAnalysisResult(rawResult);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed.";
    return res.status(500).json({ error: message });
  }
}
