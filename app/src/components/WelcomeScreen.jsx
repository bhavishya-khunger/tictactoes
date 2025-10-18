// src/components/WelcomeScreen.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaCat, FaDog, FaDragon, FaGhost, FaRobot } from 'react-icons/fa';

const avatars = [
  { name: 'User', icon: FaUser },
  { name: 'Cat', icon: FaCat },
  { name: 'Dog', icon: FaDog },
  { name: 'Dragon', icon: FaDragon },
  { name: 'Ghost', icon: FaGhost },
  { name: 'Robot', icon: FaRobot },
];

function WelcomeScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('User');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (name.trim()) {
      onLogin(name.trim(), selectedAvatar);
      setError('');
    } else {
      setError('Please enter your name.');
    }
  };

  return (
    // UPDATED: Removed min-h-screen, bg-[#0E0E10]. Added h-full.
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col justify-center items-center px-6"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white/5 backdrop-blur-md rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
      >
        {/* Title */}
        <h1 className="text-3xl font-semibold mb-2 text-[#F9C80E]">Welcome</h1>
        <p className="text-gray-400 mb-8 text-sm">Enter your details to start playing</p>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Name Input */}
        <div className="w-full mb-6 text-left">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Your Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={15}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#9B5DE5] transition-all"
          />
        </div>

        {/* Avatar Selection */}
        <div className="w-full mb-8">
          <p className="text-sm font-medium text-gray-300 mb-3 text-left">Choose Your Avatar</p>
          <div className="flex flex-wrap justify-center gap-3">
            {avatars.map(({ name: avatarName, icon: Icon }) => {
              const isSelected = selectedAvatar === avatarName;
              return (
                <motion.button
                  key={avatarName}
                  onClick={() => setSelectedAvatar(avatarName)}
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#9B5DE5] text-white shadow-md scale-105'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Icon className="text-2xl mb-1" />
                  <span className="text-xs">{avatarName}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <motion.button
          onClick={handleLogin}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-[#F9C80E] text-black font-semibold py-3 rounded-xl text-lg shadow-lg hover:bg-[#FFD93D] transition-all"
        >
          Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default WelcomeScreen;