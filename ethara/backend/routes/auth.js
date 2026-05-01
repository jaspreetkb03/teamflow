const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
};

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  validate
], async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });

    // First user becomes admin automatically
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : (role === 'admin' ? 'admin' : 'member');

    const user = await User.create({ name, email, password, role: assignedRole });
    res.status(201).json({ success: true, token: generateToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({ success: true, token: generateToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get me
router.get('/me', protect, (req, res) => res.json({ success: true, user: req.user }));

module.exports = router;
