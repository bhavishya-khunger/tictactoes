import React from 'react';
import { motion } from 'framer-motion';

function Board({ board, onClick, winningLine = [] }) {
  const renderSquare = (value, i) => {
    const isWinning = winningLine.includes(i);
    const color = value === 'X' ? '#9B5DE5' : value === 'O' ? '#F9C80E' : '#FFF';
    return (
      <motion.button
        key={i}
        onClick={() => onClick(i)}
        whileTap={{ scale: 0.95 }}
        className={`aspect-square flex items-center justify-center rounded-xl bg-white/5 
        ${isWinning ? 'ring-2 ring-white' : ''}`}
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: value ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            color,
            fontSize: '2rem',
            fontWeight: 700,
          }}
        >
          {value}
        </motion.span>
      </motion.button>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
      {board.map((val, i) => renderSquare(val, i))}
    </div>
  );
}

export default Board;
