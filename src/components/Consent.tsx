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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto">
      <div className="bg-white border-2 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">Privacy & Consent</h2>
        
        <div className="space-y-4 text-sm text-neutral-600 mb-8 font-medium">
          <p>By proceeding, you agree to the following terms regarding the "Hue & You" AI Activation:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>We will use your device's camera to capture a single photograph for analysis.</li>
            <li>Your photo is processed in real-time by Google Gemini AI to determine your color palette.</li>
            <li>Photos are NOT permanently stored on our servers and are automatically deleted after your session ends.</li>
            <li>No personal data (name, email) is collected or shared during this process.</li>
            <li>The generated visual synthesis is for your personal use and entertainment.</li>
          </ul>
        </div>

        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setAgreed(!agreed)}>
          <div className={`w-6 h-6 border-2 border-black flex items-center justify-center transition-colors ${agreed ? 'bg-orange-600' : 'bg-white'}`}>
            {agreed && <div className="w-2 h-2 bg-white" />}
          </div>
          <span className="text-xs font-bold uppercase tracking-tight">I understand and agree to the processing of my image</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            disabled={!agreed}
            onClick={onAccept}
            className="flex-1 bg-black text-white py-4 font-black uppercase text-sm tracking-tighter border-2 border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
          >
            I Agree, Let's Start
          </button>
          <button 
            onClick={onDecline}
            className="px-8 bg-white text-black py-4 font-black uppercase text-sm tracking-tighter border-2 border-black hover:bg-neutral-100 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
