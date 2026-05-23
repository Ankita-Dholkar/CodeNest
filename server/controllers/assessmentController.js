import Assessment from '../models/Assessment.js';
import Room from '../models/Room.js';

// POST /api/assessments
export async function createAssessment(req, res) {
  try {
    const { label, durationMinutes, template } = req.body;
    const assessment = await Assessment.create({
      interviewerId: req.user._id,
      label: label || 'Frontend Test',
      durationMinutes: durationMinutes || 45,
      template: template || 'react',
    });
    res.status(201).json(assessment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/assessments/interviewer/me
export async function getAssessments(req, res) {
  try {
    const assessments = await Assessment.find({ interviewerId: req.user._id }).sort({ createdAt: -1 });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/assessments/join/:assessmentId
// Candidate uses the multi-use link, enters name, and creates their own unique Room
export async function joinAssessment(req, res) {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment link not found.' });

    // Guard: reject if the interviewer has terminated this link
    if (!assessment.isActive) {
      return res.status(403).json({ message: 'This assessment link has been closed by the interviewer.' });
    }

    const { candidateName, candidateEmail } = req.body;
    
    const room = await Room.create({
      candidateName,
      candidateEmail,
      durationMinutes: assessment.durationMinutes,
      template: assessment.template || 'react',
      label: assessment.label,
      interviewerId: assessment.interviewerId,
      status: 'active',
      startedAt: new Date(),
    });

    res.status(201).json({ roomId: room._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/assessments/:assessmentId/terminate  (Recruiter only)
// Marks the link as inactive so no new candidates can join.
// Also force-expires any candidate rooms that are still 'active'.
// ─────────────────────────────────────────────────────────────────────────────
export async function terminateAssessment(req, res) {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });

    // Ownership check — only the creating interviewer can terminate
    if (String(assessment.interviewerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorised to terminate this assessment.' });
    }

    if (!assessment.isActive) {
      return res.status(409).json({ message: 'Assessment is already terminated.' });
    }

    // 1. Deactivate the master link
    assessment.isActive = false;
    await assessment.save();

    // 2. Force-expire every still-active room spawned from this assessment
    const now = new Date();
    const result = await Room.updateMany(
      {
        interviewerId: req.user._id,
        label: assessment.label,
        status: 'active',
      },
      {
        $set: {
          status: 'expired',
          submittedAt: now,
        },
      }
    );

    res.json({
      success: true,
      message: `Assessment terminated. ${result.modifiedCount} active room(s) force-expired.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
