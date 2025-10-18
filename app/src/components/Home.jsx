import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';

// This is the new component that holds the scanner
const ScannerOverlay = ({ onClose, onScanResult }) => {
    useEffect(() => {
        // --- This is the new scanner logic ---
        const scanner = new Html5QrcodeScanner(
            "qr-reader", // ID of the div to render the scanner
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
            },
            false // verbose
        );

        function onScanSuccess(decodedText, decodedResult) {
            // handle the scanned code as you like
            scanner.clear(); // Stop scanning on success
            onScanResult(decodedText);
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
            // console.warn(`Code scan error = ${error}`);
        }

        scanner.render(onScanSuccess, onScanFailure);

        // Cleanup function to stop the scanner when the component unmounts
        return () => {
            // It's important to check if the scanner has a clear method before calling it
            // to avoid errors if the component unmounts before scanner is fully initialized.
            if (scanner && typeof scanner.clear === 'function') {
                 scanner.clear().catch(err => console.error("Failed to clear scanner:", err));
            }
        };
    }, [onScanResult]);


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4"
        >
            <div className="bg-white/10 p-4 rounded-2xl w-full max-w-md">
                 {/* This div is the target for the QR scanner to render in */}
                <div id="qr-reader" className="w-full"></div>
            </div>
            <button
                onClick={onClose}
                className="mt-6 bg-red-600 text-white font-semibold py-2 px-6 rounded-lg"
            >
                Cancel
            </button>
        </motion.div>
    );
};


function Home({ socket, user, setError }) {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleCreateRoom = () => {
    socket.emit('create-room', { name: user.name, avatar: user.avatar });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomIdInput.trim()) {
      socket.emit('join-room', {
        roomId: roomIdInput.trim(),
        name: user.name,
        avatar: user.avatar,
      });
      setRoomIdInput('');
    } else {
      setError('Please enter a Room ID.');
    }
  };

  const handleScanResult = (scannedRoomId) => {
    setShowScanner(false);
    if (scannedRoomId) {
      socket.emit('join-room', {
        roomId: scannedRoomId,
        name: user.name,
        avatar: user.avatar,
      });
    }
  };

  return (
    <>
      <motion.div
        key="home"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="h-full w-full flex flex-col justify-center items-center"
      >
        <div className="w-full max-w-md p-8 rounded-lg shadow-xl bg-gray-800">
          <h2 className="text-3xl font-bold text-center mb-6 text-white">Join a Game</h2>

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-lg text-lg transition duration-200"
          >
            Create New Room
          </button>

          <div className="relative flex items-center justify-center my-6">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          {/* Join Room Form */}
          <form onSubmit={handleJoinRoom}>
            <input
              type="text"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              placeholder="Enter Room ID"
              className="w-full p-3 mb-4 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-200"
            >
              Join with Code
            </button>
          </form>

          {/* Scan QR Button */}
          <button
            onClick={() => setShowScanner(true)}
            className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-200"
          >
            Scan to Join
          </button>
        </div>
      </motion.div>

      {/* This renders the scanner on top of everything when showScanner is true */}
      <AnimatePresence>
        {showScanner && (
          <ScannerOverlay
            onClose={() => setShowScanner(false)}
            onScanResult={handleScanResult}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default Home;

