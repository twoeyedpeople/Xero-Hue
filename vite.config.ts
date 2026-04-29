import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const SEASONS = [
  'True (Warm) Spring',
  'Light Spring',
  'Bright Spring',
  'True (Cool) Summer',
  'Light Summer',
  'Soft Summer',
  'True (Warm) Autumn',
  'Deep Autumn',
  'Soft Autumn',
  'True (Cool) Winter',
  'Deep Winter',
  'Bright Winter',
] as const;

const HUES = ['Warm', 'Cool', 'Neutral'] as const;
const VALUES = ['Light', 'Medium', 'Deep'] as const;
const CHROMAS = ['Bright', 'Neutral', 'Muted'] as const;
const AXES = ['Warm', 'Cool', 'Light', 'Deep', 'Bright', 'Muted'] as const;
const CONTRASTS = ['High', 'Medium-High', 'Medium', 'Low'] as const;

const SEASON_BY_SIGNATURE = {
  'Warm|Bright': 'True (Warm) Spring',
  'Warm|Muted': 'True (Warm) Autumn',
  'Warm|Light': 'Light Spring',
  'Warm|Deep': 'Deep Autumn',
  'Cool|Bright': 'True (Cool) Winter',
  'Cool|Muted': 'True (Cool) Summer',
  'Cool|Light': 'Light Summer',
  'Cool|Deep': 'Deep Winter',
  'Light|Warm': 'Light Spring',
  'Light|Cool': 'Light Summer',
  'Deep|Warm': 'Deep Autumn',
  'Deep|Cool': 'Deep Winter',
  'Bright|Warm': 'Bright Spring',
  'Bright|Cool': 'Bright Winter',
  'Muted|Warm': 'Soft Autumn',
  'Muted|Cool': 'Soft Summer',
} as const;

const PALETTE_COLOR_NAMES: Record<string, string[]> = {
  'True (Cool) Winter': ['Deep vivid blue', 'Deep raspberry', 'Bright scarlet', 'Medium cyan', 'Slate blue-grey', 'Light cool grey'],
  'Deep Winter': ['Very deep navy', 'Deep teal-blue', 'Dark red/burgundy', 'Very deep green', 'Charcoal blue', 'Near-black'],
  'Bright Winter': ['Bright cyan', 'Vivid azure', 'Bright magenta', 'Bright crimson', 'Bright kelly green', 'Strong golden yellow'],
  'True (Warm) Autumn': ['Mustard yellow', 'Dark brown', 'Medium brown-orange', 'Deep brick red', 'Dark chocolate', 'Olive green'],
  'Deep Autumn': ['Deep forest green', 'Deep plum/magenta', 'Brownish red', 'Very dark green', 'Muted brown', 'Dark olive'],
  'Soft Autumn': ['Warm light beige', 'Pale warm grey', 'Muted khaki', 'Medium warm taupe', 'Warm marigold', 'Muted terracotta'],
  'True (Cool) Summer': ['Pale cool periwinkle', 'Dusty blue-grey', 'Deep steel blue', 'Cool grey', 'Light dusty aqua', 'Light cool lavender'],
  'Light Summer': ['Light baby blue', 'Light lavender', 'Very light pink', 'Pale mint grey', 'Muted straw', 'Warm light grey'],
  'Soft Summer': ['Light cool grey', 'Warm grey', 'Medium cool grey', 'Dark cool grey', 'Muted denim blue', 'Very light warm grey'],
  'True (Warm) Spring': ['Bright warm yellow', 'Light orange', 'Vivid orange', 'Bright yellow-green', 'Bright aqua', 'Vivid warm red-orange'],
  'Bright Spring': ['Bright yellow', 'Strong orange', 'Vivid red', 'Bright green', 'Vivid teal', 'Bright cyan-blue'],
  'Light Spring': ['Soft bright yellow', 'Light peach', 'Light warm cream', 'Very light aqua', 'Light sky blue', 'Soft coral'],
};

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

function includesValue<T extends readonly string[]>(items: T, value: unknown): value is T[number] {
  return typeof value === 'string' && (items as readonly string[]).includes(value);
}

