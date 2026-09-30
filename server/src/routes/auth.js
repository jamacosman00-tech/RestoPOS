const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { auth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Clean username: remove any leading @ and trim whitespace
    const cleanUsername = username.toLowerCase().trim().replace(/^@+/, '');

    // Case-insensitive query
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.active) {
      return res.status(400).json({ message: 'Account is deactivated. Contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, fullName: user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role, fullName: user.fullName },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/seed - force initialize/reset admin and cashier accounts
router.post('/seed', async (req, res) => {
  try {
    // 1. Ensure Admin exists and has known password
    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      admin = new User({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        fullName: 'Restaurant Administrator',
        active: true,
        lastLogin: new Date(),
      });
      await admin.save();
    } else {
      admin.password = 'admin123';
      admin.active = true;
      admin.role = 'admin';
      await admin.save();
    }

    // 2. Ensure Cashier exists and has known password
    // Migrate old cashier1 username to cashier if it exists
    let cashier = await User.findOne({ username: 'cashier' });
    const oldCashier = await User.findOne({ username: 'cashier1' });

    if (!cashier && oldCashier) {
      // Rename the old cashier1 to cashier
      oldCashier.username = 'cashier';
      oldCashier.password = 'cashier123';
      oldCashier.active = true;
      oldCashier.role = 'cashier';
      await oldCashier.save();
      cashier = oldCashier;
    } else if (!cashier) {
      cashier = new User({
        username: 'cashier',
        password: 'cashier123',
        role: 'cashier',
        fullName: 'Cashier',
        active: true,
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
      await cashier.save();
    } else {
      cashier.password = 'cashier123';
      cashier.active = true;
      cashier.role = 'cashier';
      await cashier.save();
    }

    // Ensure default settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({});
    }

    res.json({
      message: 'Demo accounts ready: admin (admin/admin123) and cashier (cashier/cashier123)',
    });
  } catch (err) {
    res.status(500).json({ message: 'Seed error', error: err.message });
  }
});

module.exports = router;
