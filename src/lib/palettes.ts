export type PaletteId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type Palette = {
  id: PaletteId;
  name: string;
  promptName: string;
  temperature: "warm" | "cool";
  value: "light" | "medium" | "dark";
  chroma: "bright" | "true" | "soft" | "deep";
  summary: string;
  colours: string[];
};

export const PALETTES: Palette[] = [
  {
    id: 0,
    name: "True Winter",
    promptName: "True (Cool) Winter",
    temperature: "cool",
    value: "dark",
    chroma: "true",
    summary: "Cool and bright colours with clean intensity.",
    colours: ["#0F4C81", "#AC145A", "#DD101B", "#00A0B0", "#2C4F6F", "#D0D0CE"],
  },
  {
    id: 1,
    name: "Deep Winter",
    promptName: "Deep Winter",
    temperature: "cool",
    value: "dark",
    chroma: "deep",
    summary: "Dark and cool tones with deep, crisp contrast.",
    colours: ["#162740", "#004C97", "#8D1D2C", "#00382D", "#343A3F", "#26272B"],
  },
  {
    id: 2,
    name: "Bright Winter",
    promptName: "Bright Winter",
    temperature: "cool",
    value: "dark",
    chroma: "bright",
    summary: "Bright and cool tones with vivid high contrast.",
    colours: ["#009ACE", "#0073CF", "#EC008C", "#E40046", "#008C45", "#F7C948"],
  },
  {
    id: 3,
    name: "Soft Autumn",
    promptName: "Soft Autumn",
    temperature: "warm",
    value: "medium",
    chroma: "soft",
    summary: "Soft and warm muted tones with relaxed earthiness.",
    colours: ["#D8C3A5", "#C5B9A8", "#B1AA87", "#8F7E6A", "#C5BB69", "#C0755A"],
  },
  {
    id: 4,
    name: "True Autumn",
    promptName: "True (Warm) Autumn",
    temperature: "warm",
    value: "medium",
    chroma: "true",
    summary: "Warm and muted hues with golden, spicy depth.",
    colours: ["#DCA900", "#8B5E3C", "#C5683A", "#953A2D", "#5A3825", "#5A5B2D"],
  },
  {
    id: 5,
    name: "Deep Autumn",
    promptName: "Deep Autumn",
    temperature: "warm",
    value: "dark",
    chroma: "deep",
    summary: "Deep and warm tones with rich earthy contrast.",
    colours: ["#004B3C", "#582147", "#9B3D30", "#1F3A34", "#A47864", "#3E3C32"],
  },
  {
    id: 6,
    name: "True Spring",
    promptName: "True (Warm) Spring",
    temperature: "warm",
    value: "medium",
    chroma: "true",
    summary: "Warm and bright colours with fresh golden clarity.",
    colours: ["#FDD95B", "#FFA05E", "#FF6F61", "#79C753", "#7FD6E5", "#E04F39"],
  },
  {
    id: 7,
    name: "Light Spring",
    promptName: "Light Spring",
    temperature: "warm",
    value: "light",
    chroma: "true",
    summary: "Light and warm hues with a clear, airy quality.",
    colours: ["#F6EB61", "#FBB383", "#F3D1A4", "#C8E7E2", "#96D8E8", "#E87460"],
  },
  {
    id: 8,
    name: "Bright Spring",
    promptName: "Bright Spring",
    temperature: "warm",
    value: "medium",
    chroma: "bright",
    summary: "Bright and warm tones that are clear and vibrant.",
    colours: ["#FFE500", "#FF6A3D", "#DD3F2D", "#8CC63E", "#009C9C", "#00A3E0"],
  },
  {
    id: 9,
    name: "Soft Summer",
    promptName: "Soft Summer",
    temperature: "cool",
    value: "medium",
    chroma: "soft",
    summary: "Muted and cool tones with softened contrast.",
    colours: ["#C2C4C6", "#9189AC", "#8E8B9A", "#767677", "#798EA4", "#E4E2D4"],
  },
  {
    id: 10,
    name: "Light Summer",
    promptName: "Light Summer",
    temperature: "cool",
    value: "light",
    chroma: "soft",
    summary: "Soft and cool tones with gentle contrast.",
    colours: ["#C3D8EB", "#C8A2C8", "#F4C4D3", "#CFE0D5", "#F1F1EB", "#C6C1B4"],
  },
  {
    id: 11,
    name: "True Summer",
    promptName: "True (Cool) Summer",
    temperature: "cool",
    value: "medium",
    chroma: "soft",
    summary: "Cool and muted colours with a calm blue-grey cast.",
    colours: ["#B9C5E9", "#6E8CA0", "#4B6576", "#B8B8B8", "#B2C8D3", "#C5D2E2"],
  },
];

export function getPalette(id: number): Palette {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}

export function palettePromptLine(palette: Palette): string {
  const last = palette.colours.at(-1);
  const firstColours = palette.colours.slice(0, -1).join(", ");
  return `The colour palette of the clothing is ${palette.promptName} (${firstColours} and ${last}).`;
}

export function clothingPaletteInstruction(palette: Palette): string {
  const last = palette.colours.at(-1);
  const firstColours = palette.colours.slice(0, -1).join(", ");

  return `Apply the ${palette.promptName} colour palette across the clothing only: ${firstColours} and ${last}. Use refined tones from this palette, controlled accents and harmonious contrast. Make the outfit wearable, premium and editorial.`;
}
