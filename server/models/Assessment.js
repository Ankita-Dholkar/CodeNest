import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  interviewerId: { type: String, required: true },
  label: { type: String, default: 'Frontend Test' },
  durationMinutes: { type: Number, default: 45 },
  template: { type: String, default: 'react' },
  isActive: { type: Boolean, default: true },   // false = link is terminated; no new joins
}, { timestamps: true });

export default mongoose.model('Assessment', assessmentSchema);
