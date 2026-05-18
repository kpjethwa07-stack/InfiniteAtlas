import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Compass, Star, Camera, Globe, ArrowRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';

const ALL_COLLECTIONS = [
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
    image: 'https://images.unsplash.com/photo-1520116468816-95b69fab8473?q=80&w=1200&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?q=80&w=1200&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1531366930477-4fbd0ce505d0?q=80&w=1200&auto=format&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1200&auto=format&fit=crop',
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
  },
  {
    id: 13,
    name: 'Venice, Italy',
    image: 'https://images.unsplash.com/photo-1514890547357-a9ee2887ad8e?q=80&w=1200&auto=format&fit=crop',
    category: 'Romantic',
    rating: 4.8,
    description: 'Dreamy canals, gondola rides, and exquisite Renaissance architecture.'
  },
  {
    id: 14,
    name: 'Cape Town, South Africa',
    image: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?q=80&w=1200&auto=format&fit=crop',
    category: 'Nature',
    rating: 4.9,
    description: 'Table Mountain views, Cape Winelands, and vibrant waterfront life.'
  },
  {
    id: 15,
    name: 'Prague, Czech Republic',
    image: 'https://images.unsplash.com/photo-1517330357046-3ab5b5dd42a1?q=80&w=1200&auto=format&fit=crop',
    category: 'Culture',
    rating: 4.8,
    description: 'The City of a Hundred Spires, medieval old town, and Charles Bridge.'
  },
  {
    id: 16,
    name: 'Bora Bora, French Polynesia',
    image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?q=80&w=1200&auto=format&fit=crop',
    category: 'Tropical',
    rating: 5.0,
    description: 'Turquoise lagoons, lush mountains, and secluded luxury retreats.'
  }
];

export default function Collections() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();

  const filteredDestinations = activeCategory === 'All' 
    ? ALL_COLLECTIONS 
    : ALL_COLLECTIONS.filter(dest => dest.category === activeCategory);

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <section className="space-y-6">
        <Button 
          variant="ghost" 
          className="group hover:bg-black/5 -ml-4"
          onClick={() => navigate('/explore')}
        >
          <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          {t('backToExplore') || 'Back to Explore'}
        </Button>
        <div className="space-y-2">
            <h1 className="text-6xl font-bold tracking-tighter leading-tight italic">{t('allCollections') || 'All Collections'}</h1>
            <p className="text-xl text-black/60 font-medium max-w-2xl">{t('allCollectionsDesc') || 'Our complete library of hand-picked destinations for every kind of adventure.'}</p>
        </div>
      </section>

      {/* Categories */}
      <section className="flex flex-wrap gap-4 overflow-x-auto pb-4 sticky top-0 bg-[#F5F2ED] py-4 z-20">
        {['All', 'Culture', 'Coastal', 'Romantic', 'Nature', 'Exotic', 'Tropical'].map((cat) => (
          <motion.button
            key={cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
              activeCategory === cat 
                ? 'bg-black text-white shadow-xl shadow-black/20' 
                : 'bg-white text-black/40 hover:text-black border-2 border-black/5 hover:border-black/10'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredDestinations.map((dest) => (
            <motion.div
              key={dest.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
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
              <h3 className="text-2xl font-bold tracking-tight">{dest.name}</h3>
              <p className="text-black/70 font-medium leading-relaxed text-sm">{dest.description}</p>
              <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-black/60">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest italic">Guided available</span>
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
      </section>
    </div>
  );
}
