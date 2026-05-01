const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Projects user is part of
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }]
    }).select('_id name color status');

    const projectIds = userProjects.map(p => p._id);

    const [
      totalTasks, myTasks, overdueTasks, tasksByStatus,
      tasksByPriority, recentTasks, projectTaskCounts
    ] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ assignee: userId }),
      Task.countDocuments({
        assignee: userId,
        status: { $ne: 'completed' },
        dueDate: { $lt: now, $ne: null }
      }),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Task.find({ assignee: userId })
        .sort({ updatedAt: -1 }).limit(6)
        .populate('project', 'name color')
        .select('title status priority dueDate project updatedAt'),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$project', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
      ])
    ]);

    const statusMap = {};
    tasksByStatus.forEach(s => { statusMap[s._id] = s.count; });

    const priorityMap = {};
    tasksByPriority.forEach(s => { priorityMap[s._id] = s.count; });

    const projectCountMap = {};
    projectTaskCounts.forEach(p => { projectCountMap[p._id.toString()] = p; });

    const projectsWithCounts = userProjects.map(p => ({
      ...p.toObject(),
      taskCount: projectCountMap[p._id.toString()]?.total || 0,
      completedCount: projectCountMap[p._id.toString()]?.completed || 0
    }));

    // Global admin extra stats
    let adminStats = null;
    if (req.user.role === 'admin') {
      const [totalUsers, totalProjects] = await Promise.all([
        User.countDocuments(),
        Project.countDocuments()
      ]);
      adminStats = { totalUsers, totalProjects };
    }

    res.json({
      success: true,
      stats: {
        totalTasks,
        myTasks,
        overdueTasks,
        totalProjects: userProjects.length,
        byStatus: {
          todo: statusMap.todo || 0,
          'in-progress': statusMap['in-progress'] || 0,
          'in-review': statusMap['in-review'] || 0,
          completed: statusMap.completed || 0
        },
        byPriority: {
          critical: priorityMap.critical || 0,
          high: priorityMap.high || 0,
          medium: priorityMap.medium || 0,
          low: priorityMap.low || 0
        },
        recentTasks,
        projects: projectsWithCounts,
        adminStats
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});

module.exports = router;
