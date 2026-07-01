import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProgramCard from './components/ProgramCard';
import ProgramDetail from './components/ProgramDetail';
import ShareModal from './components/ShareModal';
import AdminPanel from './components/AdminPanel';
import { Program, Vote, ViewType } from './types';
import { 
  Heart, Sparkles, ClipboardList, Info, HelpCircle, 
  Search, Filter, Lock, Eye, CheckCircle, ArrowUpRight, LayoutGrid 
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedProgramVotes, setSelectedProgramVotes] = useState<Vote[]>([]);
  
  // Searching & Filtering programs on Home page
  const [homeSearch, setHomeSearch] = useState('');
  const [homeStatusFilter, setHomeStatusFilter] = useState('Semua');

  // Modals state
  const [activeProgramForVote, setActiveProgramForVote] = useState<Program | null>(null);
  const [activeProgramForShare, setActiveProgramForShare] = useState<Program | null>(null);

  // Admin session states
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('rt_admin_token');
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Statistics for Public Page
  const [publicStats, setPublicStats] = useState({
    totalPrograms: 0,
    totalVotes: 0,
    popularProgram: '',
    popularProgramSlug: ''
  });

  // 1. Initial Load and URL Parsing (Support for shared link parameters)
  useEffect(() => {
    fetchProgramsList();
    
    // Parse URL Query Params: e.g., /?program=slug-name
    const params = new URLSearchParams(window.location.search);
    const programSlug = params.get('program');
    
    // Parse Hash fallback: e.g., /#/program/slug-name
    const hash = window.location.hash;
    const hashMatch = hash.match(/#\/program\/([a-zA-Z0-9-]+)/);
    const finalSlug = programSlug || (hashMatch ? hashMatch[1] : null);

    if (finalSlug) {
      handleSelectProgramBySlug(finalSlug);
    }
  }, []);

  // Sync programs to calculate public statistics whenever program list is updated
  useEffect(() => {
    if (programs.length > 0) {
      const totalVotes = programs.reduce((acc, curr) => acc + curr.votes_count, 0);
      const sorted = [...programs].sort((a, b) => b.votes_count - a.votes_count);
      setPublicStats({
        totalPrograms: programs.length,
        totalVotes,
        popularProgram: sorted[0] ? sorted[0].title : '-',
        popularProgramSlug: sorted[0] ? sorted[0].slug : ''
      });
    }
  }, [programs]);

  const fetchProgramsList = async () => {
    try {
      const res = await fetch('/api/programs');
      if (res.ok) {
        const data = await res.json();
        setPrograms(data);
      }
    } catch (err) {
      console.error("Failed to fetch programs:", err);
    }
  };

  const handleSelectProgramBySlug = async (slug: string) => {
    try {
      const res = await fetch(`/api/programs/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProgram(data.program);
        setSelectedProgramVotes(data.votes);
        setCurrentView('detail');
        // Update browser URL hash/history quietly to keep share links valid
        window.history.replaceState(null, '', `?program=${slug}`);
      } else {
        console.error("Program not found for slug:", slug);
        setCurrentView('home');
        window.history.replaceState(null, '', '/');
      }
    } catch (err) {
      console.error(err);
      setCurrentView('home');
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedProgram(null);
    setSelectedProgramVotes([]);
    window.history.replaceState(null, '', '/');
    fetchProgramsList(); // Refresh lists
  };

  const handleNavigate = (view: ViewType) => {
    if (view === 'home') {
      handleBackToHome();
    } else {
      setCurrentView(view);
    }
  };

  // 2. Admin Login Action
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setLoginError('Lengkapi seluruh formulir login.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: adminEmail.trim(),
          password: adminPassword.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setAdminToken(data.token);
        localStorage.setItem('rt_admin_token', data.token);
        setCurrentView('admin-dashboard');
        // reset form
        setAdminEmail('');
        setAdminPassword('');
      } else {
        setLoginError(data.error || 'Email atau Password salah.');
      }
    } catch (err) {
      setLoginError('Gagal menghubungkan ke server. Silakan coba lagi.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('rt_admin_token');
    handleBackToHome();
  };

  // Filter programs based on home search & status filter
  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(homeSearch.toLowerCase()) || 
                          p.location.toLowerCase().includes(homeSearch.toLowerCase());
    const matchesStatus = homeStatusFilter === 'Semua' || p.status === homeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_45%)] flex items-center justify-center p-0 md:p-6 lg:p-8 select-none font-sans overflow-hidden">
      
      {/* Decorative Blur Backgrounds for Desktop */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none hidden lg:block" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none hidden lg:block" />

      {/* Desktop Info Left Column (hidden on mobile/tablet) */}
      <div className="hidden lg:flex flex-col max-w-sm text-slate-100 space-y-6 mr-12 z-10 select-none">
        <div className="flex items-center space-x-3">
          <img 
            src="https://i.ibb.co.com/tTzpHtJc/logo-ringintunggal-1.webp" 
            alt="Logo Desa Ringintunggal" 
            className="h-16 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-xl font-display font-black text-emerald-400 tracking-tight leading-none">
              Suara Warga
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Desa Ringintunggal
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ● PRIORITAS MOBILE AKTIF
          </span>
          <h2 className="text-3xl font-display font-bold leading-tight tracking-tight">
            Desain Khusus Smartphone & Layar Sentuh
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sistem Suara Warga ini dirancang dan dioptimalkan secara menyeluruh untuk kenyamanan warga yang mengakses melalui handphone.
          </p>
        </div>

        <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 space-y-3 text-xs text-slate-300">
          <p className="font-bold text-emerald-400">Keunggulan Desain Mobile-First:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Navigasi ringkas dengan satu jempol</li>
            <li>Pilihan status menggunakan tombol scroll kesamping</li>
            <li>Formulir & Captcha responsif sentuhan</li>
            <li>Optimasi gambar berkecepatan tinggi</li>
          </ul>
        </div>
      </div>

      {/* Smartphone Outer Container */}
      <div className="w-full max-w-md md:max-w-[430px] h-screen md:h-[860px] md:max-h-[92vh] bg-slate-50 flex flex-col justify-between md:rounded-[40px] md:shadow-2xl md:border-[10px] md:border-slate-800 relative overflow-hidden shrink-0 z-10">
        
        {/* Simulated Smartphone Notch (Desktop only) */}
        <div className="hidden md:block h-6 bg-slate-800 shrink-0 z-50">
          <div className="w-24 h-4 bg-slate-900 rounded-b-xl mx-auto flex items-center justify-center">
            <div className="w-8 h-1 bg-slate-700 rounded-full" />
          </div>
        </div>

        {/* Outer app wrapper with custom scrollbar behavior */}
        <div className="flex-1 flex flex-col overflow-y-auto select-none scrollbar-none bg-slate-50 relative">
          
          {/* Header Navigation */}
          <Header
            currentView={currentView}
            onNavigate={handleNavigate}
            isAdminLoggedIn={!!adminToken}
            onLogout={handleAdminLogout}
          />

          {/* Main Container */}
          <main className="flex-1 flex flex-col">

            {/* ======================================= */}
            {/* VIEW 1: HOME PAGE (Warga View)          */}
            {/* ======================================= */}
            {currentView === 'home' && (
              <div className="space-y-5 pb-10 animate-fadeIn">
                
                {/* Modern & Premium Hero Card - Optimized for mobile view */}
                <section className="px-4 pt-5">
                  <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-lg shadow-emerald-950/20">
                    {/* Abstract smooth glow overlays for modern organic look */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                      {/* Interactive sleek badge */}
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-extrabold uppercase tracking-widest text-white border border-white/10">
                        <Sparkles className="w-3 h-3 text-white animate-pulse" />
                        <span>Membangun Desa Bersama</span>
                      </span>

                      <div className="space-y-1.5">
                        <h2 className="font-display font-black text-2xl tracking-tight leading-tight text-white drop-shadow-xs">
                          Suara Warga<br />
                          Desa Ringintunggal
                        </h2>
                        <p className="text-[11px] text-white font-medium max-w-xs mx-auto leading-relaxed">
                          Dukungan suara Anda menentukan realisasi prioritas pembangunan desa yang transparan, bersih, & akuntabel.
                        </p>
                      </div>

                      {/* Info Bar */}
                      <div className="flex items-center space-x-1.5 bg-black/25 border border-white/5 rounded-2xl px-3 py-2 text-[10px] text-white max-w-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                        <span className="text-left leading-tight">Urutan berdasarkan suara terbanyak warga.</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Compact Public Statistics Row - Re-designed to 2 Rows */}
                <section className="px-4 space-y-2">
                  {/* Grid 1: Isi 2 (Usulan dan Dukungan) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 text-center">
                      <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Usulan Pembangunan</p>
                      <p className="text-base font-black text-slate-900 mt-0.5">{publicStats.totalPrograms} Program</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 text-center">
                      <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Dukungan Warga</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">{publicStats.totalVotes} Suara</p>
                    </div>
                  </div>

                  {/* Grid 2: Isi 1 (Teratas), Clickable to navigate to Detail Page */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 rounded-2xl border border-amber-500/15 p-3.5">
                    <p className="text-[9px] font-extrabold uppercase text-amber-800 tracking-wider flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Prioritas Teratas Warga saat ini:</span>
                    </p>
                    {publicStats.popularProgramSlug ? (
                      <button
                        onClick={() => handleSelectProgramBySlug(publicStats.popularProgramSlug)}
                        className="w-full text-left mt-1.5 group flex items-center justify-between text-xs font-black text-slate-900 hover:text-emerald-700 transition-all cursor-pointer"
                      >
                        <span className="truncate pr-2 group-hover:underline">{publicStats.popularProgram}</span>
                        <span className="text-[10px] text-amber-700 font-extrabold bg-amber-500/20 px-2 py-0.5 rounded-md flex items-center shrink-0">
                          <span>Detail</span>
                          <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </button>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 mt-1.5">-</p>
                    )}
                  </div>
                </section>

                {/* Programs Section with Search and Filters */}
                <section className="px-4 space-y-4">
                  
                  {/* Filter controls bar */}
                  <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari program atau lokasi..."
                        value={homeSearch}
                        onChange={(e) => setHomeSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-emerald-500 rounded-2xl outline-none text-xs transition-all font-medium shadow-2xs"
                      />
                    </div>

                    {/* Touch-Friendly Horizontal Filter Pills */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
                      {['Semua', 'Baru Dibuka', 'Prioritas Tinggi', 'Menunggu Anggaran', 'Dalam Perencanaan', 'Sedang Dikerjakan', 'Selesai', 'Ditunda'].map((status) => {
                        const isSelected = homeStatusFilter === status;
                        return (
                          <button
                            key={status}
                            onClick={() => setHomeStatusFilter(status)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200' 
                                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic single-column layout for easy scrolling on mobile */}
                  {filteredPrograms.length > 0 ? (
                    <div className="space-y-4">
                      {filteredPrograms.map((program) => (
                        <ProgramCard
                          key={program.id}
                          program={program}
                          onSelect={(slug: string) => { handleSelectProgramBySlug(slug); }}
                          onShare={(p: Program) => { setActiveProgramForShare(p); }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 px-4">
                      <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="font-display font-bold text-slate-500 text-sm">Tidak ada program ditemukan</p>
                      <p className="text-xs text-slate-400 mt-1">Sesuaikan kata kunci atau filter status.</p>
                    </div>
                  )}

                </section>
              </div>
            )}

            {/* ======================================= */}
            {/* VIEW 2: PROGRAM DETAIL PAGE             */}
            {/* ======================================= */}
            {currentView === 'detail' && selectedProgram && (
              <div className="animate-fadeIn">
                <ProgramDetail
                  program={selectedProgram}
                  votes={selectedProgramVotes}
                  onBack={handleBackToHome}
                  onVoteSuccess={() => {
                    fetchProgramsList();
                    if (selectedProgram) {
                      handleSelectProgramBySlug(selectedProgram.slug);
                    }
                  }}
                  onShareClick={() => setActiveProgramForShare(selectedProgram)}
                />
              </div>
            )}

            {/* ======================================= */}
            {/* VIEW 3: ADMIN LOGIN PAGE                */}
            {/* ======================================= */}
            {currentView === 'admin-login' && (
              <div className="px-4 py-8 animate-fadeIn">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-center text-white space-y-1.5">
                    <Lock className="w-8 h-8 mx-auto" />
                    <h3 className="font-display font-black text-xl tracking-tight leading-none">
                      Sistem Autentikasi
                    </h3>
                    <p className="text-[10px] text-emerald-100 font-medium">
                      Khusus Administrator Desa Ringintunggal
                    </p>
                  </div>

                  <form onSubmit={handleAdminLoginSubmit} className="p-5 space-y-4">
                    {loginError && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label htmlFor="email" className="text-xs font-bold text-slate-700">Email Admin *</label>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        disabled={loginLoading}
                        className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="pass" className="text-xs font-bold text-slate-700">Password *</label>
                      <input
                        id="pass"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        disabled={loginLoading}
                        className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-xs font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-100 transition-all cursor-pointer"
                    >
                      {loginLoading ? 'Memproses Masuk...' : 'Masuk Administrator'}
                    </button>


                  </form>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* VIEW 4: ADMIN DASHBOARD PANEL           */}
            {/* ======================================= */}
            {currentView === 'admin-dashboard' && adminToken && (
              <div className="animate-fadeIn">
                <AdminPanel
                  token={adminToken}
                  onLogout={handleAdminLogout}
                  onNavigateHome={handleBackToHome}
                  onSelectProgram={(slug) => handleSelectProgramBySlug(slug)}
                />
              </div>
            )}

          </main>

          {/* Persistent Mobile Footer */}
          <footer className="bg-white border-t border-slate-100 py-6 text-center shrink-0 mt-auto">
            <div className="px-4 space-y-4">
              {/* Logo & Nama Website */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <img 
                  src="https://i.ibb.co.com/tTzpHtJc/logo-ringintunggal-1.webp" 
                  alt="Logo Ringintunggal" 
                  className="h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-slate-800 font-black text-xs tracking-tight uppercase">
                  Suara Warga Ringintunggal
                </span>
              </div>

              {/* Copyright & Info */}
              <div className="text-[10px] text-slate-400 font-semibold space-y-1">
                <p>© 2026 Desa Ringintunggal Kecamatan Gayam Kabupaten Bojonegoro.</p>
                <p>Hak Cipta Dilindungi Undang-Undang.</p>
              </div>

              {/* Pindah Tombol Admin ke Footer */}
              <div className="pt-2.5 border-t border-slate-50 flex justify-center">
                {adminToken ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleNavigate('admin-dashboard')}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/60 text-emerald-800 rounded-full text-[10px] font-extrabold border border-emerald-100/50 cursor-pointer transition-all"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Panel Admin</span>
                    </button>
                    <button
                      onClick={handleAdminLogout}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100/60 text-rose-700 rounded-full text-[10px] font-extrabold border border-rose-100/50 cursor-pointer transition-all"
                    >
                      <span>Keluar</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavigate('admin-login')}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-full text-[10px] font-extrabold border border-slate-200 transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Akses Administrator Desa</span>
                  </button>
                )}
              </div>
            </div>
          </footer>

        </div>
      </div>

      {/* ======================================= */}
      {/* GLOBAL MODALS INJECTION                 */}
      {/* ======================================= */}

      {/* 1. Share Dialog Modal */}
      <ShareModal
        program={activeProgramForShare}
        isOpen={activeProgramForShare !== null}
        onClose={() => setActiveProgramForShare(null)}
      />

    </div>
  );
}
