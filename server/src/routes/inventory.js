const express = require('express');
const router = express.Router();
const InventoryLog = require('../models/InventoryLog');
const MenuItem = require('../models/MenuItem');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/logs', auth, async (req, res) => {
  try {
    const { menuItem, changeType, limit = 100 } = req.query;
    const filter = {};
    if (menuItem) filter.menuItem = menuItem;
    if (changeType) filter.changeType = changeType;
    const logs = await InventoryLog.find(filter)
      .populate('performedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/low-stock', auth, async (req, res) => {
  try {
    const items = await MenuItem.find().populate('category', 'name');
    const lowStock = items.filter(item => item.stock <= item.lowStockThreshold && item.available);
    res.json(lowStock);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
