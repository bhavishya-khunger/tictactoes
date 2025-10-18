import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode'; // Using the core qrcode library
import { FaUser, FaCat, FaDog, FaDragon, FaGhost, FaRobot } from 'react-icons/fa';

// Map avatar names (from WelcomeScreen) to their icon components
const avatarMap = {
  User: FaUser,
  Cat: FaCat,
  Dog: FaDog,
  Dragon: FaDragon,
  Ghost: FaGhost,
  Robot: FaRobot,
};

function Lobby({ socket, user, room, onLeave }) {
  const isHost = user.id === room.hostId;
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Generate the QR Code when the component loads or roomId changes
  useEffect(() => {
    if (room.roomId) {
      QRCode.toDataURL(room.roomId, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.9,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      })
        .then(url => {
          setQrCodeUrl(url);
        })
        .catch(err => {
          console.error("Failed to generate QR Code:", err);
        });
    }
  }, [room.roomId]);


  const handleStartGame = () => {
    socket.emit('start-game', room.roomId);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(room.roomId);
    // You could add a small "Copied!" notification here
  };

  return (
    <motion.div
      key="lobby"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full w-full flex flex-col justify-center items-center"
    >
      {/* Updated to match WelcomeScreen's styling */}
      <div className="w-full max-w-md p-8 rounded-3xl shadow-2xl bg-white/5 backdrop-blur-md">
        <h2 className="text-2xl font-bold text-center mb-4 text-[#F9C80E]">
          Room Lobby
        </h2>

        {/* --- QR Code Display --- */}
        <div className="flex flex-col items-center justify-center mb-6">
          <p className="text-gray-300 mb-2 text-sm">Scan to join the room:</p>
          <div className="p-2 bg-white rounded-lg">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt={`QR code for room ${room.roomId}`} width="160" height="160" />
            ) : (
              <div className="w-40 h-40 bg-gray-200 flex items-center justify-center">
                <p className="text-xs text-gray-500">Loading QR...</p>
              </div>
            )}
          </div>
        </div>

        {/* Room ID Display */}
        <div className="mb-6 text-center">
          <p className="text-gray-300 text-sm">Or enter this code:</p>
          <div
            className="inline-flex items-center bg-white/10 p-3 rounded-lg cursor-pointer mt-2"
            onClick={copyToClipboard}
            title="Click to copy"
          >
            <span className="text-3xl font-bold tracking-widest text-white mr-2">
              {room.roomId}
            </span>
          </div>
        </div>

        {/* Player List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Players:</h3>
          <ul className="space-y-2">
            {room.players.map((player) => {
              // Get the correct Icon component from the map
              const Icon = avatarMap[player.avatar] || FaUser; // Default to FaUser
              return (
                <li
                  key={player.id}
                  className="flex items-center justify-between bg-white/10 p-3 rounded-lg"
                >
                  <div className="flex items-center">
                    {/* Render the icon component instead of an img tag */}
                    <div className="w-8 h-8 rounded-full mr-3 bg-[#9B5DE5] flex items-center justify-center text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-white font-medium">{player.name}</span>
                  </div>
                  {player.id === room.hostId && (
                    <span className="text-xs font-semibold text-[#F9C80E] bg-[#F9C80E]/20 px-2 py-1 rounded-full">
                      HOST
                    </span>
                  )}
                </li>
              );
            })}
            {room.players.length < 2 && (
              <li className="flex items-center justify-center bg-white/5 p-3 rounded-lg border-2 border-dashed border-white/10">
                <span className="text-gray-400">Waiting for opponent...</span>
              </li>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 2}
              className={`w-full font-bold py-3 px-4 rounded-xl text-lg transition duration-200 ${
                room.players.length < 2
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#F9C80E] hover:bg-[#FFD93D] text-black' // Matched WelcomeScreen button
              }`}
            >
              Start Game
            </button>
          )}
          <button
            onClick={onLeave}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl"
          >
            Leave Room
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default Lobby;