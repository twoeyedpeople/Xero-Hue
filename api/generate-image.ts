import { GoogleGenAI } from "@google/genai";

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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image64, season, style } = req.body ?? {};
    if (typeof image64 !== "string" || !image64) {
      return res.status(400).json({ error: "Missing image64 payload." });
    }
    if (typeof season !== "string" || !season) {
      return res.status(400).json({ error: "Missing season." });
    }
    if (typeof style !== "string" || !style) {
      return res.status(400).json({ error: "Missing style." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY environment variable." });
    }

    const paletteColors = PALETTE_COLOR_NAMES[season];
    if (!paletteColors) {
      return res.status(400).json({ error: "Unknown season." });
    }
    const colorList = paletteColors.join(", ");
    const prompt = `Editorial full-body fashion portrait of the person in the provided image.
Preserve their identity exactly - same face, bone structure, skin tone, eye
color, hairline, body type, and proportions. Photorealistic skin with
visible texture, pores, fine peach fuzz, and individual hair strands. No
retouched plastic finish, no AI smoothing.

The subject is wearing a contemporary ${style} outfit with a 2026 editorial
sensibility: modern silhouettes, considered proportions, intentional
layering, and tactile material detail - visible fabric weave, natural
drape, real shadows in the folds, believable shoes and accessories. Styling
should feel pulled from a current fashion magazine, not a stock catalog or
costume rental.

Color direction is locked to the ${season} palette: ${colorList}. Every
visible garment and accessory must sit inside this palette - no
off-palette colors anywhere in the wardrobe. Use the palette confidently:
a dominant hero color, a supporting tone, and an accent.

Background is tonally complementary but quiet: a sunlit minimalist
interior, a soft architectural exterior, a textured plaster or concrete
wall, or a clean seamless gradient. It should feel current and gallery-like
- never a generic office, hotel lobby, or stock "professional environment."

Camera: shot on a full-frame body with an 85mm prime at f/2.0. Shallow
depth of field, tack-sharp focus on the face, gentle background falloff.
Lighting is directional and cinematic with a subtle rim separating the
subject from the background - not flat studio fill. Slight film grain.

Pose is relaxed and candid: weight on one leg, hands placed naturally,
shoulders not squared to camera, an unforced confident expression. Avoid
catalog stiffness and forced symmetry.

Overall aesthetic: high-end fashion editorial - Vogue, SSENSE, Net-a-Porter,
Zara campaign quality. Modern, striking, hyper-realistic.

Avoid: dated or costume-y styling, plastic AI skin, glossy over-retouched
faces, overly symmetrical poses, blurred or warped hands, generic corporate
backdrops, low-contrast flat lighting, fabric without texture, off-palette
colors.`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image64.split(",")[1] || image64,
              },
            },
          ],
        },
      ],
    });

    let image = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        image = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!image) {
      throw new Error("Image generation failed");
    }

    return res.status(200).json({ image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed.";
    return res.status(500).json({ error: message });
  }
}
