'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, FileText, Clipboard, RefreshCw } from 'lucide-react';

interface SearchResult {
  answer: string;
  references: { index: number; title: string }[];
}

const PAPERS: Record<string, { title: string; authors: string; abstract: string; keyTakeaways: string[] }> = {
  attention: {
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    keyTakeaways: [
      'Introduced Self-Attention mechanism allowing O(1) path length between arbitrary sequence elements.',
      'Replaced sequential RNN structures, enabling massive parallelization during training.',
      'Achieved state-of-the-art results on English-to-German and English-to-French translation tasks.'
    ]
  },
  roberta: {
    title: 'RoBERTa: A Robustly Optimized BERT Pretraining Approach',
    authors: 'Yinhan Liu, Myle Ott, Naman Goyal, Jingfei Du, Mandar Joshi, Danqi Chen, Omer Levy, Mike Lewis, Luke Zettlemoyer, Veselin Stoyanov',
    abstract: 'Language model pretraining has led to significant performance gains, but carefully comparing different approaches is challenging. We present a replication study of BERT pretraining that carefully measures the impact of many key hyperparameters and training data size. We find that BERT was significantly undertrained, and can match or exceed the performance of every post-BERT method published since.',
    keyTakeaways: [
      'Demonstrated that training BERT longer, over larger batch sizes, on more data improves downstream performance.',
      'Removed Next Sentence Prediction (NSP) loss objective during pretraining.',
      'Used dynamic masking patterns instead of static masks across epochs.'
    ]
  }
};

