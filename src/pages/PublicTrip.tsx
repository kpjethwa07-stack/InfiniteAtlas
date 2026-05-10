import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Trip, Stop, Activity, TripStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { MapPin, Calendar, Globe, Copy, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { AnimatedLogo } from '../components/AnimatedLogo';

export default function PublicTrip() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [activities, setActivities] = useState<{ [stopId: string]: Activity[] }>({});
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    async function fetchPublicTrip() {
      if (!tripId) return;
      try {
        const tripSnap = await getDoc(doc(db, 'trips', tripId));
        if (tripSnap.exists()) {
          const tripData = { id: tripId, ...tripSnap.data() } as Trip;
          if (!tripData.isPublic) {
            setLoading(false);
            return;
          }
          setTrip(tripData);

          const stopsSnap = await getDocs(collection(db, 'trips', tripId, 'stops'));
          const stopsData = stopsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stop);
          const sortedStops = stopsData.sort((a, b) => a.order - b.order);
          setStops(sortedStops);

          const actsMap: { [stopId: string]: Activity[] } = {};
          try {
            for (const stop of sortedStops) {
              const actSnap = await getDocs(collection(db, 'trips', tripId, 'stops', stop.id, 'activities'));
              actsMap[stop.id] = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Activity);
            }
            setActivities(actsMap);
          } catch (e) {
            handleFirestoreError(e, OperationType.GET, `trips/${tripId}/stops/activities`);
          }
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `trips/${tripId}`);
        console.error("Error fetching trip:", e);
      }
      setLoading(false);
    }
    fetchPublicTrip();
  }, [tripId]);

  const handleCopyTrip = async () => {
    if (!user) {
      toast.error('Please log in to copy this itinerary');
      navigate('/login');
      return;
    }
    if (!trip) return;

    setCopying(true);
    try {
      // 1. Create the Trip
      const newTripRef = await addDoc(collection(db, 'trips'), {
        title: `${trip.title} (Copy)`,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        coverURL: trip.coverURL,
        ownerId: user.uid,
        status: TripStatus.PLANNING,
        budgetLimit: trip.budgetLimit,
        isPublic: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Loop through stops
      for (const stop of stops) {
        const newStopRef = await addDoc(collection(db, 'trips', newTripRef.id, 'stops'), {
          cityName: stop.cityName,
          arrivalDate: stop.arrivalDate,
          departureDate: stop.departureDate,
          order: stop.order,
          note: stop.note
        });

        // 3. Loop through activities for this stop
        const stopActivities = activities[stop.id] || [];
        for (const act of stopActivities) {
          await addDoc(collection(db, 'trips', newTripRef.id, 'stops', newStopRef.id, 'activities'), {
            title: act.title,
            description: act.description,
            cost: act.cost,
            type: act.type,
            startTime: act.startTime || null,
            duration: act.duration || "",
            status: act.status || ""
          });
        }
      }

      toast.success('Itinerary copied successfully!');
      navigate(`/trips/${newTripRef.id}`);
    } catch (e) {
      toast.error('Failed to copy itinerary');
      console.error(e);
    } finally {
      setCopying(false);
    }
  };

  if (loading) return <div className="p-24 text-center">Opening shared itinerary...</div>;
  if (!trip) return <div className="p-24 text-center h-screen flex flex-col items-center justify-center space-y-4">
    <Globe className="w-16 h-16 text-black/10" />
    <h1 className="text-2xl font-bold">This itinerary is private</h1>
    <p className="text-black/40">The owner has not made this plan public yet.</p>
    <Link to="/login"><Button className="rounded-full mt-4">Go to App</Button></Link>
  </div>;

  return (
    <div className="min-h-screen bg-[#F5F2ED] pb-24">
      {/* Top Bar */}
      <div className="bg-black/90 backdrop-blur-md text-white py-4 px-8 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm">
           <div className="flex items-center gap-4">
             <Link to={user ? "/dashboard" : "/login"} className="font-bold flex items-center gap-2">
               <AnimatedLogo size="sm" inverted />
               Infinity Atlas
             </Link>
           </div>
           <div className="flex items-center gap-4">
             <Button 
              variant="outline" 
              className="rounded-full border-white/20 h-9 px-4 gap-2 hover:bg-white hover:text-black"
              onClick={handleCopyTrip}
              disabled={copying}
             >
               <Copy className="w-3 h-3" />
               {copying ? 'Copying...' : 'Save to My Trips'}
             </Button>
           </div>
        </div>
      </div>

      <div className="h-[400px] w-full relative overflow-hidden">
        <img 
          src={trip.coverURL || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2000&auto=format&fit=crop`} 
          className="w-full h-full object-cover"
          alt={trip.title}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F2ED] via-transparent to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-8 -mt-24 relative z-10 space-y-12 pb-24">
        {/* Simple Header */}
        <div className="space-y-6 bg-white/60 backdrop-blur-md p-12 rounded-[48px] shadow-sm border border-white/40">
           <h1 className="text-6xl font-bold tracking-tighter leading-tight">{trip.title}</h1>
           <div className="flex gap-8 items-center text-black/40 font-semibold uppercase tracking-widest text-[11px]">
             <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" /> {format(trip.startDate.toDate(), 'MMMM yyyy')}</span>
             <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> {stops.length} Cities</span>
           </div>
           <p className="text-xl text-black/60 max-w-2xl leading-relaxed italic line-clamp-3">"{trip.description}"</p>
        </div>

        {/* Timeline */}
        <div className="space-y-16 pt-12">
           {stops.map((stop, index) => (
             <section key={stop.id} className="relative pl-12 border-l border-black/10">
               <div className="absolute left-[-20px] top-0 w-10 h-10 bg-black rounded-full text-white flex items-center justify-center font-bold text-sm ring-8 ring-[#F5F2ED]">
                 {index + 1}
               </div>

               <div className="space-y-8">
                 <div>
                   <h3 className="text-4xl font-bold italic tracking-tight mb-2">{stop.cityName}</h3>
                   <span className="text-xs font-bold opacity-30 tracking-[0.2em] uppercase">Stay for 4 nights</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {activities[stop.id]?.map(act => (
                     <div key={act.id} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex justify-between items-center group hover:shadow-md transition-all">
                       <div className="space-y-1">
                         <h4 className="font-bold">{act.title}</h4>
                         <Badge variant="outline" className="text-[9px] h-5 rounded-full opacity-60 uppercase">{act.type}</Badge>
                       </div>
                       <div className="text-right">
                         <span className="text-xs font-black opacity-20 block uppercase tracking-widest mb-1">Cost</span>
                         <span className="font-bold text-sm bg-black/5 px-3 py-1 rounded-full">${act.cost}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </section>
           ))}
        </div>
      </div>
    </div>
  );
}
