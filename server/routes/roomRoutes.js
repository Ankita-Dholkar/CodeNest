import express from 'express';
import {
  createRoom,
  getRoom,
  startRoom,
  saveRoom,
  listRooms,
  getRoomsByInterviewer,
} from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Recruiter (Protected)
router.get('/', protect, listRooms);
router.post('/', protect, createRoom);
router.get('/interviewer/me', protect, getRoomsByInterviewer);

// Candidate
router.get('/:roomId', getRoom);
router.patch('/start/:roomId', startRoom);
router.post('/save/:roomId', saveRoom);

export default router;
