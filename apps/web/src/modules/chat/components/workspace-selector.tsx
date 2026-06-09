'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/modules/documents/store/workspace-store';
import { ChevronDown, Folder, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const WorkspaceSelector: React.FC = () => {
  const router = useRouter();
  const { activeWorkspaceId, setActiveWorkspaceId, collections } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeWorkspace = collections.find((c) => c.id === activeWorkspaceId);

  const handleSelect = (id: string | null) => {
    setActiveWorkspaceId(id);
    setIsOpen(false);
    if (id) {
      router.push(`/workspaces/${id}`);
    } else {
      router.push('/chat');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] hover:bg-[#ecebea]/60 text-slate-800 text-xs font-bold transition-all border border-transparent hover:border-slate-200 select-none shadow-none cursor-pointer"
      >
        {activeWorkspace ? (
          <>
            <Folder className="w-3.5 h-3.5" style={{ color: activeWorkspace.color || '#64748B' }} />
            <span className="truncate max-w-[150px]">{activeWorkspace.name}</span>
          </>
        ) : (
          <>
            <Globe className="w-3.5 h-3.5 text-slate-600" />
            <span>Global Context</span>
          </>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-300 rounded-[6px] shadow-md py-1.5 z-50">
          <div className="px-3 py-1 text-xs font-semibold text-slate-800 select-none">
            Active Workspace
          </div>
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-[#f4f3f0] hover:text-slate-950 flex items-center gap-2 cursor-pointer ${
              !activeWorkspaceId ? 'bg-[#ecebea]/40 text-slate-900 font-bold' : 'text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-slate-600" />
            Global Context (All files)
          </button>
          
          <div className="border-t border-slate-200 my-1" />
          
          {collections.map((w) => (
            <button
              key={w.id}
              onClick={() => handleSelect(w.id)}
              className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-[#f4f3f0] hover:text-slate-950 flex items-center gap-2 cursor-pointer ${
                w.id === activeWorkspaceId ? 'bg-[#ecebea]/40 text-slate-900 font-bold' : 'text-slate-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5" style={{ color: w.color || '#64748B' }} />
              <span className="truncate">{w.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
