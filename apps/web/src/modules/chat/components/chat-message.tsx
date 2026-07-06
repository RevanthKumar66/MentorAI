'use client';

import React, { useState, useEffect, useRef, startTransition } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Pencil, Send } from 'lucide-react';

/* ── outlined→filled icon helpers for message actions ── */
const CopyIconSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* outlined — hidden on hover */}
    <g className="group-hover/action:hidden">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </g>
    {/* filled — hidden at rest */}
    <g className="hidden group-hover/action:block">
      <rect x="9" y="9" width="13" height="13" rx="2" fill="currentColor" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

const ThumbUpSVG = ({ active, className }: { active: boolean; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <path fill="currentColor" d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14ZM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3v11Z"/>
    ) : (
      <>
        <g className="group-hover/action:hidden">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </g>
        <g className="hidden group-hover/action:block">
          <path fill="currentColor" d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14ZM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3v11Z" />
        </g>
      </>
    )}
  </svg>
);

const ThumbDownSVG = ({ active, className }: { active: boolean; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {active ? (
      <path fill="currentColor" d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10ZM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17V2Z"/>
    ) : (
      <>
        <g className="group-hover/action:hidden">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </g>
        <g className="hidden group-hover/action:block">
          <path fill="currentColor" d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10ZM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17V2Z" />
        </g>
      </>
    )}
  </svg>
);
import { ChatMessage as ChatMessageType } from '../store/chat-store';
import { MermaidRenderer } from './mermaid-renderer';
import { CalloutRenderer } from './callout-renderer';
import { SourcesPanel } from './sources-panel';

import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';

interface ChatMessageProps {
  message: ChatMessageType;
  onEditMessage?: (content: string) => void;
  onClickSuggestion?: (content: string) => void;
}

// Extract follow-up questions from response content
const parseMessageContent = (content: string) => {
  const splitMarker = '## Suggested Follow-up Questions';
  const parts = content.split(splitMarker);
  if (parts.length > 1) {
    const mainContent = parts[0].trim();
    const suggestionsText = parts[1].trim();
    
    // Parse bullets like "* question" or "- question"
    const suggestions = suggestionsText
      .split('\n')
      .map(line => line.replace(/^[\s*-]+/, '').trim())
      .filter(line => line.length > 0);
      
    return { mainContent, suggestions };
  }
  return { mainContent: content, suggestions: [] };
};

// Hook to type out content smoothly when streaming
const useTypingEffect = (content: string, isStreaming: boolean, speed: number = 8) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const currentContentRef = useRef('');
  const targetContentRef = useRef(content);

  useEffect(() => {
    targetContentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!isStreaming) {
      startTransition(() => {
        setDisplayedContent(content);
      });
      currentContentRef.current = content;
      return;
    }

    let timer: NodeJS.Timeout | null = null;

    const typeNext = () => {
      const current = currentContentRef.current;
      const target = targetContentRef.current;

      if (current === target) {
        return;
      }

      if (!target.startsWith(current)) {
        // Reset or jump if the target string has changed shape completely
        setDisplayedContent(target);
        currentContentRef.current = target;
        return;
      }

      // Append characters with lag catchup
      const diff = target.length - current.length;
      let charsToAppend = 1;
      if (diff > 50) charsToAppend = 3;
      if (diff > 150) charsToAppend = 10;
      if (diff > 300) charsToAppend = diff;

      const nextContent = current + target.substring(current.length, current.length + charsToAppend);
      setDisplayedContent(nextContent);
      currentContentRef.current = nextContent;

      timer = setTimeout(typeNext, speed);
    };

    typeNext();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [content, isStreaming, speed]);

  return displayedContent;
};

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  code: string;
  className?: string;
}

