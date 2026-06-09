import React, { useState } from 'react';
import { X, Copy, Check, Mail } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/chat?session=${sessionId}` 
    : '';

  const shareText = `Check out my conversation on MentorAI: "${sessionTitle}"`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Social Share Links
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent('Shared MentorAI Conversation')}&body=${encodeURIComponent(shareText + '\n\nLink: ' + shareUrl)}`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
      <div 
        className="w-full max-w-sm bg-white border border-slate-300 rounded-[12px] p-5 shadow-xl relative animate-scale-in mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Share Conversation</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <p className="text-[11px] text-slate-700 mb-4 leading-relaxed">
          Anyone with this link will be able to view a read-only snapshot of this chat session.
        </p>

        {/* Link Input Row */}
        <div className="flex items-center gap-2 bg-[#f4f3f0] border border-slate-300 rounded-[8px] p-1.5 pl-3 mb-5">
          <input 
            type="text" 
            readOnly 
            value={shareUrl} 
            className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none select-all truncate font-mono"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-slate-900 hover:bg-black text-white text-[10.5px] font-bold transition-all cursor-pointer shadow-sm select-none shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Social Media Sharing */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-850 block mb-1">
            Share to Socials
          </span>

          <div className="grid grid-cols-4 gap-2.5">
            {/* WhatsApp */}
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-[8px] border border-slate-200 hover:border-[#25D366]/40 hover:bg-[#25D366]/5 transition-all cursor-pointer group"
              title="Share on WhatsApp"
            >
              <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
                  <path d="M12 .003c-6.627 0-12 5.373-12 12 0 2.159.57 4.258 1.66 6.105L.03 24l6.064-1.59A11.905 11.905 0 0 0 12 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm6.75 16.54c-.25.707-1.462 1.3-2.012 1.387-.5.08-1.15.148-3.275-.732-2.722-1.12-4.475-3.89-4.61-4.074-.138-.184-1.12-1.487-1.12-2.837 0-1.35.705-2.012.956-2.274.25-.262.543-.324.725-.324.18 0 .36 0 .518.007.16 0 .375-.062.588.444.22.518.744 1.81.81 1.942.063.13.104.283.018.455-.088.172-.13.282-.26.435-.125.15-.263.33-.375.443-.125.125-.256.262-.11.512.148.25.656 1.082 1.41 1.756.97.868 1.786 1.134 2.037 1.258.25.125.395.105.544-.062.148-.172.637-.744.812-1 .174-.25.343-.206.58-.12.24.088 1.518.718 1.776.85.26.13.43.193.493.3.064.11.064.63-.186 1.34z" />
                </svg>
              </div>
              <span className="text-[9px] text-slate-700 font-semibold mt-1">WhatsApp</span>
            </a>

            {/* X / Twitter */}
            <a 
              href={twitterUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-[8px] border border-slate-200 hover:border-black/30 hover:bg-black/5 transition-all cursor-pointer group"
              title="Share on X"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-black group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span className="text-[9px] text-slate-700 font-semibold mt-1">X / Twitter</span>
            </a>

            {/* Facebook */}
            <a 
              href={facebookUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-[8px] border border-slate-200 hover:border-[#1877F2]/40 hover:bg-[#1877F2]/5 transition-all cursor-pointer group"
              title="Share on Facebook"
            >
              <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span className="text-[9px] text-slate-700 font-semibold mt-1">Facebook</span>
            </a>

            {/* Email */}
            <a 
              href={emailUrl}
              className="flex flex-col items-center justify-center p-2.5 rounded-[8px] border border-slate-200 hover:border-slate-400/40 hover:bg-slate-100/5 transition-all cursor-pointer group"
              title="Share via Email"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-[9px] text-slate-700 font-semibold mt-1">Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
