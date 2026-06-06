'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Pencil, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../store/chat-store';
import { MermaidRenderer } from './mermaid-renderer';
import { CalloutRenderer } from './callout-renderer';

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
        <code className={className} {...props}>
          {code}
        </code>
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

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
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

  if (!isAssistant) {
    // User message: Aligned to the right, rounded grey bubble
    return (
      <div className="w-full flex flex-col items-end group/msg">
        <div className="flex items-end gap-2 max-w-[75%]">
          <div className="bg-[#ecebea]/80 text-[#1f1f1f] text-[13px] px-4 py-2.5 rounded-[20px] rounded-br-[4px] border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] leading-relaxed whitespace-pre-wrap">
            {isEditing ? (
              <div className="flex flex-col gap-2 min-w-[240px]">
                <textarea
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="w-full text-[13px] bg-transparent border-0 focus:ring-0 p-0 text-[#1f1f1f] focus:outline-none resize-none leading-relaxed font-sans"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-1 pt-1 border-t border-slate-200/30 items-center">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
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
              className="p-1.5 rounded-[6px] hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Copy prompt"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
            
            {onEditMessage && (
              <button
                onClick={() => {
                  setEditVal(message.content);
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-[6px] hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
    <div className="w-full flex gap-4 py-4 group/msg text-left">
      {/* Avatar Icon */}
      <div className="w-8 h-8 rounded-full bg-transparent border border-slate-200 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-none">
        <Image src="/mentorai-symbol-only.svg" alt="MentorAI" width={20} height={20} className="w-5 h-5" />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-slate-400 select-none">
          <span className="text-[12px] font-medium text-slate-600">MentorAI</span>
          {message.model_name && (
            <span className="px-1.5 py-0.5 rounded-[6px] bg-[#f4f3f0] border border-slate-200 text-[9px] text-slate-500 font-mono font-medium lowercase">
              {message.model_name}
            </span>
          )}
        </div>

        <div className={`prose prose-slate max-w-none text-[#1f1f1f] text-[13px] leading-relaxed break-words ${
          message.id === 'streaming-assistant' ? 'streaming-content' : ''
        }`}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3.5 last:mb-0 text-[#1f1f1f]">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-3.5 space-y-1 text-slate-700">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-3.5 space-y-1 text-slate-700">{children}</ol>,
              li: ({ children }) => <li className="text-slate-700">{children}</li>,
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
                  return <MermaidRenderer code={codeText} />;
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
                
                return <blockquote className="border-l-4 border-slate-300 pl-4 my-3 italic text-slate-600">{children}</blockquote>;
              },
              details: ({ children }) => (
                <details className="border border-slate-200 rounded-[8px] bg-slate-50/20 p-3 my-3 [&[open]>summary]:border-b [&[open]>summary]:pb-2 [&[open]>summary]:mb-2 transition-all">
                  {children}
                </details>
              ),
              summary: ({ children }) => (
                <summary className="font-semibold text-xs text-slate-800 cursor-pointer select-none focus:outline-none">
                  {children}
                </summary>
              ),
            }}
          >
            {mainContent}
          </ReactMarkdown>
        </div>

        {/* Action icons below assistant message */}
        <div className="flex items-center gap-1 pt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-[6px] hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          
          <button
            onClick={() => setLiked(liked === true ? null : true)}
            className={`p-1.5 rounded-[6px] hover:bg-slate-100 transition-colors cursor-pointer ${liked === true ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'}`}
            title="Good response"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setLiked(liked === false ? null : false)}
            className={`p-1.5 rounded-[6px] hover:bg-slate-100 transition-colors cursor-pointer ${liked === false ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'}`}
            title="Bad response"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        {isAssistant && suggestions.length > 0 && (
          <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-100 select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Suggested follow-ups</span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onClickSuggestion && onClickSuggestion(suggestion)}
                  className="px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-[12px] font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer text-left leading-snug"
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
