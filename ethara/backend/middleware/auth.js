const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

// Verify JWT
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Global admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

// Must be project member (any role)
const projectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not a project member' });
    }
    req.project = project;
    req.projectRole = member?.role || (req.user.role === 'admin' ? 'admin' : null);
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Must be project admin or global admin
const projectAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isProjectAdmin = member?.role === 'admin';
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isGlobalAdmin = req.user.role === 'admin';

    if (!isProjectAdmin && !isOwner && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Project admin access required' });
    }
    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

module.exports = { protect, adminOnly, projectMember, projectAdmin, generateToken };
