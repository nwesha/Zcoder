// server.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const problemRoutes = require('./routes/problemRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');

// Import models for socket functionality
const Room = require('./models/Room');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Database connection
connectDB();

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO connection handling
const activeUsers = new Map(); // Track active users in rooms

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room
  socket.on('join-room', async (data) => {
    try {
      const { roomId, userId } = data;
      
      // Verify user and room exist
      const user = await User.findById(userId).select('username profile.firstName profile.lastName profile.avatar');
      const room = await Room.findById(roomId)
        .populate('participants.user', 'username profile.firstName profile.lastName profile.avatar')
        .populate('currentProblem', 'title description difficulty starterCode');

      if (!user || !room) {
        socket.emit('error', { message: 'User or room not found' });
        return;
      }

      // Check if user is participant
      const isParticipant = room.participants.some(p => p.user._id.toString() === userId);
      if (!isParticipant) {
        socket.emit('error', { message: 'Not authorized to join this room' });
        return;
      }

      // Join socket room
      socket.join(roomId);
      
      // Track active user
      activeUsers.set(socket.id, { userId, roomId, user });
      
      // Notify room about new participant
      socket.to(roomId).emit('user-joined', {
        user: {
          id: user._id,
          username: user.username,
          profile: user.profile
        }
      });

      // Send current room state to user
      socket.emit('room-joined', {
        room: room,
        sharedCode: room.sharedCode
      });

      // Send current active users in room
      const roomUsers = Array.from(activeUsers.values())
        .filter(activeUser => activeUser.roomId === roomId)
        .map(activeUser => ({
          id: activeUser.user._id,
          username: activeUser.user.username,
          profile: activeUser.user.profile
        }));

      io.to(roomId).emit('active-users', roomUsers);

    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leave-room', async (data) => {
    try {
      const { roomId } = data;
      const activeUser = activeUsers.get(socket.id);
      
      if (activeUser && activeUser.roomId === roomId) {
        socket.leave(roomId);
        
        // Notify room about user leaving
        socket.to(roomId).emit('user-left', {
          user: {
            id: activeUser.user._id,
            username: activeUser.user.username
          }
        });

        // Remove from active users
        activeUsers.delete(socket.id);

        // Update active users for room
        const roomUsers = Array.from(activeUsers.values())
          .filter(user => user.roomId === roomId)
          .map(user => ({
            id: user.user._id,
            username: user.user.username,
            profile: user.user.profile
          }));

        io.to(roomId).emit('active-users', roomUsers);
      }
    } catch (error) {
      console.error('Leave room error:', error);
    }
  });

  // Handle code changes
  socket.on('code-change', async (data) => {
    try {
      const { roomId, code, language, cursorPosition } = data;
      const activeUser = activeUsers.get(socket.id);

      if (!activeUser || activeUser.roomId !== roomId) {
        socket.emit('error', { message: 'Not authorized for this room' });
        return;
      }

      // Update shared code in database
      await Room.findByIdAndUpdate(roomId, {
        'sharedCode.content': code,
        'sharedCode.language': language,
        'sharedCode.lastModified': new Date(),
        'sharedCode.lastModifiedBy': activeUser.userId
      });

      // Broadcast code change to other users in room
      socket.to(roomId).emit('code-update', {
        code,
        language,
        cursorPosition,
        user: {
          id: activeUser.user._id,
          username: activeUser.user.username
        }
      });

    } catch (error) {
      console.error('Code change error:', error);
      socket.emit('error', { message: 'Failed to update code' });
    }
  });

  // Handle cursor position changes
  socket.on('cursor-change', (data) => {
    const { roomId, cursorPosition } = data;
    const activeUser = activeUsers.get(socket.id);

    if (activeUser && activeUser.roomId === roomId) {
      socket.to(roomId).emit('cursor-update', {
        cursorPosition,
        user: {
          id: activeUser.user._id,
          username: activeUser.user.username
        }
      });
    }
  });

  // Handle chat messages
  socket.on('chat-message', async (data) => {
    try {
      const { roomId, message, type = 'text' } = data;
      const activeUser = activeUsers.get(socket.id);

      if (!activeUser || activeUser.roomId !== roomId) {
        socket.emit('error', { message: 'Not authorized for this room' });
        return;
      }

      // Save message to database
      const room = await Room.findById(roomId);
      room.chatHistory.push({
        user: activeUser.userId,
        message,
        type,
        timestamp: new Date()
      });
      await room.save();

      // Broadcast message to room
      io.to(roomId).emit('chat-message', {
        message,
        type,
        timestamp: new Date(),
        user: {
          id: activeUser.user._id,
          username: activeUser.user.username,
          profile: activeUser.user.profile
        }
      });

    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const activeUser = activeUsers.get(socket.id);
    if (activeUser) {
      const { roomId } = activeUser;
      
      // Notify room about user leaving
      socket.to(roomId).emit('user-left', {
        user: {
          id: activeUser.user._id,
          username: activeUser.user.username
        }
      });

      // Remove from active users
      activeUsers.delete(socket.id);

      // Update active users for room
      const roomUsers = Array.from(activeUsers.values())
        .filter(user => user.roomId === roomId)
        .map(user => ({
          id: user.user._id,
          username: user.user.username,
          profile: user.user.profile
        }));

      io.to(roomId).emit('active-users', roomUsers);
    }
  });
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/execute', require('./routes/execRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ZCoder API' });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  server.close(() => {
    console.log('HTTP server closed');
  });
});