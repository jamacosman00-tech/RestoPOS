const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

// GET all users (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create user (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, role, fullName } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ message: 'Username, password, and full name are required' });
    }
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: 'Username already exists' });
    const user = new User({
      username: username.toLowerCase().trim(),
      password,
      role: role || 'cashier',
      fullName: fullName.trim(),
    });
    await user.save();
    res.status(201).json({ ...user.toObject(), password: undefined });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update user (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { password, username, fullName, role, active } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (username && username.toLowerCase().trim() !== user.username) {
      const existing = await User.findOne({ username: username.toLowerCase().trim(), _id: { $ne: user._id } });
      if (existing) return res.status(400).json({ message: 'Username already taken' });
      user.username = username.toLowerCase().trim();
    }
    if (fullName) user.fullName = fullName.trim();
    if (role) user.role = role;
    if (typeof active === 'boolean') user.active = active;
    if (password && password.trim().length > 0) user.password = password;
    
    await user.save();
    res.json({ ...user.toObject(), password: undefined });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH reset user password (admin only)
router.patch('/:id/reset-password', auth, adminOnly, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters long' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE user (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own active account' });
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only remaining admin account' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH toggle active
router.patch('/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.active = !user.active;
    await user.save();
    res.json({ active: user.active });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
