/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AnalysisAxis,
  AnalysisChroma,
  AnalysisContrast,
  AnalysisHue,
  AnalysisValue,
  Season,
  Style,
} from '../types';
import { PALETTES } from '../constants';
import { motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { ExternalLink, Link2, RefreshCw } from 'lucide-react';
import { SEASON_SUMMARIES } from '../seasonNarratives';
import { buildTakeawayUrl, formatConfidence } from '../takeaway';

interface ResultsViewProps {
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
  synthesizedImage?: string;
  onReset: () => void;
  style: Style;
}

function getSignalAppearance(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes('warm')) {
    return {
      chip: 'bg-[#F5B942]',
      accent: 'text-[#9E6A00]',
      tone: 'Warm-leaning pigmentation with golden or peach undertones.',
    };
  }

  if (normalized.includes('cool')) {
    return {
      chip: 'bg-[#4BB8E8]',
      accent: 'text-[#0D6994]',
      tone: 'Cool-leaning pigmentation with blue, rose, or ash influence.',
    };
  }

  if (normalized.includes('neutral')) {
    return {
      chip: 'bg-[#93CDEB]',
      accent: 'text-[#2F7397]',
      tone: 'Balanced signal sitting between warm and cool extremes.',
    };
  }

  if (normalized.includes('light')) {
    return {
      chip: 'bg-[#D7E5EF]',
      accent: 'text-[#6D8395]',
      tone: 'Light overall value with softer depth across the feature set.',
    };
  }

  if (normalized.includes('deep')) {
    return {
      chip: 'bg-[#002B49]',
      accent: 'text-[#0B4E7A]',
      tone: 'Darker value range with more weight and contrast in the coloring.',
    };
  }

  if (normalized.includes('medium')) {
    return {
      chip: 'bg-[#88A4B8]',
      accent: 'text-[#4E6677]',
      tone: 'Balanced depth sitting between very light and very deep.',
    };
  }

  if (normalized.includes('bright')) {
    return {
      chip: 'bg-[#13B5EA]',
      accent: 'text-[#0078A0]',
      tone: 'High saturation and visual clarity with crisp, lively color energy.',
    };
  }

  if (normalized.includes('muted')) {
    return {
      chip: 'bg-[#8A8D8F]',
      accent: 'text-[#636669]',
      tone: 'Softened saturation with more diffused and blended color behavior.',
    };
  }

  if (normalized.includes('high')) {
    return {
      chip: 'bg-[#08253B]',
      accent: 'text-[#0D6994]',
      tone: 'Strong separation between features creates a more dramatic read.',
    };
  }

  return {
    chip: 'bg-[#5D7D93]',
    accent: 'text-[#345065]',
    tone: 'Moderate signal intensity with a more balanced visual profile.',
  };
}

