import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Paperclip, FileText, X, ChevronDown,
  Code, Search, Briefcase, Sparkles,
  GraduationCap, GitFork, BarChart3
} from 'lucide-react';

/* ─── Safe cross-browser SpeechRecognition helper ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

function getSpeechRecognition(): (new () => AnySpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w['SpeechRecognition'] || w['webkitSpeechRecognition'] || null) as
    | (new () => AnySpeechRecognition)
    | null;
}

const roleLabels: Record<string, string> = {
  general: 'General Assistant',
  learning: 'Learning Mentor',
  coding: 'Coding Assistant',
  dsa: 'DSA Coach',
  research: 'Research Analyst',
  career: 'Career Advisor',
  datascience: 'Data Scientist',
  document: 'Document Assistant'
};

const roleIcons: Record<string, React.ReactNode> = {
  general: <Sparkles className="w-3 h-3 shrink-0 text-slate-700" />,
  learning: <GraduationCap className="w-3 h-3 shrink-0 text-slate-700" />,
  coding: <Code className="w-3 h-3 shrink-0 text-slate-700" />,
  dsa: <GitFork className="w-3 h-3 shrink-0 text-slate-700" />,
  research: <Search className="w-3 h-3 shrink-0 text-slate-700" />,
  career: <Briefcase className="w-3 h-3 shrink-0 text-slate-700" />,
  datascience: <BarChart3 className="w-3 h-3 shrink-0 text-slate-700" />,
  document: <FileText className="w-3 h-3 shrink-0 text-slate-700" />
};

const modelLabels: Record<string, string> = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Lite'
};

/* ─────────────────────────── custom SVG icons ──────────────────────────── */

/** Mic icon:
 * - outlined at rest (black strokes)
 * - filled blue on hover (controlled via group-hover/mic on parent button)
 * - red pulsing circle (recording active state) when recording=true
 */
const MicIcon = ({ recording, className }: { recording: boolean; className?: string }) =>
  recording ? (
    /* Red circle with stop square — recording active */
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="white" />
    </svg>
  ) : (
    /* Outlined at rest, filled blue on parent group-hover/mic */
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outlined — visible at rest, hidden on hover */}
      <g className="group-hover/mic:hidden">
        <rect x="9" y="1" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </g>
      {/* Filled blue — shown on hover */}
      <g className="hidden group-hover/mic:block">
        <rect x="9" y="1" width="6" height="11" rx="3" fill="#2563EB"/>
        <path d="M5 10a7 7 0 0 0 14 0" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12" y2="21" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="8" y1="21" x2="16" y2="21" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/>
      </g>
    </svg>
  );

/* ─────────────────────────── interfaces ────────────────────────────────── */

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled: boolean;
  modelName: string;
  activeSessionId?: string;
  currentRole?: string;
  onUpdateRole?: (role: string) => void;
  onUpdateModel?: (model: string) => void;
  inputDraft?: string;
  onClearDraft?: () => void;
}

interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'text' | 'other';
  size: string;
  dataUrl?: string;
  content?: string;
  file: File;
}

