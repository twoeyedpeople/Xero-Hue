/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Season, ColorSwatch, Style } from '../types';
import { PALETTES } from '../constants';
import { motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { ExternalLink, Link2, RefreshCw } from 'lucide-react';
import { SEASON_SUMMARIES, SEASON_SUMMARY_SOURCE } from '../seasonNarratives';
import { buildTakeawayUrl, formatConfidence } from '../takeaway';

interface ResultsViewProps {
  season: Season;
  hue: string;
  value: string;
  chroma: string;
  confidence: number;
  synthesizedImage?: string;
  userImage?: string;
  onReset: () => void;
  style: Style;
}

export default function ResultsView({ 
  season, 
  hue, 
  value, 
  chroma, 
  confidence,
  synthesizedImage, 
  onReset,
  style
}: ResultsViewProps) {
  const palette = PALETTES[season];
  const shareUrl = buildTakeawayUrl({ season, hue, value, chroma, style, confidence });
  const summary = SEASON_SUMMARIES[season] ?? palette.description;
  const formattedConfidence = formatConfidence(confidence);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  const handleOpenTakeaway = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto pb-12 pt-4">
      {/* Left: Visual Synthesis */}
      <section className="lg:col-span-5 flex flex-col gap-8">
        <div className="bg-white rounded-[2rem] relative aspect-[4/5] overflow-hidden shadow-2xl border border-neutral-100 group">
          <div className="absolute top-6 left-6 z-20 bg-xero-navy/80 backdrop-blur-md text-white px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full border border-white/10">
            Wardrobe Synthesis // {style}
          </div>
          {synthesizedImage ? (
            <motion.img 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              src={synthesizedImage} 
              alt="Synthesized Wardrobe" 
              className="w-full h-full object-cover grayscale-0 hover:grayscale-0 transition-all duration-700"
            />
          ) : (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-xero-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="bg-xero-navy text-white rounded-3xl p-8 shadow-xl">
           <h4 className="text-[10px] font-mono uppercase mb-6 text-xero-blue font-black tracking-widest">Digital Takeaway</h4>
           <div className="flex items-center gap-8">
              <div className="p-3 bg-white rounded-2xl shadow-inner shrink-0">
                <QRCodeCanvas value={shareUrl} size={124} fgColor="#002B49" />
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

      {/* Right: Data Analysis */}
      <section className="lg:col-span-7 flex flex-col gap-8">
        {/* Result Header */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="bg-white rounded-3xl p-8 md:p-9 border border-neutral-100 shadow-xl xl:col-span-8">
            <h3 className="text-[10px] font-mono uppercase mb-4 text-xero-blue font-bold tracking-widest">Identified Persona</h3>
            <h2 className="text-4xl md:text-5xl font-black text-xero-navy uppercase leading-none tracking-tighter mb-5">{palette.title}</h2>
            <p className="text-sm md:text-base font-medium text-neutral-600 leading-7">
              {summary}
            </p>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 mt-5">
              Source reference:{' '}
              <a href={SEASON_SUMMARY_SOURCE} target="_blank" rel="noreferrer" className="text-xero-blue underline underline-offset-4">
                The Concept Wardrobe
              </a>
            </p>
          </div>
          <div className="bg-xero-blue text-white rounded-3xl p-6 md:p-7 flex flex-col justify-between shadow-xl xl:col-span-4 min-h-[180px]">
             <div className="flex justify-between items-start gap-4">
                <h3 className="text-[10px] font-mono uppercase text-white/70 font-bold tracking-[0.22em]">Analysis Precision</h3>
                <span className="text-2xl md:text-3xl font-black">{formattedConfidence}</span>
             </div>
             <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: formattedConfidence }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-white h-full shadow-[0_0_15px_white]"
                />
             </div>
             <p className="text-sm leading-6 text-white/80 mt-4">
               High-confidence match across hue, value and chroma signals from your captured profile.
             </p>
          </div>
        </div>

        {/* Technical Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Hue',
              value: hue,
              indicator: hue.toLowerCase().includes('warm') ? 'bg-[#F5B942]' : 'bg-[#4BB8E8]',
              tone: hue.toLowerCase().includes('warm') ? 'Warm undertone leaning golden' : 'Cool undertone leaning blue',
            },
            {
              label: 'Value',
              value: value,
              indicator: value.toLowerCase().includes('light') ? 'bg-[#D8E5EF]' : value.toLowerCase().includes('deep') ? 'bg-[#002B49]' : 'bg-[#88A4B8]',
              tone: value.toLowerCase().includes('light') ? 'Lighter overall contrast' : value.toLowerCase().includes('deep') ? 'Darker overall contrast' : 'Balanced depth',
            },
            {
              label: 'Chroma',
              value: chroma,
              indicator: chroma.toLowerCase().includes('bright') || chroma.toLowerCase().includes('clear') ? 'bg-[#13B5EA]' : 'bg-[#8A8D8F]',
              tone: chroma.toLowerCase().includes('bright') || chroma.toLowerCase().includes('clear') ? 'High clarity and saturation' : 'Softened and muted saturation',
            }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-lg">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h4 className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-[0.24em]">{stat.label}</h4>
                <span className={`w-3 h-3 rounded-full ${stat.indicator} shadow-sm`} />
              </div>
              <p className="font-black text-xl text-xero-navy uppercase tracking-wide mb-2">{stat.value}</p>
              <p className="text-sm text-neutral-500 leading-6">{stat.tone}</p>
            </div>
          ))}
        </div>

        {/* Color Swatches */}
        <div className="bg-white rounded-3xl p-10 flex-1 border border-neutral-100 shadow-xl">
          <h3 className="text-[10px] font-mono uppercase mb-8 text-xero-blue font-black tracking-widest underline underline-offset-8">Primary Pigmentation Matrix</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {palette.colors.map((color, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex flex-col gap-3 group"
              >
                <div 
                  className="aspect-square rounded-2xl border border-neutral-100 shadow-md group-hover:scale-110 transition-transform duration-300" 
                  style={{ backgroundColor: color.hex }}
                />
                <div className="font-mono text-center">
                  <div className="text-xero-navy mb-1 text-[11px] md:text-xs uppercase leading-relaxed font-black">{color.name}</div>
                  <div className="text-xero-blue opacity-100 text-[11px] md:text-xs uppercase tracking-[0.16em]">{color.pantone || color.hex}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <button 
          onClick={onReset}
          className="w-full bg-white text-xero-navy p-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:shadow-xl hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 border border-neutral-200"
        >
          <RefreshCw className="w-4 h-4 text-xero-blue" />
          Analyze Another Attendee
        </button>
      </section>
    </div>
  );
}
