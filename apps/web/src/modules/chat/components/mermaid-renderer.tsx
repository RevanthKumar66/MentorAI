'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MermaidRendererProps {
  code: string;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

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
            htmlLabels: true,
          },
        });
        
        // Create unique ID for rendering
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        
        // Clean code (remove leading/trailing spaces, newlines)
        const cleanCode = code.trim();
        
        const { svg: renderedSvg } = await mermaid.render(id, cleanCode);
        
        if (active) {
          setSvg(renderedSvg);
          setError('');
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (active) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(errMsg || 'Error rendering workflow diagram. Please check Mermaid syntax.');
        }
      }
    };

    renderDiagram();

    return () => {
      active = false;
    };
  }, [code]);

  if (error) {
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
    <div className="my-4 overflow-x-auto flex justify-center bg-white p-4.5 rounded-[12px] border border-slate-200/50 shadow-[0_1px_4px_rgba(0,0,0,0.02)] select-none">
      <div 
        className="w-full max-w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto" 
        ref={containerRef} 
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </div>
  );
};