/* ─────────────────────────── component ─────────────────────────────────── */

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled, 
  modelName,
  activeSessionId,
  currentRole,
  onUpdateRole,
  onUpdateModel,
  inputDraft,
  onClearDraft
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  /* ── voice state ── */
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<AnySpeechRecognition>(null);

  /* ── draft injection ── */
  useEffect(() => {
    if (inputDraft) {
      const timer = setTimeout(() => {
        setText(inputDraft);
        if (onClearDraft) onClearDraft();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [inputDraft, onClearDraft]);

  /* ── close dropdowns on outside click ── */
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  /* ── auto-resize textarea ── */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const computedHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(computedHeight, 24), 200);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = computedHeight > 200 ? 'auto' : 'hidden';
  }, [text]);

  /* ── helpers ── */
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const addFileAttachment = (file: File) => {
    const id = Math.random().toString(36).substring(7);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAttachments((prev) => [...prev, { id, name: file.name, type: 'image', size: formatBytes(file.size), dataUrl, file }]);
      };
      reader.readAsDataURL(file);
    } else if (
      file.type.startsWith('text/') ||
      ['.js','.ts','.tsx','.jsx','.py','.json','.css','.html','.md','.yaml','.yml','.toml','.ini']
        .some(ext => file.name.endsWith(ext))
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setAttachments((prev) => [...prev, { id, name: file.name, type: 'text', size: formatBytes(file.size), content, file }]);
      };
      reader.readAsText(file);
    } else {
      setAttachments((prev) => [...prev, { id, name: file.name, type: 'other', size: formatBytes(file.size), file }]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) addFileAttachment(files[i]);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    let hasFiles = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        hasFiles = true;
        const file = item.getAsFile();
        if (file) addFileAttachment(file);
      }
    }
    if (hasFiles) e.preventDefault();
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleSubmit = () => {
    // Merge interim voice transcript if present
    const fullText = interimTranscript
      ? (text ? text + ' ' + interimTranscript : interimTranscript).trim()
      : text;

    if ((!fullText.trim() && attachments.length === 0) || disabled) return;

    let finalContent = fullText;
    if (attachments.length > 0) {
      const textParts: string[] = [];
      const fileSummaries: string[] = [];
      for (const att of attachments) {
        if (att.type === 'text' && att.content) {
          textParts.push(`\n\n--- Attached File: ${att.name} ---\n\`\`\`\n${att.content}\n\`\`\``);
          fileSummaries.push(`[Code File: ${att.name}]`);
        } else if (att.type === 'image') {
          fileSummaries.push(`[Image: ${att.name}]`);
        } else {
          fileSummaries.push(`[Document: ${att.name} (${att.size})]`);
        }
      }
      finalContent = `${fileSummaries.join(' ')}\n\n${fullText}${textParts.join('')}`;
    }

    onSendMessage(finalContent);
    setText('');
    setInterimTranscript('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };


  /* ── stop recording helper ── */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  /* ── voice mic handler ── */
  const handleMicClick = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();

    if (!SpeechRecognitionAPI) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;   // keep recording until user stops manually

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = event as any;
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        setText(prev => (prev ? prev + ' ' + final : final).trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, stopListening]);

  /* ────────────────────────── render ─────────────────────────────────────── */
  return (
    <div className="bg-transparent px-4 py-2 pb-4">
      <div className="max-w-3xl mx-auto relative">

        {/* Top bar: model + role selectors */}
        <div className="flex items-center justify-start gap-2 mb-2 pl-3.5">

          {/* Model selector */}
          {activeSessionId && onUpdateModel ? (
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setModelDropdownOpen(prev => !prev)}
                className="flex items-center justify-between gap-1 w-[135px] h-[23px] px-2 text-[9.5px] font-semibold text-slate-800 rounded-[5px] bg-[#f4f3f0] border border-slate-300 hover:bg-[#ecebea] transition-all cursor-pointer text-left select-none shadow-none"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className="w-3 h-3 shrink-0 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z" fill="currentColor"/>
                  </svg>
                  <span className="truncate">{modelLabels[modelName] || modelName}</span>
                </div>
                <ChevronDown className={`w-2.5 h-2.5 text-slate-500 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {modelDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-[135px] bg-white border border-slate-300 rounded-[5px] py-1 z-50 shadow-none">
                  {Object.entries(modelLabels).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { onUpdateModel(key); setModelDropdownOpen(false); }}
                      className="w-full text-left px-2.5 py-1 text-[9.5px] font-semibold text-slate-800 hover:bg-[#f4f3f0] hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 w-[135px] h-[23px] text-[9.5px] font-semibold text-slate-800 rounded-[5px] bg-[#f4f3f0] border border-slate-300 select-none shadow-none">
              <svg className="w-3 h-3 shrink-0 text-black" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z" fill="currentColor"/>
              </svg>
              <span className="truncate">{modelLabels[modelName] || modelName}</span>
            </div>
          )}

          {/* Role selector */}
          {activeSessionId && onUpdateRole && (
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(prev => !prev)}
                className="flex items-center justify-between gap-1 w-[135px] h-[23px] px-2 text-[9.5px] font-semibold text-slate-800 rounded-[5px] bg-[#f4f3f0] border border-slate-300 hover:bg-[#ecebea] transition-all cursor-pointer text-left shadow-none"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {roleIcons[currentRole || 'general']}
                  <span className="truncate">{roleLabels[currentRole || 'general']}</span>
                </div>
                <ChevronDown className={`w-2.5 h-2.5 text-slate-500 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-[135px] bg-white border border-slate-300 rounded-[5px] py-1 z-50 shadow-none">
                  {Object.entries(roleLabels).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { onUpdateRole(key); setRoleDropdownOpen(false); }}
                      className="w-full text-left px-2 py-1 text-[9.5px] font-semibold text-slate-800 hover:bg-[#f4f3f0] hover:text-slate-950 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {roleIcons[key]}
                      <span className="truncate">{val}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#fbfbfa] border border-slate-300 rounded-[10px] max-h-24 overflow-y-auto scrollbar-thin">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-[6px] bg-white border border-slate-200 text-[9.5px] text-slate-800 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:shadow-sm"
              >
                {att.type === 'image' && att.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.dataUrl} className="w-4 h-4 object-cover rounded-[3px] border border-slate-100" alt="Preview" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                )}
                <span className="max-w-[130px] truncate text-[10px] text-slate-800">{att.name}</span>
                <span className="text-[8px] text-slate-700 font-mono">({att.size})</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 rounded-full hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Remove Attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-end gap-1.5 bg-white border border-slate-300 hover:border-slate-400 focus-within:border-slate-500 rounded-[20px] p-1.5 pl-3 pr-2 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.04)] min-h-[42px]">

          {/* Attach button */}
          <label
            className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0 select-none mb-0.5"
            title="Upload files"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
          </label>

          {/* Textarea */}
          {/* Interim voice transcript overlay */}
          {isListening && interimTranscript ? (
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={disabled}
                placeholder=""
                className="flex-1 w-full resize-none bg-transparent text-slate-800 placeholder-slate-500 focus:outline-none text-[12.5px] py-1.5 px-0.5 max-h-[160px] leading-relaxed scrollbar-thin overflow-y-hidden min-h-[20px]"
              />
              {/* Live interim text shown below typed text */}
              <span className="absolute left-0.5 top-1.5 text-[12.5px] leading-relaxed text-slate-400 italic pointer-events-none select-none">
                {text ? '' : interimTranscript}
              </span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={disabled}
              placeholder={
                isListening
                  ? 'Listening…'
                  : disabled
                  ? 'Waiting for response...'
                  : 'Ask MentorAI anything...'
              }
              className="flex-1 resize-none bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-[12.5px] py-1.5 px-0.5 max-h-[160px] leading-relaxed scrollbar-thin overflow-y-hidden min-h-[20px] italic-placeholder"
            />
          )}


          {/* Mic button — group/mic for hover-fill support */}
          <button
            type="button"
            onClick={handleMicClick}
            className={`group/mic p-1.5 transition-colors cursor-pointer shrink-0 mb-0.5 rounded-full ${
              isListening
                ? 'text-rose-500 animate-pulse'
                : 'text-black hover:text-blue-600'
            }`}
            title={isListening ? 'Stop recording' : 'Voice input'}
          >
            <MicIcon recording={isListening} className="w-[18px] h-[18px]" />
          </button>

          {/* Send / Stop button — 3 states:
               1. Idle (no text): faded outlined arrow
               2. Ready (has text): black outlined → filled black on hover
               3. Generating (disabled): animated spinner ring with stop square
          */}
          <button
            onClick={() => {
              if (isListening) stopListening();
              handleSubmit();
            }}
            disabled={disabled && !isListening}
            className="group/send p-1 transition-all cursor-pointer shrink-0 mb-0.5 rounded-full"
            title={disabled ? 'Generating...' : 'Send Message'}
          >
            {disabled ? (
              /* ── Generating state: spinning ring + stop square ── */
              <span className="relative flex items-center justify-center w-[18px] h-[18px]">
                {/* Spinning arc */}
                <svg
                  className="absolute inset-0 w-full h-full animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12" cy="12" r="10"
                    stroke="#e2e8f0"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M12 2 A10 10 0 0 1 22 12"
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Stop square in center */}
                <span className="w-[7px] h-[7px] rounded-[1.5px] bg-slate-900" />
              </span>
            ) : (
              /* ── Send arrow: outlined black → filled black on hover ── */
              <svg
                className="w-[18px] h-[18px]"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Outlined pure black — no divider line, always visible */}
                <g className="group-hover/send:hidden">
                  <path
                    d="M22 2L15 22L11 13L2 9L22 2Z"
                    stroke="#000"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"
                  />
                </g>
                {/* Filled black — visible on hover */}
                <path
                  className="hidden group-hover/send:block"
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  fill="#000"
                />
              </svg>
            )}
          </button>
        </div>

        <p className="text-[8.5px] text-center text-slate-700 mt-1.5">
          Shift + Enter for new line. Paste images, files, or links directly into the prompt box.
        </p>
      </div>
    </div>
  );
};
