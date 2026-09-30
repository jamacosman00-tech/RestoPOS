const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Settings = require('./models/Settings');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';

// Auto-seed default accounts on DB connection
async function autoSeed() {
  try {
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
      console.log('Default admin created (admin / admin123)');
    }

    let cashier = await User.findOne({ username: 'cashier1' });
    if (!cashier) {
      cashier = new User({
        username: 'cashier1',
        password: 'cashier123',
        role: 'cashier',
        fullName: 'Sarah Connor (Cashier)',
        active: true,
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
      await cashier.save();
      console.log('Default cashier created (cashier1 / cashier123)');
    }

    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({});
      console.log('Default settings created');
    }
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await autoSeed();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
