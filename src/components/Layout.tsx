import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plane, User, LogOut, Compass, ShieldCheck, Menu, X, Heart } from 'lucide-react';
import { AnimatedLogo } from './AnimatedLogo';
import { FloatingOrbs } from './FloatingOrbs';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

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
        <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <AnimatedLogo size="md" />
          <span className="text-xl font-bold tracking-tight text-white">Infinity Atlas</span>
        </Link>
      </div>

      {/* Greeting card */}
      <div className="mx-4 mb-5 px-5 py-4 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
        <p className="text-xs font-semibold text-white/70">
          {getTimeEmoji()} Welcome back, {user?.displayName?.split(' ')[0] || 'Traveler'}
        </p>
        <p className="text-[10px] mt-1 text-white/30 italic">
          Make today an adventure
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item, i) => {
          const isActive = pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-orange-500/90 to-amber-500/80 text-white shadow-lg shadow-orange-500/15"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 space-y-3 mt-auto border-t border-white/[0.04] bg-[#0B0E15]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="relative">
            <img
              src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel'}
              alt="Avatar"
              className="w-10 h-10 rounded-xl border border-white/10 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0B0E15]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate">
              {user?.displayName || 'Traveler'}
            </span>
            <span className="text-[11px] text-white/25 truncate">
              {user?.email}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 text-sm h-10"
          onClick={() => { auth.signOut(); setMobileOpen(false); }}
        >
          <LogOut className="w-4 h-4" />
          {t('signOut')}
        </Button>
        <p className="text-center text-[9px] text-white/15 flex items-center justify-center gap-1 pt-1">
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
    <div className="flex h-screen overflow-hidden bg-[#080B12] text-white">
      {/* Ambient floating orbs behind everything */}
      <FloatingOrbs />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0B0E15]/90 backdrop-blur-2xl border-r border-white/[0.04] relative z-10">
        <SidebarContent user={user} isAdmin={isAdmin} pathname={pathname} t={t} setMobileOpen={setMobileOpen} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0B0E15]/80 backdrop-blur-2xl border-b border-white/[0.04] px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <AnimatedLogo size="sm" />
          <span className="text-lg font-bold tracking-tight text-white">Infinity Atlas</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-white/60"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#0B0E15] flex flex-col shadow-2xl"
          >
            <SidebarContent user={user} isAdmin={isAdmin} pathname={pathname} t={t} setMobileOpen={setMobileOpen} />
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-6xl mx-auto p-6 md:p-8 pt-20 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
