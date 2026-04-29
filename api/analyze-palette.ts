import { GoogleGenAI, Type } from "@google/genai";

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

interface PaletteAnalysisResult {
  season: (typeof SEASONS)[number];
  hue: string;
  value: string;
  chroma: string;
  confidence: number;
  reasoning: string;
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
            {
              text: `Analyze this person's physical characteristics (skin undertone, hair color, eye color, and overall contrast) to determine their best Color Season among the 12-season color analysis theory.
              
              Return the result in JSON format with the following fields:
              - season: One of [${SEASONS.map(s => `"${s}"`).join(', ')}]
              - hue: "Warm", "Cool", or "Neutral"
              - value: "Light", "Deep", or "Medium"
              - chroma: "Bright", "Muted", or "Clear"
              - confidence: A number between 0 and 1
              - reasoning: A brief 1-sentence explanation of the findings.
              
              Focus on the scientific attributes of the facial features.`,
            },
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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            season: { type: Type.STRING },
            hue: { type: Type.STRING },
            value: { type: Type.STRING },
            chroma: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
          },
          required: ["season", "hue", "value", "chroma", "confidence", "reasoning"],
        },
      },
    });

    const result = JSON.parse(response.text) as PaletteAnalysisResult;
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed.";
    return res.status(500).json({ error: message });
  }
}
