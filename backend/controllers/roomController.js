//controllers/roomController.js

const Room = require('../models/Room');
const User = require('../models/User');

// Get all rooms
const getRooms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      search,
      isPrivate = false
    } = req.query;

    // Build query
    const query = { isActive: true, isPrivate: isPrivate === 'true' };
    
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const rooms = await Room.find(query)
      .populate('owner', 'username profile.firstName profile.lastName')
      .populate('participants.user', 'username profile.avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Room.countDocuments(query);

    res.json({
      success: true,
      data: {
        rooms,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single room
const getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'username profile.firstName profile.lastName')
      .populate('participants.user', 'username profile.firstName profile.lastName profile.avatar')
      .populate('currentProblem', 'title description difficulty')
      .populate('chatHistory.user', 'username profile.avatar');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room is private and user has access
    if (room.isPrivate) {
      const isParticipant = room.participants.some(
        p => p.user._id.toString() === req.user.id
      );
      const isOwner = room.owner._id.toString() === req.user.id;

      if (!isParticipant && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to private room'
        });
      }
    }

    res.json({
      success: true,
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getUserRooms = async (req, res) => {
  const rooms = await Room.find({ 'participants.user': req.user.id });
  return res.json({ success: true, data: { rooms } });
};

// Create room
const createRoom = async (req, res) => {
    console.log('🛠️ createRoom payload:', req.body);
  try {
    const roomData = {
      ...req.body,
      owner: req.user.id,
      participants: [{
        user: req.user.id,
        role: 'owner'
      }]
    };

    const room = await Room.create(roomData);
    await room.populate('owner', 'username profile.firstName profile.lastName');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Join room
const joinRoom = async (req, res) => {
  try {
    const { password } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Check if user is already in room
    const isAlreadyParticipant = room.participants.some(
      p => p.user.toString() === req.user.id
    );

    if (isAlreadyParticipant) {
      return res.status(400).json({
        success: false,
        message: 'Already in room'
      });
    }

    // Check password for private rooms
    if (room.isPrivate && room.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid room password'
      });
    }

    // Add user to room
    room.participants.push({
      user: req.user.id,
      role: 'participant'
    });

    await room.save();
    await room.populate('participants.user', 'username profile.firstName profile.lastName profile.avatar');
    await recordActivity({
    user: req.user.id,
    type: 'room',
    message: `Joined room: "${room.name}"`,
    resourceType: 'room',
    resourceId: room._id
  });

    res.json({
      success: true,
      message: 'Joined room successfully',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Leave room
const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Remove user from participants
    room.participants = room.participants.filter(
      p => p.user.toString() !== req.user.id
    );

    // If owner leaves, transfer ownership or delete room
    if (room.owner.toString() === req.user.id) {
      if (room.participants.length > 0) {
        // Transfer ownership to first participant
        room.owner = room.participants[0].user;
        room.participants[0].role = 'owner';
      } else {
        // Delete room if no participants left
        await Room.findByIdAndDelete(req.params.id);
        return res.json({
          success: true,
          message: 'Room deleted as last participant left'
        });
      }
    }

    await room.save();

    await recordActivity({
    user: req.user.id,
    type: 'room',
    message: `Left room: "${room.name}"`,
    resourceType: 'room',
    resourceId: room._id
  });

    res.json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update room
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is owner
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner can update room'
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'username profile.firstName profile.lastName');

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: { room: updatedRoom }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is owner
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner can delete room'
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getRooms,
  getRoom,
  createRoom,
  joinRoom,
  leaveRoom,
  updateRoom,
  deleteRoom,
  getUserRooms,
};