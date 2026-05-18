import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plane, User, LogOut, Compass, ShieldCheck, Menu, X, Heart } from 'lucide-react';
import { AnimatedLogo } from './AnimatedLogo';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  user: any;
  isAdmin: boolean;
  pathname: string;
  t: (key: string) => string;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContent = ({ user, isAdmin, pathname, t, setMobileOpen }: SidebarProps) => {
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

  return (
    <>
      <div className="p-6 pb-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <AnimatedLogo size="md" />
          <span className="text-xl font-bold tracking-tight">Infinity Atlas</span>
        </Link>
      </div>

      <div className="mx-4 mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 shrink-0">
        <p className="text-xs font-semibold text-orange-700">
          {getTimeEmoji()} {t('welcome')}, {user?.displayName?.split(' ')[0] || 'Traveler'}
        </p>
        <p className="text-[10px] text-orange-500/70 mt-0.5 italic">Make today an adventure</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
              pathname === item.path 
                ? "bg-black text-white shadow-lg shadow-black/10" 
                : "text-black/50 hover:bg-black/[0.04] hover:text-black"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-black/[0.06] space-y-3 bg-white mt-auto">
        <div className="flex items-center gap-3 px-3 py-2">
          <img 
            src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel'} 
            alt="Avatar" 
            className="w-10 h-10 rounded-xl border border-black/10 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{user?.displayName || 'Traveler'}</span>
            <span className="text-[11px] text-black/35 truncate">{user?.email}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 rounded-xl text-black/40 hover:text-red-500 hover:bg-red-50 text-sm h-10"
          onClick={() => { auth.signOut(); setMobileOpen(false); }}
        >
          <LogOut className="w-4 h-4" />
          {t('signOut')}
        </Button>
        <p className="text-center text-[9px] text-black/20 flex items-center justify-center gap-1 pt-1">
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F2ED] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-black/[0.06] flex-col bg-white">
        <SidebarContent user={user} isAdmin={isAdmin} pathname={pathname} t={t} setMobileOpen={setMobileOpen} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <AnimatedLogo size="sm" />
          <span className="text-lg font-bold tracking-tight">Infinity Atlas</span>
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
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
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
