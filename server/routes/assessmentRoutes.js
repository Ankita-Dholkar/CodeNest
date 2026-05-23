import express from 'express';
import { createAssessment, getAssessments, joinAssessment, terminateAssessment } from '../controllers/assessmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Recruiter (Protected)
router.post('/', protect, createAssessment);
router.get('/interviewer/me', protect, getAssessments);
router.patch('/:assessmentId/terminate', protect, terminateAssessment);

// Candidate (Public)
router.post('/join/:assessmentId', joinAssessment);

export default router;
