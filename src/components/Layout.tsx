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
    <div className="h-screen overflow-hidden bg-[#F4F7F9] text-xero-navy font-sans p-3 md:p-4 xl:p-6 flex flex-col gap-3 md:gap-4 selection:bg-xero-blue selection:text-white">
      {/* Header Section */}
      <header className="flex justify-between items-end gap-4 border-b border-neutral-300 pb-3 md:pb-4">
        <div>
          <h1 className="text-xl md:text-2xl xl:text-3xl font-black tracking-tight text-xero-blue mb-1">Hue &amp; You</h1>
          <p className="text-[8px] md:text-[9px] font-mono uppercase tracking-[0.16em] md:tracking-[0.18em] opacity-50">
            Professional Color Analysis Engine // London 2026
          </p>
        </div>
        <img
          src="/xero-wordmark-blue.png"
          alt="Xero"
          className="h-4 md:h-5 xl:h-6 w-auto object-contain shrink-0"
        />
      </header>

      <main className="flex-1 min-h-0 flex flex-col overflow-x-hidden overflow-y-auto relative">
        {children}
      </main>

      {/* Footer Bar */}
      <footer className="flex justify-between items-center text-[8px] md:text-[9px] font-mono uppercase tracking-widest border-t border-black pt-3">
        <div className="flex gap-4 md:gap-8">
          <span className="hidden xs:inline">Ref: THECONCEPTWARDROBE.COM</span>
          <span>System Status: Online</span>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-red-600"></div>
          <div className="w-2 h-2 rounded-full bg-green-600"></div>
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        </div>
        <span>&copy; 2026 XeroCon London</span>
      </footer>
    </div>
  );
}
