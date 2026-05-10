import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Plane, User, Settings, LogOut, Compass, ShieldCheck } from 'lucide-react';
import { AnimatedLogo } from './AnimatedLogo';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Plane, label: 'My Trips', path: '/trips' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  if (isAdmin) {
    navItems.push({ icon: ShieldCheck, label: 'Admin', path: '/admin' });
  }

  return (
    <div className="flex h-screen bg-[#F5F2ED] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1a1a1a1a] flex flex-col bg-white">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-2">
            <AnimatedLogo size="md" />
            <span className="text-2xl font-bold tracking-tight">Infinity Atlas</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors",
                pathname === item.path 
                  ? "bg-black text-white" 
                  : "text-black/60 hover:bg-black/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1a1a1a1a] space-y-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <img 
              src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel'} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border border-black/10"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate max-w-[120px]">{user?.displayName || 'Traveler'}</span>
              <span className="text-xs text-black/40 truncate max-w-[120px]">{user?.email}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 rounded-full text-black/60 hover:text-black"
            onClick={() => auth.signOut()}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
