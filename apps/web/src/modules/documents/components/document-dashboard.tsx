import React, { useState, useEffect } from 'react';
import { useDocuments } from '../hooks/use-documents';
import { UploadQueue } from './upload-queue';
import { 
  FileText, Database, Code2, BookOpen, Table, Presentation, 
  Trash2, Download, Search, UploadCloud, ChevronLeft, ChevronRight,
  FolderOpen, AlertCircle, FileText as FileIcon, Calendar, HardDrive,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export const DocumentDashboard: React.FC = () => {
  const {
    documents,
    total,
    page,
    limit,
    searchQuery,
    selectedCategory,
    isLoading,
    isError,
    error,
    setPage,
    setSearchQuery,
    setSelectedCategory,
    uploadFiles,
    deleteDocument,
    downloadDocument,
  } = useDocuments();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isDragging, setIsDragging] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput, setSearchQuery]);

  // Sync state if changed externally
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      uploadFiles(filesArray);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      uploadFiles(filesArray);
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Mapped Category definitions
  const categories = [
    { value: '', label: 'All Files', icon: FolderOpen },
    { value: 'document', label: 'Documents', icon: FileText },
    { value: 'dataset', label: 'Datasets', icon: Database },
    { value: 'code', label: 'Source Code', icon: Code2 },
    { value: 'notebook', label: 'Notebooks', icon: BookOpen },
    { value: 'spreadsheet', label: 'Spreadsheets', icon: Table },
    { value: 'presentation', label: 'Presentations', icon: Presentation },
  ];

  // Helper to resolve icon by category
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'document': return FileText;
      case 'dataset': return Database;
      case 'code': return Code2;
      case 'notebook': return BookOpen;
      case 'spreadsheet': return Table;
      case 'presentation': return Presentation;
      default: return FileIcon;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div 
      className="flex-1 flex flex-col h-full bg-white text-[#1f1f1f] relative min-w-0"
      onDragOver={handleDragOver}
    >
      {/* Drag overlay backdrop */}
      {isDragging && (
        <div 
          className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center border-2 border-dashed border-[#dcdad6] m-4 rounded-[6px] transition-all backdrop-blur-sm"
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-[6px] bg-[#f4f3f0] border border-slate-200 flex items-center justify-center text-slate-800">
              <UploadCloud className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">Drop files to upload</h3>
              <p className="text-[11px] text-slate-500 mt-1">Supports PDFs, Notebooks, CSVs, Scripts and more</p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar / Header */}
      <header className="px-8 py-4 border-b border-[#e5e5e5] bg-[#fcfbf9]/90 backdrop-blur-md shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900">
            Document Explorer
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Secure production file workspace for datasets, scripts, and notes. Max 100 MB.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Navigate back to chat */}
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-600 hover:text-slate-900 transition-colors font-semibold"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Back to Chat
          </Link>

          {/* Upload Button Trigger */}
          <label className="flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-slate-900 hover:bg-black text-xs text-white font-semibold cursor-pointer transition-colors">
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Files
            <input 
              type="file" 
              multiple 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Category Filters */}
        <section className="w-full md:w-56 border-b md:border-b-0 md:border-r border-[#e5e5e5] p-4 shrink-0 flex flex-row md:flex-col gap-0.5 overflow-x-auto md:overflow-x-visible scrollbar-none bg-[#f9f9f8]">
          <span className="hidden md:block text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2.5 mb-2">
            Categories
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.value;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium transition-colors border shrink-0 md:shrink ${
                  isActive
                    ? 'bg-[#ecebea] text-slate-900 border-[#dcdad6]'
                    : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-[#ecebea]/55'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-800' : 'text-slate-400'}`} />
                {cat.label}
              </button>
            );
          })}
        </section>

        {/* Right Listing Section */}
        <section className="flex-1 flex flex-col overflow-hidden p-6 gap-6 bg-white">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search documents by name..."
                className="w-full bg-white border border-slate-200 rounded-[6px] py-1.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
              />
            </div>
          </div>

          {/* List display */}
          <div className="flex-1 overflow-y-auto bg-white border border-[#e5e5e5] rounded-[6px] overflow-hidden flex flex-col min-h-0 scrollbar-thin">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
                <span className="text-[10px] font-medium text-slate-500">Loading files...</span>
              </div>
            ) : isError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 px-6 text-center">
                <AlertCircle className="w-6 h-6 text-rose-500/80" />
                <h3 className="text-xs font-bold text-slate-800">Failed to load documents</h3>
                <p className="text-[10px] text-slate-400">{error?.message || 'Check database connectivity.'}</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 px-6 text-center">
                <div className="w-10 h-10 rounded-[6px] bg-[#f4f3f0] border border-slate-200/60 flex items-center justify-center text-slate-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">No files found</h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {searchQuery || selectedCategory 
                      ? 'No files match your search or filter criteria.'
                      : 'Drag & drop files or click Upload to start.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 justify-between">
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#e5e5e5] text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-[#fcfbf9]">
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3 hidden sm:table-cell">Size</th>
                        <th className="px-6 py-3 hidden md:table-cell">Uploaded</th>
                        <th className="px-6 py-3 hidden lg:table-cell">Checksum</th>
                        <th className="px-6 py-3 text-right pr-8">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {documents.map((doc) => {
                        const Icon = getCategoryIcon(doc.category);
                        return (
                          <tr 
                            key={doc.id}
                            className="group hover:bg-[#fcfbf9] transition-colors"
                          >
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-[6px] bg-[#f4f3f0] border border-slate-200/60 flex items-center justify-center text-slate-500 group-hover:text-slate-800 transition-colors shrink-0">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate pr-4" title={doc.original_file_name}>
                                    {doc.original_file_name}
                                  </p>
                                  <span className="inline-flex sm:hidden text-[9px] font-medium text-slate-400 mt-0.5">
                                    {formatBytes(doc.file_size)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-xs text-slate-500 hidden sm:table-cell">
                              {formatBytes(doc.file_size)}
                            </td>
                            <td className="px-6 py-3 text-[10px] text-slate-500 hidden md:table-cell">
                              <div className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(doc.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-[10px] text-slate-400 font-mono hidden lg:table-cell">
                              {doc.checksum.substring(0, 8)}...{doc.checksum.substring(doc.checksum.length - 8)}
                            </td>
                            <td className="px-6 py-3 text-right pr-8 shrink-0">
                              <div className="inline-flex gap-1.5">
                                <button
                                  onClick={() => downloadDocument(doc.id, doc.original_file_name)}
                                  className="p-1.5 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete '${doc.original_file_name}'?`)) {
                                      deleteDocument(doc.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-[6px] border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Delete File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <footer className="px-6 py-3 border-t border-[#e5e5e5] flex items-center justify-between text-xs text-slate-500 bg-[#fcfbf9]/40 shrink-0">
                    <span>
                      Page <strong className="text-slate-700">{page}</strong> of <strong className="text-slate-700">{totalPages}</strong> ({total} files)
                    </span>
                    <div className="inline-flex gap-1.5">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="p-1 rounded-[6px] border border-slate-200 bg-white disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="p-1 rounded-[6px] border border-slate-200 bg-white disabled:opacity-40 disabled:hover:bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </footer>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Reactive Upload Progress widget */}
      <UploadQueue />
    </div>
  );
};
