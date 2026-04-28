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
    "We will use your device's camera to capture a single photograph for analysis.",
    "Your photo is processed in real-time by Google Gemini AI to determine your color palette.",
    "Photos are NOT permanently stored on our servers and are automatically deleted after your session ends.",
    "No personal data (name, email) is collected or shared during this process.",
    "The generated visual synthesis is for your personal use and entertainment.",
  ];

  return (
    <div className="flex-1 flex items-center justify-center py-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        <section className="lg:col-span-5 bg-xero-navy rounded-[2rem] p-8 md:p-10 text-white shadow-2xl flex flex-col justify-between min-h-[540px]">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold uppercase tracking-[0.25em] text-xero-blue mb-8">
              Consent Gateway
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9] mb-5">
              Privacy
              <br />
              Protocol
            </h2>

            <p className="text-sm md:text-base text-white/70 leading-relaxed max-w-md mb-10">
              Before we activate the chromatic scan, we need your approval to process one live image through the Hue & You analysis engine.
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Processing Mode</div>
                <div className="text-lg font-black uppercase tracking-tight">Real-Time AI Analysis</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Data Retention</div>
                <div className="text-lg font-black uppercase tracking-tight">Session Use Only</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-xero-blue/30 bg-white/5 p-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-xero-blue mb-3">System Notice</div>
            <p className="text-sm text-white/75 leading-relaxed">
              This experience is designed for event demonstration purposes and uses camera access only after you explicitly opt in.
            </p>
          </div>
        </section>

        <section className="lg:col-span-7 bg-white rounded-[2rem] p-8 md:p-10 border border-neutral-200 shadow-xl min-h-[540px] flex flex-col">
          <div className="mb-8">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-xero-blue font-bold mb-4">
              Step 01: Consent Capture
            </h3>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-xero-navy leading-[0.9] mb-5">
              Privacy & Consent
            </h2>
            <p className="text-base text-neutral-500 leading-relaxed max-w-2xl">
              By proceeding, you agree to the following terms regarding the Hue & You AI activation.
            </p>
          </div>

          <div className="grid gap-3 mb-8">
            {consentPoints.map((point, index) => (
              <div
                key={point}
                className="flex gap-4 rounded-2xl border border-neutral-100 bg-neutral-50/80 px-5 py-4"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-xero-blue text-[10px] font-black text-white">
                  {index + 1}
                </div>
                <p className="text-sm md:text-[15px] font-medium text-neutral-600 leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className={`mb-8 flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
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
              <div className="text-sm text-neutral-500 mt-1">
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
