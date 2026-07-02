'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Trash2, Info, RefreshCw } from 'lucide-react';

export default function DocumentAssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCollection = searchParams.get('collection');

  // File explorer states
  const [documents, setDocuments] = useState([
    { id: 'd1', name: 'api_specifications.md', size: '12 KB', date: 'Yesterday' },
    { id: 'd2', name: 'user_research_summary.pdf', size: '240 KB', date: '3 days ago' },
    { id: 'd3', name: 'db_migration_schema.sql', size: '8 KB', date: 'June 18, 2026' }
  ]);

  // Query state
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<string | null>(null);

  const deleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const executeRAGQuery = () => {
    if (!query.trim()) return;
    setIsQuerying(true);
    setQueryResult(null);
    setTimeout(() => {
      setQueryResult('Based on "api_specifications.md" (Line 42), the gateway routes all client session authorization tokens using Bearer credentials headers. In "db_migration_schema.sql", the profiles table contains a JSON column mapping learning_goals fields, initialized as an empty object.');
      setIsQuerying(false);
    }, 1400);
  };

  // 1. FILE EXPLORER / RAG VIEW
  if (activeCollection) {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">RAG Document Explorer</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Inspect and query your indexed knowledge base files.</p>
        </div>

        {/* Query Input */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Query Knowledge Context</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about the contents of your files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') executeRAGQuery();
              }}
              className="flex-1 px-3.5 py-2 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 shadow-inner bg-slate-50/50"
            />
            <button
              onClick={executeRAGQuery}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer shrink-0"
            >
              Analyze
            </button>
          </div>

          {isQuerying ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] flex items-center justify-center text-[10.5px] font-semibold text-slate-550">
              <RefreshCw className="w-4 h-4 animate-spin text-rose-600 mr-2" /> Retrieving segments and performing cross-references...
            </div>
          ) : queryResult ? (
            <div className="bg-rose-50/20 border border-rose-200 rounded-[10px] p-4 space-y-2">
              <span className="text-[9px] font-bold text-rose-850 uppercase tracking-widest block">Anchored Answer</span>
              <p className="text-[10.5px] leading-relaxed text-slate-700 font-semibold">{queryResult}</p>
            </div>
          ) : null}
        </div>

        {/* Files Table */}
        <div className="bg-white border border-slate-200 rounded-[12px] overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-150 bg-[#fafafa] flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">File Database</h3>
            <span className="text-[9.5px] text-slate-500 font-bold">{documents.length} Files</span>
          </div>

          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10.5px] border-collapse font-semibold text-slate-700">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="p-3 font-bold text-slate-900">Name</th>
                    <th className="p-3 font-bold text-slate-900">Size</th>
                    <th className="p-3 font-bold text-slate-900">Indexed</th>
                    <th className="p-3 font-bold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                      <td className="p-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{doc.size}</td>
                      <td className="p-3 text-slate-500 font-medium">{doc.date}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteDoc(doc.id)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete file index"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-44 flex flex-col justify-center items-center text-center text-slate-400 space-y-2 p-5">
              <Info className="w-8 h-8 text-slate-300" />
              <p className="text-[11px] font-semibold">No files remaining in this collection.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. DEFAULT DOCUMENT ASSISTANT DASHBOARD
  return (
    <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-rose-50/50 to-pink-50/30 border border-rose-200 rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-slate-900 tracking-tight mb-1">RAG Knowledge Assistant</h2>
          <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
            Index local documentation files and query them contextually with strict reference validations.
          </p>
        </div>
        <button
          onClick={() => router.push('/mentors/documents?collection=all')}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-[6px] transition-colors shrink-0 uppercase tracking-widest shadow-xs cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" /> Launch Explorer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats card */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Workspace Status</h3>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">3 Files Indexed</span>
            <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-250 text-rose-700 text-[8.5px] font-bold uppercase tracking-wider">Ready</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Documents are tokenized and compiled in vector memory clusters.</p>
        </div>

        {/* Collections List */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Workspace Collections</h3>
          <div className="space-y-2">
            <div
              onClick={() => router.push('/mentors/documents?collection=all')}
              className="p-3 border border-slate-200 hover:border-slate-350 rounded-[8px] bg-slate-55/30 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-rose-650 transition-colors">All Workspace Files</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">3 files | 260 KB total size</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-rose-600">Open Explorer →</span>
            </div>
            <div
              onClick={() => router.push('/mentors/documents?collection=tech')}
              className="p-3 border border-slate-250 rounded-[8px] bg-white transition-all flex items-center justify-between cursor-pointer group opacity-85"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-rose-650 transition-colors">Engineering Project Docs</span>
                  <span className="text-[8.5px] text-slate-405 font-semibold uppercase">Empty collection</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-slate-500">Open Explorer →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
