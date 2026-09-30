const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const InventoryLog = require('../models/InventoryLog');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { category, search, available } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (available !== undefined) filter.available = available === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };
    const items = await MenuItem.find(filter).populate('category', 'name icon').sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category', 'name icon');
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update stock
router.patch('/:id/stock', auth, adminOnly, async (req, res) => {
  try {
    const { quantity, changeType, reason } = req.body;
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const previousStock = item.stock;
    if (changeType === 'add') item.stock += quantity;
    else if (changeType === 'reduce') item.stock = Math.max(0, item.stock - quantity);
    else item.stock = quantity;
    await item.save();
    await InventoryLog.create({
      menuItem: item._id, itemName: item.name, changeType,
      quantity, previousStock, newStock: item.stock,
      reason: reason || '', performedBy: req.user.id,
    });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