export default function ResearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = searchParams.get('view');
  const paperId = searchParams.get('id');

  // Literature search state
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Citation generator state
  const [citeData, setCiteData] = useState({
    title: 'Attention Is All You Need',
    authors: 'Vaswani, A., et al.',
    year: '2017',
    journal: 'Advances in Neural Information Processing Systems',
    style: 'APA'
  });
  const [formattedCitation, setFormattedCitation] = useState('');

  // Toast notifications
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast('Copied to clipboard!');
  };

  const executeSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setSearchResult({
        answer: 'Based on recent NLP literature, the Transformer architecture [1] replaced recurrent networks by utilizing self-attention mechanisms to map dependencies regardless of distance. Later replication studies [2] showed that BERT was significantly undertrained, and robust hyperparameter optimization (like removing NSP and training longer) yields substantial performance gains on GLUE benchmarks.',
        references: [
          { index: 1, title: 'Attention Is All You Need (Vaswani et al., 2017)' },
          { index: 2, title: 'RoBERTa: A Robustly Optimized BERT Approach (Liu et al., 2019)' }
        ]
      });
      setIsSearching(false);
    }, 1500);
  };

  const buildCitation = () => {
    let result = '';
    if (citeData.style === 'APA') {
      result = `${citeData.authors} (${citeData.year}). ${citeData.title}. ${citeData.journal}.`;
    } else if (citeData.style === 'MLA') {
      result = `${citeData.authors}. "${citeData.title}." ${citeData.journal}, ${citeData.year}.`;
    } else {
      result = `[1] ${citeData.authors}, "${citeData.title}," ${citeData.journal}, ${citeData.year}.`;
    }
    setFormattedCitation(result);
  };

  // 1. LITERATURE SEARCH TERMINAL
  if (activeView === 'search') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded shadow-lg z-50">
            {toast}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Literature Search Engine</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Run queries across indexed publications to get citation-backed summaries.</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter research query (e.g. self-attention complexity, BERT hyperparameters)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') executeSearch();
              }}
              className="w-full pl-11 pr-24 py-3 bg-white border border-slate-250 rounded-[10px] text-[11.5px] font-semibold focus:outline-none focus:border-slate-400 focus:shadow-xs shadow-inner"
            />
            <button
              onClick={executeSearch}
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[9px] uppercase tracking-wider rounded-[6px] transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>

          {isSearching ? (
            <div className="p-8 border border-slate-200 bg-white rounded-[12px] text-center flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
              <p className="text-[11px] font-bold text-slate-800">Synthesizing publications databases...</p>
            </div>
          ) : searchResult ? (
            <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-amber-800 uppercase block tracking-wider">AI Literature Synthesis</span>
                <p className="text-[11px] leading-relaxed text-slate-700 font-semibold">{searchResult.answer}</p>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Source References</span>
                <div className="space-y-1.5">
                  {searchResult.references.map((ref, idx) => (
                    <div key={idx} className="flex gap-2 items-center text-[10px] text-slate-650 font-semibold">
                      <span className="w-4 h-4 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold">[{ref.index}]</span>
                      <span className="truncate">{ref.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // 2. CITATION BUILDER VIEW
  if (activeView === 'citations') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded shadow-lg z-50">
            {toast}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Citation Bibliography Builder</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Convert parsed publication metadata into standard format indices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Metadata Form</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Title</label>
                <input
                  type="text"
                  value={citeData.title}
                  onChange={(e) => setCiteData({ ...citeData, title: e.target.value })}
                  className="w-full px-3.5 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Authors</label>
                  <input
                    type="text"
                    value={citeData.authors}
                    onChange={(e) => setCiteData({ ...citeData, authors: e.target.value })}
                    className="w-full px-3.5 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Year</label>
                  <input
                    type="text"
                    value={citeData.year}
                    onChange={(e) => setCiteData({ ...citeData, year: e.target.value })}
                    className="w-full px-3.5 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Citation Format</label>
                <select
                  value={citeData.style}
                  onChange={(e) => setCiteData({ ...citeData, style: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-bold focus:outline-none"
                >
                  <option value="APA">APA 7th Edition</option>
                  <option value="MLA">MLA 9th Edition</option>
                  <option value="IEEE">IEEE Reference</option>
                </select>
              </div>
              <button
                onClick={buildCitation}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10.5px] uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer"
              >
                Format Entry
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Formated Citation</h3>
            {formattedCitation ? (
              <div className="space-y-4 flex flex-col h-full justify-between pb-2">
                <pre className="text-[10.5px] font-semibold leading-relaxed text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 p-4 border border-slate-200 rounded-[8px]">
                  {formattedCitation}
                </pre>
                <button
                  onClick={() => handleCopy(formattedCitation)}
                  className="flex items-center justify-center gap-1.5 w-full py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] rounded-[6px] uppercase tracking-wider shadow-2xs cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" /> Copy Entry
                </button>
              </div>
            ) : (
              <div className="h-44 flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] font-semibold">Verify form details on the left and click Format.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. SCIENTIFIC PAPER ABSTRACT VIEWER
  if (activeView === 'paper' && paperId && PAPERS[paperId]) {
    const paper = PAPERS[paperId];
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="border-b border-slate-150 pb-4">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">{paper.title}</h1>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Authors: {paper.authors}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Abstract Summary</h3>
          <p className="text-[11px] leading-relaxed text-slate-700 font-semibold bg-white p-5 border border-slate-200 rounded-[10px] shadow-xs">
            {paper.abstract}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Key Takeaways & Contributions</h3>
          <ul className="space-y-2 list-disc pl-5 text-[11px] leading-relaxed text-slate-700 font-medium">
            {paper.keyTakeaways.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  // 4. DEFAULT RESEARCH MENTOR DASHBOARD
  return (
    <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/30 border border-amber-200 rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-slate-900 tracking-tight mb-1">Literature Research Workspace</h2>
          <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
            Run citation-backed literature queries, format bibliography nodes, and summarize papers.
          </p>
        </div>
        <button
          onClick={() => router.push('/mentors/research?view=search')}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-[6px] transition-colors shrink-0 uppercase tracking-widest shadow-xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" /> Launch Literature Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats card */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Workspace Library</h3>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">2 Publications</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-250 text-amber-700 text-[8.5px] font-bold uppercase tracking-wider">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">RAG context engine has indexed paper abstract files for attention mechanisms and BERT approaches.</p>
        </div>

        {/* Papers List */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Scientific Bibliography</h3>
          <div className="space-y-2">
            <div
              onClick={() => router.push('/mentors/research?view=paper&id=attention')}
              className="p-3 border border-slate-200 hover:border-slate-350 rounded-[8px] bg-slate-55/30 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-amber-650 transition-colors">Attention Is All You Need</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Vaswani et al. | 2017</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-amber-600">Summarize Paper →</span>
            </div>
            <div
              onClick={() => router.push('/mentors/research?view=paper&id=roberta')}
              className="p-3 border border-slate-250 rounded-[8px] bg-white transition-all flex items-center justify-between cursor-pointer group opacity-85"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-amber-650 transition-colors">RoBERTa: Robust BERT Approach</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Liu et al. | 2019</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-slate-500">Summarize Paper →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
