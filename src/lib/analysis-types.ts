import type { PaletteId } from "@/lib/palettes";

export type StylePresentation = "feminine" | "masculine" | "neutral";

export type AnalysisResult = {
  paletteId: PaletteId;
  paletteName: string;
  confidence: number;
  evidence: {
    skin: string;
    eyes: string;
    hair: string;
  };
  rationale: string;
  stylePresentation: StylePresentation;
  generatedImage: string;
  generatedImageMimeType: string;
  warnings?: string[];
};
