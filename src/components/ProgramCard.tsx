import { Program } from '../types';
import { Heart, MapPin, Share2, ArrowRight } from 'lucide-react';

interface ProgramCardProps {
  key?: any;
  program: Program;
  onSelect: (slug: string) => void | Promise<void>;
  onShare: (program: Program) => void | Promise<void>;
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Baru Dibuka':
      return { bg: 'bg-teal-50 border-teal-200 text-teal-800', dot: 'bg-teal-500' };
    case 'Prioritas Tinggi':
      return { bg: 'bg-rose-50 border-rose-200 text-rose-800', dot: 'bg-rose-500 animate-pulse' };
    case 'Menunggu Anggaran':
      return { bg: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500' };
    case 'Dalam Perencanaan':
      return { bg: 'bg-sky-50 border-sky-200 text-sky-800', dot: 'bg-sky-500' };
    case 'Sedang Dikerjakan':
      return { bg: 'bg-purple-50 border-purple-200 text-purple-800', dot: 'bg-purple-500' };
    case 'Selesai':
      return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' };
    case 'Ditunda':
      return { bg: 'bg-slate-50 border-slate-200 text-slate-800', dot: 'bg-slate-400' };
    default:
      return { bg: 'bg-slate-50 border-slate-200 text-slate-800', dot: 'bg-slate-500' };
  }
};

export default function ProgramCard({ program, onSelect, onShare }: ProgramCardProps) {
  const statusTheme = getStatusColor(program.status);

  return (
    <article className="group bg-white rounded-3xl border border-slate-100 hover:border-emerald-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full duration-300">
      
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(program.slug)}>
        <img
          src={program.image_url}
          alt={program.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${statusTheme.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusTheme.dot}`} />
            <span>{program.status}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        
        <div className="space-y-3">
          {/* Location */}
          <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="line-clamp-1">{program.location}</span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelect(program.slug)}
            className="font-display font-bold text-slate-800 text-lg sm:text-xl leading-snug hover:text-emerald-700 cursor-pointer transition-colors"
          >
            {program.title}
          </h3>

          {/* Short description */}
          <p className="text-sm sm:text-base text-slate-600 line-clamp-3 leading-relaxed">
            {program.short_description}
          </p>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
          {/* Support Counter */}
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-950 px-4 py-2 rounded-2xl">
            <Heart className="w-4.5 h-4.5 text-emerald-600 fill-emerald-600 shrink-0" />
            <div>
              <p className="text-base sm:text-lg font-extrabold leading-none">
                {program.votes_count}
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-emerald-700">
                Dukungan
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Share Button */}
            <button
              onClick={() => onShare(program)}
              title="Bagikan program ini"
              className="p-2.5 sm:p-3 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-2xl border border-transparent hover:border-emerald-100 transition-all cursor-pointer"
            >
              <Share2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>

            {/* View Detail Button */}
            <button
              onClick={() => onSelect(program.slug)}
              className="inline-flex items-center space-x-1 px-4 py-2.5 sm:px-5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group/btn"
            >
              <span>Detail</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </div>

      </div>
    </article>
  );
}
