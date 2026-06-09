'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '@/modules/documents/store/workspace-store';
import { collectionApi } from '@/modules/documents/services/collection-api';
import { Copy, Check, Download, FileText, Maximize2, X } from 'lucide-react';

interface MermaidRendererProps {
  code: string;
  isStreaming?: boolean;
}

const preprocessMermaidCode = (code: string): string => {
  let processed = code;
  
  // 1. Match double brackets first to prevent partial matching:
  
  // Match double brackets like ID([content])
  processed = processed.replace(/(^|[\s;>-])([a-zA-Z0-9_-]+)\s*\(\[([^\]\r\n]+)\]\)/g, (match, prefix, id, content) => {
    if (content.startsWith('"') && content.endsWith('"')) return match;
    const clean = content.replace(/"/g, "'");
    return `${prefix}${id}(["${clean}"])`;
  });

  // Match double brackets like ID((content))
  processed = processed.replace(/(^|[\s;>-])([a-zA-Z0-9_-]+)\s*\(\(([^)\r\n]+)\)\)/g, (match, prefix, id, content) => {
    if (content.startsWith('"') && content.endsWith('"')) return match;
    const clean = content.replace(/"/g, "'");
    return `${prefix}${id}(("${clean}"))`;
  });

  // Match double brackets like ID[[content]]
  processed = processed.replace(/(^|[\s;>-])([a-zA-Z0-9_-]+)\s*\[\[([^\]\r\n]+)\]\]/g, (match, prefix, id, content) => {
    if (content.startsWith('"') && content.endsWith('"')) return match;
    const clean = content.replace(/"/g, "'");
    return `${prefix}${id}[["${clean}"]]`;
  });

  // 2. Match single brackets with negative lookahead:

  // Match ID[content] -> content cannot contain ]
  processed = processed.replace(/(^|[\s;>-])([a-zA-Z0-9_-]+)\s*\[(?!\[)([^\]\r\n]+)\](?!\])/g, (match, prefix, id, content) => {
    if (content.startsWith('"') && content.endsWith('"')) return match;
    const clean = content.replace(/"/g, "'");
    return `${prefix}${id}["${clean}"]`;
  });
  
  // Match ID(content) -> content cannot contain )
  // We use (?![\(\[]) to ensure the opening parenthesis is not followed by another ( or a [ (as in ([...]))
  processed = processed.replace(/(^|[\s;>-])([a-zA-Z0-9_-]+)\s*\((?![\(\[])([^)\r\n]+)\)(?!\))/g, (match, prefix, id, content) => {
    if (content.startsWith('"') && content.endsWith('"')) return match;
    const clean = content.replace(/"/g, "'");
    return `${prefix}${id}(" ${clean} ")`.replace('" ', '"').replace(' "', '"');
  });
  
  // Match ID{content} -> content cannot contain }
  processed = processed.replace(/(^|[\s;>-])([a-zA-Z0-9_-]+)\s*\{(?!\{)([^}\r\n]+)\}(?!\})/g, (match, prefix, id, content) => {
    if (content.startsWith('"') && content.endsWith('"')) return match;
    const clean = content.replace(/"/g, "'");
    return `${prefix}${id}{"${clean}"}`;
  });

  return processed;
};

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, isStreaming = false }) => {
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [isCapped, setIsCapped] = useState(false);

  // Clipboard & Download States
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [copiedPng, setCopiedPng] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);
  const [noteStatusMsg, setNoteStatusMsg] = useState('');

  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  // Measure if the diagram height exceeds the max-height limit in the feed
  useEffect(() => {
    if (feedContainerRef.current) {
      const { scrollHeight, clientHeight } = feedContainerRef.current;
      setIsCapped(scrollHeight > clientHeight);
    }
  }, [svg]);

  useEffect(() => {
    let active = true;
    
    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          flowchart: {
            htmlLabels: false,
          },
        });
        
        // Suppress default parse error logging on the instance
        try {
          (mermaid as unknown as { parseError?: (...args: unknown[]) => void }).parseError = () => {};
        } catch {
          // ignore if read-only property
        }
        
        // Create unique ID for rendering
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        
        // Clean and preprocess code to wrap invalid unquoted labels in quotes
        const cleanCode = preprocessMermaidCode(code.trim());
        
        // Pre-validate diagram syntax before calling render.
        // This avoids throwing unhandled promise exceptions from render midway.
        await mermaid.parse(cleanCode);
        
        const { svg: renderedSvg } = await mermaid.render(id, cleanCode);
        
        if (active) {
          setSvg(renderedSvg);
          setError('');
        }
      } catch (err) {
        if (isStreaming) {
          // During streaming, syntax errors are expected and temporary. Log quietly as warning.
          console.warn('Mermaid rendering draft during stream (normal):', err instanceof Error ? err.message : err);
        } else {
          console.error('Mermaid render error:', err);
          if (active) {
            const errMsg = err instanceof Error ? err.message : String(err);
            setError(errMsg || 'Error rendering workflow diagram. Please check Mermaid syntax.');
          }
        }
      }
    };

    renderDiagram();

    return () => {
      active = false;
    };
  }, [code, isStreaming]);

  // Copy SVG XML code
  const handleCopySvg = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(svg);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    } catch (err) {
      console.error('Failed to copy SVG text:', err);
    }
  };

  // Copy Diagram as PNG Image to Clipboard
  const handleCopyPng = (e: React.MouseEvent) => {
    e.stopPropagation();
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1024;
        canvas.height = img.naturalHeight || 768;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; // White background for copied PNG
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (pngBlob) => {
            if (pngBlob) {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': pngBlob })
                ]);
                setCopiedPng(true);
                setTimeout(() => setCopiedPng(false), 2000);
              } catch (clipErr) {
                console.error('Clipboard image write failed:', clipErr);
              }
            }
          }, 'image/png');
        }
      } catch (err) {
        console.error('Error drawing SVG to canvas for copy:', err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  // Download SVG file
  const handleDownloadSvg = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagram-${Math.random().toString(36).substring(2, 6)}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading SVG:', err);
    }
  };

  // Download PNG file
  const handleDownloadPng = (e: React.MouseEvent) => {
    e.stopPropagation();
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1024;
        canvas.height = img.naturalHeight || 768;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `diagram-${Math.random().toString(36).substring(2, 6)}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch (err) {
        console.error('Error downloading PNG:', err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  // Save Diagram to Workspace Notes
  const handleAddToNotes = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeWorkspaceId) return;
    try {
      setNoteStatusMsg('Saving note...');
      let title = 'Workflow Diagram';
      const titleMatch = /title:\s*(.*)/.exec(code);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      } else {
        title = `Workflow Diagram - ${new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      }

      const content = `# ${title}\n\nThis workflow diagram was saved from your chat workspace.\n\n\`\`\`mermaid\n${code.trim()}\n\`\`\`\n`;

      await collectionApi.createNote(activeWorkspaceId, {
        title,
        content
      });

      setSavedToNotes(true);
      setNoteStatusMsg('Saved to Workspace Notes!');
      setTimeout(() => {
        setSavedToNotes(false);
        setNoteStatusMsg('');
      }, 3000);
    } catch (err) {
      console.error('Failed to save diagram note:', err);
      setNoteStatusMsg('Failed to save note');
      setTimeout(() => setNoteStatusMsg(''), 3000);
    }
  };

  if (error && !isStreaming) {
    return (
      <div className="bg-rose-50/50 border border-rose-200/60 p-3.5 rounded-[8px] my-3.5 text-rose-700 text-xs font-mono whitespace-pre-wrap select-text">
        <div className="font-bold mb-1">Diagram Render Error:</div>
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="w-full flex items-center justify-center py-6 bg-slate-50/30 border border-slate-200/40 rounded-[8px] my-3.5 select-none animate-pulse">
        <span className="text-[11px] font-medium text-slate-400 font-sans">Generating workflow diagram...</span>
      </div>
    );
  }

  return (
    <>
      {/* Left-aligned wrapper with dynamic width container */}
      <div className="w-full flex justify-start my-3.5">
        <div 
          className="relative group/diagram border border-slate-200/60 rounded-[12px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.015)] overflow-hidden select-none hover:border-slate-350 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all cursor-pointer w-fit max-w-full"
          onClick={() => setIsZoomed(true)}
        >
          {/* Floating actions menu on hover */}
          <div 
            className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-0 group-hover/diagram:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-[8px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()} // prevent triggering zoom
          >
            <button
              onClick={handleCopySvg}
              className="p-1.5 rounded-[6px] hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              title="Copy SVG XML"
            >
              {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownloadSvg}
              className="p-1.5 rounded-[6px] hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              title="Download SVG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {activeWorkspaceId && (
              <button
                onClick={handleAddToNotes}
                className="p-1.5 rounded-[6px] hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                title="Save to Workspace Notes"
              >
                {savedToNotes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={() => setIsZoomed(true)}
              className="p-1.5 rounded-[6px] hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              title="Zoom/Expand"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scaled/capped rendering in feed - using p-4 for equal minimal padding on all 4 sides */}
          <div 
            ref={feedContainerRef}
            className="p-4 flex justify-center max-h-[380px] overflow-hidden relative w-fit max-w-full"
          >
            <div 
              className="w-fit max-w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:block" 
              dangerouslySetInnerHTML={{ __html: svg }} 
            />
            {isCapped && (
              /* Fade gradient at the bottom to indicate click zoom */
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-1">
                <span className="text-[9px] font-semibold text-slate-400 select-none group-hover/diagram:text-slate-700 transition-colors">
                  Click diagram to zoom & export
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightroom Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/40 backdrop-blur-md items-center justify-center p-6 select-none"
          onClick={() => setIsZoomed(false)}
        >
          {/* Modal Container */}
          <div 
            className="w-full max-w-5xl bg-white rounded-[16px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Actions bar */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">Workflow Diagram</span>
                {noteStatusMsg && (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-100">
                    {noteStatusMsg}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Copy SVG */}
                <button
                  onClick={handleCopySvg}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                  title="Copy SVG source XML"
                >
                  {copiedSvg ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  Copy SVG
                </button>

                {/* Copy Image */}
                <button
                  onClick={handleCopyPng}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                  title="Copy diagram as PNG image to clipboard"
                >
                  {copiedPng ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  Copy Image
                </button>

                {/* Download SVG */}
                <button
                  onClick={handleDownloadSvg}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Download SVG
                </button>

                {/* Download PNG */}
                <button
                  onClick={handleDownloadPng}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Download PNG
                </button>

                {/* Save to Notes */}
                {activeWorkspaceId && (
                  <button
                    onClick={handleAddToNotes}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                  >
                    {savedToNotes ? <Check className="w-3 h-3 text-emerald-600" /> : <FileText className="w-3 h-3" />}
                    Save to Notes
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 rounded-[6px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Diagram Board */}
            <div className="p-8 overflow-auto flex items-center justify-center bg-slate-50/30 flex-1 min-h-0 select-text">
              <div 
                className="max-w-full max-h-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto bg-white p-6 rounded-[12px] border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)]"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
