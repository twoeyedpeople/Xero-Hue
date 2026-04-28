/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Style } from '../types';
import { motion } from 'motion/react';

interface StyleSelectorProps {
  onSelect: (style: Style) => void;
  selectedStyle?: Style;
}

export default function StyleSelector({ onSelect, selectedStyle }: StyleSelectorProps) {
  const styles = Object.values(Style);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl p-8 md:p-16 text-center max-w-5xl mx-auto w-full shadow-xl border border-neutral-100">
      <h3 className="text-[10px] font-mono uppercase mb-4 tracking-[0.3em] text-xero-blue font-bold">Step 02: Preference Capture</h3>
      <h2 className="text-5xl md:text-7xl font-black text-xero-navy uppercase tracking-tighter mb-8 leading-[0.9]">Select Your Aesthetic</h2>
      <p className="text-lg md:text-xl font-medium text-neutral-500 mb-12 max-w-2xl mx-auto tracking-tight">
        Define the stylistic lens through which the Gemini engine will synthesize your color profile.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
        {styles.map((style, index) => (
          <motion.button
            key={style}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(style)}
            className={`p-8 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-4 border-2
              ${selectedStyle === style 
                ? 'bg-xero-blue text-white border-xero-blue shadow-xl scale-105' 
                : 'bg-white text-xero-navy border-neutral-100 hover:border-xero-blue hover:text-xero-blue hover:-translate-y-1 shadow-md'
              }`}
          >
            <div className={`w-8 h-1 rounded-full mb-2 ${selectedStyle === style ? 'bg-white' : 'bg-xero-blue'}`} />
            {style}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
