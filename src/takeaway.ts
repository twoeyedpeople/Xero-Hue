/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Season, Style } from './types';

export interface TakeawayPayload {
  season: Season;
  hue: string;
  value: string;
  chroma: string;
  style: Style;
  confidence: number;
}

const FALLBACK_PUBLIC_URL = 'https://xero-hue.vercel.app';

function normalizeConfidence(confidence: number) {
  if (Number.isNaN(confidence)) return 0.984;
  return confidence > 1 ? confidence / 100 : confidence;
}

export function formatConfidence(confidence: number) {
  return `${(normalizeConfidence(confidence) * 100).toFixed(1)}%`;
}

export function getPublicAppUrl() {
  if (typeof window === 'undefined') return FALLBACK_PUBLIC_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return FALLBACK_PUBLIC_URL;
  }
  return window.location.origin;
}

export function buildTakeawayUrl(payload: TakeawayPayload) {
  const params = new URLSearchParams({
    takeaway: '1',
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    season: payload.season,
    hue: payload.hue,
    value: payload.value,
    chroma: payload.chroma,
    style: payload.style,
    confidence: normalizeConfidence(payload.confidence).toString(),
  });

  return `${getPublicAppUrl()}/?${params.toString()}`;
}

export function parseTakeawayFromSearch(search: string): TakeawayPayload | null {
  const params = new URLSearchParams(search);
  if (params.get('takeaway') !== '1') return null;

  const season = params.get('season');
  const style = params.get('style');
  const hue = params.get('hue');
  const value = params.get('value');
  const chroma = params.get('chroma');

  if (
    !season ||
    !style ||
    !hue ||
    !value ||
    !chroma ||
    !Object.values(Season).includes(season as Season) ||
    !Object.values(Style).includes(style as Style)
  ) {
    return null;
  }

  return {
    season: season as Season,
    hue,
    value,
    chroma,
    style: style as Style,
    confidence: Number(params.get('confidence') ?? '0.984'),
  };
}