function validateAnalysisResult(result: unknown) {
  if (!result || typeof result !== 'object') {
    throw new Error('Analysis response was not an object.');
  }

  const candidate = result as Record<string, any>;
  const evidence = candidate.evidence;

  if (
    !includesValue(SEASONS, candidate.season) ||
    !includesValue(HUES, candidate.hue) ||
    !includesValue(VALUES, candidate.value) ||
    !includesValue(CHROMAS, candidate.chroma) ||
    !includesValue(AXES, candidate.dominant) ||
    !includesValue(AXES, candidate.secondary) ||
    !includesValue(CONTRASTS, candidate.contrast) ||
    typeof candidate.confidence !== 'number' ||
    typeof candidate.reasoning !== 'string' ||
    typeof candidate.image_quality_issues !== 'string' ||
    !evidence ||
    typeof evidence.skin !== 'string' ||
    typeof evidence.hair !== 'string' ||
    typeof evidence.eyes !== 'string'
  ) {
    throw new Error('Analysis response did not match the expected schema.');
  }

  const expectedSeason = SEASON_BY_SIGNATURE[`${candidate.dominant}|${candidate.secondary}` as keyof typeof SEASON_BY_SIGNATURE];
  if (!expectedSeason || expectedSeason !== candidate.season) {
    throw new Error('Analysis response returned an invalid season signature.');
  }

  return {
    season: candidate.season,
    hue: candidate.hue,
    value: candidate.value,
    chroma: candidate.chroma,
    dominant: candidate.dominant,
    secondary: candidate.secondary,
    contrast: candidate.contrast,
    evidence,
    imageQualityIssues: candidate.image_quality_issues,
    confidence: Math.max(0, Math.min(1, candidate.confidence)),
    reasoning: candidate.reasoning.trim(),
  };
}

