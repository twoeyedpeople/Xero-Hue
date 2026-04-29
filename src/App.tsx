/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppState, Season, Style } from './types';
import Layout from './components/Layout';
import Welcome from './components/Welcome';
import Consent from './components/Consent';
import CameraComponent from './components/CameraComponent';
import StyleSelector from './components/StyleSelector';
import AnalysisOverlay from './components/AnalysisOverlay';
import ResultsView from './components/ResultsView';
import TakeawayView from './components/TakeawayView';
import { analyzeUserPalette, generateStylizedImage, getGuestId } from './services/geminiService';
import { AnimatePresence, motion } from 'motion/react';
import { parseTakeawayFromSearch } from './takeaway';

export default function App() {
  const [state, setState] = useState<AppState>('welcome');
  const [userImage, setUserImage] = useState<string | undefined>(undefined);
  const [selectedStyle, setSelectedStyle] = useState<Style | undefined>(undefined);
  const [analysis, setAnalysis] = useState<{
    season: Season;
    hue: string;
    value: string;
    chroma: string;
    confidence: number;
  } | null>(null);
  const [synthesizedImage, setSynthesizedImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string>('');

  useEffect(() => {
    setGuestId(getGuestId());
  }, []);

  const sharedTakeaway = parseTakeawayFromSearch(window.location.search);

  const handleStart = () => setState('consent');
  const handleConsent = () => setState('camera');
  const handleDecline = () => setState('welcome');
  
  const handleCapture = (image: string) => {
    setUserImage(image);
    setState('style-selection');
  };

  const handleStyleSelect = async (style: Style) => {
    setSelectedStyle(style);
    setState('analyzing');
    setError(null);

    try {
      if (!userImage) throw new Error("No image captured");
      
      // Step 1: Run Analysis
      const result = await analyzeUserPalette(userImage);
      setAnalysis(result);

      // Step 2: Generate Wardrobe Synthesis
      const synth = await generateStylizedImage(userImage, result.season, style);
      setSynthesizedImage(synth);

      setState('results');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setState('camera'); // Return to camera on error
    }
  };

  const handleReset = () => {
    setState('welcome');
    setUserImage(undefined);
    setSelectedStyle(undefined);
    setAnalysis(null);
    setSynthesizedImage(undefined);
    setError(null);
  };

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={sharedTakeaway ? 'takeaway' : state}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          {sharedTakeaway ? (
            <TakeawayView {...sharedTakeaway} />
          ) : (
            <>
              {state === 'welcome' && <Welcome onStart={handleStart} />}
              {state === 'consent' && <Consent onAccept={handleConsent} onDecline={handleDecline} />}
              {state === 'camera' && <CameraComponent onCapture={handleCapture} onCancel={handleReset} />}
              {state === 'style-selection' && <StyleSelector onSelect={handleStyleSelect} selectedStyle={selectedStyle} />}
              {state === 'analyzing' && <AnalysisOverlay userImage={userImage} />}
              {state === 'results' && analysis && selectedStyle && (
                <ResultsView 
                  {...analysis} 
                  userImage={userImage} 
                  synthesizedImage={synthesizedImage}
                  onReset={handleReset}
                  style={selectedStyle}
                />
              )}
            </>
          )}

          {error && (
            <div className="fixed bottom-10 left-10 right-10 bg-red-600 text-white p-4 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase text-xs animate-bounce z-50">
              Error: {error}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
