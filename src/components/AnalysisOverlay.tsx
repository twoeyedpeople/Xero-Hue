/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const MESSAGES = [
  "INITIALIZING CHROMATIC SCANNER...",
  "EXTRACTING HUE FREQUENCIES...",
  "ANALYZING SKIN CHROMA...",
  "MAPPING EYE REFLECTANCE...",
  "CROPPING CHROMATIC DATA...",
  "CROSS-REFERENCING DATABASE...",
  "SYNTHESIZING WARDROBE DATA...",
  "FINALIZING COLOR PALETTE..."
];

interface AnalysisOverlayProps {
  userImage?: string;
}

export default function AnalysisOverlay({ userImage }: AnalysisOverlayProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 md:px-6 md:py-6 bg-[#F4F7F9]">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 min-h-[620px]">
        {/* Left: Animated Scanner */}
        <section className="md:col-span-5 bg-xero-navy rounded-3xl relative overflow-hidden flex items-center justify-center shadow-2xl min-h-[320px] md:min-h-[420px]">
          <div className="absolute top-6 left-6 z-10 bg-xero-blue text-white px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full">
            Biometric Linkage
          </div>
          
          <div className="w-[14rem] h-[17.5rem] md:w-[15rem] md:h-[19rem] lg:w-[16.5rem] lg:h-[20.5rem] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center relative bg-white/5 backdrop-blur-sm">
            <motion.div 
               animate={{ y: [0, 300, 0] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-0 left-0 w-full h-[3px] bg-xero-blue shadow-[0_0_25px_rgba(19,181,234,0.8)] z-20"
            />
            <div className="w-40 h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full border-4 border-white/10 mb-4 flex items-center justify-center overflow-hidden relative bg-xero-blue/10">
                {userImage ? (
                  <motion.img
                    src={userImage}
                    alt="Captured user"
                    className="w-full h-full object-cover"
                    animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.03, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : (
                  <motion.div 
                    className="w-full h-full bg-xero-blue/20"
                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-xero-navy/30" />
                <div className="absolute inset-0 border border-white/10 rounded-full" />
            </div>
            <span className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] text-white/40">Status: EXTRUDING DATA</span>
          </div>
        </section>

        {/* Right: Status Panel */}
        <section className="md:col-span-7 flex flex-col gap-5 md:gap-6">
          <div className="bg-white rounded-3xl p-7 md:p-8 flex-1 flex flex-col justify-center border border-neutral-100 shadow-xl">
            <div className="mb-8 md:mb-10">
              <h3 className="text-[10px] font-mono uppercase mb-4 text-xero-blue font-bold tracking-widest underline underline-offset-8">Server Logic Stream</h3>
              <div className="min-h-[7rem] md:min-h-[8rem] overflow-visible">
                <motion.p 
                  key={msgIndex}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  className="text-2xl md:text-[2.2rem] leading-[1.05] font-black uppercase tracking-tighter text-xero-navy max-w-[12ch] pr-4"
                >
                  {MESSAGES[msgIndex]}
                </motion.p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-mono uppercase opacity-30 tracking-widest">Compute Saturation</span>
                  <span className="text-xs font-black text-xero-blue">OVERCLOCKING</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 20, ease: "linear" }}
                    className="bg-xero-blue h-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-5">
                 <div className="bg-white rounded-2xl p-6 h-32 flex flex-col justify-between border border-neutral-100">
                    <span className="text-[9px] font-mono uppercase opacity-40">Gemini Core</span>
                    <motion.span 
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-xl font-black text-xero-navy"
                    >
                      SYNCHRONIZED
                    </motion.span>
                 </div>
                 <div className="bg-xero-navy rounded-2xl p-6 h-32 flex flex-col justify-between text-white">
                    <span className="text-[9px] font-mono uppercase opacity-40">Pulse Rate</span>
                    <div className="flex gap-1.5 items-end h-8">
                       {[...Array(8)].map((_, i) => (
                         <motion.div 
                            key={i}
                            animate={{ height: [6, 24, 6] }}
                            transition={{ duration: 0.6, delay: i * 0.08, repeat: Infinity }}
                            className="w-1.5 bg-xero-blue rounded-full"
                         />
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 md:p-7 rounded-2xl border border-xero-blue/20 italic font-medium text-neutral-500 text-sm leading-relaxed">
             <span className="text-xero-blue font-black uppercase text-[10px] block mb-2 not-italic tracking-widest underline">Engine Update</span>
             Our proprietary vision pipeline is cross-referencing your biometric data against 24,000 reference samples to guarantee clinical-grade seasonal isolation.
          </div>
        </section>
      </div>
    </div>
  );
}