export default function ResultsView({
  season,
  hue,
  value,
  chroma,
  dominant,
  secondary,
  contrast,
  evidence,
  confidence,
  reasoning,
  synthesizedImage,
  onReset,
  style,
}: ResultsViewProps) {
  const palette = PALETTES[season];
  const takeawayId = React.useMemo(
    () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const shareUrl = React.useMemo(
    () => buildTakeawayUrl({ id: takeawayId, season, hue, value, chroma, style, confidence }),
    [takeawayId, season, hue, value, chroma, style, confidence]
  );
  const summary = SEASON_SUMMARIES[season] ?? palette.description;
  const formattedConfidence = formatConfidence(confidence);

  const signalCards = [
    { label: 'Hue', value: hue },
    { label: 'Value', value: value },
    { label: 'Chroma', value: chroma },
    { label: 'Dominant Axis', value: dominant },
    { label: 'Secondary Axis', value: secondary },
    { label: 'Contrast', value: contrast },
  ];

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  const handleOpenTakeaway = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 flex flex-col gap-5 md:gap-6 overflow-y-auto pb-10 pt-4">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-5 md:gap-6 items-start">
        <section className="flex flex-col gap-5 md:gap-6">
          <div className="bg-white rounded-[2rem] relative aspect-[4/5] md:aspect-[3/4] overflow-hidden shadow-2xl border border-neutral-100 group">
            <div className="absolute bottom-6 left-6 z-20 bg-xero-navy/85 backdrop-blur-md text-white px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full border border-white/10">
              Editorial Look // {style}
            </div>
            {synthesizedImage ? (
              <motion.img
                initial={{ scale: 1.06, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                src={synthesizedImage}
                alt="Synthesized wardrobe recommendation"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-xero-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="bg-xero-navy text-white rounded-3xl p-6 shadow-xl">
            <h4 className="text-[10px] font-mono uppercase mb-6 text-xero-blue font-black tracking-widest">Digital Takeaway</h4>
            <div className="flex items-center gap-6">
              <div className="p-3 bg-white rounded-2xl shadow-inner shrink-0">
                <QRCodeCanvas value={shareUrl} size={108} fgColor="#002B49" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-300 leading-relaxed mb-6">
                  Scan to open a mobile results page with your season profile, palette matrix and a downloadable PDF-style takeaway.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleOpenTakeaway}
                    className="flex-1 flex items-center justify-center gap-2 bg-xero-blue text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
                    aria-label="Copy takeaway link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5 md:gap-6">
          <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.48fr)] gap-5 items-start">
            <div className="bg-white rounded-3xl p-7 md:p-8 border border-neutral-100 shadow-xl">
              <h3 className="text-[10px] font-mono uppercase mb-4 text-xero-blue font-bold tracking-widest">Seasonal Result</h3>
              <h2 className="text-4xl md:text-5xl xl:text-[3.2rem] font-black text-xero-navy uppercase leading-none tracking-tighter mb-4">
                {palette.title}
              </h2>
              <p className="text-sm md:text-[15px] font-medium text-neutral-600 leading-7">
                {summary}
              </p>
            </div>

            <div className="grid gap-5">
              <div className="bg-xero-blue text-white rounded-3xl p-5 md:p-6 shadow-xl">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-[10px] font-mono uppercase text-white/70 font-bold tracking-[0.22em]">Analysis Precision</h3>
                  <span className="text-xl md:text-2xl font-black">{formattedConfidence}</span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: formattedConfidence }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="bg-white h-full shadow-[0_0_15px_white]"
                  />
                </div>
                <p className="text-sm md:text-[15px] leading-6 text-white/85 mt-4 max-w-[48ch]">
                  Confidence is now tied to image quality, axis clarity and decision-table fit.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-7 border border-neutral-100 shadow-xl">
            <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
              <div>
                <h3 className="text-[10px] font-mono uppercase mb-3 text-xero-blue font-black tracking-widest">Model Readout</h3>
                <p className="text-base md:text-lg leading-8 text-xero-navy font-medium">{reasoning}</p>
              </div>

              <div className="rounded-2xl bg-[#F8FBFD] border border-neutral-200 p-4">
                <h4 className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-400 mb-3">Observed Evidence</h4>
                <div className="space-y-3 text-sm leading-6 text-neutral-600">
                  <p><span className="font-black uppercase text-xero-navy text-[11px] tracking-[0.16em]">Skin</span> {evidence.skin}</p>
                  <p><span className="font-black uppercase text-xero-navy text-[11px] tracking-[0.16em]">Hair</span> {evidence.hair}</p>
                  <p><span className="font-black uppercase text-xero-navy text-[11px] tracking-[0.16em]">Eyes</span> {evidence.eyes}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] gap-5 md:gap-6 items-start">
        <section className="grid gap-4 sm:grid-cols-2">
          {signalCards.map((stat) => {
            const appearance = getSignalAppearance(stat.value);

            return (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-lg min-h-[164px] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-[0.24em] mb-3">
                      {stat.label}
                    </h4>
                    <div className="flex items-center gap-4">
                      <span className={`w-9 h-9 md:w-11 md:h-11 rounded-full ${appearance.chip} shadow-[0_10px_24px_rgba(0,43,73,0.18)] ring-4 ring-white shrink-0`} />
                      <p className="font-black text-xl md:text-[1.7rem] text-xero-navy uppercase tracking-tight leading-none">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${appearance.accent} opacity-80`}>
                    Signal
                  </span>
                </div>
                <p className="text-sm md:text-[15px] text-neutral-500 leading-6 max-w-[28ch]">{appearance.tone}</p>
              </div>
            );
          })}
        </section>

        <section className="bg-white rounded-3xl p-7 md:p-8 border border-neutral-100 shadow-xl">
          <h3 className="text-[10px] font-mono uppercase mb-6 text-xero-blue font-black tracking-widest underline underline-offset-8">
            Primary Pigmentation Matrix
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-5">
            {palette.colors.map((color, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.04 }}
                className="flex flex-col gap-3 group"
              >
                <div
                  className="aspect-square rounded-2xl border border-neutral-100 shadow-md group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="font-mono text-center">
                  <div className="text-xero-navy mb-1 text-[11px] md:text-xs uppercase leading-relaxed font-black">{color.name}</div>
                  <div className="text-xero-blue opacity-100 text-[11px] md:text-xs uppercase tracking-[0.16em]">{color.pantone || color.hex}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-white text-xero-navy p-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:shadow-xl hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 border border-neutral-200"
      >
        <RefreshCw className="w-4 h-4 text-xero-blue" />
        Analyze Another Attendee
      </button>
    </div>
  );
}
