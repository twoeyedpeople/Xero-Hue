/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  patientName?: string;
}

export default function Layout({ children, patientName = 'Guest Attendee' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F7F9] text-xero-navy font-sans p-4 md:p-8 flex flex-col gap-6 selection:bg-xero-blue selection:text-white">
      {/* Header Section */}
      <header className="flex justify-between items-end border-b border-neutral-300 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-xero-blue rounded-full flex items-center justify-center">
              <span className="text-white font-black text-xl">x</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-1">
              Xero <span className="text-xero-blue italic font-medium">Hue & You</span>
            </h1>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
            Professional Color Analysis Engine // Brisbane 2026
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-mono uppercase opacity-40 mb-1">Session ID: BNE-26-ALPHA</p>
          <div className="px-3 py-1 bg-white border border-neutral-200 rounded-full inline-block">
             <p className="text-xs font-bold text-xero-blue uppercase tracking-wider">{patientName}</p>
          </div>
        </div>
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
        <span>&copy; 2026 Xerocon Brisbane</span>
      </footer>
    </div>
  );
}
