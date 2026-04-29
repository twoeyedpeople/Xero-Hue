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
    const prompt = `A professional, high-quality full-body portrait synthesis of the person in the provided image. 
    They are wearing a stylish ${style} outfit that perfectly matches their ${season} color palette.
    The clothing should feature colors like: ${colorList}.
    The setting is a modern, high-end professional environment.
    The image should look like a professional studio portrait with soft lighting.
    Maintain the facial features and identity of the person from the original image.
    The overall aesthetic should be polished, expensive, and sophisticated.`;

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
