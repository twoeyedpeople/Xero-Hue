/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Season, ColorSwatch, Style } from '../types';
import { PALETTES } from '../constants';
import { motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, RefreshCw } from 'lucide-react';

interface ResultsViewProps {
  season: Season;
  hue: string;
  value: string;
  chroma: string;
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
  synthesizedImage, 
  onReset,
  style
}: ResultsViewProps) {
  const palette = PALETTES[season];
  const shareUrl = window.location.href;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-y-auto pb-12 pt-4">
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
                <QRCodeCanvas value={shareUrl} size={110} fgColor="#002B49" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-300 leading-relaxed mb-6">Scan to export your chromatic profile and 12-season strategic palette directly to your device.</p>
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-xero-blue text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="p-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Right: Data Analysis */}
      <section className="lg:col-span-7 flex flex-col gap-8">
        {/* Result Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-xl">
            <h3 className="text-[10px] font-mono uppercase mb-4 text-xero-blue font-bold tracking-widest">Identified Persona</h3>
            <h2 className="text-5xl font-black text-xero-navy uppercase leading-none tracking-tighter mb-4">{palette.title}</h2>
            <p className="text-sm font-medium text-neutral-500 leading-relaxed">
              {palette.description}
            </p>
          </div>
          <div className="bg-xero-blue text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl">
             <div className="flex justify-between items-start">
                <h3 className="text-[10px] font-mono uppercase text-white/60 font-bold">Analysis Precision</h3>
                <span className="text-3xl font-black">98.4%</span>
             </div>
             <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-6">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "98.4%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-white h-full shadow-[0_0_15px_white]"
                />
             </div>
          </div>
        </div>

        {/* Technical Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'HUE', value: hue, bg: hue.toLowerCase().includes('warm') ? 'bg-[#FFD700]' : 'bg-[#ACE5EE]' },
            { label: 'VALUE', value: value, bg: 'bg-[#DDE4E8]' },
            { label: 'CHROMA', value: chroma, bg: chroma.toLowerCase() === 'bright' ? 'bg-[#FF69B4]' : 'bg-[#ACE5EE]' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-lg">
              <h4 className="text-[10px] font-mono uppercase mb-6 text-neutral-400 font-bold">{stat.label}</h4>
              <div className={`w-full h-2 ${stat.bg} rounded-full mb-3 opacity-40`} />
              <p className="font-black text-sm text-xero-navy uppercase tracking-widest">{stat.value}</p>
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
                <div className="font-mono text-[8px] uppercase leading-tight font-bold text-center">
                  <div className="text-xero-navy mb-1">{color.name}</div>
                  <div className="text-xero-blue opacity-100">{color.pantone || color.hex}</div>
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
