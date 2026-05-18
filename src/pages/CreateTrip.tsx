import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeft, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { TripStatus, ActivityType } from '../types';
import { generateSmartPlan } from '../services/smartPlanService';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Plane, Hotel, Utensils, Camera, Ticket, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const destParam = params.get('destination');
    if (destParam) {
      setDestination(destParam);
    }
  }, [location]);

  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [budget, setBudget] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({
    [ActivityType.TRANSPORT]: '',
    [ActivityType.STAY]: '',
    [ActivityType.FOOD]: '',
    [ActivityType.SIGHTSEEING]: '',
    [ActivityType.ACTIVITY]: '',
    [ActivityType.OTHER]: ''
  });

  const handleCategoryBudgetChange = (cat: string, value: string) => {
    setCategoryBudgets(prev => ({ ...prev, [cat]: value }));
  };

  const handleCreate = async () => {
    if (!user) {
      toast.error('You must be logged in to create a trip');
      return;
    }

    if (!destination || !startDate || !endDate) {
      toast.error('Please specify a destination and dates');
      return;
    }

    setLoading(true);
    const loadingToastId = toast.loading(`Drafting your custom itinerary for ${destination}...`);
    
    try {
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const smartPlan = await generateSmartPlan(destination, duration, description);

      const tripData = {
        title: title || `Trip to ${destination}`,
        description: (description + "\n\n" + smartPlan.generalAdvice.localTips).trim(),
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        budgetLimit: budget ? Number(budget) : 0,
        categoryBudgets: Object.entries(categoryBudgets).reduce((acc, [key, val]) => {
          if (val) acc[key] = Number(val);
          return acc;
        }, {} as Record<string, number>),
        ownerId: user.uid,
        status: TripStatus.PLANNING,
        smartAssistant: {
          airlines: smartPlan.generalAdvice.airlines,
          taxiApps: smartPlan.generalAdvice.taxiApps,
          localTips: smartPlan.generalAdvice.localTips
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic: false,
        coverURL: `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop`
      };

      const docRef = await addDoc(collection(db, 'trips'), tripData);
      console.log('Main trip document created:', docRef.id);
      
      for (const [index, stop] of smartPlan.stops.entries()) {
        const stopArrival = new Date(startDate);
        stopArrival.setDate(stopArrival.getDate() + stop.arrivalDateOffset);
        
        const stopDeparture = new Date(startDate);
        stopDeparture.setDate(stopDeparture.getDate() + stop.departureDateOffset);

        const stopRef = await addDoc(collection(db, 'trips', docRef.id, 'stops'), {
          cityName: stop.cityName,
          order: index,
          arrivalDate: Timestamp.fromDate(stopArrival),
          departureDate: Timestamp.fromDate(stopDeparture),
          note: stop.note
        });

        for (const activity of stop.activities) {
          await addDoc(collection(db, 'trips', docRef.id, 'stops', stopRef.id, 'activities'), {
            title: activity.title,
            description: activity.description,
            cost: activity.cost,
            type: activity.type,
            duration: activity.duration,
            status: 'planned'
          });
        }
      }

      if (smartPlan.generalAdvice.airlines.length > 0 || smartPlan.generalAdvice.taxiApps.length > 0) {
        await addDoc(collection(db, 'trips', docRef.id, 'notes'), {
          content: `Recommended Airlines: ${smartPlan.generalAdvice.airlines.join(', ')}\nTaxi Apps: ${smartPlan.generalAdvice.taxiApps.join(', ')}`,
          createdAt: serverTimestamp()
        });
      }

      toast.success('Itinerary designed successfully!', { id: loadingToastId });
      navigate(`/trips/${docRef.id}`);
    } catch (error) {
      console.error('Failed to create trip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create trip: ${errorMessage}`, { id: loadingToastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto py-12 space-y-12"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full text-white/50 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-4xl font-bold tracking-tight text-white">Design a Journey</h1>
      </div>

      <div className="space-y-8 bg-white/[0.03] backdrop-blur-xl p-12 rounded-[48px] shadow-lg border border-white/[0.06]">
        <div className="space-y-2">
          <Label htmlFor="destination" className="text-xs uppercase tracking-widest font-bold text-white/30">Where are you going? *</Label>
          <Input 
            id="destination" 
            placeholder="e.g. Paris, France or Tokyo, Japan" 
            className="text-2xl font-bold border-none px-0 focus-visible:ring-0 placeholder:text-white/10 h-auto py-2 bg-transparent text-white"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs uppercase tracking-widest font-bold text-white/30">Trip Title (Optional)</Label>
          <Input 
            id="title" 
            placeholder="e.g. Dream Vacation 2026" 
            className="text-xl font-medium border-none px-0 focus-visible:ring-0 placeholder:text-white/10 h-auto py-1 bg-transparent text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest font-bold text-white/30">Start Date *</Label>
            <Popover>
              <PopoverTrigger className={cn("w-full justify-start text-left font-normal rounded-full border border-white/[0.06] h-12 px-6 bg-white/[0.03] hover:bg-white/[0.05] flex items-center text-white", !startDate && "text-white/30")}>
                <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-xl rounded-3xl overflow-hidden" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest font-bold text-white/30">End Date *</Label>
            <Popover>
              <PopoverTrigger className={cn("w-full justify-start text-left font-normal rounded-full border border-white/[0.06] h-12 px-6 bg-white/[0.03] hover:bg-white/[0.05] flex items-center text-white", !endDate && "text-white/30")}>
                <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-xl rounded-3xl overflow-hidden" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget" className="text-xs uppercase tracking-widest font-bold text-white/30">Estimated Budget ($)</Label>
          <div className="relative">
            <Input 
              id="budget" 
              type="number"
              placeholder="0.00" 
              className="pl-6 h-14 bg-white/[0.04] border border-white/[0.06] rounded-2xl text-lg font-semibold focus-visible:ring-orange-500 text-white placeholder:text-white/20"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-xs uppercase tracking-widest font-bold text-white/30">Budget Breakdown (Optional)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id: ActivityType.TRANSPORT, label: 'Transport', icon: Plane },
              { id: ActivityType.STAY, label: 'Stay', icon: Hotel },
              { id: ActivityType.FOOD, label: 'Food', icon: Utensils },
              { id: ActivityType.SIGHTSEEING, label: 'Sightseeing', icon: Camera },
              { id: ActivityType.ACTIVITY, label: 'Activities', icon: Ticket },
              { id: ActivityType.OTHER, label: 'Other', icon: MoreHorizontal },
            ].map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <cat.icon className="w-3 h-3 text-white/30" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">{cat.label}</span>
                </div>
                <Input 
                  type="number"
                  placeholder="0"
                  className="h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm font-semibold focus-visible:ring-orange-500 text-white placeholder:text-white/20"
                  value={categoryBudgets[cat.id]}
                  onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs uppercase tracking-widest font-bold text-white/30">Trip Description</Label>
          <Textarea 
            id="description" 
            placeholder="Tell us more about your dream trip..." 
            className="min-h-[120px] bg-white/[0.04] border border-white/[0.06] rounded-3xl p-6 focus-visible:ring-orange-500 text-lg resize-none text-white placeholder:text-white/20"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="pt-8 flex flex-col gap-4">
          <Button 
            size="lg" 
            className="w-full h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-orange-500/20 hover:shadow-xl text-xl font-bold flex gap-4 justify-center items-center transition-all hover:scale-[1.02] active:scale-95 shadow-lg border-none"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Designing your trip...' : (
              <>
                Create Itinerary
                <Send className="w-5 h-5" />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-white/25 font-medium leading-relaxed max-w-md mx-auto">
            We will gather a personalized schedule of hotels, daily activities, and travel recommendations matching your preferences. You can edit and customize everything once created!
          </p>
        </div>
      </div>
    </motion.div>
  );
}
