/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraComponentProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

export default function CameraComponent({ onCapture, onCancel }: CameraComponentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please check permissions.");
      }
    }
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      capture();
      setCountdown(null);
    }
  }, [countdown]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 overflow-hidden py-4">
      <section className="md:col-span-8 bg-xero-navy rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-6 left-6 z-20 bg-xero-blue text-white px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full">
          Live Analysis Stream
        </div>
        
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
        />
        
        {/* Face Overlay Guideline */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-64 h-80 rounded-[4rem] border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-[1px]" />
        </div>

        <AnimatePresence>
          {countdown !== null && (
            <motion.div 
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-xero-navy/40 backdrop-blur-sm z-30 pointer-events-none"
            >
              <span className="text-white text-[12rem] font-black tracking-tighter">{countdown}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-xero-navy/95 text-white p-12 text-center z-40">
            <p className="font-mono uppercase tracking-widest text-sm opacity-80">{error}</p>
          </div>
        )}
      </section>

      <section className="md:col-span-4 flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-8 flex-1 flex flex-col justify-center border border-neutral-200">
          <h3 className="text-[10px] font-mono uppercase mb-4 opacity-40">Status: Calibration Stable</h3>
          <h2 className="text-4xl font-black text-xero-navy uppercase leading-tight mb-4 tracking-tighter">Perfect Frame</h2>
          <p className="text-sm font-medium text-neutral-500 mb-10 leading-relaxed">
            Please align your face within the guide. Artificial intelligence works best with neutral expressions and direct gaze.
          </p>

          <div className="space-y-4">
            <button 
              onClick={takePhoto}
              disabled={!isReady || countdown !== null}
              className="w-full bg-xero-blue text-white font-black py-5 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 group flex items-center justify-center gap-3 text-sm uppercase tracking-wider"
            >
              <Camera className="w-5 h-5" />
              Capture Identity
            </button>
            <button 
              onClick={onCancel}
              className="w-full bg-transparent text-xero-navy/50 font-bold py-3 uppercase text-[10px] tracking-widest hover:text-xero-navy transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>

        <div className="bg-xero-navy text-white p-6 rounded-2xl font-mono text-[9px] uppercase space-y-2 opacity-90">
          <div className="flex justify-between border-b border-white/10 pb-2"><span>Sensor:</span><span className="text-xero-blue">OPTIMIZED</span></div>
          <div className="flex justify-between border-b border-white/10 pb-2"><span>Processing:</span><span>SERVER-SIDE</span></div>
          <div className="flex justify-between"><span>Region:</span><span>BRISBANE (BNE)</span></div>
        </div>
      </section>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
