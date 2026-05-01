const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, projectAdmin, projectMember } = require('../middleware/auth');

router.use(protect);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

// Get all projects for current user
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort({ updatedAt: -1 });

    // Add task counts
    const projectIds = projects.map(p => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
    ]);

    const countMap = {};
    taskCounts.forEach(t => { countMap[t._id.toString()] = t; });

    const enriched = projects.map(p => {
      const obj = p.toObject();
      const counts = countMap[p._id.toString()] || { total: 0, completed: 0 };
      obj.taskCount = counts.total;
      obj.completedTaskCount = counts.completed;
      return obj;
    });

    res.json({ success: true, projects: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name 2-100 chars'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('deadline').optional().isISO8601().toDate(),
  validate
], async (req, res) => {
  try {
    const { name, description, priority, deadline, color } = req.body;
    const project = await Project.create({
      name, description, priority, deadline, color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// Get single project
router.get('/:projectId', projectMember, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const stats = { todo: 0, 'in-progress': 0, 'in-review': 0, completed: 0 };
    taskStats.forEach(s => { stats[s._id] = s.count; });

    res.json({ success: true, project, taskStats: stats, userRole: req.projectRole });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});

// Update project (project admin only)
router.put('/:projectId', projectAdmin, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('status').optional().isIn(['active', 'on-hold', 'completed', 'archived']),
  validate
], async (req, res) => {
  try {
    const allowed = ['name', 'description', 'status', 'priority', 'deadline', 'color'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const project = await Project.findByIdAndUpdate(req.params.projectId, updates, { new: true })
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:projectId', projectAdmin, async (req, res) => {
  try {
    await Task.deleteMany({ project: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ success: true, message: 'Project and all tasks deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// Add member to project
router.post('/:projectId/members', projectAdmin, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member']),
  validate
], async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No user found with that email' });

    const project = await Project.findById(req.params.projectId);
    const already = project.members.some(m => m.user.toString() === user._id.toString());
    if (already) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: user._id, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// Remove member
router.delete('/:projectId/members/:userId', projectAdmin, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (project.owner.toString() === req.params.userId)
      return res.status(400).json({ message: 'Cannot remove project owner' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    // Unassign their tasks
    await Task.updateMany(
      { project: project._id, assignee: req.params.userId },
      { assignee: null }
    );

    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

// Update member role
router.patch('/:projectId/members/:userId/role', projectAdmin, [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  validate
], async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    const member = project.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.role = req.body.role;
    await project.save();
    res.json({ success: true, message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role' });
  }
});

module.exports = router;
