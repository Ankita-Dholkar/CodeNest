import mongoose from 'mongoose';

/**
 * Room — represents a single candidate assessment session.
 *
 *  durationMinutes  : total allowed time in minutes (set by recruiter, default 45)
 *  startedAt        : ISO timestamp of when the candidate FIRST opened the room
 *                     (null until candidate starts — this is what makes the timer persistent)
 *  files            : the live Sandpack file tree saved by save/submit calls
 *  status           : 'pending' | 'active' | 'submitted' | 'expired'
 */
const roomSchema = new mongoose.Schema(
  {
    candidateName:  { type: String, default: '' },
    candidateEmail: { type: String, default: '' },
    interviewerId:  { type: String, default: 'admin' },
    template:       { type: String, default: 'react' },

    // ── Timer ──────────────────────────────────────────────────────────────
    durationMinutes: { type: Number, default: 45 },   // recruiter-defined, in minutes
    startedAt:       { type: Date,   default: null }, // stamped when candidate starts

    // ── Code snapshot ──────────────────────────────────────────────────────
    files: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Lifecycle ──────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'active', 'submitted', 'expired'],
      default: 'pending',
    },

    // ── Metadata ───────────────────────────────────────────────────────────
    label:       { type: String, default: '' },
    submittedAt: { type: Date,   default: null },
    timeTaken:   { type: Number, default: 0 },  // seconds spent
  },
  { timestamps: true }
);

export default mongoose.model('Room', roomSchema);

