/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Season, Style } from "../types";
import { PALETTES } from "../constants";
import { db, ensureAuth, handleFirestoreError, OperationType } from "./firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function analyzeUserPalette(image64: string): Promise<{
  season: Season;
  hue: string;
  value: string;
  chroma: string;
  confidence: number;
  reasoning: string;
}> {
  const model = "gemini-3-flash-preview";
  const guestId = getGuestId();
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            text: `Analyze this person's physical characteristics (skin undertone, hair color, eye color, and overall contrast) to determine their best Color Season among the 12-season color analysis theory.
            
            Return the result in JSON format with the following fields:
            - season: One of [${Object.values(Season).map(s => `"${s}"`).join(', ')}]
            - hue: "Warm", "Cool", or "Neutral"
            - value: "Light", "Deep", or "Medium"
            - chroma: "Bright", "Muted", or "Clear"
            - confidence: A number between 0 and 1
            - reasoning: A brief 1-sentence explanation of the findings.
            
            Focus on the scientific attributes of the facial features.`
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: image64.split(',')[1] || image64,
            }
          }
        ]
      }
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
        required: ["season", "hue", "value", "chroma", "confidence", "reasoning"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text);
    
    // Persist to Firestore
    await ensureAuth();
    try {
      const analysisData = {
        userId: guestId,
        season: result.season,
        hue: result.hue,
        value: result.value,
        chroma: result.chroma,
        reasoning: result.reasoning,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'analyses'), analysisData);
      
      // Update user doc for consistency
      await setDoc(doc(db, 'users', guestId), {
        guestId,
        lastSeason: result.season,
        lastUpdatedAt: serverTimestamp(),
        createdAt: serverTimestamp() // setDoc with merge might be better but create is fine if we check
      }, { merge: true });
      
    } catch (dbErr) {
      handleFirestoreError(dbErr, OperationType.WRITE, 'analyses');
    }

    return result;
  } catch (e) {
    if (e instanceof Error && e.message.includes('{"error"')) throw e; // Re-throw firestore error
    console.error("Failed to parse Gemini response", e);
    throw new Error("Analysis failed. Please try again.");
  }
}

export async function generateStylizedImage(
  image64: string,
  season: Season,
  style: Style
): Promise<string> {
  const palette = PALETTES[season];
  const colorList = palette.colors.map(c => c.name).join(', ');
  
  const model = "gemini-2.5-flash-image";
  const prompt = `A professional, high-quality full-body portrait synthesis of the person in the provided image. 
  They are wearing a stylish ${style} outfit that perfectly matches their ${season} color palette.
  The clothing should feature colors like: ${colorList}.
  The setting is a modern, high-end professional environment.
  The image should look like a professional studio portrait with soft lighting.
  Maintain the facial features and identity of the person from the original image.
  The overall aesthetic should be polished, expensive, and sophisticated.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: image64.split(',')[1] || image64,
            }
          }
        ]
      }
    ]
  });

  let base64 = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      base64 = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!base64) throw new Error("Image generation failed");
  return base64;
}
