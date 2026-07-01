import React, { useState, useEffect } from 'react';
import { Program, Vote, AdminStats } from '../types';
import { 
  BarChart3, Plus, Edit2, Trash2, Users, FileText, CheckCircle2,
  Calendar, Search, Filter, AlertCircle, Upload, Eye, Image as ImageIcon,
  Check, X, Activity, HelpCircle, ArrowLeft, Heart, Sparkles, MapPin
} from 'lucide-react';

interface AdminPanelProps {
  token: string;
  onLogout: () => void;
  onNavigateHome: () => void;
  onSelectProgram: (slug: string) => void;
}

export default function AdminPanel({ token, onLogout, onNavigateHome, onSelectProgram }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'programs' | 'votes'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  
  // Filtering & Searching in supporters
  const [voteSearch, setVoteSearch] = useState('');
  const [voteRtFilter, setVoteRtFilter] = useState('Semua');
  const [selectedProgramId, setSelectedProgramId] = useState('Semua');
  
  // Program CRUD Form State
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState('Baru Dibuka');
  const [formImageUrl, setFormImageUrl] = useState('');
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // General state
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPrograms();
    fetchVotes();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const data = await res.json();
        setApiError(data.error || 'Gagal memuat statistik');
      }
    } catch (err) {
      setApiError('Koneksi terputus. Gagal memuat data.');
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      if (res.ok) {
        const data = await res.json();
        setPrograms(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVotes = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (voteSearch) queryParams.append('search', voteSearch);
      if (voteRtFilter && voteRtFilter !== 'Semua') queryParams.append('rt', voteRtFilter);
      if (selectedProgramId && selectedProgramId !== 'Semua') queryParams.append('programId', selectedProgramId);

      const res = await fetch(`/api/admin/votes?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVotes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search of votes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeTab === 'votes') {
        fetchVotes();
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [voteSearch, voteRtFilter, selectedProgramId, activeTab]);

  // Helper to compress image client-side before upload to keep DB/network payloads small and fast (especially on Vercel)
  const compressImage = (file: File, maxWidth = 900, maxHeight = 600, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPEG, PNG, WEBP).');
      return;
    }

    setUploadingImage(true);
    setUploadError('');

    try {
      const compressedBase64 = await compressImage(file);
      
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image: compressedBase64,
          fileName: file.name
        })
      });

      const uploadData = await uploadRes.json();
      if (uploadRes.ok) {
        setFormImageUrl(uploadData.url);
        setSuccessMsg('Gambar berhasil diunggah!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setUploadError(uploadData.error || 'Gagal mengunggah gambar');
      }
      setUploadingImage(false);
    } catch (err) {
      setUploadError('Terjadi kesalahan saat mengunggah.');
      setUploadingImage(false);
    }
  };

  // Program Add / Edit CRUD
  const openAddProgram = () => {
    setFormMode('add');
    setEditingProgramId(null);
    setFormTitle('');
    setFormShortDesc('');
    setFormDesc('');
    setFormLocation('');
    setFormStatus('Baru Dibuka');
    setFormImageUrl('https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?auto=format&fit=crop&q=80&w=800');
    setUploadError('');
    setShowProgramForm(true);
  };

  const openEditProgram = (p: Program) => {
    setFormMode('edit');
    setEditingProgramId(p.id);
    setFormTitle(p.title);
    setFormShortDesc(p.short_description);
    setFormDesc(p.description);
    setFormLocation(p.location);
    setFormStatus(p.status);
    setFormImageUrl(p.image_url);
    setUploadError('');
    setShowProgramForm(true);
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formShortDesc.trim() || !formDesc.trim() || !formLocation.trim() || !formImageUrl.trim()) {
      setApiError('Harap lengkapi semua kolom.');
      return;
    }

    setLoading(true);
    setApiError('');

    const url = formMode === 'add' ? '/api/admin/programs' : `/api/admin/programs/${editingProgramId}`;
    const method = formMode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          short_description: formShortDesc.trim(),
          description: formDesc.trim(),
          location: formLocation.trim(),
          status: formStatus,
          image_url: formImageUrl.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(formMode === 'add' ? 'Program baru berhasil ditambahkan!' : 'Program berhasil diperbarui!');
        setShowProgramForm(false);
        fetchPrograms();
        fetchStats();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setApiError(data.error || 'Gagal menyimpan program.');
      }
    } catch (err) {
      setApiError('Koneksi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus program "${title}"? Tindakan ini akan menghapus semua dukungan yang terkait dan bersifat permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccessMsg('Program berhasil dihapus.');
        fetchPrograms();
        fetchStats();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus program.');
      }
    } catch (err) {
      alert('Koneksi gagal.');
    }
  };

  // Delete spam vote
  const handleDeleteVote = async (id: string, voterName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus dukungan dari "${voterName}"? Tindakan ini akan secara otomatis mengurangi 1 jumlah dukungan pada program yang bersangkutan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/votes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccessMsg('Dukungan spam berhasil dihapus.');
        fetchVotes();
        fetchStats();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus dukungan.');
      }
    } catch (err) {
      alert('Koneksi gagal.');
    }
  };

  const rtOptions = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06', 'RT 07', 'RT 08', 'RT 09', 'RT 10'];
  const statusOptions = ['Baru Dibuka', 'Prioritas Tinggi', 'Menunggu Anggaran', 'Dalam Perencanaan', 'Sedang Dikerjakan', 'Selesai', 'Ditunda'];

  return (
    <div className="w-full max-w-full mx-auto px-4 py-4 pb-24 space-y-5 animate-fadeIn">
      
      {/* Top Welcome Title */}
      <div className="border-b border-slate-100 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Admin Panel
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onNavigateHome}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
            >
              Lihat Web
            </button>
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
        <div>
          <h2 className="font-display font-black text-xl text-slate-900">
            Halo, Admin Desa
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kelola program dan usulan prioritas pembangunan dari warga desa.
          </p>
        </div>
      </div>

      {/* Global Message Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-950 text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {apiError && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-950 text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="flex-1">{apiError}</span>
          <button onClick={() => setApiError('')} className="text-red-500 font-bold hover:text-red-700 text-xs">✕</button>
        </div>
      )}

      {/* Custom Segmented Tab Navigation - Mobile perfect! */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full border border-slate-200/50 max-w-xl mx-auto">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Statistik</span>
        </button>
        
        <button
          onClick={() => setActiveTab('programs')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'programs'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Program ({programs.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab('votes')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'votes'
              ? 'bg-white text-slate-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Dukungan</span>
        </button>
      </div>

      {/* ==================================== */}

      {/* ==================================== */}
      {/* TAB 1: STATISTICS & GRAPHS           */}
      {/* ==================================== */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-5 animate-fadeIn">
          {/* Numbers Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Program</p>
              <h3 className="text-lg font-black text-slate-950 mt-1 leading-none">{stats.totalPrograms}</h3>
              <p className="text-[9px] text-slate-500 mt-1">Usulan aktif</p>
            </div>
            
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Dukungan</p>
              <h3 className="text-lg font-black text-emerald-900 mt-1 leading-none">{stats.totalVotes}</h3>
              <p className="text-[9px] text-emerald-600 font-medium mt-1">Suara terverifikasi</p>
            </div>
            
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Partisipasi</p>
              <h3 className="text-lg font-black text-purple-950 mt-1 leading-none">{stats.totalParticipants}</h3>
              <p className="text-[9px] text-slate-500 mt-1">Warga terdaftar</p>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hari Ini</p>
              <h3 className="text-lg font-black text-amber-950 mt-1 leading-none">+{stats.votesToday}</h3>
              <p className="text-[9px] text-slate-500 mt-1">Minggu ini: <span className="font-bold">+{stats.votesThisWeek}</span></p>
            </div>
          </div>

          {/* Terpopuler Banner */}
          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase text-emerald-800 tracking-wider">Terpopuler Saat Ini</p>
              <p className="text-xs font-extrabold text-slate-800 truncate">
                {stats.popularProgram}
              </p>
            </div>
          </div>

          {/* Graphs / Visualization */}
          <div className="space-y-4">
            
            {/* Sebaran Dukungan per RT */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-xs">Sebaran Dukungan per RT</h4>
                <p className="text-[9px] text-slate-500">Jumlah suara sah dari masing-masing RT</p>
              </div>

              <div className="space-y-2">
                {rtOptions.map(rt => {
                  const voteCount = stats.rtDistribution[rt] || 0;
                  const maxVal = Math.max(...Object.values(stats.rtDistribution) as number[], 1);
                  const widthPercent = Math.max(5, (voteCount / maxVal) * 100);
                  
                  return (
                    <div key={rt} className="flex items-center space-x-2">
                      <span className="w-10 font-mono font-bold text-[9px] text-slate-700 shrink-0">{rt}</span>
                      <div className="flex-1 bg-slate-50 h-5 rounded-md overflow-hidden relative border border-slate-100">
                        <div 
                          className="bg-emerald-500 h-full rounded-md transition-all duration-700" 
                          style={{ width: `${widthPercent}%` }}
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-800">{voteCount} suara</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peringkat Prioritas Program */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-xs">Peringkat Prioritas Program</h4>
                <p className="text-[9px] text-slate-500">Urutan popularitas berdasarkan suara warga</p>
              </div>

              <div className="space-y-3">
                {programs.map((p, idx) => {
                  const maxVotes = Math.max(...programs.map(pr => pr.votes_count), 1);
                  const percent = Math.max(5, (p.votes_count / maxVotes) * 100);
                  
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-2xs">
                        <span className="font-bold text-slate-800 line-clamp-1 flex items-center space-x-1.5 min-w-0">
                          <span className="w-4 h-4 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-[9px] shrink-0">{idx + 1}</span>
                          <span className="truncate">{p.title}</span>
                        </span>
                        <span className="font-extrabold text-emerald-800 text-[10px] shrink-0 pl-2">{p.votes_count} suara</span>
                      </div>
                      <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-100">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily growth graph */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-3">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-xs">Grafik Dukungan Harian</h4>
                <p className="text-[9px] text-slate-500">Pertumbuhan jumlah dukungan harian (7 hari terakhir)</p>
              </div>

              <div className="flex items-end justify-between h-36 pt-4 border-b border-slate-100 px-1 gap-1">
                {stats.dailyGrowth.map(item => {
                  const maxVal = Math.max(...stats.dailyGrowth.map(g => g.count), 1);
                  const heightPercent = Math.max(8, (item.count / maxVal) * 80);
                  
                  const parts = item.date.split('-');
                  const label = parts[2] ? `${parts[2]}/${parts[1]}` : item.date;

                  return (
                    <div key={item.date} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                      <span className="text-[8px] font-extrabold text-slate-700 mb-0.5">
                        +{item.count}
                      </span>
                      <div 
                        className="w-full max-w-[20px] bg-emerald-500 rounded-t-sm transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[8px] text-slate-400 mt-1 font-mono shrink-0">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* TAB 2: MANAGE PROGRAMS CRUD         */}
      {/* ==================================== */}
      {activeTab === 'programs' && (
        <div className="space-y-6 animate-fadeIn">
          {showProgramForm ? (
            /* Dedicated input page/form instead of Pop Up */
            <div className="space-y-4 animate-fadeIn">
              <button
                type="button"
                onClick={() => setShowProgramForm(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Daftar</span>
              </button>

              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-display font-black text-slate-900 text-base sm:text-lg">
                    {formMode === 'add' ? 'Tambah Program Baru' : 'Ubah Program Pembangunan'}
                  </h3>
                  <p className="text-2xs sm:text-xs text-slate-500 mt-0.5">Lengkapi isian form usulan di bawah ini</p>
                </div>

                <form onSubmit={handleProgramSubmit} className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Judul Program *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Perbaikan Jalan RT 03"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold"
                    />
                  </div>

                  {/* Short Description */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">Deskripsi Singkat (Maks 150 Karakter) *</label>
                      <span className={`text-[10px] font-bold ${formShortDesc.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>
                        {formShortDesc.length}/150
                      </span>
                    </div>
                    <textarea
                      required
                      maxLength={150}
                      placeholder="Contoh: Paving jalan sepanjang 150 meter yang mengalami kerusakan parah..."
                      value={formShortDesc}
                      onChange={(e) => setFormShortDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-medium"
                    />
                  </div>

                  {/* Full Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Deskripsi Lengkap *</label>
                    <textarea
                      required
                      placeholder="Detail informasi usulan pembangunan, manfaat bagi warga, target penyelesaian, dll..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      rows={4}
                      className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-medium leading-relaxed"
                    />
                  </div>

                  {/* Grid row: Location & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Location */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Lokasi Program *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: RT 03 RW 01, Dusun Krajan"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold"
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Status Program *</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold cursor-pointer"
                      >
                        {statusOptions.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Image Upload & URL input */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">Gambar Program *</label>
                    
                    {formImageUrl && (
                      <div className="relative aspect-[16/8] max-w-xs bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-5">
                        <label className="w-full flex flex-col items-center justify-center py-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 hover:border-emerald-400 rounded-xl cursor-pointer transition-all">
                          <Upload className="w-5 h-5 text-slate-400 mb-0.5" />
                          <span className="text-[10px] font-bold text-slate-600">Pilih File</span>
                          <span className="text-[8px] text-slate-400">Maks 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingImage}
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        {uploadingImage && <p className="text-[10px] text-emerald-700 font-semibold mt-1">Sedang mengunggah...</p>}
                        {uploadError && <p className="text-[10px] text-red-500 font-semibold mt-1">{uploadError}</p>}
                      </div>

                      <div className="sm:col-span-7 flex flex-col justify-center space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400">Atau masukkan Link Gambar eksternal:</span>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-lg outline-none text-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowProgramForm(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loading || uploadingImage}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                    >
                      {loading ? 'Menyimpan...' : 'Simpan Program'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg">Daftar Pembangunan Desa</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar usulan program yang sedang berjalan atau diusulkan.</p>
                </div>
                <button
                  onClick={openAddProgram}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Program</span>
                </button>
              </div>

              {/* List */}
              {programs.length > 0 ? (
                <div className="space-y-3">
                  {programs.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-2xs flex flex-col justify-between gap-3">
                      <div className="flex gap-3">
                        <img src={p.image_url} alt="" className="w-20 h-16 object-cover rounded-xl border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex px-1.5 py-0.5 font-bold text-[9px] rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800">
                              {p.status}
                            </span>
                            <span className="font-extrabold text-emerald-800 text-[10px] shrink-0 bg-emerald-50/50 px-2 py-0.5 rounded-full">
                              {p.votes_count} Dukungan
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs mt-1 line-clamp-1">{p.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">{p.short_description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[10px]">
                        <span className="text-slate-500 truncate max-w-[120px]">📍 {p.location}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onSelectProgram(p.slug)}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                          <button
                            onClick={() => openEditProgram(p)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-100 active:scale-95 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Ubah</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProgram(p.id, p.title)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-100 text-red-700 font-bold rounded-lg hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-500 text-base">Tidak ada program ditemukan</p>
                  <button onClick={openAddProgram} className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md">
                    Buat Program Pertama
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================================== */}
      {/* TAB 3: MANAGE VOTES / SPAM           */}
      {/* ==================================== */}
      {activeTab === 'votes' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg">Kelola Dukungan Warga</h3>
              <p className="text-xs text-slate-500 mt-0.5">Analisis keaslian hak suara dan hapus vote yang dicurigai sebagai spam harian.</p>
            </div>
          </div>

          {/* Filtering Tools Row - 2 Rows Design */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
            {/* Baris 1: Cari Berdasarkan */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama pendukung..."
                value={voteSearch}
                onChange={(e) => setVoteSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs transition-all"
              />
            </div>

            {/* Baris 2: Filter RT dan Program */}
            <div className="grid grid-cols-2 gap-3">
              {/* RT filter */}
              <div className="relative">
                <select
                  value={voteRtFilter}
                  onChange={(e) => setVoteRtFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold cursor-pointer transition-all"
                >
                  <option value="Semua">Semua RT</option>
                  {rtOptions.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              {/* Program selection filter */}
              <div className="relative">
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold cursor-pointer transition-all"
                >
                  <option value="Semua">Semua Program</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Supporters Grid Table */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <p className="text-slate-500 font-semibold animate-pulse text-sm">Sedang mengambil data dukungan...</p>
            </div>
          ) : votes.length > 0 ? (
            <div className="space-y-3">
              {votes.map(v => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-xs shrink-0">
                        {v.voter_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs block truncate">{v.voter_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{v.ip_address}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded font-bold text-emerald-800 text-[10px] shrink-0">
                      RT {v.voter_rt}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Program Pilihan</p>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">{v.program_title}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-50">
                    <span className="text-slate-400">🕒 {new Date(v.created_at).toLocaleString('id-ID')}</span>
                    <button
                      onClick={() => handleDeleteVote(v.id, v.voter_name)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-100 text-red-700 font-bold rounded-lg hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus & Tandai Spam</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-500 text-base">Tidak ada data dukungan terdeteksi</p>
              <p className="text-xs text-slate-400 mt-1">Coba bersihkan kata kunci atau filter pencarian Anda.</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
