/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Season {
  TRUE_SPRING = 'True (Warm) Spring',
  LIGHT_SPRING = 'Light Spring',
  BRIGHT_SPRING = 'Bright Spring',
  TRUE_SUMMER = 'True (Cool) Summer',
  LIGHT_SUMMER = 'Light Summer',
  SOFT_SUMMER = 'Soft Summer',
  TRUE_AUTUMN = 'True (Warm) Autumn',
  DEEP_AUTUMN = 'Deep Autumn',
  SOFT_AUTUMN = 'Soft Autumn',
  TRUE_WINTER = 'True (Cool) Winter',
  DEEP_WINTER = 'Deep Winter',
  BRIGHT_WINTER = 'Bright Winter',
}

export type AnalysisHue = 'Warm' | 'Cool' | 'Neutral';
export type AnalysisValue = 'Light' | 'Medium' | 'Deep';
export type AnalysisChroma = 'Bright' | 'Neutral' | 'Muted';
export type AnalysisAxis = 'Warm' | 'Cool' | 'Light' | 'Deep' | 'Bright' | 'Muted';
export type AnalysisContrast = 'High' | 'Medium-High' | 'Medium' | 'Low';

export interface PaletteAnalysis {
  season: Season;
  hue: AnalysisHue;
  value: AnalysisValue;
  chroma: AnalysisChroma;
  dominant: AnalysisAxis;
  secondary: AnalysisAxis;
  contrast: AnalysisContrast;
  evidence: {
    skin: string;
    hair: string;
    eyes: string;
  };
  imageQualityIssues: string;
  confidence: number;
  reasoning: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
  pantone?: string;
  description?: string;
}

export interface Palette {
  season: Season;
  title: string;
  description: string;
  colors: ColorSwatch[];
  characteristics: {
    hue: 'Warm' | 'Cool' | 'Neutral-Warm' | 'Neutral-Cool';
    value: 'Light' | 'Deep' | 'Medium';
    chroma: AnalysisChroma;
  };
}

export enum Style {
  SMART_CASUAL = 'Smart Casual',
  FORMAL = 'Formal',
  SPORTY = 'Sporty',
  LOUNGEWEAR = 'Loungewear',
  AVANT_GARDE = 'Avant Garde',
}

export type AppState = 'welcome' | 'consent' | 'style-selection' | 'camera' | 'analyzing' | 'results';
