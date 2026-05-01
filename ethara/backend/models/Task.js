const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  status:      { type: String, enum: ['todo', 'in-progress', 'in-review', 'completed'], default: 'todo' },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate:     { type: Date, default: null },
  tags:        [{ type: String, trim: true, maxlength: 30 }],
  completedAt: { type: Date, default: null }
}, { timestamps: true });

taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) this.completedAt = new Date();
    else if (this.status !== 'completed') this.completedAt = null;
  }
  next();
});

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
