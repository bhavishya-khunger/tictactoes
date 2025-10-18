// src/App.jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './components/Home';
import GameRoom from './components/GameRoom';
import WelcomeScreen from './components/WelcomeScreen';
import Lobby from './components/Lobby';

// Initialize socket
const socket = io('http://localhost:3001');

function App() {
  const [user, setUser] = useState(null); // { id, name, avatar }
  const [room, setRoom] = useState(null); // Full room object from server
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    socket.on('room-created', (roomData) => {
      setRoom(roomData);
      setError('');
    });
    socket.on('player-joined', (roomData) => {
      setRoom(roomData);
      setError('');
    });
    // --- Removed: spectator-joined listener ---

    socket.on('update-lobby', (roomData) => {
      setRoom(roomData);
    });
    socket.on('new-host', ({ newHostId, players }) => {
      setRoom(prevRoom => ({ ...prevRoom, hostId: newHostId, players }));
      if (newHostId === user?.id) {
        console.log("You are the new host!");
      }
    });

    socket.on('game-started', (roomData) => {
      setRoom(roomData);
    });

    // ADDED THIS LISTENER
    // In App.jsx useEffect
    // ADDED THIS LISTENER
    socket.on('game-update', (gameUpdateData) => {
      // Use a functional update to MERGE the new data with the existing state
      setRoom(prevRoom => ({
        ...prevRoom,       // <-- Keep all old room data (like players, roomId, status)
        ...gameUpdateData  // <-- Overwrite with the new data (board, winner, score, etc.)
      }));
    });

    socket.on('opponent-left', ({ message, winner, score }) => {
      // Clear the error message on the next interaction or timeout it
      setError(message);
      setRoom(prevRoom => ({ ...prevRoom, status: 'finished', winner, score }));
      // The server logic now ensures the room is updated or deleted.
      // We don't need to manually clear `room` here for players still in the room.
    });

    // --- Removed: spectator promotion listeners ---
    // socket.on('promoted-to-player', (roomData) => { ... });
    // socket.on('player-promoted', ({ room, message }) => { ... });

    socket.on('error', (message) => setError(message));
    socket.on('connect', () => {
      console.log('Connected to server!');
      setIsConnecting(false);

      if (room && user) {
        // If reconnecting and was in a room, try to re-join
        socket.emit('join-room', {
          roomId: room.roomId,
          name: user.name,
          avatar: user.avatar
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnecting(true);
      setError('Disconnected. Attempting to reconnect...');
      setRoom(null); // Clear room state on disconnect to avoid stale data
    });

    return () => {
      socket.off('room-created');
      socket.off('player-joined');
      socket.off('update-lobby');
      socket.off('new-host');
      socket.off('game-started');
      socket.off('opponent-left');
      socket.off('error');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game-update'); // ADDED THIS CLEANUP
      // --- Removed: spectator-related off calls ---
    };
  }, [user, room]);

  const handleLogin = (name, avatar) => {
    setUser({ id: socket.id, name, avatar });
  };

  const handleLeaveRoom = () => {
    if (room) {
      socket.emit('leave-room', room.roomId);
    }
    setRoom(null);
    setError(''); // Clear error when leaving room
  };

  const renderContent = () => {
    if (isConnecting && !user) {
      return (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // This component is temporary, we center it.
          className="h-full w-full flex flex-col justify-center items-center"
        >
          <div className="w-full max-w-md p-8 rounded-lg shadow-xl text-center bg-brand-purple">
            <h2 className="text-2xl font-semibold text-brand-text-light">Connecting to Server...</h2>
          </div>
        </motion.div>
      );
    }

    if (!user) {
      return <WelcomeScreen key="welcome" onLogin={handleLogin} />;
    }
    if (!room) {
      return <Home key="home" socket={socket} user={user} setError={setError} />;
    }
    if (room.status === 'waiting' || room.players.length < 2) { // Lobby for waiting or less than 2 players
      return <Lobby key="lobby" socket={socket} user={user} room={room} onLeave={handleLeaveRoom} />;
    }
    if (room.status === 'playing' || room.status === 'finished') {
      return <GameRoom key="game" socket={socket} user={user} room={room} onLeave={handleLeaveRoom} />;
    }
  };

  return (
    // This div now controls the main background and layout
    <div className="min-h-screen bg-[#0E0E10] text-white flex flex-col p-4 overflow-hidden">
      <h1 className="text-5xl font-extrabold mb-4 text-brand-gold-darker uppercase tracking-wider text-center w-full">
        Tic Tac Toe
      </h1>

      <AnimatePresence>
        {error && (
          // Added mx-auto to center the error block
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="w-full max-w-md mb-4 mx-auto"
          >
            <div
              className="text-red-300 bg-red-800/60 p-3 rounded-lg relative cursor-pointer shadow-lg"
              onClick={() => setError('')}
            >
              <p className="pr-6 text-sm">{error}</p>
              <span className="absolute top-1/2 right-3 -translate-y-1/2 font-bold text-lg">X</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added a flex-grow wrapper to make content fill remaining space */}
      <div className="flex-grow w-full">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;