async function readJsonBody(req: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: any, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  process.env.GEMINI_API_KEY ??= env.GEMINI_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-gemini-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url?.split('?')[0];
            if (req.method !== 'POST' || !url?.startsWith('/api/')) {
              return next();
            }

            try {
              const body = await readJsonBody(req);

              if (url === '/api/analyze-palette') {
                if (typeof body.image64 !== 'string' || !body.image64) {
                  return sendJson(res, 400, { error: 'Missing image64 payload.' });
                }
                if (!process.env.GEMINI_API_KEY) {
                  return sendJson(res, 500, { error: 'Missing GEMINI_API_KEY environment variable.' });
                }
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                  model: 'gemini-3-flash-preview',
                  contents: [
                    {
                      parts: [
                        { text: ANALYSIS_PROMPT },
                        {
                          inlineData: {
                            mimeType: 'image/jpeg',
                            data: body.image64.split(',')[1] || body.image64,
                          },
                        },
                      ],
                    },
                  ],
                  config: {
                    temperature: 0,
                    responseMimeType: 'application/json',
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
                          required: ['skin', 'hair', 'eyes'],
                        },
                        image_quality_issues: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING },
                      },
                      required: [
                        'season',
                        'hue',
                        'value',
                        'chroma',
                        'dominant',
                        'secondary',
                        'contrast',
                        'evidence',
                        'image_quality_issues',
                        'confidence',
                        'reasoning',
                      ],
                    },
                  },
                });
                const result = validateAnalysisResult(JSON.parse(response.text));
                return sendJson(res, 200, result);
              }

              if (url === '/api/generate-image') {
                if (typeof body.image64 !== 'string' || !body.image64) {
                  return sendJson(res, 400, { error: 'Missing image64 payload.' });
                }
                if (typeof body.season !== 'string' || !body.season) {
                  return sendJson(res, 400, { error: 'Missing season.' });
                }
                if (typeof body.style !== 'string' || !body.style) {
                  return sendJson(res, 400, { error: 'Missing style.' });
                }
                if (!process.env.GEMINI_API_KEY) {
                  return sendJson(res, 500, { error: 'Missing GEMINI_API_KEY environment variable.' });
                }
                const paletteColors = PALETTE_COLOR_NAMES[body.season];
                if (!paletteColors) {
                  return sendJson(res, 400, { error: 'Unknown season.' });
                }
                const colorList = paletteColors.join(', ');
                const prompt = `Photorealistic full-body portrait of the person in the provided image.
Preserve their identity exactly — same face, bone structure, skin tone,
eye color, hairline, body type, and proportions. Photorealistic skin
with visible texture, pores, fine peach fuzz, and individual hair
strands. No retouched plastic finish, no AI smoothing.

The subject is dressed in a contemporary ${body.style} outfit — the kind of
real, wearable clothing a stylish person would actually own and put on
in 2026. Think elevated everyday: well-fitted basics, modern but
familiar silhouettes, quality fabrics, considered but unfussy styling.
Reference register: Uniqlo, COS, Aritzia, Everlane, J.Crew, Reformation,
Buck Mason, Norse Projects — premium high-street, not high fashion.
The clothes should look bought off the rack, not styled by an editor.
Visible fabric texture (knit weave, denim grain, cotton drape, soft
brushed jersey) and natural folds where the garment hangs.

The outfit must read as appropriate to the ${body.style} category, the way
a real person would interpret it:
  • Loungewear  → soft sweats, joggers, henleys, hoodies, knit sets — at-home comfortable.
  • Casual      → jeans/chinos + t-shirt or knit, simple jacket if needed.
  • Smart casual → tailored trousers, button-down or fine-gauge knit, clean sneakers or loafers.
  • Formal      → well-cut suit or tailored dress, minimal accessories.
  • Sporty      → modern athleisure, technical fabrics, clean lines.
Always interpret ${body.style} literally — do not push it toward fashion-week styling.

Color direction is locked to the ${body.season} palette: ${colorList}. Every
visible garment and accessory must sit inside this palette — no
off-palette colors. Use one dominant color, one supporting tone, and
optionally one quiet accent. Keep the look cohesive and calm, not bold
or attention-seeking. Maximum two layers visible at once.

Background is understated and tonally complementary: a sunlit
minimalist room, a soft plaster or concrete wall, a clean architectural
exterior, or a seamless gradient. It should read as a real space, not a
fashion campaign location or a styled set.

Camera: shot on a full-frame body with an 85mm prime at f/2.0. Shallow
depth of field, tack-sharp focus on the face, gentle background falloff.
Lighting is natural and directional — soft window light or even daylight
with a subtle rim separating the subject from the background. Slight
film grain.

Pose is relaxed and natural: weight on one leg, hands placed casually
(in pockets, at the side, lightly holding a phone or coffee), shoulders
not squared to camera, an unforced expression. Reads as a candid photo
of a real person, not a posed shoot.

Overall feel: a stylish, well-shot photo of a real person in real,
buyable clothing. Aspirational but accessible. Modern but not
avant-garde.

AVOID:
  • Draped shawls, capes, ponchos, oversized scarves, blanket-style
    overlays, asymmetric drapery, sculptural pieces.
  • Statement runway silhouettes, conceptual fashion, costume styling,
    fashion-week looks, "styled by an editor" energy.
  • More than two visible layers stacked together.
  • Oversized statement jewelry, sculptural bags, dramatic belts, large
    decorative scarves.
  • Plastic AI skin, glossy over-retouching, warped or extra fingers,
    melted hands, smeared facial features.
  • Off-palette colors anywhere in the look.
  • Generic corporate or hotel-lobby backdrops, "modern professional
    environment" stock settings.
  • Catalog stiffness, forced symmetry, dated styling, costume-y
    period references.`;
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash-image',
                  contents: [
                    {
                      parts: [
                        { text: prompt },
                        {
                          inlineData: {
                            mimeType: 'image/jpeg',
                            data: body.image64.split(',')[1] || body.image64,
                          },
                        },
                      ],
                    },
                  ],
                });
                let image = '';
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                  if (part.inlineData?.data) {
                    image = `data:image/png;base64,${part.inlineData.data}`;
                    break;
                  }
                }
                if (!image) {
                  return sendJson(res, 500, { error: 'Image generation failed' });
                }
                return sendJson(res, 200, { image });
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Request failed.';
              return sendJson(res, 500, { error: message });
            }

            return next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
