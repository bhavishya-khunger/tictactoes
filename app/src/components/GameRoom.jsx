import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IoMdRefreshCircle } from "react-icons/io";

// --- SVG Icons ---
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// --- Board Component ---
const Board = ({ board, onClick, winningLine }) => (
  <div className="grid grid-cols-3 gap-2 md:gap-3 aspect-square w-full">
    {board.map((value, index) => {
      const isWinningSquare = winningLine.includes(index);
      return (
        <button
          key={index}
          onClick={() => onClick(index)}
          className={`flex items-center justify-center aspect-square rounded-lg md:rounded-xl transition-all duration-300
            ${isWinningSquare ? 'bg-[#F9C80E] animate-pulse' : 'bg-white/10 hover:bg-white/20'}
            ${value ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {value && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-5xl md:text-7xl lg:text-8xl font-bold select-none
                ${value === 'X' ? 'text-[#9B5DE5]' : 'text-[#F9C80E]'}`}
            >
              {value}
            </motion.span>
          )}
        </button>
      );
    })}
  </div>
);

// --- Winning Line Calculation ---
const calculateWinningLine = (squares) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return line;
  }
  return [];
};

// --- Confetti Component ---
const Confetti = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const confettiPieces = Array(150).fill().map(() => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      radius: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 70%)`,
      speed: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.5 + 0.5,
    }));

    let animationFrameId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      confettiPieces.forEach(piece => {
        piece.y += piece.speed;
        piece.rotation += piece.speed / 2;
        if (piece.y > height) {
          piece.x = Math.random() * width;
          piece.y = -20;
        }
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation * Math.PI / 180);
        ctx.fillStyle = piece.color;
        ctx.globalAlpha = piece.opacity;
        ctx.fillRect(-piece.radius, -piece.radius, piece.radius * 2, piece.radius * 2);
        ctx.restore();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-50" />;
};

// --- GameRoom Component ---
function GameRoom({ socket, user, room, onLeave }) {
  const [localVoted, setLocalVoted] = useState(false);

  useEffect(() => {
    if (room.board && room.board.every(cell => cell === null)) {
      setLocalVoted(false);
    }
  }, [room.board]);

  const board = room.board || Array(9).fill(null);
  const winner = room.winner || null;
  const score = room.score || { X: 0, O: 0 };
  const playerSymbol = room.players.find((p) => p.id === user.id)?.symbol;

  const isMyTurn = !winner && room.currentPlayer === playerSymbol;
  const iAmWinner = winner === playerSymbol;
  const winningLine = winner && winner !== 'Draw' ? calculateWinningLine(board) : [];

  const rematchVotes = room.rematchVotes || [];
  const hasVotedForRematch = rematchVotes.includes(user.id) || localVoted;

  const handleSquareClick = (i) => {
    if (board[i] || winner || !isMyTurn) return;
    socket.emit('make-move', { roomId: room.roomId, index: i, playerSymbol });
  };

  const handleRematch = () => {
    socket.emit('request-rematch', room.roomId);
    setLocalVoted(true);
  };

  const statusText = winner
    ? winner === 'Draw' ? "It's a Draw!" : iAmWinner ? 'You Won!' : 'You Lost!'
    : isMyTurn ? 'Your Turn' : 'Opponent’s Turn';

  return (
    <>
      {iAmWinner && <Confetti />}
      <motion.div
        layout
        initial={{ backgroundColor: "rgba(30,30,32,1)" }}
        animate={isMyTurn && !winner ? { backgroundColor: "rgba(38,38,42,1)" } : { backgroundColor: "rgba(30,30,32,1)" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="h-full flex flex-col items-center justify-between p-6 md:p-10 bg-[#1E1E22] rounded-2xl"
      >
        {/* Header */}
        <div className="w-full max-w-3xl flex justify-between items-center mb-6 md:mb-8">
          <button
            onClick={onLeave}
            className="text-gray-400 hover:text-white transition p-2 md:p-3 rounded-xl bg-white/5 hover:bg-white/10"
          >
            <ArrowLeftIcon />
          </button>
          <p className="text-base md:text-xl font-medium text-yellow-400 text-center">{statusText}</p>
          <div className="w-11 md:w-14" />
        </div>

        {/* Scores */}
        <div className="flex justify-around items-center w-full max-w-3xl mb-6 md:mb-8">
          {['X', 'O'].map((sym) => (
            <div
              key={sym}
              className="flex flex-col items-center w-1/3 md:w-1/4 bg-white/5 rounded-xl py-3 md:py-4"
            >
              <p className={`text-3xl md:text-5xl font-bold ${sym === 'X' ? 'text-[#9B5DE5]' : 'text-[#F9C80E]'}`}>
                {sym}
              </p>
              <p className="text-sm md:text-base text-gray-400">Score: {score[sym]}</p>
            </div>
          ))}
        </div>

        {/* Board */}
        <div className="flex justify-center items-center w-full max-w-md md:max-w-lg lg:max-w-xl mb-10">
          <Board board={board} onClick={handleSquareClick} winningLine={winningLine} />
        </div>

        {/* Footer */}
        {winner && (
          <motion.button
            onClick={handleRematch}
            disabled={hasVotedForRematch}
            whileHover={{ scale: hasVotedForRematch ? 1 : 1.05 }}
            whileTap={{ scale: hasVotedForRematch ? 1 : 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-semibold py-3 md:py-4 px-8 md:px-10 rounded-xl shadow-lg w-full max-w-xs md:max-w-sm flex items-center justify-center gap-2 text-xl transition ${hasVotedForRematch
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-[#9B5DE5] text-white hover:bg-[#A471E6]'
              }`}
          >
            <IoMdRefreshCircle size={30} /> {hasVotedForRematch ? 'Waiting for Opponent...' : 'Rematch'}
          </motion.button>
        )}
      </motion.div>
    </>
  );
}

export default GameRoom;