const CodeBlock = ({ code, className, ...props }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = (className || 'code').replace('language-', '');

  const highlighted = React.useMemo(() => {
    try {
      const langObj = Prism.languages[language];
      if (langObj) {
        return Prism.highlight(code, langObj, language);
      }
      // Try fallback to javascript
      const jsLang = Prism.languages.javascript;
      if (jsLang) {
        return Prism.highlight(code, jsLang, 'javascript');
      }
    } catch (e) {
      console.error('Prism highlighting error:', e);
    }
    return code; // raw code fallback
  }, [code, language]);

  return (
    <div className="relative group/code my-4 rounded-[8px] overflow-hidden border border-slate-800">
      <div className="flex items-center justify-between bg-[#0b0e17] px-4 py-2 border-b border-slate-800 text-[10px] text-slate-500 font-mono select-none">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-[#0f1424] p-4 overflow-x-auto font-mono text-[11px] text-slate-300 leading-relaxed scrollbar-thin">
        <code 
          className={className} 
          dangerouslySetInnerHTML={{ __html: highlighted }}
          {...props}
        />
      </pre>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEditMessage, onClickSuggestion }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(message.content);
  const messageRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      const plainText = message.content;
      if (isAssistant && messageRef.current) {
        const htmlContent = messageRef.current.innerHTML;
        if (typeof ClipboardItem !== 'undefined') {
          const blobHtml = new Blob([htmlContent], { type: 'text/html' });
          const blobText = new Blob([plainText], { type: 'text/plain' });
          const data = [
            new ClipboardItem({
              'text/html': blobHtml,
              'text/plain': blobText,
            })
          ];
          await navigator.clipboard.write(data);
        } else {
          await navigator.clipboard.writeText(plainText);
        }
      } else {
        await navigator.clipboard.writeText(plainText);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      try {
        await navigator.clipboard.writeText(message.content);
      } catch (e) {
        console.error('Fallback copy failed: ', e);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSubmit = () => {
    if (onEditMessage && editVal.trim() && editVal.trim() !== message.content) {
      onEditMessage(editVal.trim());
    }
    setIsEditing(false);
  };

  const { mainContent, suggestions } = parseMessageContent(message.content);
  const isStreaming = message.id === 'streaming-assistant';
  const typedMainContent = useTypingEffect(mainContent, isStreaming);

  if (!isAssistant) {
    // User message: Aligned to the right, rounded grey bubble
    return (
      <div className="w-full flex flex-col items-end group/msg">
        <div className="flex items-end gap-2 max-w-[88%] md:max-w-[75%]">
          <div className="bg-[#ecebea] text-[#1f1f1f] text-[13px] px-3.5 md:px-4 py-2 md:py-2.5 rounded-[18px] md:rounded-[20px] rounded-br-[4px] border border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] leading-relaxed whitespace-pre-wrap">
            {isEditing ? (
              <div className="flex flex-col gap-2 min-w-[240px]">
                <textarea
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="w-full text-[13px] bg-transparent border-0 focus:ring-0 p-0 text-[#1f1f1f] focus:outline-none resize-none leading-relaxed font-sans"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-1 pt-1 border-t border-slate-300 items-center">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[11px] text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    disabled={!editVal.trim() || editVal.trim() === message.content}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                      editVal.trim() && editVal.trim() !== message.content
                        ? 'bg-slate-900 text-white hover:bg-black'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title="Send"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              message.content
            )}
          </div>
        </div>
        
        {/* Actions below the user bubble (visible on hover) */}
        {!isEditing && (
          <div className="flex items-center gap-1 mt-1 mr-1 opacity-0 group-hover/msg:opacity-100 transition-opacity justify-end">
            <button
              onClick={handleCopy}
              className="group/action p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Copy prompt"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <CopyIconSVG className="w-3 h-3" />}
            </button>
            
            {onEditMessage && (
              <button
                onClick={() => {
                  setEditVal(message.content);
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-[6px] hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                title="Edit prompt"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Assistant message: Aligned to the left, plain text, with action buttons below
  return (
    <div className="w-full flex gap-2.5 md:gap-4 py-2.5 md:py-4 group/msg text-left">
      {/* Avatar Icon */}
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-transparent border border-slate-350 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-none">
        <Image src="/mentorai-symbol-only.svg" alt="MentorAI" width={18} height={18} className="w-4 h-4 md:w-5 md:h-5" />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-slate-700 select-none">
          <span className="text-[12px] font-semibold text-slate-900 font-sans">MentorAI</span>
          {message.model_name && (
            <span className="px-1.5 py-0.5 rounded-[6px] bg-[#f4f3f0] border border-slate-300 text-[9px] text-slate-700 font-mono font-semibold lowercase">
              {message.model_name}
            </span>
          )}
        </div>

        <div 
          ref={messageRef}
          className={`prose prose-slate max-w-none text-[#1f1f1f] text-[13px] leading-relaxed break-words ${
            message.id === 'streaming-assistant' ? 'streaming-content' : ''
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-3.5 last:mb-0 text-[#1f1f1f]">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-3.5 space-y-1 text-[#1f1f1f]">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-3.5 space-y-1 text-[#1f1f1f]">{children}</ol>,
              li: ({ children }) => <li className="text-[#1f1f1f]">{children}</li>,
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                if (isInline) {
                  return (
                    <code className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded-[4px] text-[11.5px] font-mono font-medium" {...props}>
                      {children}
                    </code>
                  );
                }

                const language = match[1];
                const codeText = String(children);

                if (language === 'mermaid') {
                  return <MermaidRenderer code={codeText} isStreaming={isStreaming} />;
                }

                return (
                  <CodeBlock code={codeText} className={className} {...props} />
                );
              },
              table: ({ children }) => <table className="w-full text-left border-collapse border border-slate-200 my-3 rounded-[6px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">{children}</table>,
              th: ({ children }) => <th className="bg-[#f4f3f0] p-2.5 font-bold text-xs border border-slate-200 text-slate-800">{children}</th>,
              td: ({ children }) => <td className="p-2.5 text-xs border border-slate-200 text-slate-700 bg-white">{children}</td>,
              h1: ({ children }) => <h1 className="text-base font-bold text-slate-900 mb-2 mt-4 first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 mb-2 mt-4 first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xs font-bold text-slate-900 mb-1 mt-3 first:mt-0">{children}</h3>,
              blockquote: ({ children }) => {
                const textContent = React.Children.toArray(children)
                  .map(child => {
                    if (typeof child === 'string') return child;
                    if (React.isValidElement(child)) {
                      const element = child as React.ReactElement<{ children?: React.ReactNode }>;
                      if (element.props && element.props.children) {
                        return React.Children.toArray(element.props.children).join('');
                      }
                    }
                    return '';
                  })
                  .join('');
                  
                const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.exec(textContent.trim());
                if (match) {
                  const type = match[1];
                  // Remove the [!NOTE] marker from children
                  const cleanedChildren = React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                      const element = child as React.ReactElement<{ children?: React.ReactNode }>;
                      if (element.props && element.props.children) {
                        const subChildren = React.Children.toArray(element.props.children);
                        if (subChildren.length > 0 && typeof subChildren[0] === 'string') {
                          const firstText = subChildren[0];
                          const cleanedText = firstText.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, '').trim();
                          return React.cloneElement(element, {}, cleanedText, ...subChildren.slice(1));
                        }
                      }
                    }
                    return child;
                  });
                  return <CalloutRenderer type={type}>{cleanedChildren}</CalloutRenderer>;
                }
                
                return <blockquote className="border-l-4 border-slate-300 pl-4 my-3 italic text-slate-800">{children}</blockquote>;
              },
              details: ({ children }) => (
                <details className="border border-slate-300 rounded-[8px] bg-slate-50 p-3 my-3 [&[open]>summary]:border-b [&[open]>summary]:pb-2 [&[open]>summary]:mb-2 transition-all">
                  {children}
                </details>
              ),
              summary: ({ children }) => (
                <summary className="font-semibold text-xs text-slate-900 cursor-pointer select-none focus:outline-none">
                  {children}
                </summary>
              ),
            }}
          >
            {typedMainContent}
          </ReactMarkdown>
        </div>

        {isAssistant && message.citations && message.citations.length > 0 && (
          <SourcesPanel citations={message.citations} />
        )}

        {/* Action icons below assistant message */}
        <div className="flex items-center gap-0.5 pt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="group/action p-1.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Copy message"
          >
            {copied
              ? <Check className="w-3.5 h-3.5 text-emerald-600" />
              : <CopyIconSVG className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setLiked(liked === true ? null : true)}
            className={`group/action p-1.5 transition-colors cursor-pointer ${
              liked === true ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Good response"
          >
            <ThumbUpSVG active={liked === true} className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setLiked(liked === false ? null : false)}
            className={`group/action p-1.5 transition-colors cursor-pointer ${
              liked === false ? 'text-rose-500' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Bad response"
          >
            <ThumbDownSVG active={liked === false} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        {isAssistant && suggestions.length > 0 && (
          <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-200 select-none">
            <span className="text-[10px] font-semibold text-slate-700 tracking-wide">Suggested Follow-ups</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onClickSuggestion && onClickSuggestion(suggestion)}
                  className="px-3.5 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-800 hover:text-slate-950 text-[12px] font-semibold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer text-left leading-snug"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
