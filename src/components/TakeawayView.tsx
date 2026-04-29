/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, Link as LinkIcon } from 'lucide-react';
import { PALETTES } from '../constants';
import { SEASON_SUMMARIES, SEASON_SUMMARY_SOURCE } from '../seasonNarratives';
import { TakeawayPayload, buildTakeawayUrl, formatConfidence } from '../takeaway';

export default function TakeawayView({
  season,
  hue,
  value,
  chroma,
  style,
  confidence,
}: TakeawayPayload) {
  const palette = PALETTES[season];
  const shareUrl = buildTakeawayUrl({ season, hue, value, chroma, style, confidence });
  const summary = SEASON_SUMMARIES[season] ?? palette.description;

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 md:py-8">
      <div className="takeaway-sheet bg-white rounded-[2rem] border border-neutral-200 shadow-[0_18px_40px_rgba(0,43,73,0.08)] p-6 md:p-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-xero-blue font-bold mb-3">
                Mobile Takeaway // Hue &amp; You
              </p>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-xero-navy uppercase leading-none mb-4">
                {palette.title}
              </h1>
              <p className="text-base md:text-lg leading-8 text-neutral-600">{summary}</p>
            </div>

            <div className="print:hidden flex flex-col gap-3 xl:min-w-[320px] xl:items-end">
              <div className="flex flex-wrap gap-3 xl:justify-end">
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center justify-center gap-2 bg-xero-blue text-white px-4 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.16em] shadow-lg hover:brightness-105 transition-all min-w-[150px]"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-2 bg-white text-xero-navy px-4 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.16em] border border-neutral-200 hover:bg-neutral-50 transition-all min-w-[140px]"
                >
                  <LinkIcon className="w-4 h-4 text-xero-blue" />
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Analysis Precision', value: formatConfidence(confidence) },
              { label: 'Hue', value: hue },
              { label: 'Value', value: value },
              { label: 'Chroma', value: chroma },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-neutral-200 bg-[#F8FBFD] p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400 mb-3">{item.label}</p>
                <p className="text-xl font-black uppercase tracking-wide text-xero-navy">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.75rem] border border-neutral-200 p-5 md:p-7">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-xero-blue font-bold mb-2">
                  Primary Pigmentation Matrix
                </p>
                <p className="text-sm text-neutral-500">Requested style profile: {style}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {palette.colors.map((color) => (
                <div key={`${palette.season}-${color.name}`} className="flex flex-col gap-3">
                  <div
                    className="aspect-square rounded-2xl shadow-[0_12px_28px_rgba(0,43,73,0.12)] border border-neutral-100"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-wide text-xero-navy">{color.name}</p>
                    <p className="text-xs font-mono uppercase tracking-[0.18em] text-xero-blue mt-1">
                      {color.pantone || color.hex}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
