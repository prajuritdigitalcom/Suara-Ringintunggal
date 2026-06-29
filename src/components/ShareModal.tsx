import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Copy, Check, Share2 } from 'lucide-react';
import { Program } from '../types';

interface ShareModalProps {
  program: Program | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ program, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!program) return null;

  // Generate share URL
  const shareUrl = `${window.location.origin}/?program=${program.slug}`;
  const messageText = `Saya mendukung program "${program.title}" di Desa Ringintunggal. Mari ikut memberikan dukungan melalui tautan berikut: ${shareUrl}`;

  // Share handlers
  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
 
          {/* Bottom Sheet Drawer Content */}
          <motion.div
            initial={{ y: "100%", opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="relative w-full max-w-md md:max-w-[400px] bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden border-t md:border border-slate-100 z-10 pb-6 md:pb-0"
          >
            {/* Native Mobile Drag Handle Pill */}
            <div className="py-3 flex justify-center md:hidden bg-gradient-to-b from-slate-50 to-white">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-white border-b border-emerald-100/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2.5 bg-emerald-100/80 text-emerald-800 rounded-2xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-slate-900 text-sm sm:text-base leading-none">
                    Bagikan Program
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Ajak warga lain mendukung pembangunan</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
 
            {/* Body */}
            <div className="p-5 space-y-5">
              
              {/* Program Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  {program.status}
                </span>
                <h4 className="font-black text-slate-800 text-sm mt-1.5 line-clamp-1">
                  {program.title}
                </h4>
                <p className="text-2xs text-slate-500 line-clamp-2 mt-0.5">
                  {program.short_description}
                </p>
              </div>
 
              {/* Share Channels */}
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center space-x-2.5 p-3.5 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-100/40 rounded-2xl text-emerald-900 transition-all text-left cursor-pointer"
                >
                  <span className="text-xl shrink-0">🟢</span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs">WhatsApp</p>
                    <p className="text-[10px] text-slate-500 truncate">Kirim chat cepat</p>
                  </div>
                </button>
 
                {/* Facebook */}
                <button
                  onClick={shareFacebook}
                  className="flex items-center space-x-2.5 p-3.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100/40 rounded-2xl text-blue-900 transition-all text-left cursor-pointer"
                >
                  <span className="text-xl shrink-0">🔵</span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs">Facebook</p>
                    <p className="text-[10px] text-slate-500 truncate">Bagikan linimasa</p>
                  </div>
                </button>
 
                {/* Telegram */}
                <button
                  onClick={shareTelegram}
                  className="flex items-center space-x-2.5 p-3.5 bg-sky-50/80 hover:bg-sky-100/80 border border-sky-100/40 rounded-2xl text-sky-900 transition-all text-left cursor-pointer"
                >
                  <span className="text-xl shrink-0">🌐</span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs">Telegram</p>
                    <p className="text-[10px] text-slate-500 truncate">Kirim via chat</p>
                  </div>
                </button>
 
                {/* Salin Link */}
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center space-x-2.5 p-3.5 border rounded-2xl transition-all text-left cursor-pointer ${
                    copied 
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${copied ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs">{copied ? 'Tersalin!' : 'Salin Link'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{copied ? 'Tautan siap' : 'Gunakan link langsung'}</p>
                  </div>
                </button>
              </div>
 
              {/* Message preview text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Pesan Teks:</label>
                <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-600 border border-slate-100 max-h-20 overflow-y-auto leading-relaxed select-all font-medium">
                  {messageText}
                </div>
              </div>
 
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
