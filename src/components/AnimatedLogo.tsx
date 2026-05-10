import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Infinity as InfinityIcon } from 'lucide-react';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  inverted?: boolean;
}

export function AnimatedLogo({ className, size = 'md', inverted = false }: AnimatedLogoProps) {
  const dimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 36
  };

  const bgClass = inverted ? 'bg-white' : 'bg-black';
  const textClass = inverted ? 'text-black' : 'text-white';

  return (
    <motion.div 
      className={cn(`relative rounded-full flex items-center justify-center ${bgClass} shadow-lg overflow-hidden`, dimensions[size], className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Rotating gradient background effect */}
      <motion.div
        className="absolute inset-[-50%] opacity-30"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${inverted ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'} 50%, transparent 100%)`
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, ease: "linear", repeat: Infinity }}
      />
      
      {/* The Infinity symbol */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <InfinityIcon size={iconSizes[size]} className={textClass} strokeWidth={2.5} />
      </motion.div>

      {/* Orbiting dot */}
      <motion.div
        className="absolute w-full h-full pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
      >
        <div className={cn("absolute top-[10%] left-1/2 -translate-x-1/2 w-[15%] h-[15%] rounded-full", inverted ? "bg-black" : "bg-orange-400")} />
      </motion.div>
    </motion.div>
  );
}
