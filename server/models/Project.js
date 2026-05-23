import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    template: {
      type: String,
      enum: ['react', 'vanilla', 'node'],
      default: 'react',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
