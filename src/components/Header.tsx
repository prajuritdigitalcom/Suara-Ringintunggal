import { LayoutGrid, Lock, ArrowLeft, Vote } from 'lucide-react';
import { ViewType } from '../types';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Header({ currentView, onNavigate, isAdminLoggedIn, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <img 
              src="https://i.ibb.co.com/tTzpHtJc/logo-ringintunggal-1.webp" 
              alt="Logo Desa Ringintunggal" 
              className="h-10 w-auto object-contain sm:h-12"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-sm sm:text-base md:text-lg font-display font-extrabold text-slate-900 tracking-tight leading-tight">
                Desa Ringintunggal
              </h1>
              <p className="text-[8px] sm:text-[11px] text-emerald-600 font-bold whitespace-nowrap leading-none mt-0.5 sm:mt-1">
                Kecamatan Gayam Kabupaten Bojonegoro
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center space-x-2">
            {currentView !== 'home' && (
              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-full transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
