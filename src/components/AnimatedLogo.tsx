import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Compass } from 'lucide-react';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AnimatedLogo({ className, size = 'md' }: AnimatedLogoProps) {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
    xl: 36
  };

  return (
    <div className={cn("relative flex items-center justify-center select-none", dimensions[size], className)} style={{ perspective: 400 }}>
      {/* Outer 3D Ring rotating on Z axis */}
      <motion.div
        className="absolute inset-0 rounded-full border border-orange-500/30 bg-gradient-to-tr from-orange-500/10 via-transparent to-amber-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, ease: "linear", repeat: Infinity }}
      />

      {/* Middle 3D Ring rotating on Y axis */}
      <motion.div
        className="absolute inset-1 rounded-full border border-indigo-500/40"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
      />

      {/* Inner 3D Ring rotating on X axis */}
      <motion.div
        className="absolute inset-2 rounded-full border border-pink-500/40"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateX: 360 }}
        transition={{ duration: 4, ease: "linear", repeat: Infinity }}
      />

      {/* Glowing core sphere */}
      <motion.div 
        className="absolute inset-3.5 bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.6)] flex items-center justify-center z-10"
        whileHover={{ scale: 1.1 }}
      >
        <Compass size={iconSizes[size]} className="text-white animate-spin-slow" />
      </motion.div>

      {/* Particle dust floating around core */}
      <motion.div
        className="absolute w-[120%] h-[120%] pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, ease: "linear", repeat: Infinity }}
      >
        <div className="absolute top-0 left-1/2 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        <div className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-rose-400 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
      </motion.div>
    </div>
  );
}
