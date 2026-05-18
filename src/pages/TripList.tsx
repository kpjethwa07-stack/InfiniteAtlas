import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Trip } from '../types';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, MapPin, Trash2, Filter, Sparkles, Map as MapIcon, List as ListIcon } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { format } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function TripList() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const tripsRef = collection(db, 'trips');
  const userTripsQuery = query(
    tripsRef,
    where('ownerId', '==', user?.uid),
    orderBy('startDate', 'asc')
  );

  const [tripsSnapshot, loading] = useCollection(user?.uid ? userTripsQuery : null);
  const trips = tripsSnapshot?.docs.map(doc => {
    const data = doc.data();
    // Provide fallback coordinates for visualization if missing
    // In a real app, these would come from geocoding or user selection
    const mockLat = data.latitude || (48.8566 + (Math.random() - 0.5) * 5);
    const mockLng = data.longitude || (2.3522 + (Math.random() - 0.5) * 5);
    
    return { 
      id: doc.id, 
      ...data,
      latitude: mockLat,
      longitude: mockLng
    };
  });

  const [tripToDelete, setTripToDelete] = useState<string | null>(null);

  const handleDelete = async (tripId: string) => {
    if (!tripId) return;
    const toastId = toast.loading(t('deleting') || 'Removing journey...');
    try {
      // Best-effort sub-collection cleanup (never blocks main delete)
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
              } catch { /* best-effort */ }
            }
            allDeletes.push(deleteDoc(docSnap.ref));
          }
        }
        if (allDeletes.length > 0) await Promise.allSettled(allDeletes);
      } catch (subErr) {
        console.warn('[TripList] Sub-collection cleanup failed (non-blocking):', subErr);
      }

      await deleteDoc(doc(db, 'trips', tripId));
      toast.success(t('deleteSuccess') || 'Trip deleted', { id: toastId });
    } catch (error) {
      console.error('[TripList] Delete error:', error);
      toast.error(t('deleteError') || 'Failed to delete trip', { id: toastId });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Your Journeys</h1>
          <p className="text-black/40 mt-3 text-lg italic">Explore your past and future adventures.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-black/5 p-1 rounded-full border border-black/5">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('grid')}
              className="rounded-full gap-2 h-10 px-4"
            >
              <ListIcon className="w-4 h-4" />
              List
            </Button>
            <Button 
              variant={viewMode === 'map' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('map')}
              className="rounded-full gap-2 h-10 px-4"
            >
              <MapIcon className="w-4 h-4" />
              Map
            </Button>
          </div>
          <Link to="/trips/new">
            <Button size="lg" className="rounded-full gap-2 bg-black hover:scale-105 transition-transform active:scale-95 text-white font-bold h-11 px-6 shadow-md">
              <Plus className="w-4 h-4" />
              Create a Journey
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Input 
            placeholder="Search trips..." 
            className="rounded-full pl-12 h-12 border-black/10 bg-white"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
        </div>
        <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-black/10">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-48 bg-black/5 rounded-[40px] animate-pulse" />)
          ) : trips?.map((trip: any) => (
            <div key={trip.id} className="relative group">
              <Link to={`/trips/${trip.id}`}>
                <Card className="rounded-[40px] overflow-hidden border-none shadow-sm hover:shadow-xl transition-all h-full">
                  <div className="flex h-full min-h-[220px]">
                    <div className="w-1/3 relative overflow-hidden">
                       <img 
                        src={trip.coverURL || `https://picsum.photos/seed/${trip.id}/800/1000`} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" 
                        alt={trip.title}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                    <div className="flex-1 p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                           <Badge variant="secondary" className="rounded-full uppercase text-[10px] tracking-widest">{trip.status}</Badge>
                           <div className="w-8 h-8" /> {/* Placeholder for absolute button space */}
                        </div>
                        <h3 className="text-2xl font-bold leading-tight line-clamp-2">{trip.title}</h3>
                      </div>
                      
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-6 text-xs font-semibold text-black/40">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span>{format(trip.startDate.toDate(), 'MMM d')} - {format(trip.endDate.toDate(), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-6 right-6 z-30 rounded-full h-8 w-8 text-black/10 hover:text-red-500 hover:bg-red-50 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTripToDelete(trip.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[600px] w-full rounded-[40px] overflow-hidden border border-black/5 shadow-sm relative z-10">
          {loading ? (
             <div className="w-full h-full bg-black/5 animate-pulse flex items-center justify-center text-black/20 italic">Loading map...</div>
          ) : (
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              scrollWheelZoom={true} 
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"
              />
              {trips?.map((trip: any) => (
                <Marker key={trip.id} position={[trip.latitude || 0, trip.longitude || 0]}>
                  <Popup className="rounded-2xl overflow-hidden p-0">
                    <div className="w-48 overflow-hidden rounded-xl">
                      <img 
                        src={trip.coverURL || `https://picsum.photos/seed/${trip.id}/400/300`} 
                        className="w-full h-24 object-cover" 
                        alt={trip.title}
                      />
                      <div className="p-3">
                        <h4 className="font-bold text-sm leading-tight mb-2">{trip.title}</h4>
                        <div className="flex items-center justify-between">
                          <Badge className="text-[8px] tracking-tighter uppercase px-2">{trip.status}</Badge>
                          <Link to={`/trips/${trip.id}`}>
                            <Button size="sm" variant="outline" className="h-6 text-[8px] rounded-full px-2">View</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      )}
      <DeleteConfirmDialog 
        isOpen={!!tripToDelete}
        onClose={() => setTripToDelete(null)}
        onConfirm={() => tripToDelete && handleDelete(tripToDelete)}
      />
    </div>
  );
}
