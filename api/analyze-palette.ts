import { analyzePaletteFromImage } from "./_lib/geminiApi";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image64 } = req.body ?? {};
    if (typeof image64 !== "string" || !image64) {
      return res.status(400).json({ error: "Missing image64 payload." });
    }

    const result = await analyzePaletteFromImage(image64);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed.";
    return res.status(500).json({ error: message });
  }
}
