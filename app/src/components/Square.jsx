import React from 'react';
import { motion } from 'framer-motion';

// --- NEW: SVG Icons for X and O ---
const IconX = () => (
  <svg className="w-1/2 h-1/2 text-brand-x" viewBox="0 0 100 100" strokeWidth="12" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15,15 L85,85 M85,15 L15,85" />
  </svg>
);

const IconO = () => (
  <svg className="w-1/2 h-1/2 text-brand-o" viewBox="0 0 100 100" strokeWidth="12" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="50" cy="50" r="35" />
  </svg>
);

function Square({ value, onClick, isWinningSquare }) {
  return (
    <motion.button
      whileHover={{ scale: value ? 1 : 1.05, backgroundColor: '#4b3576' }}
      whileTap={{ scale: 0.95 }}
      className={`w-24 h-24 md:w-28 md:h-28 bg-brand-surface rounded-xl flex items-center justify-center 
                  shadow-lg transition-colors duration-200
                  ${isWinningSquare ? 'bg-brand-primary' : ''}
                  ${!value ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={onClick}
      disabled={!!value}
    >
      {value && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-full h-full flex items-center justify-center"
        >
          {value === 'X' ? <IconX /> : <IconO />}
        </motion.div>
      )}
    </motion.button>
  );
}

export default Square;
