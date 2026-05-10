import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Trip, Stop, Activity, ActivityType } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, MapPin, Calendar, Clock, DollarSign, Trash2, Edit3, CheckCircle2, ChevronRight, Globe, Search, Utensils, Plane, Hotel, Star } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';

export default function ItineraryBuilder() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for new stop
  const [newStopCity, setNewStopCity] = useState('');
  const [newStopArrival, setNewStopArrival] = useState('');
  const [newStopDeparture, setNewStopDeparture] = useState('');
  const [isAddingStop, setIsAddingStop] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    const tripUnsub = onSnapshot(doc(db, 'trips', tripId), (doc) => {
      if (doc.exists()) {
        setTrip({ id: doc.id, ...doc.data() } as Trip);
      } else {
        toast.error('Trip not found');
        navigate('/trips');
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `trips/${tripId}`));

    const stopsQuery = query(collection(db, 'trips', tripId, 'stops'), orderBy('order', 'asc'));
    const stopsUnsub = onSnapshot(stopsQuery, (snapshot) => {
      setStops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stop));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/stops`));

    return () => {
      tripUnsub();
      stopsUnsub();
    };
  }, [tripId]);

  const handleAddStop = async () => {
    if (!newStopCity || !newStopArrival || !newStopDeparture || !tripId) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await addDoc(collection(db, 'trips', tripId, 'stops'), {
        cityName: newStopCity,
        arrivalDate: new Date(newStopArrival),
        departureDate: new Date(newStopDeparture),
        order: stops.length,
      });
      setNewStopCity('');
      setNewStopArrival('');
      setNewStopDeparture('');
      setIsAddingStop(false);
      toast.success('Stop added!');
    } catch (error) {
      console.error('Error adding stop:', error);
      toast.error('Failed to add stop');
    }
  };

  const deleteStop = async (stopId: string) => {
    if (!tripId) return;
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'stops', stopId));
      toast.success('Stop removed');
    } catch (error) {
      toast.error('Failed to remove stop');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading Itinerary...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="rounded-full px-4 border-black/10 text-black/60">{trip?.status}</Badge>
            <span className="text-sm text-black/40">•</span>
            <span className="text-sm text-black/40">{trip && format(trip.startDate.toDate(), 'MMM d')} - {trip && format(trip.endDate.toDate(), 'MMM d, yyyy')}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{trip?.title}</h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full border-black" onClick={() => navigate(`/trips/${tripId}`)}>View Full Plan</Button>
          <Button className="rounded-full bg-black text-white hover:bg-black/90 px-8" onClick={() => setIsAddingStop(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Destination
          </Button>
        </div>
      </div>

      {/* Main Content: Steps and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Stops List */}
        <div className="lg:col-span-12 space-y-8">
          {stops.length === 0 ? (
            <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-black/10">
              <Globe className="w-16 h-16 mx-auto mb-6 text-black/10" />
              <h2 className="text-2xl font-bold mb-2">No stops yet</h2>
              <p className="text-black/40 mb-8 max-w-md mx-auto">Start building your itinerary by adding your first city. You can add as many stops as you'd like!</p>
              <Button size="lg" className="rounded-full px-12 h-14 bg-black" onClick={() => setIsAddingStop(true)}>Add Your First Stop</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {stops.map((stop, index) => (
                <div key={stop.id} className="group relative">
                  {/* Connector Line */}
                  {index < stops.length - 1 && (
                    <div className="absolute left-[31px] top-24 bottom-0 w-[2px] bg-black/5 z-0" />
                  )}
                  
                  <div className="flex gap-8 relative z-10">
                    {/* Circle Indicator */}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white font-bold text-xl ring-8 ring-[#F5F2ED]">
                        {index + 1}
                      </div>
                    </div>

                    {/* Stop Card */}
                    <Card className="flex-1 rounded-[40px] border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex h-full min-h-[200px]">
                        {/* City Details */}
                        <div className="flex-1 p-8 space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 text-black/40 text-sm font-semibold uppercase tracking-widest mb-1">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                {format(stop.arrivalDate.toDate(), 'MMM d')} - {format(stop.departureDate.toDate(), 'MMM d')}
                              </div>
                              <h3 className="text-3xl font-bold">{stop.cityName}</h3>
                            </div>
                            <div className="flex gap-2">
                              {/* Add Activity Trigger */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-full bg-black/5 hover:bg-black/10">
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-[40px] max-w-2xl border-none shadow-2xl p-12">
                                  <ActivityCreator tripId={tripId!} stopId={stop.id} />
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" onClick={() => deleteStop(stop.id)} className="rounded-full text-red-500 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <ActivityList tripId={tripId!} stopId={stop.id} />
                        </div>

                        {/* Stop Image / Info */}
                        <div className="w-64 bg-black/5 relative">
                          <img 
                            src={`https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=400&fit=crop`} 
                            className="w-full h-full object-cover grayscale opacity-60 mix-blend-multiply"
                            alt={stop.cityName}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 flex items-center justify-center flex-col p-4 text-center">
                            <MapPin className="w-8 h-8 mb-2 text-black/20" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-black/30">City Hub</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Stop Dialog */}
      <Dialog open={isAddingStop} onOpenChange={setIsAddingStop}>
        <DialogContent className="rounded-[40px] max-w-xl border-none shadow-2xl p-12 overflow-hidden bg-white">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold tracking-tight mb-8">Where are you heading?</DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-black/40">City Name</Label>
              <div className="relative">
                <Input 
                  placeholder="e.g. Paris, France" 
                  className="h-14 bg-[#F5F2ED] border-none rounded-2xl px-12 text-lg font-semibold focus-visible:ring-black"
                  value={newStopCity}
                  onChange={(e) => setNewStopCity(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest font-bold text-black/40">Arrival</Label>
                <Input 
                  type="date"
                  className="h-14 bg-[#F5F2ED] border-none rounded-2xl px-6 font-semibold focus-visible:ring-black"
                  value={newStopArrival}
                  onChange={(e) => setNewStopArrival(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest font-bold text-black/40">Departure</Label>
                <Input 
                  type="date"
                  className="h-14 bg-[#F5F2ED] border-none rounded-2xl px-6 font-semibold focus-visible:ring-black"
                  value={newStopDeparture}
                  onChange={(e) => setNewStopDeparture(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-8">
              <Button size="lg" className="w-full h-16 rounded-full bg-black text-white text-xl font-bold" onClick={handleAddStop}>
                Add to Itinerary
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActivityCreator({ tripId, stopId }: { tripId: string, stopId: string }) {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [type, setType] = useState<ActivityType>(ActivityType.SIGHTSEEING);

  const addActivity = async () => {
    if (!title || !cost) {
      toast.error('Title and cost are required');
      return;
    }
    try {
      await addDoc(collection(db, 'trips', tripId, 'stops', stopId, 'activities'), {
        title,
        cost: Number(cost),
        type,
        status: 'planned',
      });
      toast.success('Activity added');
      setTitle('');
      setCost('');
    } catch (e) {
      toast.error('Failed to add activity');
    }
  };

  const types = [
    { id: ActivityType.SIGHTSEEING, icon: Globe, label: 'Sightseeing' },
    { id: ActivityType.FOOD, icon: Utensils, label: 'Dining' },
    { id: ActivityType.TRANSPORT, icon: Plane, label: 'Travel' },
    { id: ActivityType.STAY, icon: Hotel, label: 'Stay' },
  ];

  return (
    <div className="space-y-8">
      <DialogHeader>
        <DialogTitle className="text-3xl font-bold">Planned Activity</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest font-bold text-black/40">Activity Name</Label>
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Louvre Museum Visit" 
            className="h-12 border-black/10 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest font-bold text-black/40">Est. Cost ($)</Label>
            <Input 
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00" 
              className="h-12 border-black/10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest font-bold text-black/40">Category</Label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
              className="w-full h-12 border border-black/10 rounded-xl px-4 text-sm"
            >
              {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          {types.map(t => (
            <Button
              key={t.id}
              variant={type === t.id ? 'default' : 'outline'}
              className="rounded-full gap-2 text-xs h-10 px-4"
              onClick={() => setType(t.id)}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </Button>
          ))}
        </div>

        <Button className="w-full h-14 rounded-full bg-black text-white font-bold" onClick={addActivity}>
          Add Activity
        </Button>
      </div>
    </div>
  );
}

function ActivityList({ tripId, stopId }: { tripId: string, stopId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'trips', tripId, 'stops', stopId, 'activities'));
    const unsub = onSnapshot(q, (sn) => {
      setActivities(sn.docs.map(d => ({ id: d.id, ...d.data() }) as Activity));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/stops/${stopId}/activities`));
    return unsub;
  }, [tripId, stopId]);

  if (activities.length === 0) return (
    <div className="flex items-center gap-2 text-black/30 bg-black/5 rounded-2xl px-4 py-3 text-sm">
      <Star className="w-4 h-4" />
      <span>No activities added yet</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {activities.map((act) => (
        <div key={act.id} className="flex justify-between items-center bg-[#F5F2ED]/60 rounded-2xl p-4 group/item">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ActivityTypeIcon type={act.type} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{act.title}</h4>
              <span className="text-[10px] uppercase font-black text-black/30">${act.cost}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 opacity-0 group-hover/item:opacity-100 transition-opacity"
            onClick={async () => {
              try {
                await deleteDoc(doc(db, 'trips', tripId, 'stops', stopId, 'activities', act.id));
              } catch (e) {}
            }}
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function ActivityTypeIcon({ type }: { type: ActivityType }) {
  switch (type) {
    case ActivityType.FOOD: return <Utensils className="w-4 h-4 text-orange-500" />;
    case ActivityType.TRANSPORT: return <Plane className="w-4 h-4 text-blue-500" />;
    case ActivityType.STAY: return <Hotel className="w-4 h-4 text-green-500" />;
    default: return <Globe className="w-4 h-4 text-purple-500" />;
  }
}
