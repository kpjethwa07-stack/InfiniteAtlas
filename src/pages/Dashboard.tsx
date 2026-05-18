import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Trip } from '../types';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Calendar, MapPin, DollarSign, Clock, Globe, Plane, Trash2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

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
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
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
    const toastId = toast.loading(t('deleting') || 'Removing journey...');
    try {
      // Best-effort cleanup of sub-collections (wrapped in try-catch so it never blocks main delete)
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

      // Delete main trip document — this is the critical operation
      await deleteDoc(doc(db, 'trips', tripId));
      console.log('[Dashboard] Trip deleted successfully');
      toast.success(t('deleteSuccess') || 'Journey removed.', { id: toastId });
    } catch (error) {
      console.error('[Dashboard] Delete error:', error);
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}`);
      toast.error(t('deleteError') || 'Failed to remove journey.', { id: toastId });
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
    if (hour < 12) return t('welcome') + ' ☀️';
    if (hour < 17) return t('welcome');
    return t('welcome') + ' 🌙';
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
          <h1 className="text-4xl font-bold tracking-tight">{getGreeting()}, {user?.displayName?.split(' ')[0]} 👋</h1>
          <p className="text-black/40 mt-2 text-lg italic">{t('curiosity')}</p>
        </div>
        <Link to="/trips/new">
          <Button size="lg" className="rounded-full gap-2 bg-black text-white hover:bg-black/90 transition-transform hover:scale-105 active:scale-95">
            <Sparkles className="w-5 h-5 text-orange-400" />
            {t('smartPlan')}
          </Button>
        </Link>
      </motion.div>

      {/* Stats / Quick Summary */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={itemVariants}>
        <Card className="rounded-[32px] border-none shadow-sm bg-white p-2 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-[10px] tracking-widest font-bold text-black/40">Upcoming Trip</CardDescription>
            <CardTitle className="text-xl font-bold italic truncate">
              {upcomingTrip ? upcomingTrip.title : 'No trips planned'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-black/60">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>{daysUntilUpcoming !== null ? `In ${daysUntilUpcoming} days` : 'Ready for adventure?'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm bg-black text-white p-2 hover:shadow-xl hover:shadow-black/10 transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-[10px] tracking-widest font-bold text-white/40">Total Planned Budget</CardDescription>
            <CardTitle className="text-2xl font-bold">${totalBudget.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span> Across {allTrips?.length || 0} journeys</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm bg-white p-2 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase text-[10px] tracking-widest font-bold text-black/40">Exploration Status</CardDescription>
            <CardTitle className="text-xl font-bold italic">{allTrips?.length || 0} Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-black/60">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Active Wayfarer</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Motivational Travel Quote */}
      <motion.div variants={itemVariants} className="px-2">
        <div className="flex items-center gap-4 py-4 px-6 bg-white/60 rounded-2xl border border-black/[0.04]">
          <span className="text-2xl">✨</span>
          <p className="text-sm text-black/50 italic font-medium">
            {[
              '"The world is a book, and those who do not travel read only one page." — St. Augustine',
              '"Travel makes one modest. You see what a tiny place you occupy in the world." — Gustave Flaubert',
              '"Life is either a daring adventure or nothing at all." — Helen Keller',
              '"Not all those who wander are lost." — J.R.R. Tolkien',
              '"To travel is to live." — Hans Christian Andersen',
              '"Adventure is worthwhile in itself." — Amelia Earhart',
              '"The journey not the arrival matters." — T.S. Eliot',
            ][new Date().getDay()]}
          </p>
        </div>
      </motion.div>

      {/* Recent Trips Section */}
      <motion.section className="space-y-6" variants={itemVariants}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">{t('recentPlans')}</h2>
          <Link to="/trips" className="text-sm font-semibold text-black/40 hover:text-black flex items-center gap-1">
            {t('viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-[40px]" />
            ))
          ) : recentTrips?.length ? (
            recentTrips.map((trip: any, idx: number) => (
              <motion.div 
                key={trip.id} 
                className="group relative h-80 rounded-[40px] overflow-hidden bg-white shadow-md hover:shadow-xl transition-all"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                  
                  <div className="absolute bottom-0 p-8 text-white w-full">
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2 block">
                      {format(trip.startDate.toDate(), 'MMM yyyy')}
                    </span>
                    <h3 className="text-2xl font-bold leading-tight group-hover:underline">{trip.title}</h3>
                    <div className="flex items-center gap-4 mt-4 text-xs opacity-80 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-orange-400" />
                        <span>Plan View</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>{trip.status}</span>
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
            <div className="col-span-3 rounded-[40px] border-2 border-dashed border-black/10 h-64 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-4">
                <Plane className="w-8 h-8 text-black/20" />
              </div>
              <h3 className="text-xl font-bold">No trips planned yet</h3>
              <p className="text-black/40 mt-1">Start your journey today by creating your first itinerary.</p>
              <Link to="/trips/new" className="mt-6">
                <Button variant="outline" className="rounded-full px-8 border-black">Plan First Trip</Button>
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
      <motion.section className="bg-orange-500 rounded-[48px] p-12 text-white overflow-hidden relative" variants={itemVariants}>
        <div className="relative z-10 max-w-xl space-y-6">
          <span className="text-xs uppercase tracking-[0.2em] font-black opacity-60">Featured Destination</span>
          <h2 className="text-6xl font-light leading-tight">Escape to <br /><span className="italic font-normal">Santorini</span></h2>
          <p className="text-white/80 text-lg">Detailed guides, curated itineraries, and hidden gems for your next Mediterranean getaway.</p>
          <Link to="/explore">
            <Button size="lg" className="bg-white text-orange-500 hover:bg-white/90 rounded-full px-8 h-12 shadow-xl border-none transition-transform hover:scale-105">
              Explore Guide
            </Button>
          </Link>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2000&auto=format&fit=crop" 
          alt="Santorini" 
          className="absolute top-0 right-0 w-1/2 h-full object-cover rounded-l-full opacity-80"
          referrerPolicy="no-referrer"
        />
      </motion.section>
    </motion.div>
  );
}
