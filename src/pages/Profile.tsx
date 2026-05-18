import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Shield, Camera, LogOut, Map, Award, Settings, Trash2, ChevronRight, Globe, Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function Profile() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const tripsRef = collection(db, 'trips');
  const userTripsQuery = query(tripsRef, where('ownerId', '==', user?.uid));
  const [tripsSnapshot] = useCollection(user?.uid ? userTripsQuery : null);
  const tripsCount = tripsSnapshot?.docs.length || 0;

  const handleUpdate = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });
      await auth.currentUser.reload();
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          displayName,
          updatedAt: new Date(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        throw error;
      }
      toast.success('Identity synchronized');
    } catch (e) {
      toast.error('Failed to update identity');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success('Signed out successfully');
    } catch (e) {
      toast.error('Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !user) return;
    const confirmDelete = window.confirm("This action is permanent and will erase all your travel history. Proceed?");
    if (!confirmDelete) return;
    setLoading(true);
    try {
      const uid = user.uid;
      const tripsQuery = query(collection(db, 'trips'), where('ownerId', '==', uid));
      const tripsSnap = await getDocs(tripsQuery);
      const batch = writeBatch(db);
      tripsSnap.docs.forEach((doc) => batch.delete(doc.ref));
      batch.delete(doc(db, 'users', uid));
      await batch.commit();
      await deleteUser(auth.currentUser);
      toast.success('Account erased');
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        toast.error('Please re-login to authorize deletion.');
        await auth.signOut();
      } else {
        toast.error('Deletion failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const memberSince = user?.metadata.creationTime 
    ? new Date(user.metadata.creationTime).getFullYear() 
    : '2024';

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-5xl mx-auto px-4 sm:px-6 pb-24"
    >
      {/* Profile Header */}
      <motion.section variants={itemVariants} className="pt-8 sm:pt-12 pb-10 border-b border-black/10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] overflow-hidden bg-black/[0.03] border border-black/10 group-hover:border-black/20 transition-all duration-500 shadow-lg">
              <img 
                src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel'} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                alt="Profile"
                referrerPolicy="no-referrer"
              />
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center border-[3px] border-[#F5F2ED] shadow-xl hover:scale-110 active:scale-95 transition-all">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Name & Info */}
          <div className="text-center sm:text-left space-y-2 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/50">Traveler Dossier</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-medium tracking-tight italic leading-tight truncate">
              {user?.displayName || 'Voyager'}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm text-black/60 font-medium">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{user?.email}</span>
              </span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-black/20" />
              <span className="text-[10px] uppercase tracking-widest font-black opacity-50">
                Since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        
        {/* Left Column: Stats */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-serif italic font-bold">Statistics</h3>
              <Globe className="w-4 h-4 text-black/30" />
            </div>
            
            <div className="space-y-5">
              {[
                { label: 'Journeys', value: tripsCount, icon: Map },
                { label: 'Status', value: tripsCount > 5 ? 'Elite' : 'Explorer', icon: Award },
                { label: 'Est. Miles', value: tripsCount * 1240, icon: Globe }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-black tracking-widest text-black/40 leading-none mb-0.5">{stat.label}</p>
                    <p className="text-lg font-bold italic tracking-tight truncate">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-5 mt-5 border-t border-black/5">
              <p className="text-xs text-black/50 italic leading-relaxed">
                Rank based on active itineraries. 
                <span className="text-black font-bold ml-1 cursor-pointer hover:underline">Learn more</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Settings */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          
          {/* Identity Settings */}
          <section>
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <Settings className="w-4 h-4 text-black/50" />
              <h2 className="text-xl sm:text-2xl font-serif italic font-bold">Identity Settings</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.15em] font-black text-black/60 ml-1">Display Name</Label>
                  <Input 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-12 rounded-xl border-none bg-black/[0.04] focus-visible:ring-black px-4 text-base font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.15em] font-black text-black/40 ml-1">Email (read-only)</Label>
                  <div className="h-12 flex items-center rounded-xl bg-black/[0.02] px-4 border border-black/[0.04] overflow-hidden">
                    <span className="text-base font-semibold text-black/30 truncate w-full">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button 
                 onClick={handleUpdate} 
                 disabled={loading}
                 className="rounded-full h-11 px-8 bg-black text-white font-bold hover:bg-black/90 transition-all shadow-lg shadow-black/10 text-sm"
              >
                {loading ? 'Updating...' : t('saveChanges')}
              </Button>
            </div>
          </section>

          {/* Language Settings */}
          <section>
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <Languages className="w-4 h-4 text-black/50" />
              <h2 className="text-xl sm:text-2xl font-serif italic font-bold">International</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.15em] font-black text-black/60 ml-1">{t('language')}</Label>
                  <p className="text-sm text-black/40 ml-1 mb-4">{t('selectLanguage')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'en', name: 'English', flag: '🇺🇸' },
                      { id: 'fr', name: 'Français', flag: '🇫🇷' },
                      { id: 'es', name: 'Español', flag: '🇪🇸' },
                      { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
                      { id: 'it', name: 'Italiano', flag: '🇮🇹' },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setLanguage(lang.id as any)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all ${
                          language === lang.id 
                            ? 'border-black bg-black/5' 
                            : 'border-transparent bg-black/[0.03] hover:bg-black/[0.05]'
                        }`}
                      >
                        <span className="font-bold text-sm">{lang.name}</span>
                        <span className="text-lg">{lang.flag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Session & Security */}
          <section>
            <div className="flex items-center gap-2.5 mb-4 px-1">
              <Shield className="w-4 h-4 text-black/50" />
              <h2 className="text-xl sm:text-2xl font-serif italic font-bold">Account & Security</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 space-y-8">
              {/* Sign Out */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold">Sign Out</h4>
                  <p className="text-sm text-black/50 max-w-xs leading-relaxed">
                    Safely exit your session. Your data stays secure in the cloud.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="rounded-full h-10 px-6 font-semibold border-black/20 hover:bg-black hover:text-white transition-all duration-300 shrink-0"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              <div className="h-px bg-black/5 w-full" />

              {/* Delete Account */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-red-600">Delete Account</h4>
                  <p className="text-sm text-black/50 max-w-xs leading-relaxed">
                    Permanently erase all data. This cannot be undone.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="rounded-full h-10 px-6 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 shrink-0"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </motion.div>
  );
}
