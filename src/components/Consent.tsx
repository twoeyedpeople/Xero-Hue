/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';

interface ConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function Consent({ onAccept, onDecline }: ConsentProps) {
  const [agreed, setAgreed] = useState(false);
  const consentPoints = [
    "We use your device camera to capture one photo for analysis.",
    "Your photo is processed in real time by Google Gemini AI to determine your palette.",
    "Photos are not permanently stored and are deleted after your session ends.",
    "No personal data such as name or email is collected or shared.",
    "The generated visual synthesis is for personal use and entertainment.",
  ];

  return (
    <div className="flex-1 flex items-center justify-center py-3">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <section className="bg-white rounded-[2rem] p-6 md:p-8 border border-neutral-200 shadow-xl flex flex-col">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-xero-blue/8 border border-xero-blue/15 text-[9px] font-bold uppercase tracking-[0.25em] text-xero-blue mb-4">
              Consent Required
            </div>
            <h2 className="text-3xl md:text-[2.35rem] font-black uppercase tracking-tighter text-xero-navy leading-[0.95] mb-3">
              Privacy & Consent
            </h2>
            <p className="text-sm md:text-[15px] text-neutral-500 leading-relaxed max-w-2xl">
              Before we begin, please review and confirm the agreements below.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 px-5 py-3 mb-6">
            {consentPoints.map((point, index) => (
              <div
                key={point}
                className={`flex gap-3 py-3 ${index !== consentPoints.length - 1 ? 'border-b border-neutral-200/70' : ''}`}
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-xero-blue text-[9px] font-black text-white">
                  {index + 1}
                </div>
                <p className="text-sm md:text-[14px] font-medium text-neutral-600 leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className={`mb-6 flex items-center gap-4 rounded-2xl border px-5 py-3.5 text-left transition-all ${
              agreed
                ? 'border-xero-blue bg-xero-blue/5 shadow-[0_10px_30px_-20px_rgba(19,181,234,0.9)]'
                : 'border-neutral-200 bg-white hover:border-xero-blue/50'
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                agreed ? 'border-xero-blue bg-xero-blue' : 'border-xero-navy/30 bg-white'
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-[2px] ${agreed ? 'bg-white' : 'bg-transparent'}`} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-xero-navy">
                I understand and agree to the processing of my image
              </div>
              <div className="text-xs md:text-sm text-neutral-500 mt-1">
                Consent is required before camera activation begins.
              </div>
            </div>
          </button>

          <div className="mt-auto flex flex-col sm:flex-row gap-4">
            <button
              disabled={!agreed}
              onClick={onAccept}
              className="flex-1 rounded-2xl bg-xero-blue text-white py-5 font-black uppercase text-sm tracking-[0.18em] shadow-[0_20px_40px_-18px_rgba(19,181,234,0.8)] hover:brightness-105 hover:-translate-y-0.5 transition-all disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              I Agree, Let&apos;s Start
            </button>
            <button
              onClick={onDecline}
              className="sm:w-52 rounded-2xl border border-xero-navy/20 bg-white text-xero-navy py-5 font-black uppercase text-sm tracking-[0.18em] hover:bg-neutral-50 transition-colors"
            >
              Decline
            </button>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
