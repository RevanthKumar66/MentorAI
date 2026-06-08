'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { documentApi } from '@/modules/documents/services/document-api';
import { 
  ArrowLeft, Download, FileText, Database, Code2, BookOpen, 
  Table, Presentation, File, ExternalLink, Copy, Check 
} from 'lucide-react';
import Link from 'next/link';

export default function DocumentPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const targetChunkIndexStr = searchParams.get('chunk');
  const targetChunkIndex = targetChunkIndexStr !== null ? parseInt(targetChunkIndexStr, 10) : null;

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'chunks' | 'stats'>('preview');
  const [searchQuery, setSearchQuery] = useState('');

  const chunkRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch document metadata
  const { data: document, isLoading, isError, error } = useQuery({
    queryKey: ['document-details', id],
    queryFn: () => documentApi.getDocumentDetails(id),
    enabled: !!id,
  });

  // 2. Fetch document chunks
  const { data: chunks, isLoading: isLoadingChunks } = useQuery({
    queryKey: ['document-chunks', id],
    queryFn: () => documentApi.getDocumentChunks(id),
    enabled: !!id,
  });

  // 3. Fetch signed download URL
  useEffect(() => {
    if (!id) return;
    documentApi.getDownloadUrl(id)
      .then(url => {
        setDownloadUrl(url);
      })
      .catch(err => {
        console.error('Failed to get download URL:', err);
      });
  }, [id]);

  // 4. Fetch raw content if it's text/code/csv/markdown
  useEffect(() => {
    if (!downloadUrl || !document) return;
    const cat = document.category;
    const isTextReadable = 
      cat === 'code' || 
      document.file_name.endsWith('.txt') || 
      document.file_name.endsWith('.md') || 
      document.file_name.endsWith('.csv') ||
      document.mime_type.startsWith('text/') ||
      document.mime_type === 'application/json';

    if (isTextReadable) {
      setLoadingContent(true);
      fetch(downloadUrl)
        .then(res => res.text())
        .then(text => {
          setRawContent(text);
          setLoadingContent(false);
        })
        .catch(err => {
          console.error('Failed to fetch text content:', err);
          setLoadingContent(false);
        });
    }
  }, [downloadUrl, document]);

  // 5. Default to chunks tab and auto-scroll if targetChunkIndex query param is set
  useEffect(() => {
    if (targetChunkIndex !== null) {
      setActiveTab('chunks');
    }
  }, [targetChunkIndex]);

  // 6. Scroll to target chunk when in chunks tab
  useEffect(() => {
    if (activeTab === 'chunks' && targetChunkIndex !== null && chunkRef.current) {
      const timer = setTimeout(() => {
        chunkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, targetChunkIndex, chunks]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'document': return FileText;
      case 'dataset': return Database;
      case 'code': return Code2;
      case 'notebook': return BookOpen;
      case 'spreadsheet': return Table;
      case 'presentation': return Presentation;
      default: return File;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full justify-center items-center bg-[#fcfbf9] text-slate-800">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs mt-2 font-medium">Loading document preview...</p>
        </div>
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="flex h-screen w-full flex-col justify-center items-center bg-[#fcfbf9] text-slate-800 p-6 text-center">
        <h2 className="text-sm font-bold text-slate-900">Failed to load document preview</h2>
        <p className="text-xs text-slate-500 mt-1">{(error as any)?.message || 'Access denied or database connection offline.'}</p>
        <Link href="/documents" className="mt-4 px-4 py-1.5 bg-slate-900 text-white rounded-[6px] text-xs font-semibold hover:bg-black transition-colors">
          Back to Explorer
        </Link>
      </div>
    );
  }

  const Icon = getCategoryIcon(document.category);
  const isPDF = document.mime_type === 'application/pdf' || document.file_name.endsWith('.pdf');
  const isCSV = document.file_name.endsWith('.csv');
  const isMarkdown = document.file_name.endsWith('.md');
  const isCode = document.category === 'code';

  const combinedRawText = rawContent || chunks?.map(c => c.content).join('\n\n') || '';
  const filteredChunks = chunks?.filter(chunk => 
    chunk.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col h-full bg-[#f9f9f8] text-slate-800">
      {/* Header bar */}
      <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/documents" className="p-1.5 rounded-[6px] hover:bg-slate-100 text-slate-800 hover:text-slate-950 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-[6px] bg-[#f4f3f0] border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-slate-900 truncate max-w-md" title={document.original_file_name}>
              {document.original_file_name}
            </h1>
            <p className="text-[9px] text-slate-700 font-medium mt-0.5 font-mono">
              {formatBytes(document.file_size)} • {document.category.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={document.original_file_name}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-850 font-bold transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
        </div>
      </header>

      {/* Main Container Area */}
      <div className="flex-1 overflow-hidden p-6 flex flex-col min-h-0">
        <div className="flex-1 bg-white border border-slate-250 rounded-[8px] overflow-hidden shadow-sm flex flex-col min-h-0">
          
          {/* Tab Selector bar */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 shrink-0 h-10 items-center gap-4 text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveTab('preview')}
              className={`h-full border-b-2 px-1 transition-all ${
                activeTab === 'preview' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-800'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`h-full border-b-2 px-1 transition-all ${
                activeTab === 'raw' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-800'
              }`}
            >
              Raw Text
            </button>
            <button
              onClick={() => setActiveTab('chunks')}
              className={`h-full border-b-2 px-1 transition-all ${
                activeTab === 'chunks' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-800'
              }`}
            >
              Chunk Viewer ({chunks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`h-full border-b-2 px-1 transition-all ${
                activeTab === 'stats' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-800'
              }`}
            >
              Stats & RAG
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            
            {/* 1. PREVIEW TAB */}
            {activeTab === 'preview' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {loadingContent ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-800 gap-2">
                    <span className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
                    <span className="text-[10px] font-semibold text-slate-800 animate-pulse">Fetching content...</span>
                  </div>
                ) : isPDF && downloadUrl ? (
                  <iframe 
                    src={`${downloadUrl}#toolbar=0`} 
                    className="w-full h-full border-none"
                    title={document.original_file_name}
                  />
                ) : isCSV && rawContent ? (
                  <CSVViewer content={rawContent} />
                ) : (isCode || isMarkdown || rawContent) && rawContent !== null ? (
                  <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="absolute right-4 top-4 z-10 flex gap-2">
                      <button
                        onClick={() => handleCopy(rawContent)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-800 bg-[#f4f3f0] hover:bg-slate-200 border border-slate-300 rounded-[6px] transition-colors shadow-sm cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto p-6 text-xs text-slate-850 font-mono leading-relaxed bg-[#fcfbf9] whitespace-pre select-text selection:bg-slate-200">
                      {rawContent}
                    </pre>
                  </div>
                ) : (
                  // Fallback: Card View for Binary/Docx/Spreadsheets
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#fcfbf9] overflow-y-auto">
                    <div className="w-16 h-16 rounded-[8px] bg-white border border-slate-250 flex items-center justify-center text-slate-800 mb-4 shadow-sm">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 mb-1">{document.original_file_name}</h2>
                    <p className="text-xs text-slate-700 max-w-sm mb-6 leading-relaxed">
                      Previews are not available for this file type. You can download the file to view it on your device.
                    </p>
                    <table className="text-left text-[11px] text-slate-800 bg-white border border-slate-200 rounded-[6px] overflow-hidden w-full max-w-md mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-2 font-bold text-slate-900">File Type</td>
                          <td className="px-4 py-2 font-mono">{document.mime_type}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-2 font-bold text-slate-900">File Size</td>
                          <td className="px-4 py-2 font-mono">{formatBytes(document.file_size)}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-4 py-2 font-bold text-slate-900">Checksum (SHA256)</td>
                          <td className="px-4 py-2 font-mono text-[9.5px] break-all">{document.checksum}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-bold text-slate-900">Uploaded</td>
                          <td className="px-4 py-2 text-slate-700 font-mono">
                            {new Date(document.created_at).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {downloadUrl && (
                      <a
                        href={downloadUrl}
                        download={document.original_file_name}
                        className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 text-white rounded-[6px] text-xs font-bold hover:bg-black transition-colors shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        Download File
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. RAW TEXT TAB */}
            {activeTab === 'raw' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#fcfbf9] relative">
                {combinedRawText ? (
                  <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="absolute right-6 top-4 z-10 flex gap-2">
                      <button
                        onClick={() => handleCopy(combinedRawText)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-800 bg-[#f4f3f0] hover:bg-slate-200 border border-slate-300 rounded-[6px] transition-colors shadow-sm cursor-pointer animate-none"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto p-6 text-xs text-slate-850 font-mono leading-relaxed whitespace-pre-wrap select-text selection:bg-slate-200">
                      {combinedRawText}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    No text content available for this document.
                  </div>
                )}
              </div>
            )}

            {/* 3. CHUNK VIEWER TAB */}
            {activeTab === 'chunks' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#fbfbfa]">
                {/* Chunk Search Bar */}
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Filter Chunks:</span>
                    <input
                      type="text"
                      placeholder="Search chunk text..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-[6px] focus:outline-none focus:border-slate-500 bg-[#f9f9f8] w-64 transition-colors font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Showing {filteredChunks.length} of {chunks?.length || 0} chunks
                  </span>
                </div>

                {/* Chunks List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {isLoadingChunks ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <span className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
                      <span className="text-[10px] font-semibold text-slate-500">Loading chunks...</span>
                    </div>
                  ) : filteredChunks.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No chunks found.
                    </div>
                  ) : (
                    filteredChunks.map((chunk) => {
                      const isHighlighted = chunk.chunk_index === targetChunkIndex;
                      return (
                        <div
                          key={chunk.id}
                          ref={isHighlighted ? chunkRef : null}
                          className={`p-4 border rounded-[8px] transition-all duration-200 ${
                            isHighlighted
                              ? 'border-amber-300 bg-amber-50/50 shadow-sm ring-1 ring-amber-300'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-[4px] ${
                              isHighlighted ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-650'
                            }`}>
                              CHUNK #{chunk.chunk_index}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(chunk.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-text selection:bg-slate-250 font-mono">
                            {chunk.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 4. STATS & RAG TAB */}
            {activeTab === 'stats' && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#fcfbf9]">
                <div className="max-w-2xl mx-auto space-y-6">
                  
                  {/* Indexing status card */}
                  <div className="bg-white border border-slate-200 rounded-[8px] p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        document.processing_status === 'completed' ? 'bg-emerald-500 animate-pulse' :
                        document.processing_status === 'failed' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                      }`} />
                      RAG Processing Status
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Status</span>
                        <span className="font-semibold text-slate-900 capitalize">{document.processing_status}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Vector Indexed</span>
                        <span className="font-semibold text-slate-900">{document.is_processed ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Total Chunks</span>
                        <span className="font-semibold text-slate-900">{chunks?.length || 0} chunks</span>
                      </div>
                      {document.processing_error && (
                        <div className="col-span-2 bg-rose-50 border border-rose-100 rounded-[6px] p-3 text-rose-800 text-[11px]">
                          <span className="font-bold block mb-1">Processing Error:</span>
                          <p className="font-mono">{document.processing_error}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vector/Model properties */}
                  <div className="bg-white border border-slate-200 rounded-[8px] p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 mb-4">Vector Database Metadata</h3>
                    <table className="w-full text-left text-xs text-slate-850">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-500 font-medium">Embedding Model</td>
                          <td className="py-2.5 font-semibold text-slate-900 font-mono">text-embedding-004 (Gemini)</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-500 font-medium">Dimensions</td>
                          <td className="py-2.5 font-semibold text-slate-900 font-mono">768 dimensions</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-500 font-medium">Distance Metric</td>
                          <td className="py-2.5 font-semibold text-slate-900 font-mono">Cosine Similarity</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-slate-500 font-medium">Workspace / Collection Bound</td>
                          <td className="py-2.5 font-semibold text-slate-900">
                            {document.document_metadata?.collection_id ? 'Yes' : 'Global / Unassigned'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Storage and File details */}
                  <div className="bg-white border border-slate-200 rounded-[8px] p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 mb-4">Storage Information</h3>
                    <table className="w-full text-left text-xs text-slate-850">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-500 font-medium">Storage Provider</td>
                          <td className="py-2.5 font-mono text-slate-900">{document.storage_provider}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2.5 text-slate-500 font-medium">Checksum (SHA256)</td>
                          <td className="py-2.5 font-mono text-[10px] text-slate-900 break-all">{document.checksum}</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-slate-500 font-medium">Storage Path</td>
                          <td className="py-2.5 font-mono text-[10px] text-slate-900 break-all">{document.storage_path}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

function CSVViewer({ content }: { content: string }) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-750 text-xs">
        Empty CSV dataset.
      </div>
    );
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);

  return (
    <div className="flex-1 overflow-auto bg-white scrollbar-thin">
      <table className="w-full text-left border-collapse text-xs select-text">
        <thead>
          <tr className="border-b border-slate-200 bg-[#f9f9f8] sticky top-0 shadow-sm z-10">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-200/50 truncate max-w-[180px]" title={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50 transition-colors">
              {headers.map((_, colIdx) => {
                const cell = row[colIdx] || '';
                return (
                  <td key={colIdx} className="px-4 py-2 text-slate-850 border-r border-slate-100 truncate max-w-[180px]" title={cell}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
