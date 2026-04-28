/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Season, Palette } from './types';

export const PALETTES: Record<Season, Palette> = {
  [Season.TRUE_WINTER]: {
    season: Season.TRUE_WINTER,
    title: 'True (Cool) Winter',
    description: 'Deep, cool, and brilliant. High contrast with icy and saturated jewel tones.',
    colors: [
      { name: 'Deep vivid blue', hex: '#003DA5', pantone: '286 C' },
      { name: 'Deep raspberry', hex: '#AC145A', pantone: '216 C' },
      { name: 'Bright scarlet', hex: '#DD101B', pantone: '1788 C' },
      { name: 'Medium cyan', hex: '#0072CE', pantone: '299 C' },
      { name: 'Slate blue-grey', hex: '#5B7F95', pantone: '5405 C' },
      { name: 'Light cool grey', hex: '#D0D0CE', pantone: '428 C' },
    ],
    characteristics: { hue: 'Cool', value: 'Medium', chroma: 'Bright' }
  },
  [Season.DEEP_WINTER]: {
    season: Season.DEEP_WINTER,
    title: 'Deep Winter',
    description: 'The darkest of the winter family. Near-black depths with mysterious shadows.',
    colors: [
      { name: 'Very deep navy', hex: '#162740', pantone: '2767 C' },
      { name: 'Deep teal-blue', hex: '#004C97', pantone: '3035 C' },
      { name: 'Dark red/burgundy', hex: '#8D1D2C', pantone: '188 C' },
      { name: 'Very deep green', hex: '#00382D', pantone: '3308 C' },
      { name: 'Charcoal blue', hex: '#343A3F', pantone: '7547 C' },
      { name: 'Near-black', hex: '#26272B', pantone: '419 C' },
    ],
    characteristics: { hue: 'Cool', value: 'Deep', chroma: 'Bright' }
  },
  [Season.BRIGHT_WINTER]: {
    season: Season.BRIGHT_WINTER,
    title: 'Bright Winter',
    description: 'Extreme clarity and brilliance. Neon-adjacent jewel tones with intense sparkle.',
    colors: [
      { name: 'Bright cyan', hex: '#00A7E1', pantone: '299 C' },
      { name: 'Vivid azure', hex: '#0073CF', pantone: '7461 C' },
      { name: 'Bright magenta', hex: '#EC008C', pantone: '219 C' },
      { name: 'Bright crimson', hex: '#E40046', pantone: '1925 C' },
      { name: 'Bright kelly green', hex: '#009739', pantone: '348 C' },
      { name: 'Strong golden yellow', hex: '#FFB511', pantone: '1235 C' },
    ],
    characteristics: { hue: 'Cool', value: 'Medium', chroma: 'Bright' }
  },
  [Season.TRUE_AUTUMN]: {
    season: Season.TRUE_AUTUMN,
    title: 'True (Warm) Autumn',
    description: 'Rich, earthy, and warm. The colors of a golden forest floor in late October.',
    colors: [
      { name: 'Mustard yellow', hex: '#DCA900', pantone: '125 C' },
      { name: 'Dark brown', hex: '#8C5629', pantone: '1545 C' },
      { name: 'Medium brown-orange', hex: '#9D5333', pantone: '154 C' },
      { name: 'Deep brick red', hex: '#953A2D', pantone: '174 C' },
      { name: 'Dark chocolate', hex: '#5C3A2E', pantone: '4635 C' },
      { name: 'Olive green', hex: '#4C4A2E', pantone: '5753 C' },
    ],
    characteristics: { hue: 'Warm', value: 'Medium', chroma: 'Muted' }
  },
  [Season.DEEP_AUTUMN]: {
    season: Season.DEEP_AUTUMN,
    title: 'Deep Autumn',
    description: 'Deep, warm, and mysterious. Heavy woods and scorched earth tones.',
    colors: [
      { name: 'Deep forest green', hex: '#004B3C', pantone: '3435 C' },
      { name: 'Deep plum/magenta', hex: '#582147', pantone: '2425 C' },
      { name: 'Brownish red', hex: '#9B3D30', pantone: '175 C' },
      { name: 'Very dark green', hex: '#1F3A34', pantone: '5535 C' },
      { name: 'Muted brown', hex: '#8B6F4E', pantone: '7504 C' },
      { name: 'Dark olive', hex: '#3E3C32', pantone: '553 C' },
    ],
    characteristics: { hue: 'Warm', value: 'Deep', chroma: 'Muted' }
  },
  [Season.SOFT_AUTUMN]: {
    season: Season.SOFT_AUTUMN,
    title: 'Soft Autumn',
    description: 'Gentle, warm, and hazy. Sun-bleached grasses and desert sands.',
    colors: [
      { name: 'Warm light beige', hex: '#D7C3B4', pantone: '7528 C' },
      { name: 'Pale warm grey', hex: '#C4BEBD', pantone: '616 C' },
      { name: 'Muted khaki', hex: '#B1AA87', pantone: '7535 C' },
      { name: 'Medium warm taupe', hex: '#8F7E6A', pantone: '7531 C' },
      { name: 'Warm marigold', hex: '#FFC759', pantone: '7408 C' },
      { name: 'Muted terracotta', hex: '#C0755A', pantone: '2311 C' },
    ],
    characteristics: { hue: 'Warm', value: 'Light', chroma: 'Muted' }
  },
  [Season.TRUE_SUMMER]: {
    season: Season.TRUE_SUMMER,
    title: 'True (Cool) Summer',
    description: 'Purely cool and elegant. Soft, hazy blues and lavenders of a misty morning.',
    colors: [
      { name: 'Pale cool periwinkle', hex: '#B9C5E9', pantone: '2707 C' },
      { name: 'Dusty blue-grey', hex: '#6E8CA0', pantone: '5425 C' },
      { name: 'Deep steel blue', hex: '#4B6576', pantone: '5335 C' },
      { name: 'Cool grey', hex: '#6D767D', pantone: '7544 C' },
      { name: 'Light dusty aqua', hex: '#B2C8D3', pantone: '5503 C' },
      { name: 'Light cool lavender', hex: '#C5D2E2', pantone: '2706 C' },
    ],
    characteristics: { hue: 'Cool', value: 'Medium', chroma: 'Muted' }
  },
  [Season.LIGHT_SUMMER]: {
    season: Season.LIGHT_SUMMER,
    title: 'Light Summer',
    description: 'Delicate, cool, and airy. Subdued pastels and soft, chalky tones.',
    colors: [
      { name: 'Light baby blue', hex: '#C3D8EB', pantone: '290 C' },
      { name: 'Light lavender', hex: '#C8A2C8', pantone: '531 C' },
      { name: 'Very light pink', hex: '#F4C4D3', pantone: '7436 C' },
      { name: 'Pale mint grey', hex: '#CFE0D5', pantone: '621 C' },
      { name: 'Muted straw', hex: '#C6B784', pantone: '617 C' },
      { name: 'Warm light grey', hex: '#C6C1B4', pantone: '400 C' },
    ],
    characteristics: { hue: 'Cool', value: 'Light', chroma: 'Muted' }
  },
  [Season.SOFT_SUMMER]: {
    season: Season.SOFT_SUMMER,
    title: 'Soft Summer',
    description: 'Subdued, cool, and neutral. Sophisticated tones of stone and twilight sky.',
    colors: [
      { name: 'Light cool grey', hex: '#A7A8AA', pantone: '443 C' },
      { name: 'Warm grey', hex: '#9E9589', pantone: '401 C' },
      { name: 'Medium cool grey', hex: '#8A8D8F', pantone: '430 C' },
      { name: 'Dark cool grey', hex: '#767677', pantone: '424 C' },
      { name: 'Muted denim blue', hex: '#839CC1', pantone: '641 C' },
      { name: 'Very light warm grey', hex: '#E4E2D4', pantone: '7527 C' },
    ],
    characteristics: { hue: 'Cool', value: 'Medium', chroma: 'Muted' }
  },
  [Season.TRUE_SPRING]: {
    season: Season.TRUE_SPRING,
    title: 'True (Warm) Spring',
    description: 'Warm, bright, and fresh. The vibrant colors of a sun-drenched tropical garden.',
    colors: [
      { name: 'Bright warm yellow', hex: '#FDD95B', pantone: '129 C' },
      { name: 'Light orange', hex: '#FFA05E', pantone: '150 C' },
      { name: 'Vivid orange', hex: '#FF7240', pantone: '1655 C' },
      { name: 'Bright yellow-green', hex: '#84C83E', pantone: '376 C' },
      { name: 'Bright aqua', hex: '#4EC3E0', pantone: '3115 C' },
      { name: 'Vivid warm red-orange', hex: '#E04F39', pantone: '7417 C' },
    ],
    characteristics: { hue: 'Warm', value: 'Medium', chroma: 'Bright' }
  },
  [Season.BRIGHT_SPRING]: {
    season: Season.BRIGHT_SPRING,
    title: 'Bright Spring',
    description: 'Vivid, warm, and electric. High-energy colors with exceptional clarity.',
    colors: [
      { name: 'Bright yellow', hex: '#FFE500', pantone: '109 C' },
      { name: 'Strong orange', hex: '#FF7034', pantone: '1725 C' },
      { name: 'Vivid red', hex: '#CE1126', pantone: '186 C' },
      { name: 'Bright green', hex: '#8CC63E', pantone: '368 C' },
      { name: 'Vivid teal', hex: '#009C9C', pantone: '3268 C' },
      { name: 'Bright cyan-blue', hex: '#00A3E0', pantone: '2995 C' },
    ],
    characteristics: { hue: 'Warm', value: 'Medium', chroma: 'Bright' }
  },
  [Season.LIGHT_SPRING]: {
    season: Season.LIGHT_SPRING,
    title: 'Light Spring',
    description: 'Delicate, warm, and radiant. Sunny pastels and fresh, glowing tones.',
    colors: [
      { name: 'Soft bright yellow', hex: '#F6EB61', pantone: '7404 C' },
      { name: 'Light peach', hex: '#FBB383', pantone: '148 C' },
      { name: 'Light warm cream', hex: '#F3D1A4', pantone: '155 C' },
      { name: 'Very light aqua', hex: '#C8E7E2', pantone: '317 C' },
      { name: 'Light sky blue', hex: '#96D8E8', pantone: '2306 C' },
      { name: 'Soft coral', hex: '#E87460', pantone: '7606 C' },
    ],
    characteristics: { hue: 'Warm', value: 'Light', chroma: 'Bright' }
  },
};
