'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export interface Citation {
  source: string;
  page: number;
  chunk: number;
  score: number;
  document_id?: string; // Optional if mapped on backend
}

interface SourcesPanelProps {
  citations: Citation[];
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ citations }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 border border-slate-200 bg-[#f9f9f8] rounded-[8px] overflow-hidden max-w-xl transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-[10px] font-bold text-slate-800 hover:bg-[#ecebea]/40 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-700" />
          <span>Sources Used ({citations.length})</span>
        </div>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="px-3.5 pb-2.5 pt-1 divide-y divide-slate-100 max-h-48 overflow-y-auto scrollbar-thin">
          {citations.map((cite, idx) => {
            // Find document id mapping or fallback link
            const docId = cite.document_id || 'preview';
            const relevancePct = Math.round(cite.score * 100);
            
            return (
              <div key={idx} className="py-2 flex items-center justify-between text-[11px] font-medium text-slate-900">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="truncate max-w-[280px]" title={cite.source}>
                    {cite.source}
                  </span>
                  <span className="text-[9px] text-slate-700 font-mono bg-[#ecebea] px-1.5 py-0.5 rounded-[4px]">
                    Chunk #{cite.chunk}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-700 font-bold">{relevancePct}% Match</span>
                  <Link
                    href={`/documents/${docId}?chunk=${cite.chunk}`}
                    className="p-1 hover:bg-[#ecebea] rounded-[4px] text-slate-850 hover:text-slate-950 transition-colors"
                    title="View file chunks"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
