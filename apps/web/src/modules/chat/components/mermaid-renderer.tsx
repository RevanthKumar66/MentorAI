'use client';

import React, { useEffect, useRef, useState } from 'react';

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
    return `${prefix}${id}("${clean}")`;
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
    <div className="my-4 overflow-x-auto flex justify-center bg-white p-4.5 rounded-[12px] border border-slate-200/50 shadow-[0_1px_4px_rgba(0,0,0,0.02)] select-none">
      <div 
        className="w-full max-w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto" 
        ref={containerRef} 
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </div>
  );
};
