import React, { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Compass, MoveRight, Map, Camera, Users, Plane } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { AnimatedLogo } from '../components/AnimatedLogo';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    }
  }
};

const IMAGES = [
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2800&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2800&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2800&auto=format&fit=crop"
];

const LOCATIONS = ["Swiss Alps", "Paris, France", "Tropical Escape"];

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.animate 
          animate={{ opacity: [0.4, 1, 0.4] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/50 text-sm tracking-[0.3em] uppercase"
        >
          Loading
        </motion.animate>
      </div>
    );
  }

  if (user) return <Navigate to="/" />;

  const handleGoogleLogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error: any) {
      if (error?.code !== 'auth/cancelled-popup-request' && error?.code !== 'auth/popup-closed-by-user') {
        console.error('Login failed:', error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-black text-white font-sans selection:bg-white/30 selection:text-white min-h-screen overflow-x-hidden">
      
      {/* Navigation - Fixed */}
      <nav className={`fixed inset-x-0 top-0 z-50 flex justify-between items-center px-8 md:px-16 py-6 transition-all duration-300 w-full ${scrolled ? 'backdrop-blur-xl bg-black/60 border-b border-white/10 shadow-2xl' : 'backdrop-blur-none bg-transparent pt-10'}`}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-3 shrink-0 cursor-pointer"
        >
          <AnimatedLogo size="lg" inverted />
          <span className="text-lg font-medium tracking-[0.2em] uppercase">Infinity Atlas</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="hidden md:flex items-center gap-12"
        >
          <span onClick={() => scrollTo('destinations')} className="text-xs font-semibold uppercase tracking-[0.15em] hover:text-white transition-colors cursor-pointer text-white/70">Destinations</span>
          <span onClick={() => scrollTo('experiences')} className="text-xs font-semibold uppercase tracking-[0.15em] hover:text-white transition-colors cursor-pointer text-white/70">Experiences</span>
          <span onClick={() => scrollTo('logbook')} className="text-xs font-semibold uppercase tracking-[0.15em] hover:text-white transition-colors cursor-pointer text-white/70">Logbook</span>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Dynamic Backgrounds */}
        <AnimatePresence initial={false}>
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={IMAGES[activeIndex]} 
              alt={LOCATIONS[activeIndex]}
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        {/* Overlays for depth and readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-black/10 to-black pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80 pointer-events-none" />

        {/* Hero Content */}
        <main className="relative z-10 flex-grow flex flex-col justify-center px-8 md:px-16 pt-32 pb-32 max-w-[1400px] w-full mx-auto">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-4xl"
          >
            <motion.div variants={fadeIn} className="flex items-center gap-4 mb-8">
              <div className="h-[1px] w-12 bg-white/40" />
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                The Next Era of Exploration
              </span>
            </motion.div>

            <motion.h1 
              variants={fadeIn} 
              className="text-6xl sm:text-7xl md:text-[8rem] leading-[0.85] font-serif font-light mb-8"
            >
              Roam <span className="italic text-white/80">beyond</span> <br />
              the ordinary.
            </motion.h1>

            <motion.p 
              variants={fadeIn} 
              className="text-lg md:text-xl font-light text-white/60 max-w-lg leading-relaxed mb-12 tracking-wide"
            >
              Design exquisite itineraries, collaborate with companions, and capture the world's beauty in one curated space.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-6">
              <button 
                onClick={handleGoogleLogin} 
                disabled={isSigningIn}
                className="w-full sm:w-auto h-14 px-10 rounded-full bg-white text-black text-sm font-semibold uppercase tracking-[0.15em] hover:bg-white/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center group shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                {isSigningIn ? 'Authenticating...' : 'Begin Journey'}
                {!isSigningIn && (
                  <MoveRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
              <button 
                onClick={() => scrollTo('destinations')}
                className="w-full sm:w-auto h-14 px-10 rounded-full border border-white/20 text-white text-sm font-semibold uppercase tracking-[0.15em] hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-sm"
              >
                Explore Demo
              </button>
            </motion.div>
          </motion.div>
        </main>

        {/* Bottom Footer / Image Indicator - Pinned to bottom of hero */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-0 inset-x-0 z-20 flex justify-between items-end px-8 md:px-16 pb-12 w-full"
        >
          <div className="flex gap-2">
            {IMAGES.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-500 ease-out ${idx === activeIndex ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 bg-white/30'}`}
              />
            ))}
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 mb-1">Current Scene</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-sm font-serif italic text-white/80"
              >
                {LOCATIONS[activeIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Destinations Section */}
      <section id="destinations" className="relative z-10 py-32 px-8 md:px-16 mx-auto bg-black">
        <div className="max-w-[1400px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="mb-24 text-center"
          >
            <h2 className="text-4xl md:text-6xl font-serif font-light mb-6">Iconic <span className="italic text-white/70">Destinations</span></h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto font-light">
              Explore handpicked locations that offer unforgettable memories and breathtaking views.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {IMAGES.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative group overflow-hidden rounded-2xl aspect-[4/5] bg-white/5"
              >
                <img src={img} alt={LOCATIONS[idx]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-8 left-8">
                  <p className="text-white text-xl font-serif italic">{LOCATIONS[idx]}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Section - Scroll down content */}
      <section id="experiences" className="relative z-10 py-32 px-8 md:px-16 max-w-[1400px] mx-auto bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="mb-24 text-center"
          >
            <h2 className="text-4xl md:text-6xl font-serif font-light mb-6">Experience <span className="italic text-white/70">Wanderlust</span></h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto font-light">
              Elevate every aspect of your journey. From the first spark of inspiration to the final destination, we redefine how you travel.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Map className="w-8 h-8 text-white/80" />,
                title: "Curated Itineraries",
                desc: "Intelligent scheduling and beautiful maps designed for spontaneous detours."
              },
              {
                icon: <Users className="w-8 h-8 text-white/80" />,
                title: "Synchronized Sync",
                desc: "Invite friends, vote on venues, and build memories together in real-time."
              },
              {
                icon: <Camera className="w-8 h-8 text-white/80" />,
                title: "Timeless Journals",
                desc: "An elegant space to pen thoughts, pin photos, and catalog your adventures."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: idx * 0.2 }}
                className="group relative p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-3 tracking-wide">{feature.title}</h3>
                <p className="text-white/50 font-light leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Logbook Section */}
      <section id="logbook" className="relative z-10 py-32 px-8 md:px-16 mx-auto bg-black border-t border-white/10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl md:text-6xl font-serif font-light mb-6">The <span className="italic text-white/70">Logbook</span></h2>
            <p className="text-white/50 text-lg font-light leading-relaxed mb-8">
              Capture every moment of your adventure. The Logbook is your personal spatial diary, an interconnected web of places, pictures, and notes that tells the genuine story of your travels.
            </p>
            <button 
              onClick={handleGoogleLogin} 
              className="px-8 flex items-center justify-center h-12 rounded-full border border-white/20 text-white text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white hover:text-black transition-all"
            >
              Start Journaling
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="aspect-square rounded-full border border-white/10 bg-white/[0.02] absolute inset-0 -m-8 mix-blend-screen" />
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative z-10">
              <img src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Logbook Preview" referrerPolicy="no-referrer" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative py-40 overflow-hidden text-center flex flex-col items-center justify-center px-8 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.05] via-black to-black z-0" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-3xl"
        >
          <div className="mb-8 flex justify-center">
             <div className="w-20 h-20 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center shadow-2xl">
               <Plane className="text-white/80 w-8 h-8 -rotate-45" />
             </div>
          </div>
          <h2 className="text-5xl md:text-7xl font-serif font-light mb-8 italic">Ready to depart?</h2>
          <button 
            onClick={handleGoogleLogin} 
            className="h-16 px-12 rounded-full bg-white text-black text-sm font-semibold uppercase tracking-[0.15em] hover:bg-white/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center mx-auto group shadow-[0_0_50px_rgba(255,255,255,0.15)]"
          >
            Start Your Journey
            <MoveRight className="ml-4 w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </section>

    </div>
  );
}

