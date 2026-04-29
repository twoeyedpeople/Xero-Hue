/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F7F9] text-xero-navy font-sans p-4 md:p-8 flex flex-col gap-6 selection:bg-xero-blue selection:text-white">
      {/* Header Section */}
      <header className="flex justify-between items-end border-b border-neutral-300 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-xero-navy mb-2">Hue &amp; You</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
            Professional Color Analysis Engine // Brisbane 2025
          </p>
        </div>
        <img
          src="/xero-wordmark-blue.png"
          alt="Xero"
          className="h-8 md:h-10 w-auto object-contain shrink-0"
        />
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>

      {/* Footer Bar */}
      <footer className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest border-t border-black pt-4">
        <div className="flex gap-4 md:gap-8">
          <span className="hidden xs:inline">Ref: THECONCEPTWARDROBE.COM</span>
          <span>System Status: Online</span>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-red-600"></div>
          <div className="w-2 h-2 rounded-full bg-green-600"></div>
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        </div>
        <span>&copy; 2025 Xerocon Brisbane</span>
      </footer>
    </div>
  );
}
