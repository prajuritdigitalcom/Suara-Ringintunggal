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

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran gambar maksimal adalah 5MB.');
      return;
    }

    setUploadingImage(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            image: base64Data,
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
      };

      reader.onerror = () => {
        setUploadError('Gagal membaca file gambar.');
        setUploadingImage(false);
      };

      reader.readAsDataURL(file);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-20 space-y-8">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-6">
        <div>
          <span className="text-2xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Panel Kontrol Administrator
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-2">
            Halo, Admin Desa Ringintunggal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gunakan panel ini untuk mengelola prioritas usulan pembangunan desa berdasarkan dukungan nyata warga.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-800 hover:bg-emerald-50 border border-emerald-100 rounded-full transition-all"
          >
            Lihat Website Utama
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-full transition-all"
          >
            Keluar Sesi
          </button>
        </div>
      </div>

      {/* Global Message Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-900 text-sm font-semibold rounded-2xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-900 text-sm font-semibold rounded-2xl flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{apiError}</span>
          <button onClick={() => setApiError('')} className="ml-auto text-red-500 font-bold hover:text-red-700">✕</button>
        </div>
      )}

      {/* Custom Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-3 font-semibold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center space-x-2 ${
            activeTab === 'stats'
              ? 'border-emerald-600 text-emerald-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5" />
          <span>Statistik & Grafik</span>
        </button>
        
        <button
          onClick={() => setActiveTab('programs')}
          className={`px-4 py-3 font-semibold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center space-x-2 ${
            activeTab === 'programs'
              ? 'border-emerald-600 text-emerald-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4.5 h-4.5" />
          <span>Kelola Program ({programs.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab('votes')}
          className={`px-4 py-3 font-semibold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center space-x-2 ${
            activeTab === 'votes'
              ? 'border-emerald-600 text-emerald-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          <span>Kelola Dukungan / Spam</span>
        </button>
      </div>

      {/* ==================================== */}
      {/* TAB 1: STATISTICS & GRAPHS           */}
      {/* ==================================== */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-8 animate-fadeIn">
          {/* Numbers Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-2xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Program</p>
              <h3 className="text-2xl sm:text-4.5xl font-black text-slate-950 mt-1 leading-none">{stats.totalPrograms}</h3>
              <p className="text-2xs sm:text-xs text-slate-500 mt-2">Program pembangunan aktif</p>
            </div>
            
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-2xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Dukungan</p>
              <h3 className="text-2xl sm:text-4.5xl font-black text-emerald-900 mt-1 leading-none">{stats.totalVotes}</h3>
              <p className="text-2xs sm:text-xs text-emerald-600 font-medium mt-2">Hak suara terkumpul</p>
            </div>
            
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-2xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">Partisipasi Warga</p>
              <h3 className="text-2xl sm:text-4.5xl font-black text-purple-950 mt-1 leading-none">{stats.totalParticipants}</h3>
              <p className="text-2xs sm:text-xs text-slate-500 mt-2">Nama unik (RT terdaftar)</p>
            </div>

            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-2xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">Dukungan Hari Ini</p>
              <h3 className="text-2xl sm:text-4.5xl font-black text-amber-950 mt-1 leading-none">+{stats.votesToday}</h3>
              <p className="text-2xs sm:text-xs text-slate-500 mt-2">Minggu ini: <span className="font-bold">+{stats.votesThisWeek}</span></p>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-2xs font-bold uppercase text-slate-400 tracking-wider">Terpopuler Saat Ini</p>
            <p className="text-base sm:text-xl font-bold text-slate-800 mt-1 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
              <span>{stats.popularProgram}</span>
            </p>
          </div>

          {/* Graphs / Visualization Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Dukungan per RT */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-base sm:text-lg">Sebaran Dukungan per RT</h4>
                <p className="text-xs text-slate-500 mt-0.5">Jumlah suara sah dari masing-masing RT</p>
              </div>

              {/* Bar charts per RT */}
              <div className="space-y-4">
                {rtOptions.map(rt => {
                  const voteCount = stats.rtDistribution[rt] || 0;
                  const maxVal = Math.max(...Object.values(stats.rtDistribution) as number[], 1);
                  const widthPercent = Math.max(5, (voteCount / maxVal) * 100);
                  
                  return (
                    <div key={rt} className="flex items-center space-x-3">
                      <span className="w-12 font-mono font-bold text-xs text-slate-700 shrink-0">{rt}</span>
                      <div className="flex-1 bg-slate-100 h-6 rounded-lg overflow-hidden relative">
                        <div 
                          className="bg-emerald-500 h-full rounded-lg transition-all duration-700" 
                          style={{ width: `${widthPercent}%` }}
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-2xs font-black text-slate-800">{voteCount} suara</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dukungan per Program Rank */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-base sm:text-lg">Peringkat Prioritas Program</h4>
                <p className="text-xs text-slate-500 mt-0.5">Urutan popularitas program berdasarkan suara warga</p>
              </div>

              {/* Programs Bar chart list */}
              <div className="space-y-5">
                {programs.map((p, idx) => {
                  const maxVotes = Math.max(...programs.map(pr => pr.votes_count), 1);
                  const percent = Math.max(5, (p.votes_count / maxVotes) * 100);
                  
                  return (
                    <div key={p.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-bold text-slate-800 line-clamp-1 flex items-center space-x-1.5">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-2xs shrink-0">{idx + 1}</span>
                          <span>{p.title}</span>
                        </span>
                        <span className="font-extrabold text-emerald-800 shrink-0">{p.votes_count} Dukungan</span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
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

          </div>

          {/* Daily growth graph */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div>
              <h4 className="font-display font-bold text-slate-900 text-base sm:text-lg">Grafik Dukungan Harian</h4>
              <p className="text-xs text-slate-500 mt-0.5">Pertumbuhan jumlah dukungan harian selama 7 hari terakhir</p>
            </div>

            {/* Styled custom growth chart */}
            <div className="flex items-end justify-between h-48 pt-6 border-b border-slate-200 px-4 sm:px-8 gap-2">
              {stats.dailyGrowth.map(item => {
                const maxVal = Math.max(...stats.dailyGrowth.map(g => g.count), 1);
                const heightPercent = Math.max(8, (item.count / maxVal) * 85);
                
                // Format date string from YYYY-MM-DD to DD/MM
                const parts = item.date.split('-');
                const label = parts[2] ? `${parts[2]}/${parts[1]}` : item.date;

                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <span className="text-3xs font-extrabold text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white px-1.5 py-0.5 rounded-md pointer-events-none absolute -translate-y-8">
                      +{item.count}
                    </span>
                    <div 
                      className="w-full max-w-[40px] bg-emerald-500 group-hover:bg-emerald-600 rounded-t-lg transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-3xs sm:text-xs text-slate-500 mt-2 font-mono">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* TAB 2: MANAGE PROGRAMS CRUD         */}
      {/* ==================================== */}
      {activeTab === 'programs' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-lg sm:text-xl">Daftar Pembangunan Desa</h3>
            <button
              onClick={openAddProgram}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Program</span>
            </button>
          </div>

          {/* Program Form Overlay / Collapsible */}
          {showProgramForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowProgramForm(false)} />
              
              <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-50 z-10 max-h-[90vh] flex flex-col">
                
                {/* Form Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-lg">
                        {formMode === 'add' ? 'Tambah Program Baru' : 'Edit Program Pembangunan'}
                      </h3>
                      <p className="text-xs text-slate-500">Lengkapi isian form usulan di bawah ini</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowProgramForm(false)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Body (Scrollable) */}
                <form onSubmit={handleProgramSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                  
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-bold text-slate-700">Judul Program *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Perbaikan Jalan RT 03"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm font-semibold"
                    />
                  </div>

                  {/* Short Description (max 150) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs sm:text-sm font-bold text-slate-700">Deskripsi Singkat (Maks 150 Karakter) *</label>
                      <span className={`text-2xs font-bold ${formShortDesc.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>
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
                      className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm font-medium"
                    />
                  </div>

                  {/* Full Description */}
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-bold text-slate-700">Deskripsi Lengkap *</label>
                    <textarea
                      required
                      placeholder="Detail informasi usulan pembangunan, manfaat bagi warga, target penyelesaian, dll..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm font-medium leading-relaxed"
                    />
                  </div>

                  {/* Grid row: Location & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Location */}
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-bold text-slate-700">Lokasi Program *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: RT 03 RW 01, Dusun Krajan"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm font-semibold"
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-xs sm:text-sm font-bold text-slate-700">Status Program *</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm font-semibold cursor-pointer"
                      >
                        {statusOptions.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Image Upload & URL input */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <label className="text-xs sm:text-sm font-bold text-slate-700 block">Gambar Program *</label>
                    
                    {/* Image preview */}
                    {formImageUrl && (
                      <div className="relative aspect-[16/8] max-w-xs bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Upload button or text URL input */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Local File Selector */}
                      <div className="sm:col-span-5">
                        <label className="w-full flex flex-col items-center justify-center py-4 bg-white hover:bg-slate-50 border border-dashed border-slate-300 hover:border-emerald-400 rounded-xl cursor-pointer transition-all">
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs font-bold text-slate-600">Pilih File Komputer</span>
                          <span className="text-3xs text-slate-400 mt-0.5">Maksimal 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingImage}
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        {uploadingImage && <p className="text-xs text-emerald-700 font-semibold mt-1">Sedang mengunggah...</p>}
                        {uploadError && <p className="text-xs text-red-500 font-semibold mt-1">{uploadError}</p>}
                      </div>

                      {/* URL input fallback */}
                      <div className="sm:col-span-7 flex flex-col justify-center space-y-1.5">
                        <span className="text-2xs font-extrabold text-slate-400">Atau masukkan Link Gambar eksternal:</span>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowProgramForm(false)}
                      className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loading || uploadingImage}
                      className="px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                      {loading ? 'Menyimpan...' : 'Simpan Program'}
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}

          {/* Programs Table / Grid list */}
          {programs.length > 0 ? (
            <div className="overflow-hidden border border-slate-100 bg-white rounded-3xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px] sm:text-xs tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Program</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4 text-center">Dukungan</th>
                      <th className="py-4 px-4">Lokasi</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {programs.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <img src={p.image_url} alt="" className="w-12 h-8 object-cover rounded-md border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                              <p className="text-2xs text-slate-400 mt-0.5 line-clamp-1">{p.short_description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 font-bold text-3xs rounded-md bg-emerald-50 border border-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-extrabold text-emerald-800 text-sm sm:text-base">
                          {p.votes_count}
                        </td>
                        <td className="py-4 px-4 max-w-[150px] truncate text-slate-500">
                          {p.location}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onSelectProgram(p.slug)}
                              title="Lihat Detail"
                              className="p-1.5 bg-slate-50 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditProgram(p)}
                              title="Ubah Program"
                              className="p-1.5 bg-slate-50 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProgram(p.id, p.title)}
                              title="Hapus Program"
                              className="p-1.5 bg-slate-50 text-slate-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

        </div>
      )}

      {/* ==================================== */}
      {/* TAB 3: MANAGE VOTES / SPAM           */}
      {/* ==================================== */}
      {activeTab === 'votes' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg sm:text-xl">Kelola Dukungan Warga</h3>
              <p className="text-xs text-slate-500 mt-0.5">Analisis keaslian hak suara dan hapus vote yang dicurigai sebagai spam harian.</p>
            </div>
          </div>

          {/* Filtering Tools Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            {/* Search */}
            <div className="relative sm:col-span-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama pendukung..."
                value={voteSearch}
                onChange={(e) => setVoteSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs transition-all"
              />
            </div>

            {/* RT filter */}
            <div className="relative sm:col-span-3">
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
            <div className="relative sm:col-span-4">
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

          {/* Supporters Grid Table */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <p className="text-slate-500 font-semibold animate-pulse text-sm">Sedang mengambil data dukungan...</p>
            </div>
          ) : votes.length > 0 ? (
            <div className="overflow-hidden border border-slate-100 bg-white rounded-3xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100 text-[10px] sm:text-xs tracking-wider">
                    <tr>
                      <th className="py-4 px-6">Pendukung</th>
                      <th className="py-4 px-4">RT</th>
                      <th className="py-4 px-4">Program Pilihan</th>
                      <th className="py-4 px-4">IP Address</th>
                      <th className="py-4 px-4">Waktu</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {votes.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-2xs">
                              {v.voter_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{v.voter_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded font-bold text-emerald-800 text-3xs">
                            {v.voter_rt}
                          </span>
                        </td>
                        <td className="py-4 px-4 max-w-[200px] truncate font-bold text-slate-700">
                          {v.program_title}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-500 text-2xs">
                          {v.ip_address}
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-2xs whitespace-nowrap">
                          {new Date(v.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteVote(v.id, v.voter_name)}
                            title="Hapus Dukungan (Deteksi Spam)"
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-700 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
