import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDocs, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Trip, Stop, Activity, PackingItem, Note as TripNote, ActivityType } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { MapPin, Calendar, DollarSign, Package, FileText, Share2, Edit3, Trash2, ChevronLeft, LayoutGrid, List, Plus, CheckCircle2, Sparkles, Plane, Car, Info } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { cn } from '../lib/utils';
import { Expense, ExpenseCategory } from '../types';
import { Label } from '../components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '../components/ui/sheet';

export default function ItineraryView() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [activities, setActivities] = useState<{ [stopId: string]: Activity[] }>({});
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [notes, setNotes] = useState<TripNote[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newPackingItem, setNewPackingItem] = useState('');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TripNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(true);

  // New Expense State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(ExpenseCategory.OTHER);
  const [expenseNote, setExpenseNote] = useState('');

  // Category Budgets State
  const [localCategoryBudgets, setLocalCategoryBudgets] = useState<Record<string, string>>({});
  const [overallBudgetLimit, setOverallBudgetLimit] = useState('');

  useEffect(() => {
    if (!tripId) return;

    const tripUnsub = onSnapshot(doc(db, 'trips', tripId), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Trip;
        setTrip({ id: doc.id, ...data } as Trip);
        setOverallBudgetLimit(data.budgetLimit?.toString() || '');
        const currentCats: Record<string, string> = {};
        Object.entries(data.categoryBudgets || {}).forEach(([cat, val]) => {
          currentCats[cat] = val.toString();
        });
        setLocalCategoryBudgets(currentCats);
      } else {
        // Document no longer exists
        setTrip(null);
        if (!loading) {
          navigate('/trips');
        }
      }
    }, (error) => {
      console.error("Trip snapshot error:", error);
      // Don't throw here to avoid crashing the view
    });

    const stopsQuery = query(collection(db, 'trips', tripId, 'stops'), orderBy('order', 'asc'));
    const stopsUnsub = onSnapshot(stopsQuery, async (snapshot) => {
      const stopsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stop);
      setStops(stopsData);
      
      // Fetch activities for each stop
      const activitiesMap: { [stopId: string]: Activity[] } = {};
      try {
        for (const stop of stopsData) {
          const actSnap = await getDocs(collection(db, 'trips', tripId, 'stops', stop.id, 'activities'));
          activitiesMap[stop.id] = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Activity);
        }
        setActivities(activitiesMap);
      } catch (error) {
        // Silently handle activity fetch error or Log it properly
        console.error("Activities fetch failed", error);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/stops`));

    const packingUnsub = onSnapshot(collection(db, 'trips', tripId, 'packingItems'), (snapshot) => {
      setPackingItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PackingItem));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/packingItems`));

    const notesUnsub = onSnapshot(query(collection(db, 'trips', tripId, 'notes'), orderBy('createdAt', 'desc')), (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TripNote));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/notes`));

    const expensesUnsub = onSnapshot(query(collection(db, 'trips', tripId, 'expenses'), orderBy('date', 'desc')), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/expenses`));

    return () => {
      tripUnsub();
      stopsUnsub();
      packingUnsub();
      notesUnsub();
      expensesUnsub();
    };
  }, [tripId]);

  const isOwner = user?.uid === trip?.ownerId;

  const handleShare = async () => {
    if (!tripId || !trip) return;
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        isPublic: true,
        updatedAt: serverTimestamp()
      });
      const shareUrl = `${window.location.origin}/shared/${tripId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Trip is now public! Share link copied to clipboard.');
    } catch (e) {
      console.error('Share error:', e);
      toast.error('Failed to update sharing settings.');
    }
  };

  const togglePackingItem = async (itemId: string, current: boolean) => {
    if (!tripId || !isOwner) return;
    await updateDoc(doc(db, 'trips', tripId, 'packingItems', itemId), { isPacked: !current });
  };

  const addPackingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackingItem || !tripId || !isOwner) return;
    try {
      await addDoc(collection(db, 'trips', tripId, 'packingItems'), {
        item: newPackingItem,
        isPacked: false,
        category: 'Uncategorized'
      });
      toast.success('Added to packing list');
      setNewPackingItem('');
    } catch (e) {
      toast.error('Failed to add item');
    }
  };

  const deletePackingItem = async (itemId: string) => {
    if (!tripId || !isOwner) return;
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'packingItems', itemId));
      toast.success('Removed item');
    } catch (e) {
      toast.error('Failed to remove item');
    }
  };

  const handleSaveNote = async () => {
    if (!tripId || !noteContent.trim() || !isOwner) return;
    try {
      if (editingNote) {
        await updateDoc(doc(db, 'trips', tripId, 'notes', editingNote.id), {
          content: noteContent,
          updatedAt: serverTimestamp()
        });
        toast.success('Note updated');
      } else {
        await addDoc(collection(db, 'trips', tripId, 'notes'), {
          content: noteContent,
          createdAt: serverTimestamp()
        });
        toast.success('Note added');
      }
      setIsNoteDialogOpen(false);
      setEditingNote(null);
      setNoteContent('');
    } catch (e) {
      toast.error('Failed to save note');
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!tripId || !isOwner) return;
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'notes', noteId));
      toast.success('Note deleted');
    } catch (e) {
      toast.error('Failed to delete note');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId || !expenseTitle || !expenseAmount || !isOwner) return;
    try {
      await addDoc(collection(db, 'trips', tripId, 'expenses'), {
        title: expenseTitle,
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        date: serverTimestamp(),
        note: expenseNote
      });
      toast.success('Expense logged');
      setIsExpenseSheetOpen(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseCategory(ExpenseCategory.OTHER);
      setExpenseNote('');
    } catch (e) {
      toast.error('Failed to log expense');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!tripId || !isOwner) return;
    try {
      await deleteDoc(doc(db, 'trips', tripId, 'expenses', id));
      toast.success('Expense removed');
    } catch (e) {
      toast.error('Failed to remove expense');
    }
  };

  const saveBudgets = async () => {
    if (!tripId || !isOwner) return;
    try {
      const budgetLimitNum = parseFloat(overallBudgetLimit);
      const categoryBudgetsNum: Record<string, number> = {};
      Object.entries(localCategoryBudgets).forEach(([cat, val]) => {
        if (val) categoryBudgetsNum[cat] = parseFloat(val as string);
      });

      await updateDoc(doc(db, 'trips', tripId), {
        budgetLimit: isNaN(budgetLimitNum) ? 0 : budgetLimitNum,
        categoryBudgets: categoryBudgetsNum,
        updatedAt: serverTimestamp()
      });
      toast.success('Budgets updated');
      setIsBudgetDialogOpen(false);
    } catch (e) {
      toast.error('Failed to update budgets');
    }
  };

  const deleteTrip = async () => {
    if (!tripId || !isOwner) return;
    console.log('[ItineraryView] Attempting to delete trip:', tripId);
    if (!window.confirm('Are you certain you want to delete this journey? This action cannot be undone.')) return;
    
    setLoading(true);
    const toastId = toast.loading('Deleting journey and all related data...');
    
    try {
      // 1. Best-effort recursive cleanup of sub-collections
      const subCollections = ['stops', 'packingItems', 'notes', 'expenses'];
      const allDeletes: any[] = [];

      try {
        for (const sub of subCollections) {
          const snap = await getDocs(collection(db, 'trips', tripId, sub));
          for (const docSnap of snap.docs) {
            if (sub === 'stops') {
              const actSnap = await getDocs(collection(db, 'trips', tripId, 'stops', docSnap.id, 'activities'));
              for (const actDoc of actSnap.docs) {
                allDeletes.push(deleteDoc(doc(db, 'trips', tripId, 'stops', docSnap.id, 'activities', actDoc.id)));
              }
            }
            allDeletes.push(deleteDoc(doc(db, 'trips', tripId, sub, docSnap.id)));
          }
        }

        if (allDeletes.length > 0) {
          await Promise.all(allDeletes);
        }
      } catch (subError) {
        console.warn('[ItineraryView] Could not delete all subcollections (permissions):', subError);
      }

      // 2. Delete main trip document
      await deleteDoc(doc(db, 'trips', tripId));
      
      console.log('[ItineraryView] Trip deleted successfully, navigating...');
      toast.success('Journey removed from your records.', { id: toastId });
      
      // Use a small delay to ensure Firestore events have propagated
      setTimeout(() => {
        navigate('/trips', { replace: true });
      }, 500);
    } catch (error) {
      console.error('[ItineraryView] Delete error:', error);
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}`);
      toast.error('Failed to remove journey.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    const activityTotal = (Object.values(activities).flat() as Activity[]).reduce((sum, act) => sum + act.cost, 0);
    const expenseTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return activityTotal + expenseTotal;
  };

  const totalCost = calculateTotalCost();
  const budgetProgress = trip?.budgetLimit ? (totalCost / trip.budgetLimit) * 100 : 0;

  const allActivities = Object.values(activities).flat() as Activity[];
  
  const costData = Object.values(ExpenseCategory).map(cat => {
    const actSpent = (allActivities.filter(a => a.type.toLowerCase() === cat.toLowerCase()) as Activity[]).reduce((s, a) => s + a.cost, 0);
    const expSpent = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    return { name: cat, value: actSpent + expSpent };
  }).filter(d => d.value > 0);

  const categoryBudgetChartData = Object.values(ExpenseCategory).map(cat => {
    // Map ActivityType to ExpenseCategory
    const actSpent = allActivities.filter(a => {
      const type = a.type.toLowerCase();
      const currentCat = cat.toLowerCase();
      if (type === currentCat) return true;
      if (type === 'stay' && currentCat === 'accommodation') return true;
      if (type === 'sightseeing' && currentCat === 'entertainment') return true;
      if (type === 'activity' && currentCat === 'entertainment') return true;
      return false;
    }).reduce((s, a) => s + a.cost, 0);

    const expSpent = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    const spent = actSpent + expSpent;
    const limit = trip?.categoryBudgets?.[cat] || 0;
    return { 
      name: cat.charAt(0).toUpperCase() + cat.slice(1), 
      spending: spent, 
      budget: limit 
    };
  }).filter(d => d.spending > 0 || d.budget > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-black/5 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-black/40">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-8">
              <span className="text-sm font-bold text-black/60">Planned Budget</span>
              <span className="text-lg font-black">${payload[0].value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center gap-8">
              <span className="text-sm font-bold text-black">Actual Spending</span>
              <span className={cn(
                "text-2xl font-black italic",
                payload[1].value > payload[0].value && payload[0].value > 0 ? "text-red-500 underline decoration-red-200" : "text-black"
              )}>
                ${payload[1].value.toLocaleString()}
              </span>
            </div>
          </div>
          {payload[0].value > 0 && payload[1].value > payload[0].value && (
            <p className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full text-center">
              EXCEEDED BY ${(payload[1].value - payload[0].value).toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#000000', '#FFBD59', '#60A5FA', '#F87171', '#4ADE80', '#A78BFA'];

  if (loading) return <div className="p-12 text-center text-black/40 font-medium italic">Analysing trip documents...</div>;

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="relative h-[400px] rounded-[48px] overflow-hidden shadow-2xl">
        <img 
          src={trip?.coverURL || `https://picsum.photos/seed/${tripId}/1920/1080`} 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Trip Cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white flex justify-between items-end">
          <div className="space-y-4">
            <Link to="/trips" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
              My Journeys
            </Link>
            <h1 className="text-6xl font-bold tracking-tighter">{trip?.title}</h1>
            <div className="flex gap-6 items-center opacity-80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{trip && format(trip.startDate.toDate(), 'MMMM d')} - {trip && format(trip.endDate.toDate(), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{stops.length} destinations</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {isOwner && (
              <Button className="rounded-full bg-white text-black hover:bg-white/90 gap-2" onClick={() => navigate(`/trips/${tripId}/build`)}>
                <Edit3 className="w-4 h-4" />
                Edit Itinerary
              </Button>
            )}
            <Button 
              variant="outline" 
              className="rounded-full border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 gap-2"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              {trip?.isPublic ? 'Copy Link' : 'Share'}
            </Button>
            {isOwner && (
              <Button 
                variant="outline" 
                className="rounded-full border-red-500/20 bg-red-500/10 backdrop-blur-md text-red-500 hover:bg-red-500/20 gap-2 hover:text-red-600"
                onClick={deleteTrip}
              >
                <Trash2 className="w-4 h-4" />
                Delete Trip
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="itinerary" className="space-y-8">
        <div className="flex justify-between items-center">
          <TabsList className="bg-white rounded-full p-1 border border-black/5">
            <TabsTrigger value="itinerary" className="rounded-full px-8 data-[state=active]:bg-black data-[state=active]:text-white">Full Itinerary</TabsTrigger>
            {trip?.smartAssistant && (
              <TabsTrigger value="guide" className="rounded-full px-8 data-[state=active]:bg-black data-[state=active]:text-white flex gap-2">
                <Sparkles className="w-4 h-4" />
                Travel Guide
              </TabsTrigger>
            )}
            <TabsTrigger value="budget" className="rounded-full px-8 data-[state=active]:bg-black data-[state=active]:text-white">Budget & Analysis</TabsTrigger>
            <TabsTrigger value="packing" className="rounded-full px-8 data-[state=active]:bg-black data-[state=active]:text-white">Packing List</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-full px-8 data-[state=active]:bg-black data-[state=active]:text-white">Trip Notes</TabsTrigger>
          </TabsList>
        </div>

        {/* Travel Guide Tab */}
        {trip?.smartAssistant && (
          <TabsContent value="guide" className="space-y-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="rounded-[40px] p-8 bg-white border-none shadow-sm space-y-6">
                <CardHeader className="p-0">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                    <Plane className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Recommended Airlines</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-wrap gap-2">
                    {trip.smartAssistant.airlines.map(airline => (
                      <Badge key={airline} variant="secondary" className="rounded-full px-4 py-1 text-sm bg-blue-50 text-blue-700 border-none">
                        {airline}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[40px] p-8 bg-white border-none shadow-sm space-y-6">
                <CardHeader className="p-0">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-2">
                    <Car className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Transportation & Taxis</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-wrap gap-2">
                    {trip.smartAssistant.taxiApps.map(app => (
                      <Badge key={app} variant="secondary" className="rounded-full px-4 py-1 text-sm bg-green-50 text-green-700 border-none">
                        {app}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-[40px] p-12 bg-black text-white border-none shadow-xl space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold italic">Local Expert Tips</h3>
              </div>
              <p className="text-xl leading-relaxed text-white/80 whitespace-pre-wrap">
                {trip.smartAssistant.localTips}
              </p>
            </Card>
          </TabsContent>
        )}
        <TabsContent value="itinerary" className="space-y-12">
          {stops.map((stop, index) => (
            <section key={stop.id} className="grid grid-cols-1 md:grid-cols-12 gap-8 relative">
              {index < stops.length - 1 && (
                <div className="absolute left-6 top-12 bottom-[-48px] w-[2px] bg-black/5 hidden md:block" />
              )}
              
              <div className="md:col-span-1 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#F5F2ED] bg-white flex items-center justify-center font-bold z-10">
                  {index + 1}
                </div>
              </div>

              <div className="md:col-span-11 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold">{stop.cityName}</h3>
                  <p className="text-black/40 font-medium">{format(stop.arrivalDate.toDate(), 'PPP')} - {format(stop.departureDate.toDate(), 'PPP')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activities[stop.id]?.map((act) => (
                    <Card key={act.id} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="rounded-full uppercase text-[10px] tracking-widest">{act.type}</Badge>
                          <span className="font-bold text-sm bg-black/5 px-2 py-1 rounded-md">${act.cost}</span>
                        </div>
                        <CardTitle className="text-lg mt-2">{act.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-black/40 line-clamp-2">{act.description || 'No additional details provided.'}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {(!activities[stop.id] || activities[stop.id].length === 0) && (
                    <div className="col-span-full py-8 text-center bg-black/5 rounded-3xl border-2 border-dashed border-black/10 text-black/40">
                      Relaxation day - no activities planned yet.
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-12 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Summary Card */}
            <Card className="rounded-[48px] p-12 border-none shadow-lg bg-white space-y-8 lg:col-span-1">
              <div className="space-y-2">
                <h3 className="text-[10px] uppercase tracking-widest font-black text-black/40">Total Expenditure</h3>
                <div className="flex justify-between items-end">
                  <span className="text-5xl font-bold tracking-tight">${totalCost.toLocaleString()}</span>
                  <span className="text-sm font-semibold opacity-40">/ ${trip?.budgetLimit || 0}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span>Capacity Used</span>
                  <span className={cn(budgetProgress > 100 ? "text-red-500" : "text-black")}>{Math.round(budgetProgress)}%</span>
                </div>
                <div className="h-6 bg-black/5 rounded-full p-1 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", budgetProgress > 100 ? "bg-red-500" : "bg-black")} 
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }} 
                  />
                </div>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 border-t border-black/5">
                <div>
                  <span className="text-[10px] text-black/40 font-black block mb-1 uppercase tracking-widest">Remaining</span>
                  <span className={cn("text-2xl font-bold", (trip?.budgetLimit || 0) - totalCost < 0 ? "text-red-500" : "text-black")}>
                    ${Math.max(0, (trip?.budgetLimit || 0) - totalCost).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-black/40 font-black block mb-1 uppercase tracking-widest">Avg / Stop</span>
                  <span className="text-2xl font-bold">${Math.round(totalCost / (stops.length || 1))}</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button variant="outline" className="rounded-full h-12 gap-2 border-black/10" onClick={() => setIsBudgetDialogOpen(true)}>
                  <DollarSign className="w-4 h-4" />
                  Configure Budgets
                </Button>
                <Sheet open={isExpenseSheetOpen} onOpenChange={setIsExpenseSheetOpen}>
                  <SheetTrigger asChild>
                    <Button className="rounded-full h-12 gap-2 bg-black text-white hover:bg-black/90">
                      <Plus className="w-4 h-4" />
                      Log New Expense
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="rounded-l-[40px] w-full sm:max-w-md p-12 overflow-y-auto">
                    <SheetHeader className="mb-8">
                      <SheetTitle className="text-3xl font-bold">Log Expense</SheetTitle>
                    </SheetHeader>
                    <form onSubmit={handleAddExpense} className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Expense Description</Label>
                        <Input 
                          placeholder="e.g., Dinner at Osteria" 
                          className="h-14 rounded-2xl bg-black/5 border-none px-6"
                          value={expenseTitle}
                          onChange={e => setExpenseTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Amount ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01"
                          className="h-14 rounded-2xl bg-black/5 border-none px-6"
                          value={expenseAmount}
                          onChange={e => setExpenseAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Category</Label>
                        <select 
                          className="w-full h-14 rounded-2xl bg-black/5 border-none px-6 appearance-none cursor-pointer font-medium"
                          value={expenseCategory}
                          onChange={e => setExpenseCategory(e.target.value as ExpenseCategory)}
                        >
                          {Object.values(ExpenseCategory).map(cat => (
                            <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Additional Notes (Optional)</Label>
                        <Textarea 
                          placeholder="Receipt details, split info etc." 
                          className="min-h-[100px] rounded-2xl bg-black/5 border-none p-6 resize-none"
                          value={expenseNote}
                          onChange={e => setExpenseNote(e.target.value)}
                        />
                      </div>
                      <SheetFooter className="pt-8">
                        <Button type="submit" className="w-full h-14 rounded-full bg-black text-white hover:bg-black/90">Log Transaction</Button>
                      </SheetFooter>
                    </form>
                  </SheetContent>
                </Sheet>
              </div>
            </Card>

            <div className="lg:col-span-2 space-y-12">
              {/* Category Breakdown Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-[48px] p-10 bg-white border-none shadow-sm h-full">
                  <div className="flex justify-between items-center mb-8 px-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest">Spend Breakdown</h4>
                    <div className="flex -space-x-2">
                      {COLORS.slice(0, 4).map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costData}
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={6}
                          dataKey="value"
                        >
                          {costData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={12} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 rounded-3xl shadow-xl border border-black/5">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">{payload[0].name}</p>
                                  <p className="text-xl font-black italic">${payload[0].value.toLocaleString()}</p>
                                  <p className="text-[10px] font-bold text-black/40 mt-1">
                                    {Math.round((payload[0].value / totalCost) * 100)}% of total
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="rounded-[48px] p-10 bg-white border-none shadow-sm h-full">
                  <div className="flex justify-between items-center mb-8 px-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest">Budget vs Actual</h4>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-black/10" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Planned</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-black" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Spent</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryBudgetChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', fill: '#9CA3AF', letterSpacing: '0.1em' }} 
                          dy={15}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 16 }}
                          content={<CustomTooltip />}
                        />
                        <Bar 
                          dataKey="budget" 
                          fill="#F3F4F6" 
                          radius={[8, 8, 0, 0]} 
                          barSize={32}
                        />
                        <Bar 
                          dataKey="spending" 
                          fill="#000000" 
                          radius={[8, 8, 0, 0]} 
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Transactions List */}
              <div className="space-y-6">
                <div className="flex justify-between items-end px-4">
                  <h3 className="text-2xl font-bold italic">Recent Transactions</h3>
                  <Badge variant="outline" className="rounded-full border-black/10">{expenses.length} Entries</Badge>
                </div>
                <div className="space-y-4">
                  {expenses.sort((a,b) => b.date.toMillis() - a.date.toMillis()).map(exp => (
                    <div key={exp.id} className="flex items-center justify-between p-6 bg-white rounded-[32px] shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center text-xl">
                          {exp.category === ExpenseCategory.FOOD && '🍕'}
                          {exp.category === ExpenseCategory.ACCOMMODATION && '🏠'}
                          {exp.category === ExpenseCategory.FLIGHTS && '✈️'}
                          {exp.category === ExpenseCategory.TRANSPORT && '🚕'}
                          {exp.category === ExpenseCategory.ENTERTAINMENT && '🎢'}
                          {exp.category === ExpenseCategory.SHOPPING && '🛍️'}
                          {exp.category === ExpenseCategory.OTHER && '💸'}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{exp.title}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{exp.category}</span>
                            <span className="w-1 h-1 rounded-full bg-black/10" />
                            <span className="text-[10px] font-medium text-black/30">{exp.date?.toDate ? format(exp.date.toDate(), 'MMM d, HH:mm') : 'Recently'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xl font-bold tracking-tight">${exp.amount.toLocaleString()}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
                          onClick={() => deleteExpense(exp.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="p-12 text-center bg-white rounded-[48px] border-2 border-dashed border-black/5 text-black/20 italic">
                      No transactions logged manually yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
            <DialogContent className="max-w-2xl rounded-[40px] p-12 max-h-[80vh] overflow-y-auto">
              <DialogHeader className="mb-8">
                <DialogTitle className="text-3xl font-bold">Configure Budgets</DialogTitle>
              </DialogHeader>
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black tracking-widest opacity-40">Overall Trip Budget ($)</Label>
                  <Input 
                    type="number" 
                    value={overallBudgetLimit} 
                    onChange={e => setOverallBudgetLimit(e.target.value)}
                    className="h-16 rounded-2xl bg-black/5 border-none px-6 text-2xl font-bold"
                  />
                  <p className="text-xs text-black/30 italic px-2">Total limit across all categories and unplanned spending.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-black/5">
                  <Label className="col-span-full text-[10px] uppercase font-black tracking-widest opacity-40 mb-2">Category-Specific Limits</Label>
                  {Object.values(ExpenseCategory).map(cat => (
                    <div key={cat} className="space-y-2">
                      <Label className="text-[11px] font-bold capitalize flex items-center gap-2">
                        {cat}
                      </Label>
                      <Input 
                        type="number" 
                        placeholder="Unlimited"
                        value={localCategoryBudgets[cat] || ''}
                        onChange={e => setLocalCategoryBudgets(prev => ({ ...prev, [cat]: e.target.value }))}
                        className="h-12 rounded-xl bg-black/5 border-none px-4"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-12">
                <Button variant="ghost" onClick={() => setIsBudgetDialogOpen(false)} className="rounded-full">Cancel</Button>
                <Button className="rounded-full px-12 h-12 bg-black text-white hover:bg-black/90" onClick={saveBudgets}>Save Configuration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Packing Tab */}
        <TabsContent value="packing" className="max-w-3xl mx-auto space-y-12 py-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-black/20" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight">Ready for adventure?</h2>
            <p className="text-black/40 text-lg">Check off items as you pack them to ensure a stress-free departure.</p>
          </div>

          <div className="bg-white rounded-[48px] p-12 shadow-sm space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {packingItems.map((item) => (
                 <div key={item.id} className="flex items-center justify-between p-4 bg-[#F5F2ED] rounded-3xl group">
                   <div className="flex items-center space-x-4">
                     <Checkbox 
                       id={item.id} 
                       checked={item.isPacked} 
                       onCheckedChange={() => togglePackingItem(item.id, item.isPacked)}
                       className="w-6 h-6 rounded-full data-[state=checked]:bg-black data-[state=checked]:border-black"
                     />
                     <label 
                       htmlFor={item.id} 
                       className={cn("text-lg font-medium transition-all cursor-pointer", item.isPacked && "line-through opacity-40")}
                      >
                       {item.item}
                     </label>
                   </div>
                   {isOwner && (
                     <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deletePackingItem(item.id)}
                     >
                       <Trash2 className="w-4 h-4 text-red-500" />
                     </Button>
                   )}
                 </div>
               ))}
             </div>
             
             {packingItems.length === 0 && (
               <div className="text-center py-12 text-black/20 italic">
                 Your packing list is empty. Start adding items below!
               </div>
             )}

             {isOwner && (
               <div className="pt-8 border-t border-black/5">
                  <form onSubmit={addPackingItem} className="flex gap-4">
                    <Input 
                      placeholder="Add new packing item..." 
                      value={newPackingItem}
                      onChange={(e) => setNewPackingItem(e.target.value)}
                      className="h-14 rounded-full bg-[#F5F2ED] border-none px-8"
                    />
                    <Button type="submit" className="h-14 w-14 rounded-full bg-black text-white shrink-0">
                      <Plus className="w-6 h-6" />
                    </Button>
                  </form>
               </div>
             )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="max-w-4xl mx-auto space-y-12 py-8">
           <div className="flex justify-between items-center px-4">
             <div>
               <h2 className="text-3xl font-bold tracking-tight">Journal & Reminders</h2>
               <p className="text-black/40">Important details, hotel info, and travel memories.</p>
             </div>
             {isOwner && (
               <Button 
                className="rounded-full bg-black text-white gap-2"
                onClick={() => {
                  setEditingNote(null);
                  setNoteContent('');
                  setIsNoteDialogOpen(true);
                }}
               >
                 <Plus className="w-4 h-4" />
                 New Note
               </Button>
             )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {notes.map((note) => (
               <Card key={note.id} className="rounded-[40px] p-8 border-none shadow-sm bg-white hover:shadow-md transition-all">
                 <div className="flex justify-between items-start mb-4">
                   <Badge variant="outline" className="rounded-full px-3 text-[10px] tracking-widest font-bold">Note</Badge>
                   <span className="text-[10px] text-black/20 font-bold uppercase tracking-widest">
                     {note.createdAt?.toDate ? format(note.createdAt.toDate(), 'PPP') : 'Just now'}
                   </span>
                 </div>
                 <p className="text-lg font-medium leading-relaxed italic whitespace-pre-wrap">{note.content}</p>
                 <div className="mt-8 flex justify-end gap-2">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full w-8 h-8 opacity-40 hover:opacity-100"
                    onClick={() => {
                      setEditingNote(note);
                      setNoteContent(note.content);
                      setIsNoteDialogOpen(true);
                    }}
                   >
                    <Edit3 className="w-3 h-3" />
                   </Button>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full w-8 h-8 opacity-40 hover:opacity-100 text-red-500"
                    onClick={() => deleteNote(note.id)}
                   >
                    <Trash2 className="w-3 h-3" />
                   </Button>
                 </div>
               </Card>
             ))}
             {notes.length === 0 && (
               <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-black/5 text-black/20 font-medium">
                 Capture your travel memories and important details here.
               </div>
             )}
           </div>

           <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
             <DialogContent className="max-w-md rounded-[32px]">
               <DialogHeader>
                 <DialogTitle className="text-2xl font-bold">{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
               </DialogHeader>
               <div className="py-4">
                 <Textarea 
                   placeholder="Type your note here..." 
                   className="min-h-[200px] rounded-2xl bg-black/5 border-none resize-none p-4"
                   value={noteContent}
                   onChange={(e) => setNoteContent(e.target.value)}
                 />
               </div>
               <DialogFooter>
                 <Button variant="ghost" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
                 <Button className="bg-black text-white rounded-full px-8" onClick={handleSaveNote}>Save Note</Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
