const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

// Helper: check project membership
const checkMember = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const member = project.members.find(m => m.user.toString() === userId.toString());
  if (!member && userRole !== 'admin') return { error: 'Not a project member', status: 403 };
  return { project, memberRole: member?.role };
};

// Get tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { error, status } = await checkMember(req.params.projectId, req.user._id, req.user.role);
    if (error) return res.status(status).json({ message: error });

    const filter = { project: req.params.projectId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignee) filter.assignee = req.query.assignee;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Get MY tasks (across all projects)
router.get('/my', async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name color')
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 chars'),
  body('project').isMongoId().withMessage('Valid project ID required'),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('dueDate').optional().isISO8601().toDate(),
  validate
], async (req, res) => {
  try {
    const { project: projectId } = req.body;
    const { error, status } = await checkMember(projectId, req.user._id, req.user.role);
    if (error) return res.status(status).json({ message: error });

    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('status').optional().isIn(['todo', 'in-progress', 'in-review', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  validate
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { error, status } = await checkMember(task.project._id, req.user._id, req.user.role);
    if (error) return res.status(status).json({ message: error });

    const allowed = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'tags'];
    allowed.forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });
    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// Quick status update
router.patch('/:id/status', [
  body('status').isIn(['todo', 'in-progress', 'in-review', 'completed']),
  validate
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.status = req.body.status;
    await task.save();
    await task.populate('assignee', 'name email avatar');
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { error, status, memberRole } = await checkMember(task.project, req.user._id, req.user.role);
    if (error) return res.status(status).json({ message: error });

    // Only project admin, creator, or global admin can delete
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (memberRole !== 'admin' && !isCreator && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to delete this task' });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

module.exports = router;
