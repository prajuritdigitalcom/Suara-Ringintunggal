import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Send, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Program, Captcha } from '../types';

interface VoteModalProps {
  program: Program | null;
  isOpen: boolean;
  onClose: () => void;
  onVoteSuccess: () => void;
}

export default function VoteModal({ program, isOpen, onClose, onVoteSuccess }: VoteModalProps) {
  const [voterName, setVoterName] = useState('');
  const [voterRt, setVoterRt] = useState('RT 01');
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch captcha on open
  useEffect(() => {
    if (isOpen) {
      fetchCaptcha();
      // Reset form states
      setVoterName('');
      setVoterRt('RT 01');
      setCaptchaAnswer('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const res = await fetch('/api/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptcha(data);
      }
    } catch (err) {
      console.error("Error fetching captcha:", err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !captcha) return;

    if (!voterName.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!captchaAnswer.trim()) {
      setErrorMessage('Jawaban captcha wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/programs/${program.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voterName: voterName.trim(),
          voterRt,
          captchaId: captcha.challengeId,
          captchaAnswer: captchaAnswer.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal mengirimkan dukungan.");
        // Refresh captcha since it was consumed or incorrect
        fetchCaptcha();
        setCaptchaAnswer('');
      } else {
        setSuccessMessage('Terima kasih! Dukungan Anda berhasil disimpan.');
        setTimeout(() => {
          onVoteSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setErrorMessage("Koneksi gagal. Silakan coba lagi nanti.");
      fetchCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const rtOptions = [
    'RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05',
    'RT 06', 'RT 07', 'RT 08', 'RT 09', 'RT 10'
  ];

  if (!program) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSubmitting ? undefined : onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-50 z-10"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg">
                    Formulir Dukungan
                  </h3>
                  <p className="text-2xs sm:text-xs text-slate-500">1 nama & RT hanya bisa mendukung 1 kali</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              
              {/* Program Name Badge */}
              <div className="mb-6 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-3xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  Dukungan Program
                </span>
                <p className="font-bold text-slate-800 text-sm mt-1 sm:text-base leading-tight">
                  {program.title}
                </p>
              </div>

              {successMessage ? (
                <div className="text-center py-8 px-4 space-y-3">
                  <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
                    <CheckCircle2 className="w-12 h-12 animate-pulse" />
                  </div>
                  <h4 className="font-display font-bold text-lg text-slate-900">
                    Dukungan Berhasil!
                  </h4>
                  <p className="text-sm text-slate-600">
                    {successMessage}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-red-800 text-xs sm:text-sm animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Nama Lengkap */}
                  <div className="space-y-1.5">
                    <label htmlFor="voterName" className="text-xs sm:text-sm font-bold text-slate-700 block">
                      Nama Lengkap Anda
                    </label>
                    <input
                      id="voterName"
                      type="text"
                      required
                      placeholder="Contoh: Ahmad"
                      disabled={isSubmitting}
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-3 text-slate-800 placeholder-slate-400 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-all text-sm sm:text-base font-medium"
                    />
                  </div>

                  {/* RT Dropdown */}
                  <div className="space-y-1.5">
                    <label htmlFor="voterRt" className="text-xs sm:text-sm font-bold text-slate-700 block">
                      Asal RT
                    </label>
                    <select
                      id="voterRt"
                      value={voterRt}
                      disabled={isSubmitting}
                      onChange={(e) => setVoterRt(e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-3 text-slate-800 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-all text-sm sm:text-base font-semibold cursor-pointer"
                    >
                      {rtOptions.map((rt) => (
                        <option key={rt} value={rt}>{rt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Captcha Section */}
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100/60 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase text-emerald-800 tracking-wider">
                        Verifikasi Anti-Spam
                      </span>
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        disabled={loadingCaptcha || isSubmitting}
                        className="inline-flex items-center space-x-1 text-2xs font-medium text-emerald-700 hover:text-emerald-900 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingCaptcha ? 'animate-spin' : ''}`} />
                        <span>Muat Ulang</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Mathematical Question Display */}
                      <div className="px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-center font-mono font-bold text-base sm:text-lg text-emerald-950 min-w-[100px] shadow-xs select-none">
                        {loadingCaptcha ? '...' : (captcha ? captcha.question : 'Gagal memuat')}
                      </div>

                      {/* Captcha input */}
                      <div className="flex-1">
                        <input
                          type="number"
                          required
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="Hasil"
                          disabled={isSubmitting}
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white text-slate-800 placeholder-slate-400 border border-emerald-200 focus:border-emerald-500 rounded-xl outline-none text-center font-mono font-bold text-base sm:text-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-200 transition-all cursor-pointer disabled:opacity-75 flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{isSubmitting ? 'Mengirimkan...' : 'Kirim Dukungan'}</span>
                  </button>

                  <p className="text-3xs text-center text-slate-400 leading-tight">
                    *Dengan mengirimkan dukungan, nama dan RT Anda akan ditampilkan secara transparan pada daftar pendukung publik program ini.
                  </p>
                </form>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
