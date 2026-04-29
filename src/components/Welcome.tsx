/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface WelcomeProps {
  onStart: () => void;
}

export default function Welcome({ onStart }: WelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8 md:px-8 md:py-10 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-xero-blue/10 rounded-full text-xero-blue text-[10px] font-bold tracking-[0.2em] uppercase mb-6 md:mb-8 border border-xero-blue/20">
          <div className="w-2 h-2 bg-xero-blue rounded-full animate-pulse" />
          London 2026
        </div>
        
        <h2 className="text-5xl md:text-7xl xl:text-9xl font-black text-xero-navy tracking-tighter leading-[0.88] md:leading-[0.85] mb-6 md:mb-8">
          Meet Your<br />
          <span className="text-xero-blue italic font-serif lowercase tracking-normal">Best</span>
          <br />Self.
        </h2>
        
        <p className="text-lg md:text-xl xl:text-2xl font-medium text-xero-navy/70 tracking-tight mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
          Harnessing the pulse of Xerocon. Our AI analyzes your unique chromatic profile to synthesize the perfect wardrobe palette.
        </p>

        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={onStart}
            className="bg-xero-blue text-white px-12 md:px-16 py-5 md:py-6 font-black uppercase text-lg md:text-xl tracking-tighter rounded-full shadow-[0_20px_40px_-10px_rgba(19,181,234,0.3)] hover:shadow-[0_10px_20px_-5px_rgba(19,181,234,0.4)] hover:-translate-y-1 transition-all active:scale-95 group"
          >
            Start Your Journey
          </button>
          
          <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest opacity-40">
            <span>Scan.</span>
            <span className="text-xero-blue">Analyze.</span>
            <span>Style.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
