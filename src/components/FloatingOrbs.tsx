import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../contexts/ThemeContext';

export function FloatingOrbs() {
  const { theme } = useTheme();

  const getOrbColors = () => {
    if (theme === 'midnight') {
      return {
        orb1: 'rgba(6,182,212,0.08)', // cyan
        orb2: 'rgba(99,102,241,0.06)', // indigo
        orb3: 'rgba(236,72,153,0.04)', // pink
      };
    }
    if (theme === 'sunset') {
      return {
        orb1: 'rgba(244,63,94,0.08)',  // rose
        orb2: 'rgba(168,85,247,0.06)', // purple
        orb3: 'rgba(251,146,60,0.04)', // orange
      };
    }
    // aurora theme
    return {
      orb1: 'rgba(16,185,129,0.08)', // emerald
      orb2: 'rgba(20,184,166,0.06)', // teal
      orb3: 'rgba(56,189,248,0.04)', // sky
    };
  };

  const colors = getOrbColors();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Top-right warm orb */}
      <motion.div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${colors.orb1} 0%, transparent 70%)`,
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity }}
      />
      {/* Bottom-left cool orb */}
      <motion.div
        className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${colors.orb2} 0%, transparent 70%)`,
        }}
        animate={{
          x: [0, -20, 30, 0],
          y: [0, 30, -20, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{ duration: 25, ease: 'easeInOut', repeat: Infinity }}
      />
      {/* Center accent orb */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${colors.orb3} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>
  );
}
