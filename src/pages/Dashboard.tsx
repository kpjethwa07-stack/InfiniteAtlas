import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Calendar, MapPin, DollarSign, Globe, Plane, Trash2 } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { Tilt3D } from '../components/Tilt3D';

import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
          <h1 className="text-4xl font-bold tracking-tight text-white">{getGreeting()}, {user?.displayName?.split(' ')[0]} 👋</h1>
          <p className="mt-2 text-lg italic font-medium text-white/30">Where will your dreams take you next?</p>
        </div>
        <Link to="/trips/new">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className="rounded-full gap-2 px-8 h-12 text-sm font-bold shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white border-none hover:shadow-orange-500/20 hover:shadow-xl transition-shadow"
            >
              <Plus className="w-5 h-5" />
              Create a Journey
            </Button>
          </motion.div>
        </Link>
      </motion.div>

      {/* 3D Stats Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants} style={{ perspective: 1200 }}>
        {/* Next Destination */}
        <Tilt3D className="rounded-[28px]" intensity={12}>
          <div className="rounded-[28px] p-8 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl h-full">
            <div className="space-y-4" style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-400" />
              </div>
              <span className="uppercase text-[9px] tracking-widest font-black text-white/30 block">Next Destination</span>
              <h3 className="text-2xl font-black text-white truncate">
                {upcomingTrip ? upcomingTrip.title : 'Ready for discovery'}
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold text-white/40">
                <Calendar className="w-4 h-4 text-orange-400/60" />
                <span>{daysUntilUpcoming !== null ? `Begins in ${daysUntilUpcoming} days` : 'No upcoming journeys'}</span>
              </div>
            </div>
          </div>
        </Tilt3D>

        {/* Total Funds */}
        <Tilt3D className="rounded-[28px]" intensity={12}>
          <div className="rounded-[28px] p-8 bg-gradient-to-br from-orange-500/20 to-amber-600/10 border border-orange-500/15 backdrop-blur-xl h-full relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="space-y-4 relative z-10" style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="uppercase text-[9px] tracking-widest font-black text-white/30 block">Allocated Funds</span>
              <h3 className="text-3xl font-black tracking-tight text-white">${totalBudget.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-white/40">
                <Globe className="w-4 h-4 text-emerald-400/60" />
                <span>Set aside across {allTrips?.length || 0} journeys</span>
              </div>
            </div>
          </div>
        </Tilt3D>

        {/* Exploration Status */}
        <Tilt3D className="rounded-[28px]" intensity={12}>
          <div className="rounded-[28px] p-8 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] backdrop-blur-xl h-full">
            <div className="space-y-4" style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="uppercase text-[9px] tracking-widest font-black text-white/30 block">Your Adventures</span>
              <h3 className="text-2xl font-black text-white">{allTrips?.length || 0} {allTrips?.length === 1 ? 'Journey' : 'Journeys'}</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-white/40">
                <Plane className="w-4 h-4 text-indigo-400/60" />
                <span>Active Wayfarer</span>
              </div>
            </div>
          </div>
        </Tilt3D>
      </motion.div>

      {/* Travel Quote */}
      <motion.div variants={itemVariants}>
        <motion.div
          whileHover={{ scale: 1.008 }}
          className="flex items-center gap-5 py-5 px-8 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/[0.04] cursor-default"
        >
          <span className="text-3xl font-serif text-orange-400/80">"</span>
          <p className="text-sm italic font-medium text-white/40 leading-relaxed">
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

      {/* Recent Trips */}
      <motion.section className="space-y-6" variants={itemVariants}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">Recent Itineraries</h2>
          <Link to="/trips" className="text-sm font-semibold flex items-center gap-1 text-white/30 hover:text-orange-400 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ perspective: 1200 }}>
          {recentLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-[32px] bg-white/[0.03]" />
            ))
          ) : recentTrips?.length ? (
            recentTrips.map((trip: any, idx: number) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 40, rotateX: 8 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <Tilt3D className="rounded-[32px]" intensity={8} glare>
                  <div className="group relative h-80 rounded-[32px] overflow-hidden border border-white/[0.06]">
                    <Link to={`/trips/${trip.id}`} className="absolute inset-0 z-10">
                      <img
                        src={trip.coverURL || `https://picsum.photos/seed/${trip.id}/800/1000`}
                        alt={trip.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      <div className="absolute bottom-0 p-7 text-white w-full" style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2 block">
                          {format(trip.startDate.toDate(), 'MMM yyyy')}
                        </span>
                        <h3 className="text-xl font-bold leading-tight">{trip.title}</h3>
                        <div className="flex items-center gap-4 mt-3 text-xs text-white/50 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-orange-400" />
                            <span>View Itinerary</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-indigo-400" />
                            <span className="capitalize">{trip.status}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="absolute top-5 right-5 z-20">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/5 backdrop-blur-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTripToDelete(trip.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Tilt3D>
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 rounded-[32px] border border-dashed border-white/[0.06] h-64 flex flex-col items-center justify-center text-center p-8 bg-white/[0.01] backdrop-blur-sm">
              <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-4">
                <Plane className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white/80">Your map is waiting to be filled</h3>
              <p className="mt-2 text-sm max-w-sm text-white/30">Every great adventure begins with a single step. Let's design your first journey.</p>
              <Link to="/trips/new" className="mt-6">
                <Button variant="outline" className="rounded-full px-8 h-12 border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all">
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
      <motion.section variants={itemVariants}>
        <Tilt3D className="rounded-[40px]" intensity={5} glare>
          <div className="rounded-[40px] p-12 overflow-hidden relative bg-gradient-to-br from-orange-600/20 via-[#12151E] to-indigo-900/15 border border-white/[0.06]">
            <div className="relative z-10 max-w-xl space-y-6" style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }}>
              <span className="text-xs uppercase tracking-[0.2em] font-black text-orange-400/70">Wanderlust Inspiration</span>
              <h2 className="text-5xl md:text-6xl font-light leading-tight text-white">Santorini is <br /><span className="italic font-normal text-white/90">calling...</span></h2>
              <p className="text-base leading-relaxed text-white/40 max-w-md">Discover sun-drenched stone paths, iconic white houses, and romantic sunsets along the beautiful cliffs of Greece.</p>
              <Link to="/explore">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                  <Button
                    size="lg"
                    className="rounded-full px-8 h-12 shadow-xl border-none bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold hover:shadow-orange-500/20 hover:shadow-2xl transition-shadow"
                  >
                    Explore Guide
                  </Button>
                </motion.div>
              </Link>
            </div>
            {/* Background image */}
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              whileHover={{ scale: 1.05 }}
              src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2000&auto=format&fit=crop"
              alt="Santorini"
              className="absolute top-0 right-0 w-1/2 h-full object-cover rounded-l-[80px] hidden md:block"
              referrerPolicy="no-referrer"
            />
            {/* Decorative blur orb */}
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-orange-500/5 rounded-full blur-3xl" />
          </div>
        </Tilt3D>
      </motion.section>
    </motion.div>
  );
}
