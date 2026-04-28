import { generateImageFromPalette } from "../server/geminiApi";

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

    const image = await generateImageFromPalette(image64, season as any, style as any);
    return res.status(200).json({ image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed.";
    return res.status(500).json({ error: message });
  }
}
