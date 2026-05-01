const router = require('express').Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// Get all users (for assigning tasks / adding members)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('name email role avatar createdAt').sort({ name: 1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Search users by email (for adding members)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, users: [] });
    const users = await User.find({
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).select('name email avatar role').limit(10);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role' });
  }
});

module.exports = router;
