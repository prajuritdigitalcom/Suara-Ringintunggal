import { useState } from 'react';
import { Program, Vote } from '../types';
import { getStatusColor } from './ProgramCard';
import { 
  Heart, MapPin, Calendar, Users, Share2, 
  ArrowLeft, Search, Filter, ClipboardList, CheckCircle2 
} from 'lucide-react';

interface ProgramDetailProps {
  program: Program;
  votes: Vote[];
  onBack: () => void;
  onVoteClick: () => void;
  onShareClick: () => void;
}

export default function ProgramDetail({ program, votes, onBack, onVoteClick, onShareClick }: ProgramDetailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRt, setSelectedRt] = useState('Semua');

  const statusTheme = getStatusColor(program.status);

  // Get Progress Percentage based on status
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'Baru Dibuka': return { val: 5, label: 'Pengumpulan Dukungan Warga' };
      case 'Dalam Perencanaan': return { val: 25, label: 'Penyusunan Rencana Kerja (Rencana Teknis)' };
      case 'Menunggu Anggaran': return { val: 50, label: 'Pengajuan & Menunggu Persetujuan APBDes' };
      case 'Sedang Dikerjakan': return { val: 75, label: 'Pekerjaan Fisik Sedang Berjalan di Lapangan' };
      case 'Selesai': return { val: 100, label: 'Pekerjaan Selesai 100% & Dapat Digunakan Warga' };
      case 'Ditunda': return { val: 15, label: 'Ditangguhkan Sementara' };
      default: return { val: 0, label: 'Belum Dimulai' };
    }
  };

  const progress = getProgressPercentage(program.status);

  // Filter votes
  const filteredVotes = votes.filter(v => {
    const matchesSearch = v.voter_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRt = selectedRt === 'Semua' || v.voter_rt === selectedRt;
    return matchesSearch && matchesRt;
  });

  const rtOptions = ['Semua', 'RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06', 'RT 07', 'RT 08', 'RT 09', 'RT 10'];

  // Format local date Indonensia
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8 pb-24">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base font-bold">Kembali ke Beranda</span>
        </button>
        
        <button
          onClick={onShareClick}
          className="inline-flex items-center space-x-1.5 px-4 py-2 hover:bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full transition-all text-xs sm:text-sm font-semibold cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Bagikan</span>
        </button>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
        {/* Banner Image */}
        <div className="relative aspect-[21/9] sm:aspect-[21/8] bg-slate-100 overflow-hidden">
          <img
            src={program.image_url}
            alt={program.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 z-10">
            <span className={`inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs sm:text-sm font-extrabold rounded-full border shadow-md ${statusTheme.bg}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${statusTheme.dot}`} />
              <span>{program.status}</span>
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 sm:p-10 space-y-6">
          
          <div className="space-y-3">
            {/* Metadata row */}
            <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-500 font-medium border-b border-slate-50 pb-4">
              <span className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{program.location}</span>
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Diusulkan: {formatDate(program.created_at)}</span>
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display font-extrabold text-2xl sm:text-3.5xl text-slate-900 tracking-tight leading-tight pt-2">
              {program.title}
            </h2>
          </div>

          {/* Support Stats Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                <Heart className="w-8 h-8 fill-emerald-600 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">
                  {program.votes_count}
                </p>
                <p className="text-xs sm:text-sm text-emerald-800 font-semibold mt-1">
                  Warna Desa memberikan dukungan
                </p>
              </div>
            </div>
            
            <button
              onClick={onVoteClick}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-extrabold rounded-xl shadow-lg shadow-emerald-200 transition-all text-center cursor-pointer flex items-center justify-center space-x-2 shrink-0 hover:scale-101 active:scale-99"
            >
              <Heart className="w-5 h-5 fill-white" />
              <span>Dukung Program Ini</span>
            </button>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">
              Deskripsi Lengkap Usulan
            </h4>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal whitespace-pre-line">
              {program.description}
            </p>
          </div>

          {/* Progress Section */}
          <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-extrabold uppercase text-slate-500 tracking-wider">
                Progress Realisasi
              </h4>
              <span className={`text-xs sm:text-sm font-bold ${program.status === 'Selesai' ? 'text-emerald-700 bg-emerald-100/50' : 'text-purple-700 bg-purple-100/50'} px-2.5 py-0.5 rounded-md`}>
                {progress.val}%
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${program.status === 'Selesai' ? 'bg-emerald-600' : 'bg-emerald-500'}`}
                style={{ width: `${progress.val}%` }}
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              <span className="font-bold text-slate-800">Tahapan saat ini: </span>
              {progress.label}
            </p>
          </div>

        </div>
      </div>

      {/* Transparent Supporters Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-slate-900 text-lg">
                Daftar Pendukung ({votes.length})
              </h3>
              <p className="text-xs text-slate-500">Transparansi dukungan warga desa secara terbuka</p>
            </div>
          </div>
        </div>

        {/* Filters and Searching */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="relative sm:col-span-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pendukung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm transition-all"
            />
          </div>

          <div className="relative sm:col-span-4 flex items-center space-x-2">
            <Filter className="w-4.5 h-4.5 text-slate-400 shrink-0 hidden sm:inline" />
            <select
              value={selectedRt}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm font-semibold cursor-pointer transition-all"
            >
              {rtOptions.map(rt => (
                <option key={rt} value={rt}>{rt === 'Semua' ? 'Semua RT' : rt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Supporter List Table / List */}
        {filteredVotes.length > 0 ? (
          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <div className="divide-y divide-slate-100">
              {filteredVotes.map((vote, idx) => (
                <div key={vote.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                      {vote.voter_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm sm:text-base">
                        {vote.voter_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Warga <span className="font-bold text-emerald-800">{vote.voter_rt}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-slate-400">
                      Mendukung pada
                    </p>
                    <p className="text-xs text-slate-600 font-medium">
                      {formatDate(vote.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-500 text-sm">Tidak ada pendukung ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pencarian atau filter RT Anda.</p>
          </div>
        )}
      </div>

      {/* Persistent Floating Sticky Bottom Support Bar for Smartphones */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100/80 -mx-4 -mb-24 flex items-center justify-between gap-3 z-30 shadow-lg">
        <div className="flex items-center space-x-2 shrink-0">
          <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-black text-slate-900 leading-none">{program.votes_count}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Dukungan</p>
          </div>
        </div>
        
        <button
          onClick={onVoteClick}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs shadow-emerald-200 transition-all text-center cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <Heart className="w-4 h-4 fill-white shrink-0" />
          <span>Dukung Usulan Ini</span>
        </button>
      </div>
    </div>
  );
}
