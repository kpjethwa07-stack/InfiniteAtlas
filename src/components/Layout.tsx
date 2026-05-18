import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plane, User, LogOut, Compass, ShieldCheck, Menu, X, Heart } from 'lucide-react';
import { AnimatedLogo } from './AnimatedLogo';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, ThemeType } from '../contexts/ThemeContext';

interface SidebarProps {
  user: any;
  isAdmin: boolean;
  pathname: string;
  t: (key: string) => string;
  setMobileOpen: (open: boolean) => void;
}

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="px-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/[0.04] dark:border-white/[0.04] space-y-1.5 shrink-0">
      <span className="text-[9px] font-black uppercase tracking-wider opacity-40 block">Aesthetic Theme</span>
      <div className="grid grid-cols-3 gap-1.5">
        <button 
          onClick={() => setTheme('sand')}
          className={cn(
            "h-7 rounded-lg text-[9px] font-black transition-all cursor-pointer",
            theme === 'sand' 
              ? "bg-[#F5F2ED] text-black border border-black/10 shadow-sm" 
              : "text-black/40 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800"
          )}
        >
          🏜️ Sand
        </button>
        <button 
          onClick={() => setTheme('midnight')}
          className={cn(
            "h-7 rounded-lg text-[9px] font-black transition-all cursor-pointer",
            theme === 'midnight' 
              ? "bg-cyan-500 text-black border border-cyan-400 shadow-sm" 
              : "text-black/40 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800"
          )}
        >
          🌌 Cyber
        </button>
        <button 
          onClick={() => setTheme('sunset')}
          className={cn(
            "h-7 rounded-lg text-[9px] font-black transition-all cursor-pointer",
            theme === 'sunset' 
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm" 
              : "text-black/40 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800"
          )}
        >
          🌆 Sunset
        </button>
      </div>
    </div>
  );
};

const SidebarContent = ({ user, isAdmin, pathname, t, setMobileOpen }: SidebarProps) => {
  const { theme } = useTheme();
  
  const navItems = [
    { icon: Home, label: t('dashboard'), path: '/' },
    { icon: Plane, label: t('myTrips'), path: '/trips' },
    { icon: Compass, label: t('explore'), path: '/explore' },
    { icon: User, label: t('profile'), path: '/profile' },
  ];

  if (isAdmin) {
    navItems.push({ icon: ShieldCheck, label: 'Admin', path: '/admin' });
  }

  const getTimeEmoji = () => {
    const h = new Date().getHours();
    if (h < 6) return '🌙';
    if (h < 12) return '☀️';
    if (h < 17) return '🌤️';
    if (h < 20) return '🌅';
    return '🌙';
  };

  const isDark = theme === 'midnight' || theme === 'sunset';

  return (
    <>
      <div className="p-6 pb-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <AnimatedLogo size="md" />
          <span className={cn(
            "text-xl font-bold tracking-tight",
            isDark ? "text-white" : "text-black"
          )}>Infinity Atlas</span>
        </Link>
      </div>

      <div className={cn(
        "mx-4 mb-4 px-4 py-3 rounded-2xl shrink-0 border",
        theme === 'sand' && "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100 text-orange-700",
        theme === 'midnight' && "bg-slate-900/60 border-slate-800/80 text-cyan-400",
        theme === 'sunset' && "bg-purple-950/30 border-purple-900/40 text-pink-400"
      )}>
        <p className="text-xs font-semibold">
          {getTimeEmoji()} Welcome, {user?.displayName?.split(' ')[0] || 'Traveler'}
        </p>
        <p className={cn(
          "text-[10px] mt-0.5 italic",
          theme === 'sand' && "text-orange-500/70",
          theme === 'midnight' && "text-slate-400",
          theme === 'sunset' && "text-purple-300"
        )}>Make today an adventure</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? (
                      theme === 'sand' && "bg-black text-white shadow-lg shadow-black/10" ||
                      theme === 'midnight' && "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" ||
                      theme === 'sunset' && "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25"
                    )
                  : (
                      isDark 
                        ? "text-slate-400 hover:bg-slate-800 hover:text-white" 
                        : "text-black/50 hover:bg-black/[0.04] hover:text-black"
                    )
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={cn(
        "p-4 space-y-3 mt-auto border-t",
        isDark ? "bg-[#0F131C] border-slate-800/80" : "bg-white border-black/[0.06]"
      )}>
        <ThemeSwitcher />
        
        <div className="flex items-center gap-3 px-3 py-2">
          <img 
            src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel'} 
            alt="Avatar" 
            className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col min-w-0">
            <span className={cn("text-sm font-semibold truncate", isDark ? "text-white" : "text-black")}>
              {user?.displayName || 'Traveler'}
            </span>
            <span className={cn("text-[11px] truncate", isDark ? "text-slate-400" : "text-black/35")}>
              {user?.email}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 rounded-xl text-sm h-10",
            isDark 
              ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10" 
              : "text-black/40 hover:text-red-500 hover:bg-red-50"
          )}
          onClick={() => { auth.signOut(); setMobileOpen(false); }}
        >
          <LogOut className="w-4 h-4" />
          {t('signOut')}
        </Button>
        <p className={cn(
          "text-center text-[9px] flex items-center justify-center gap-1 pt-1",
          isDark ? "text-slate-500" : "text-black/20"
        )}>
          Made with <Heart className="w-2.5 h-2.5 fill-red-400 text-red-400" /> by Infinity Atlas
        </p>
      </div>
    </>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = theme === 'midnight' || theme === 'sunset';

  return (
    <div className={cn(
      "flex h-screen overflow-hidden transition-colors duration-500",
      theme === 'sand' && "bg-[#F5F2ED]",
      theme === 'midnight' && "bg-[#0A0D14]",
      theme === 'sunset' && "bg-[#0C0819]"
    )}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex w-64 flex-col transition-colors duration-500",
        theme === 'sand' && "bg-white border-r border-black/[0.06]",
        theme === 'midnight' && "bg-[#0F131C] border-r border-slate-800/85",
        theme === 'sunset' && "bg-[#130E26] border-r border-purple-950/80"
      )}>
        <SidebarContent user={user} isAdmin={isAdmin} pathname={pathname} t={t} setMobileOpen={setMobileOpen} />
      </aside>

      {/* Mobile Header */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between border-b transition-colors duration-500",
        theme === 'sand' && "bg-white/80 backdrop-blur-xl border-black/[0.06]",
        theme === 'midnight' && "bg-[#0F131C]/80 backdrop-blur-xl border-slate-800/80",
        theme === 'sunset' && "bg-[#130E26]/80 backdrop-blur-xl border-purple-950/80"
      )}>
        <Link to="/" className="flex items-center gap-2">
          <AnimatedLogo size="sm" />
          <span className={cn("text-lg font-bold tracking-tight", isDark ? "text-white" : "text-black")}>Infinity Atlas</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-xl"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setMobileOpen(false)} />
          <aside className={cn(
            "absolute left-0 top-0 bottom-0 w-72 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300",
            theme === 'sand' && "bg-white",
            theme === 'midnight' && "bg-[#0F131C]",
            theme === 'sunset' && "bg-[#130E26]"
          )}>
            <SidebarContent user={user} isAdmin={isAdmin} pathname={pathname} t={t} setMobileOpen={setMobileOpen} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8 pt-20 md:pt-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
