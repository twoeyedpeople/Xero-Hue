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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-full bg-xero-blue flex items-center justify-center shadow-[0_10px_25px_-18px_rgba(19,181,234,0.8)]">
              <span className="text-white font-semibold text-[1.65rem] leading-none -mt-0.5">x</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-1">
              <span className="text-xero-navy">Xero</span>
              <span className="text-xero-blue">Hue & You</span>
            </h1>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
            Professional Color Analysis Engine // Brisbane 2025
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-mono uppercase opacity-40 mb-1">Guest Identification</p>
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
        <span>&copy; 2025 Xerocon Brisbane</span>
      </footer>
    </div>
  );
}
