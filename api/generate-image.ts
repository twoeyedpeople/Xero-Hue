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
    const prompt = `Photorealistic full-body portrait of the person in the provided image.
Preserve their identity exactly — same face, bone structure, skin tone,
eye color, hairline, body type, and proportions. Photorealistic skin
with visible texture, pores, fine peach fuzz, and individual hair
strands. No retouched plastic finish, no AI smoothing.

The subject is dressed in a contemporary ${style} outfit — the kind of
real, wearable clothing a stylish person would actually own and put on
in 2026. Think elevated everyday: well-fitted basics, modern but
familiar silhouettes, quality fabrics, considered but unfussy styling.
Reference register: Farfetch product styling, COS, Aritzia, Everlane,
J.Crew, Reformation, Buck Mason, Norse Projects — premium retail,
wearable designer and elevated high-street, not runway or costume.
The clothes should look bought off the rack, not styled by an editor.
Visible fabric texture (knit weave, denim grain, cotton drape, soft
brushed jersey) and natural folds where the garment hangs.

The outfit must read as appropriate to the ${style} category, the way
a real person would interpret it:
  • Loungewear  → soft sweats, joggers, henleys, hoodies, knit sets — at-home comfortable.
  • Casual      → jeans/chinos + t-shirt or knit, simple jacket if needed.
  • Smart casual → tailored trousers, button-down or fine-gauge knit, clean sneakers or loafers.
  • Formal      → well-cut suit or tailored dress, minimal accessories.
  • Sporty      → modern athleisure, technical fabrics, clean lines.
Always interpret ${style} literally — do not push it toward fashion-week styling.

Color direction is locked to the ${season} palette: ${colorList}. Every
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
