import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, X } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled: boolean;
  modelName: string;
}

interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'text' | 'other';
  size: string;
  dataUrl?: string; // For image previews
  content?: string; // For text/code file contents
  file: File;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, modelName }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Auto-resize textarea height as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to compute scrollHeight
    textarea.style.height = 'auto';
    const computedHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(computedHeight, 24), 200);
    textarea.style.height = `${newHeight}px`;

    // Manage scrollbar visibility dynamically
    if (computedHeight > 200) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  }, [text]);

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
        setAttachments((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            type: 'image',
            size: formatBytes(file.size),
            dataUrl,
            file
          }
        ]);
      };
      reader.readAsDataURL(file);
    } else if (
      file.type.startsWith('text/') || 
      file.name.endsWith('.js') || 
      file.name.endsWith('.ts') || 
      file.name.endsWith('.tsx') || 
      file.name.endsWith('.jsx') || 
      file.name.endsWith('.py') || 
      file.name.endsWith('.json') || 
      file.name.endsWith('.css') || 
      file.name.endsWith('.html') || 
      file.name.endsWith('.md') ||
      file.name.endsWith('.yaml') ||
      file.name.endsWith('.yml') ||
      file.name.endsWith('.toml') ||
      file.name.endsWith('.ini')
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            type: 'text',
            size: formatBytes(file.size),
            content,
            file
          }
        ]);
      };
      reader.readAsText(file);
    } else {
      setAttachments((prev) => [
        ...prev,
        {
          id,
          name: file.name,
          type: 'other',
          size: formatBytes(file.size),
          file
        }
      ]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      addFileAttachment(files[i]);
    }
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
        if (file) {
          addFileAttachment(file);
        }
      }
    }

    if (hasFiles) {
      e.preventDefault();
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachments.length === 0) || disabled) return;

    let finalContent = text;

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

      const attachmentsHeader = fileSummaries.join(' ');
      finalContent = `${attachmentsHeader}\n\n${text}${textParts.join('')}`;
    }

    onSendMessage(finalContent);
    setText('');
    setAttachments([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="bg-transparent p-4 pb-6">
      <div className="max-w-3xl mx-auto relative">

        {/* Top bar containing model selector */}
        <div className="flex items-center justify-start mb-2 pl-3.5">
          {/* Model tag in solid gray with colored Gemini star logo */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-slate-800 rounded-[6px] bg-[#f4f3f0] border border-slate-200/60 max-w-fit select-none shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ aspectRatio: '1/1' }}>
              <path d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z" fill="url(#gemini-gradient)"/>
              <defs>
                <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4285F4" />
                  <stop offset="30%" stopColor="#9B72CB" />
                  <stop offset="70%" stopColor="#D96570" />
                  <stop offset="100%" stopColor="#F3AF42" />
                </linearGradient>
              </defs>
            </svg>
            <span>Model: {modelName}</span>
          </div>
        </div>

        {/* Attachment preview cards list */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5 p-2 bg-[#fbfbfa] border border-slate-200/50 rounded-[12px] max-h-28 overflow-y-auto scrollbar-thin">
            {attachments.map((att) => (
              <div 
                key={att.id} 
                className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-[8px] bg-white border border-slate-200 text-[10px] text-slate-700 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:shadow-sm"
              >
                {att.type === 'image' && att.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.dataUrl} className="w-4.5 h-4.5 object-cover rounded-[4px] border border-slate-100" alt="Preview" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="max-w-[150px] truncate text-[10.5px] text-slate-800">{att.name}</span>
                <span className="text-[8.5px] text-slate-400 font-mono">({att.size})</span>
                <button 
                  onClick={() => removeAttachment(att.id)} 
                  className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Remove Attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area Input Wrapper - Rounded ChatGPT style */}
        <div className="relative flex items-end gap-2 bg-white border border-slate-200 hover:border-slate-350 focus-within:border-slate-500 rounded-[26px] p-2 pl-3.5 pr-2.5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.04)] min-h-[52px]">
          {/* Upload Button inside the input box */}
          <label className="p-2 rounded-full hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0 select-none" title="Upload files">
            <Paperclip className="w-4 h-4" />
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder={disabled ? "Waiting for response..." : "Ask MentorAI anything..."}
            className="flex-1 resize-none bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-[13px] py-2 px-1 max-h-[200px] leading-relaxed scrollbar-thin overflow-y-hidden min-h-[24px]"
          />

          {/* Circular Send Button */}
          <button
            onClick={handleSubmit}
            disabled={(!text.trim() && attachments.length === 0) || disabled}
            className={`p-2 rounded-full transition-all cursor-pointer shrink-0 ${
              (text.trim() || attachments.length > 0) && !disabled
                ? 'bg-slate-900 hover:bg-black text-white shadow-sm'
                : 'bg-[#f4f3f0] text-slate-400 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[9px] text-center text-slate-400 mt-2.5">
          Shift + Enter for new line. Paste images, files, or links directly into the prompt box.
        </p>
      </div>
    </div>
  );
};
