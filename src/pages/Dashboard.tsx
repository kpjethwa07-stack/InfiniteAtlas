import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Trip } from '../types';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Calendar, MapPin, DollarSign, Globe, Plane, Trash2 } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { useTheme } from '../contexts/ThemeContext';

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
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const tripsRef = collection(db, 'trips');
  const recentTripsQuery = query(
    tripsRef,
    where('ownerId', '==', user?.uid),
    orderBy('updatedAt', 'desc'),
    limit(3)
  );

  const [recentTripsSnapshot, recentLoading] = useCollection(user?.uid ? recentTripsQuery : null);
  const recentTrips = recentTripsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

  const [tripToDelete, setTripToDelete] = React.useState<string | null>(null);

  const handleDelete = async (tripId: string) => {
    const toastId = toast.loading('Removing journey...');
    try {
      try {
        const subCollections = ['stops', 'packingItems', 'notes', 'expenses'];
        const allDeletes: any[] = [];
        for (const sub of subCollections) {
          const snap = await getDocs(collection(db, 'trips', tripId, sub));
          for (const docSnap of snap.docs) {
            if (sub === 'stops') {
              try {
                const actSnap = await getDocs(collection(db, 'trips', tripId, 'stops', docSnap.id, 'activities'));
                actSnap.docs.forEach(actDoc => allDeletes.push(deleteDoc(actDoc.ref)));
              } catch { /* activities cleanup is best-effort */ }
            }
            allDeletes.push(deleteDoc(docSnap.ref));
          }
        }
        if (allDeletes.length > 0) await Promise.allSettled(allDeletes);
      } catch (subErr) {
        console.warn('[Dashboard] Sub-collection cleanup failed (non-blocking):', subErr);
      }

      await deleteDoc(doc(db, 'trips', tripId));
      toast.success('Journey removed successfully.', { id: toastId });
    } catch (error) {
      console.error('[Dashboard] Delete error:', error);
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}`);
      toast.error('Failed to remove journey.', { id: toastId });
    }
  };

  const allTripsQuery = query(
    tripsRef,
    where('ownerId', '==', user?.uid),
    orderBy('startDate', 'asc')
  );
  const [allTripsSnapshot] = useCollection(user?.uid ? allTripsQuery : null);
  const allTrips = allTripsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

  const now = new Date();
  const upcomingTrip = allTrips?.find((t: any) => t.startDate.toDate() > now);
  const totalBudget = allTrips?.reduce((acc: number, t: any) => acc + (t.budgetLimit || 0), 0) || 0;
  const daysUntilUpcoming = upcomingTrip ? Math.ceil((upcomingTrip.startDate.toDate().getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isDark = theme === 'midnight' || theme === 'sunset';

  return (
    <motion.div 
      className="space-y-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4" variants={itemVariants}>
        <div>
          <h1 className={`text-4xl font-bold tracking-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-black'}`}>{getGreeting()}, {user?.displayName?.split(' ')[0]} 👋</h1>
          <p className={`mt-2 text-lg italic font-medium transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-black/40'}`}>Where will your dreams take you today?</p>
        </div>
        <Link to="/trips/new">
          <Button 
            size="lg" 
            className={`rounded-full gap-2 transition-all hover:scale-105 active:scale-95 px-8 h-12 text-sm font-black shadow-md ${
              theme === 'sand' && 'bg-black text-white hover:bg-black/90' ||
              theme === 'midnight' && 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/25' ||
              theme === 'sunset' && 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-95 shadow-pink-500/20'
            }`}
          >
            <Plus className="w-5 h-5" />
            Create a Journey
          </Button>
        </Link>
      </motion.div>

      {/* Stats / Quick Summary */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
        {/* Next Destination Card */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`rounded-[32px] p-8 hover:shadow-xl transition-all duration-300 cursor-default border ${
            theme === 'sand' && 'border-black/[0.04] bg-white/75 backdrop-blur-xl shadow-sm' ||
            theme === 'midnight' && 'border-cyan-500/10 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.02)]' ||
            theme === 'sunset' && 'border-pink-500/10 bg-purple-950/20 backdrop-blur-xl shadow-[0_0_20px_rgba(236,72,153,0.02)]'
          }`}
        >
          <div className="space-y-4">
            <span className={`uppercase text-[9px] tracking-widest font-black block ${isDark ? 'text-slate-500' : 'text-black/40'}`}>Next Destination</span>
            <h3 className={`text-2xl font-black italic truncate ${isDark ? 'text-white' : 'text-black/80'}`}>
              {upcomingTrip ? upcomingTrip.title : 'Ready for discovery'}
            </h3>
            <div className={`flex items-center gap-2 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-black/50'}`}>
              <Calendar className={`w-4 h-4 ${theme === 'midnight' ? 'text-cyan-400' : theme === 'sunset' ? 'text-pink-400' : 'text-orange-500'}`} />
              <span>{daysUntilUpcoming !== null ? `Begins in ${daysUntilUpcoming} days` : 'No upcoming journeys'}</span>
            </div>
          </div>
        </motion.div>

        {/* Total Funds Card */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`rounded-[32px] p-8 hover:shadow-2xl transition-all duration-300 cursor-default border ${
            theme === 'sand' && 'bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-950 text-white border-neutral-800 shadow-lg' ||
            theme === 'midnight' && 'bg-slate-900 border-slate-800 text-white shadow-lg' ||
            theme === 'sunset' && 'bg-gradient-to-br from-purple-950 to-indigo-950 border-purple-900/60 text-white shadow-lg shadow-purple-950/20'
          }`}
        >
          <div className="space-y-4">
            <span className="uppercase text-[9px] tracking-widest font-black text-white/40 block">Allocated Funds</span>
            <h3 className="text-3xl font-black tracking-tight">${totalBudget.toLocaleString()}</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-white/60">
              <DollarSign className={`w-4 h-4 ${theme === 'midnight' ? 'text-cyan-400' : theme === 'sunset' ? 'text-pink-400' : 'text-emerald-400'}`} />
              <span>Set aside across {allTrips?.length || 0} journeys</span>
            </div>
          </div>
        </motion.div>

        {/* Wayfarer Status Card */}
        <motion.div 
          whileHover={{ y: -6, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`rounded-[32px] p-8 hover:shadow-xl transition-all duration-300 cursor-default border ${
            theme === 'sand' && 'border-black/[0.04] bg-white/75 backdrop-blur-xl shadow-sm' ||
            theme === 'midnight' && 'border-cyan-500/10 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.02)]' ||
            theme === 'sunset' && 'border-pink-500/10 bg-purple-950/20 backdrop-blur-xl shadow-[0_0_20px_rgba(236,72,153,0.02)]'
          }`}
        >
          <div className="space-y-4">
            <span className={`uppercase text-[9px] tracking-widest font-black block ${isDark ? 'text-slate-500' : 'text-black/40'}`}>Exploration Status</span>
            <h3 className={`text-2xl font-black italic ${isDark ? 'text-white' : 'text-black/80'}`}>{allTrips?.length || 0} {allTrips?.length === 1 ? 'Journey' : 'Journeys'}</h3>
            <div className={`flex items-center gap-2 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-black/50'}`}>
              <Globe className={`w-4 h-4 ${theme === 'midnight' ? 'text-cyan-400' : theme === 'sunset' ? 'text-pink-400' : 'text-blue-500'}`} />
              <span>Active Wayfarer</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Motivational Travel Quote */}
      <motion.div variants={itemVariants} className="px-2">
        <motion.div 
          whileHover={{ scale: 1.005 }}
          className={`flex items-center gap-4 py-5 px-8 backdrop-blur-md rounded-3xl border shadow-sm transition-all duration-300 cursor-default ${
            theme === 'sand' && 'bg-white/50 border-black/[0.03]' ||
            theme === 'midnight' && 'bg-slate-900/20 border-slate-800/80 shadow-[0_0_15px_rgba(6,182,212,0.01)]' ||
            theme === 'sunset' && 'bg-purple-950/10 border-purple-900/30'
          }`}
        >
          <span className={`text-2xl font-serif ${theme === 'midnight' ? 'text-cyan-400' : theme === 'sunset' ? 'text-pink-400' : 'text-orange-500'}`}>“</span>
          <p className={`text-sm italic font-bold ${isDark ? 'text-slate-300' : 'text-black/60'}`}>
            {[
              'The world is a book, and those who do not travel read only one page. — St. Augustine',
              'Travel makes one modest. You see what a tiny place you occupy in the world. — Gustave Flaubert',
              'Life is either a daring adventure or nothing at all. — Helen Keller',
              'Not all those who wander are lost. — J.R.R. Tolkien',
              'To travel is to live. — Hans Christian Andersen',
              'Adventure is worthwhile in itself. — Amelia Earhart',
              'The journey not the arrival matters. — T.S. Eliot',
            ][new Date().getDay()]}
          </p>
        </motion.div>
      </motion.div>

      {/* Recent Trips Section */}
      <motion.section className="space-y-6" variants={itemVariants}>
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Recent Itineraries</h2>
          <Link to="/trips" className={`text-sm font-semibold flex items-center gap-1 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-black/40 hover:text-black'}`}>
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className={`h-80 w-full rounded-[40px] ${isDark ? 'bg-slate-800' : 'bg-black/5'}`} />
            ))
          ) : recentTrips?.length ? (
            recentTrips.map((trip: any) => (
              <motion.div 
                key={trip.id} 
                className={`group relative h-80 rounded-[40px] overflow-hidden border shadow-md hover:shadow-2xl transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-black/5'
                }`}
                variants={itemVariants}
                whileHover={{ y: -8 }}
              >
                <Link to={`/trips/${trip.id}`} className="absolute inset-0 z-10">
                  <img 
                    src={trip.coverURL || `https://picsum.photos/seed/${trip.id}/800/1000`} 
                    alt={trip.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                  
                  <div className="absolute bottom-0 p-8 text-white w-full">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2 block">
                      {format(trip.startDate.toDate(), 'MMM yyyy')}
                    </span>
                    <h3 className="text-2xl font-bold leading-tight group-hover:underline">{trip.title}</h3>
                    <div className="flex items-center gap-4 mt-4 text-xs opacity-80 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className={`w-3 h-3 ${theme === 'midnight' ? 'text-cyan-400' : theme === 'sunset' ? 'text-pink-400' : 'text-orange-400'}`} />
                        <span>View Itinerary</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe className={`w-3 h-3 ${theme === 'midnight' ? 'text-cyan-400' : theme === 'sunset' ? 'text-pink-400' : 'text-blue-400'}`} />
                        <span className="capitalize">{trip.status}</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="absolute top-6 right-6 z-20">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-white/10 backdrop-blur-md text-white/40 hover:text-red-400 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTripToDelete(trip.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className={`col-span-3 rounded-[40px] border-2 border-dashed h-64 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm ${
              isDark ? 'border-slate-800 bg-slate-900/20' : 'border-black/10 bg-white/30'
            }`}>
              <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Plane className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-black/30'}`} />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black/85'}`}>Your map is waiting to be filled</h3>
              <p className={`mt-2 text-sm max-w-sm ${isDark ? 'text-slate-400' : 'text-black/55'}`}>Every great adventure begins with a single step. Let's design your first journey.</p>
              <Link to="/trips/new" className="mt-6">
                <Button 
                  variant="outline" 
                  className={`rounded-full px-8 h-12 transition-all border ${
                    theme === 'sand' && 'border-black hover:bg-black hover:text-white' ||
                    theme === 'midnight' && 'border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-cyan-500/10' ||
                    theme === 'sunset' && 'border-pink-500 text-pink-400 hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 hover:text-white shadow-pink-500/10'
                  }`}
                >
                  Start Planning
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.section>

      <DeleteConfirmDialog 
        isOpen={!!tripToDelete}
        onClose={() => setTripToDelete(null)}
        onConfirm={() => tripToDelete && handleDelete(tripToDelete)}
      />

      {/* Discovery Section */}
      <motion.section 
        whileHover={{ scale: 1.005 }}
        className={`rounded-[48px] p-12 text-white overflow-hidden relative shadow-lg ${
          theme === 'sand' && 'bg-gradient-to-r from-orange-500 to-amber-500' ||
          theme === 'midnight' && 'bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-slate-800/80 shadow-cyan-500/5' ||
          theme === 'sunset' && 'bg-gradient-to-r from-purple-950 via-[#130E26] to-pink-950 border border-purple-900/40'
        }`} 
        variants={itemVariants}
      >
        <div className="relative z-10 max-w-xl space-y-6">
          <span className={`text-xs uppercase tracking-[0.2em] font-black ${isDark ? 'text-cyan-400' : 'text-white/80'}`}>Wanderlust Inspiration</span>
          <h2 className="text-6xl font-light leading-tight">Santorini is <br /><span className="italic font-normal">calling...</span></h2>
          <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-white/90'}`}>Discover sun-drenched stone paths, iconic white houses, and romantic sunsets along the beautiful cliffs of Greece.</p>
          <Link to="/explore">
            <Button 
              size="lg" 
              className={`rounded-full px-8 h-12 shadow-xl border-none transition-transform hover:scale-105 active:scale-95 font-bold ${
                theme === 'sand' && 'bg-white text-orange-600 hover:bg-orange-50' ||
                theme === 'midnight' && 'bg-cyan-500 text-black hover:bg-cyan-400' ||
                theme === 'sunset' && 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-95 shadow-pink-500/20'
              }`}
            >
              Explore Guide
            </Button>
          </Link>
        </div>
        <motion.img 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2000&auto=format&fit=crop" 
          alt="Santorini" 
          className="absolute top-0 right-0 w-1/2 h-full object-cover rounded-l-[80px] opacity-90 hidden md:block"
          referrerPolicy="no-referrer"
        />
      </motion.section>
    </motion.div>
  );
}
