import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, Timestamp, where } from 'firebase/firestore';
import { 
  Users, 
  PlaneTakeoff, 
  TrendingUp, 
  MapPin, 
  Calendar,
  ChevronRight,
  ShieldCheck,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { UserProfile, Trip } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const COLORS = ['#000000', '#FFBD59', '#60A5FA', '#F87171', '#4ADE80', '#A78BFA'];

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const tripsSnap = await getDocs(collection(db, 'trips'));
        
        const userData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        const tripData = tripsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
        
        setUsers(userData);
        setTrips(tripData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Explorers', value: users.length, icon: Users, trend: '+12%', positive: true },
    { label: 'Total Journeys', value: trips.length, icon: PlaneTakeoff, trend: '+25%', positive: true },
    { label: 'Avg Trip Duration', value: '4.5 Days', icon: Calendar, trend: '-2%', positive: false },
    { label: 'Platform Growth', value: '89%', icon: TrendingUp, trend: '+5%', positive: true },
  ];

  // Prepare chart data
  const tripsByMonth = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = format(date, 'MMM');
    const count = trips.filter(t => {
      const tripDate = t.createdAt.toDate();
      return tripDate.getMonth() === date.getMonth() && tripDate.getFullYear() === date.getFullYear();
    }).length;
    return { month, count };
  }).reverse();

  const statusDistribution = [
    { name: 'Planning', value: trips.filter(t => t.status === 'planning').length },
    { name: 'Ongoing', value: trips.filter(t => t.status === 'ongoing').length },
    { name: 'Completed', value: trips.filter(t => t.status === 'completed').length },
  ].filter(d => d.value > 0);

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center font-serif italic text-2xl animate-pulse">
        Accessing Command Center...
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-black pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-6 h-6" />
             <span className="text-xs font-black uppercase tracking-[0.3em] text-black/40">Travelloop Command Center</span>
          </div>
          <h1 className="text-8xl md:text-9xl font-serif font-light tracking-tighter italic leading-[0.8] mb-2">
            Governance
          </h1>
          <p className="text-black/60 font-medium max-w-xl">
            Real-time analytics and platform oversight. Monitor global travel trends and user engagement across the Travelloop ecosystem.
          </p>
        </div>
        
        <div className="flex gap-4">
          <Badge variant="outline" className="rounded-full px-4 py-2 border-black/10 font-bold bg-white">
            System Status: Optimal
          </Badge>
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse mt-3" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-[40px] p-8 border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-500">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
                  stat.positive ? "text-green-600" : "text-red-500"
                )}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-black/30 mb-1">{stat.label}</p>
              <h3 className="text-4xl font-serif italic font-medium">{stat.value}</h3>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[56px] p-10 bg-white border-none shadow-sm h-full">
          <div className="flex justify-between items-center mb-10 px-2">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-1">Growth Curve</h4>
              <h3 className="text-2xl font-serif italic">New Journeys Created</h3>
            </div>
            <LayoutDashboard className="w-6 h-6 text-black/10" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tripsByMonth}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }} 
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#000" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[56px] p-10 bg-white border-none shadow-sm h-full">
          <div className="mb-10 px-2">
            <h4 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-1">Status Mix</h4>
            <h3 className="text-2xl font-serif italic">Trip Progress</h3>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={12} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <PlaneTakeoff className="w-8 h-8 text-black/10" />
               <span className="text-xs font-black uppercase tracking-widest text-black/20">Stages</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
             {statusDistribution.map((d, i) => (
               <div key={d.name} className="flex justify-between items-center text-xs">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="font-bold opacity-40 uppercase tracking-widest">{d.name}</span>
                 </div>
                 <span className="font-black">{d.value}</span>
               </div>
             ))}
          </div>
        </Card>
      </div>

      {/* User Management */}
      <Card className="rounded-[56px] p-10 bg-white border-none shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 px-2">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-black/40 mb-1">Explorer Base</h4>
            <h3 className="text-3xl font-serif italic">User Management</h3>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <Input 
              placeholder="Search explorers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 rounded-full border-black/10 bg-black/[0.02] focus-visible:ring-black"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-black/5">
                <th className="pb-6 text-[10px] uppercase font-black tracking-widest text-black/40 pl-4">Explorer</th>
                <th className="pb-6 text-[10px] uppercase font-black tracking-widest text-black/40">Status</th>
                <th className="pb-6 text-[10px] uppercase font-black tracking-widest text-black/40">Registered</th>
                <th className="pb-6 text-[10px] uppercase font-black tracking-widest text-black/40">Role</th>
                <th className="pb-6 text-[10px] uppercase font-black tracking-widest text-black/40 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="group hover:bg-black/[0.01] transition-colors">
                  <td className="py-6 pl-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} 
                        className="w-10 h-10 rounded-full border border-black/10" 
                        alt=""
                      />
                      <div>
                        <p className="font-bold text-sm">{u.displayName || 'Discovery Traveler'}</p>
                        <p className="text-xs text-black/40">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <Badge variant="secondary" className="rounded-full text-[9px] uppercase tracking-widest px-3 bg-green-50 text-green-700 border-none">
                      Active
                    </Badge>
                  </td>
                  <td className="py-6 text-xs font-bold text-black/40 tabular-nums">
                    {u.createdAt ? format(u.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="py-6">
                    {u.isAdmin ? (
                      <div className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-widest">
                        <UserCheck className="w-3 h-3" />
                        Admin
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-black/20 uppercase tracking-widest">Explorer</span>
                    )}
                  </td>
                  <td className="py-6 text-right pr-4">
                    <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 hover:bg-black hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
