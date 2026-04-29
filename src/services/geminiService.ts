/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PaletteAnalysis, Season, Style } from "../types";

// Simple guest ID helper
const GUEST_ID_KEY = 'hue_you_guest_id';
export function getGuestId() {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : "Request failed. Please try again.";
    throw new Error(message);
  }

  return payload as T;
}

export async function analyzeUserPalette(image64: string): Promise<PaletteAnalysis> {
  return postJson<PaletteAnalysis>("/api/analyze-palette", { image64 });
}

export async function generateStylizedImage(
  image64: string,
  season: Season,
  style: Style
): Promise<string> {
  const response = await postJson<{ image: string }>("/api/generate-image", {
    image64,
    season,
    style,
  });

  if (!response.image) {
    throw new Error("Image generation failed");
  }

  return response.image;
}
