// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tictactoes-chi.vercel.app", 
    methods: ["GET", "POST"]
  }
});

const gameRooms = {};

// Helper function to check for a winner
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]           // Diagonals
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]; // Returns 'X' or 'O'
    }
  }

  if (squares.every(square => square !== null)) {
    return 'Draw'; // All squares filled, no winner
  }

  return null; // No winner yet
}

// Helper function to generate room ID
function generateRoomId() {
  let roomId;
  do {
    roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
  } while (gameRooms[roomId]); // Ensure unique room ID
  return roomId;
}

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // --- 1. Create Room ---
  socket.on('create-room', ({ name, avatar }) => {
    try {
      if (!name || !avatar) {
        return socket.emit('error', 'Name and avatar are required');
      }

      const roomId = generateRoomId();
      gameRooms[roomId] = {
        roomId,
        players: [{
          id: socket.id,
          name: name.trim(),
          avatar: avatar,
          symbol: 'X'
        }],
        board: Array(9).fill(null),
        currentPlayer: 'X',
        status: 'waiting',
        hostId: socket.id,
        createdAt: new Date(),
        score: { X: 0, O: 0 },
        rematchVotes: [],
      };

      socket.join(roomId);
      console.log(`Room ${roomId} created by ${name}`);
      socket.emit('room-created', gameRooms[roomId]);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  });

  // --- 2. Join Room ---
  socket.on('join-room', ({ roomId, name, avatar }) => {
    try {
      if (!roomId || !name || !avatar) {
        return socket.emit('error', 'Room ID, name, and avatar are required');
      }

      const upperRoomId = roomId.toUpperCase();
      const room = gameRooms[upperRoomId];
      if (!room) {
        return socket.emit('error', 'Room not found');
      }

      const existingPlayer = room.players.find(p => p.id === socket.id);
      if (existingPlayer) {
        return socket.emit('error', 'You are already in this room');
      }

      if (room.players.length >= 2) {
        return socket.emit('error', 'Room is full');
      }

      socket.join(upperRoomId);

      // Join as Player 2
      room.players.push({ id: socket.id, name: name.trim(), avatar: avatar, symbol: 'O' });
      socket.emit('player-joined', room);
      console.log(`Player 2 ${name} joined room ${upperRoomId}`);

      io.to(upperRoomId).emit('update-lobby', room);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });

  // --- 3. Start Game ---
  socket.on('start-game', (roomId) => {
    try {
      const room = gameRooms[roomId];
      if (!room) return socket.emit('error', 'Room not found');
      if (room.hostId !== socket.id) return socket.emit('error', 'Only the host can start');
      if (room.players.length < 2) return socket.emit('error', 'Need 2 players to start');

      room.status = 'playing';
      room.board = Array(9).fill(null);
      room.currentPlayer = 'X';
      room.winner = null;
      room.rematchVotes = [];

      console.log(`Game started in room ${roomId}`);
      io.to(roomId).emit('game-started', room);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', 'Failed to start game');
    }
  });

  // --- 4. Make a Move ---
  socket.on('make-move', ({ roomId, index, playerSymbol }) => {
    try {
      const room = gameRooms[roomId];
      if (!room) return socket.emit('error', 'Room not found');
      if (room.status !== 'playing') return;
      if (room.board[index] !== null) return;
      if (room.currentPlayer !== playerSymbol) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player || player.symbol !== playerSymbol) return;

      room.board[index] = playerSymbol;
      const winner = calculateWinner(room.board);
      room.currentPlayer = playerSymbol === 'X' ? 'O' : 'X';

      if (winner) {
        room.status = 'finished';
        room.winner = winner;
        if (winner === 'X' || winner === 'O') {
          room.score[winner]++;
        }
      }

      // In server.js 'make-move' handler
      const gameUpdate = {
        board: room.board,
        currentPlayer: room.currentPlayer,
        winner: winner,
        score: room.score,
      };
      io.to(roomId).emit('game-update', gameUpdate); // <-- Sends only this partial object

    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('error', 'Failed to make move');
    }
  });

  // --- 5. Request Rematch ---
  socket.on('request-rematch', (roomId) => {
    try {
      const room = gameRooms[roomId];
      if (!room) return socket.emit('error', 'Room not found');

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      if (!room.rematchVotes.includes(socket.id)) {
        room.rematchVotes.push(socket.id);
      }

      io.to(roomId).emit('rematch-vote-update', {
        votes: room.rematchVotes,
        voters: room.rematchVotes.map(id => {
          const player = room.players.find(p => p.id === id);
          return player ? player.name : 'Unknown';
        })
      });

      // Start rematch when both players vote
      if (room.rematchVotes.length === room.players.length && room.players.length >= 2) {
        room.board = Array(9).fill(null);
        room.currentPlayer = room.winner === 'X' ? 'O' : 'X';
        room.status = 'playing';
        room.winner = null;
        room.rematchVotes = [];

        io.to(roomId).emit('game-started', room);
        console.log(`Rematch started in room ${roomId}`);
      }
    } catch (error) {
      console.error('Error on rematch:', error);
      socket.emit('error', 'Failed to request rematch');
    }
  });

  // --- 6. Handle Disconnect ---
  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);

    for (const roomId in gameRooms) {
      const room = gameRooms[roomId];
      let playerLeft = false;
      let playerName = '';
      const wasHost = socket.id === room.hostId;

      // Check if disconnected user was a player
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const disconnectedPlayer = room.players[playerIndex];
        playerName = disconnectedPlayer.name;

        room.players.splice(playerIndex, 1);
        playerLeft = true;

        // Remove any rematch votes from disconnected player
        room.rematchVotes = room.rematchVotes.filter(id => id !== socket.id);

        if (room.status === 'playing' && room.players.length === 1) {
          // End the game if a player leaves during gameplay
          const remainingPlayer = room.players[0];
          room.status = 'finished';
          room.winner = remainingPlayer.symbol;
          room.score[remainingPlayer.symbol]++;

          io.to(roomId).emit('opponent-left', {
            message: `${playerName} left the game. ${remainingPlayer.name} wins!`,
            winner: remainingPlayer.symbol,
            score: room.score,
          });

          // Handle host transfer
          if (wasHost) {
            room.hostId = remainingPlayer.id;
          }
        } else if (wasHost && room.players.length > 0) {
          // Player left from lobby, transfer host
          room.hostId = room.players[0].id;
          io.to(roomId).emit('new-host', {
            newHostId: room.hostId,
            newHostName: room.players[0].name
          });
        }
      }

      // Clean up empty rooms
      if (room.players.length === 0) {
        delete gameRooms[roomId];
        console.log(`Room ${roomId} deleted (empty)`);
        continue;
      }

      // Update lobby if someone left
      if (playerLeft) {
        io.to(roomId).emit('update-lobby', room);
      }
    }
  });

  // --- 7. Leave Room (explicit leave) ---
  socket.on('leave-room', (roomId) => {
    const room = gameRooms[roomId];
    if (room) {
      socket.leave(roomId);
      // The disconnect handler will handle the cleanup
    }
  });
});

app.get('/', (req, res) => {
  res.send('Server is running.');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;