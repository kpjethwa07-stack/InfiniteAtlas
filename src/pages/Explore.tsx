import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Compass, Star, Camera, Globe, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';

const DESTINATIONS = [
  {
    id: 1,
    name: 'Kyoto, Japan',
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=1200&auto=format&fit=crop',
    category: 'Culture',
    rating: 4.9,
    description: 'Ancient temples, traditional tea houses, and stunning cherry blossoms.'
  },
  {
    id: 2,
    name: 'Amalfi Coast, Italy',
    image: 'https://images.unsplash.com/photo-1533903345206-13a891968596?q=80&w=1200&auto=format&fit=crop',
    category: 'Coastal',
    rating: 4.8,
    description: 'Dramatic cliffs and pastel-colored villages overlooking the turquoise sea.'
  },
  {
    id: 3,
    name: 'Santorini, Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1200&auto=format&fit=crop',
    category: 'Romantic',
    rating: 4.9,
    description: 'Iconic white-washed buildings and breathtaking sunset views.'
  },
  {
    id: 4,
    name: 'Zermatt, Switzerland',
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop',
    category: 'Nature',
    rating: 5.0,
    description: 'Glacial lakes and majestic mountains in the heart of the Swiss Alps.'
  },
  {
    id: 5,
    name: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
    category: 'Romantic',
    rating: 4.9,
    description: 'The City of Lights, world-class museums, and romantic bistros.'
  },
  {
    id: 6,
    name: 'Reykjavik, Iceland',
    image: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=1200&auto=format&fit=crop',
    category: 'Nature',
    rating: 4.8,
    description: 'Breathtaking waterfalls, volcanic landscapes, and Northern Lights.'
  },
  {
    id: 7,
    name: 'Sedona, USA',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
    category: 'Nature',
    rating: 4.7,
    description: 'Stunning red rock formations, energy vortexes, and desert beauty.'
  },
  {
    id: 8,
    name: 'Cairo, Egypt',
    image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?q=80&w=1200&auto=format&fit=crop',
    category: 'Culture',
    rating: 4.6,
    description: 'The Great Pyramids, historic mosques, and the bustling Khan el-Khalili bazaar.'
  },
  {
    id: 9,
    name: 'Maldives',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1200&auto=format&fit=crop',
    category: 'Tropical',
    rating: 5.0,
    description: 'Overwater bungalows, crystal clear lagoons, and vibrant coral reefs.'
  },
  {
    id: 10,
    name: 'Tulum, Mexico',
    image: 'https://images.unsplash.com/photo-1504730655501-24c39ac53f0e?q=80&w=1200&auto=format&fit=crop',
    category: 'Coastal',
    rating: 4.7,
    description: 'Ancient Mayan ruins overlooking turquoise waters and white sand beaches.'
  },
  {
    id: 11,
    name: 'Serengeti, Tanzania',
    image: 'https://images.unsplash.com/photo-1516422317184-268504f19cd0?q=80&w=1200&auto=format&fit=crop',
    category: 'Exotic',
    rating: 4.9,
    description: 'Unforgettable safaris through vast plains and diverse wildlife encounters.'
  },
  {
    id: 12,
    name: 'Lisbon, Portugal',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1200&auto=format&fit=crop',
    category: 'Culture',
    rating: 4.7,
    description: 'Charming hills, iconic yellow trams, and soulful Fado music.'
  }
];

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredDestinations = activeCategory === 'All' 
    ? DESTINATIONS 
    : DESTINATIONS.filter(dest => dest.category === activeCategory);

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-[48px] overflow-hidden bg-black flex items-center px-12">
        <div className="absolute inset-0 opacity-40">
           <img 
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover"
            alt="Adventure"
            referrerPolicy="no-referrer"
           />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/20 text-white backdrop-blur-md mb-4 px-4 py-1 rounded-full border-none font-medium">✨ Discover New Horizons</Badge>
            <h1 className="text-6xl font-bold text-white tracking-tight italic">Find your next <br />great story.</h1>
            <p className="text-white/90 text-xl font-medium mt-4">Curated destinations for the modern traveller.</p>
          </motion.div>
          
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex gap-4 p-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 max-w-xl"
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('search') as HTMLInputElement;
              if (input && input.value) {
                window.location.href = `/trips/new?destination=${encodeURIComponent(input.value)}`;
              }
            }}
          >
            <div className="flex-1 px-6 flex items-center gap-3">
              <Search className="w-5 h-5 text-white/40" />
              <Input 
                name="search"
                placeholder="Where to next?" 
                className="bg-transparent border-none text-white placeholder:text-white/40 focus-visible:ring-0 h-10 p-0 text-lg" 
              />
            </div>
            <Button type="submit" className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-12 font-bold uppercase tracking-wider text-xs">
              Explore
            </Button>
          </motion.form>
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-wrap gap-4 overflow-x-auto pb-4">
        {['All', 'Culture', 'Coastal', 'Romantic', 'Nature', 'Exotic', 'Tropical'].map((cat) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
              activeCategory === cat 
                ? 'bg-black text-white shadow-xl shadow-black/20' 
                : 'bg-white text-black/40 hover:text-black border-2 border-black/5 hover:border-black/10'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </section>

      {/* Destinations Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight italic">
            {activeCategory === 'All' ? 'Featured Collections' : `${activeCategory} Getaways`}
          </h2>
          <Link to="/collections">
            <Button variant="ghost" className="font-bold uppercase tracking-widest text-xs gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {filteredDestinations.map((dest) => (
              <motion.div
                key={dest.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -10 }}
                className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
              >
                  <Link to={`/trips/new?destination=${encodeURIComponent(dest.name)}`} className="block relative h-64 overflow-hidden">
                <img 
                  src={dest.image} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={dest.name}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] font-bold">{dest.rating}</span>
                </div>
                <Badge className="absolute bottom-4 left-4 bg-black text-white px-3 py-1 rounded-full border-none text-[10px] uppercase font-bold tracking-widest">
                  {dest.category}
                </Badge>
              </Link>
              <div className="p-8 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold tracking-tight">{dest.name}</h3>
                  <Link to={`/trips/new?destination=${encodeURIComponent(dest.name)}`} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black/40 group-hover:bg-black group-hover:text-white transition-colors">
                    <Camera className="w-5 h-5" />
                  </Link>
                </div>
                <p className="text-black/70 font-medium leading-relaxed">{dest.description}</p>
                <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-black/60">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest italic">8 Guides available</span>
                  </div>
                  <Link to={`/trips/new?destination=${encodeURIComponent(dest.name)}`}>
                    <Button variant="ghost" size="sm" className="rounded-full h-8 px-4 text-[10px] uppercase font-bold tracking-widest border border-black/5 hover:bg-black hover:text-white transition-all">
                      Plan
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Community Section */}
      <section className="bg-[#F5F2ED] rounded-[48px] p-12 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
        <div className="flex-1 space-y-6">
          <Badge className="bg-black/5 text-black px-4 py-1 rounded-full border-none font-bold uppercase tracking-widest text-[10px]">Community Highlights</Badge>
          <h2 className="text-5xl font-bold tracking-tight italic">Share your <br />story with us.</h2>
          <p className="text-black/60 text-lg font-medium max-w-md">Join over 10,000 travellers sharing their itineraries, secret spots, and travel hacks daily.</p>
          <Button className="bg-black text-white rounded-full px-10 h-14 font-bold uppercase tracking-wider">Join Wayfarers</Button>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
           <div className="space-y-4 pt-8">
             <motion.div animate={{ rotate: 3 }} className="aspect-square bg-white p-2 rounded-3xl shadow-sm"><img src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" /></motion.div>
             <motion.div animate={{ rotate: -5 }} className="aspect-square bg-white p-2 rounded-3xl shadow-sm"><img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" /></motion.div>
           </div>
           <div className="space-y-4">
             <motion.div animate={{ rotate: -2 }} className="aspect-square bg-white p-2 rounded-3xl shadow-sm"><img src="https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" /></motion.div>
             <motion.div animate={{ rotate: 4 }} className="aspect-square bg-white p-2 rounded-3xl shadow-sm"><img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" /></motion.div>
           </div>
        </div>
      </section>
    </div>
  );
}
