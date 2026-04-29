import { GoogleGenAI } from "@google/genai";
import { PALETTES } from "../src/constants";
import { Season, Style } from "../src/types";

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

    const palette = PALETTES[season as Season];
    const colorList = palette.colors.map((color) => color.name).join(", ");
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
