const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  status:      { type: String, enum: ['active', 'on-hold', 'completed', 'archived'], default: 'active' },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  deadline:    { type: Date, default: null },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:     [memberSchema],
  color:       { type: String, default: '#00e5ff' }
}, { timestamps: true });

// Owner is always included in members as admin
projectSchema.pre('save', function(next) {
  const ownerInMembers = this.members.some(m => m.user.toString() === this.owner.toString());
  if (!ownerInMembers) {
    this.members.unshift({ user: this.owner, role: 'admin' });
  }
  next();
});

// Virtual: task count (populated manually)
projectSchema.virtual('taskCount');

projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', projectSchema);
