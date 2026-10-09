import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    dueAt: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', null], default: null },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ dueAt: 1 });
taskSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Task', taskSchema);
