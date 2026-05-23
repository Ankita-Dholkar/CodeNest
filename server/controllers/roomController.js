import Room from '../models/Room.js';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rooms/:roomId
// Called on workspace mount.  Sets startedAt on first open (smart timer start).
// ─────────────────────────────────────────────────────────────────────────────
export async function getRoom(req, res) {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Calculate remaining seconds (server-authoritative, avoids client clock skew)
    let secondsRemaining = null;
    if (room.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(room.startedAt).getTime()) / 1000);
      const totalDurationSeconds = (room.durationMinutes || 45) * 60;
      secondsRemaining = Math.max(0, totalDurationSeconds - elapsed);

      // Auto-expire on the server side if time is already up
      if (secondsRemaining === 0 && room.status === 'active') {
        room.status = 'expired';
        await room.save();
      }
    }

    res.json({
      _id: room._id,
      candidateName: room.candidateName,
      candidateEmail: room.candidateEmail,
      files: room.files,
      status: room.status,
      template: room.template || 'react',
      durationMinutes: room.durationMinutes,
      startedAt: room.startedAt,
      secondsRemaining,          // ← key field: frontend uses this, not its own clock
      label: room.label,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/rooms/start/:roomId
// Candidate enters name/email and officially starts the timer.
// ─────────────────────────────────────────────────────────────────────────────
export async function startRoom(req, res) {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.status !== 'pending') {
      return res.status(400).json({ message: 'Assessment already started or completed.' });
    }

    room.candidateName = req.body.candidateName;
    room.candidateEmail = req.body.candidateEmail;
    room.startedAt = new Date();
    room.status = 'active';
    await room.save();

    res.json({ success: true, startedAt: room.startedAt, status: room.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rooms/save/:roomId
// Saves the current file snapshot. If body.status === 'submitted', finalises the room.
// ─────────────────────────────────────────────────────────────────────────────
export async function saveRoom(req, res) {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Prevent saving to an already-submitted/expired room
    if (room.status === 'submitted' || room.status === 'expired') {
      return res.status(409).json({ message: `Room is already ${room.status}` });
    }

    const { files, status } = req.body;

    if (files) room.files = files;

    if (status === 'submitted' || status === 'expired') {
      room.status = status;
      room.submittedAt = new Date();
      if (room.startedAt) {
        room.timeTaken = Math.floor((room.submittedAt.getTime() - room.startedAt.getTime()) / 1000);
      }
    }

    await room.save();
    res.json({ success: true, status: room.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rooms
// Recruiter creates a new room for a candidate.
// ─────────────────────────────────────────────────────────────────────────────
export async function createRoom(req, res) {
  try {
    const { candidateName, candidateEmail, durationMinutes, label, template } = req.body;
    const room = await Room.create({
      candidateName: candidateName || '',
      candidateEmail: candidateEmail || '',
      durationMinutes: durationMinutes || 45,
      template: template || 'react',
      label: label || '',
      interviewerId: req.user._id, // Assign to the logged in user
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rooms/interviewer/me
// Fetch all rooms assigned to the logged in interviewer.
// ─────────────────────────────────────────────────────────────────────────────
export async function getRoomsByInterviewer(req, res) {
  try {
    const rooms = await Room.find({ interviewerId: req.user._id }).sort({ createdAt: -1 }).select('-files');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rooms  (recruiter list view)
// ─────────────────────────────────────────────────────────────────────────────
export async function listRooms(req, res) {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 }).select('-files');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
