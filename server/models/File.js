import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    // e.g. "/src/components/App.jsx"
    path: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'javascript',
    },
  },
  { timestamps: true }
);

// Ensure no duplicate paths within the same project
fileSchema.index({ projectId: 1, path: 1 }, { unique: true });

export default mongoose.model('File', fileSchema);
