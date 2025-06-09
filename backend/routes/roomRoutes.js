const express = require('express');
const {
  getRooms,
  getRoom,
  createRoom,
  joinRoom,
  leaveRoom,
  updateRoom,
  deleteRoom,
   getUserRooms,
} = require('../controllers/roomController');
const { auth } = require('../middleware/auth');
const { roomValidation, validate } = require('../utils/validators');

const router = express.Router();

// All routes are protected
router.use(auth);

router.get('/', getRooms);
router.get('/:id', getRoom);
router.get('/user/rooms', getUserRooms);
router.post('/', roomValidation, validate, createRoom);
router.post('/:id/join', joinRoom);
router.post('/:id/leave', leaveRoom);
router.put('/:id', roomValidation, validate, updateRoom);
router.delete('/:id', deleteRoom);

module.exports = router;