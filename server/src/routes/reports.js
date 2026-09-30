const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth, adminOnly } = require('../middleware/auth');

function dateRange(period) {
  const now = new Date();
  const start = new Date(now);
  if (period === 'daily') start.setHours(0, 0, 0, 0);
  else if (period === 'weekly') { start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); }
  else if (period === 'monthly') { start.setDate(1); start.setHours(0, 0, 0, 0); }
  return { start, end: now };
}

// GET sales summary
router.get('/sales', auth, adminOnly, async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate); start.setHours(0,0,0,0);
      end = new Date(endDate); end.setHours(23,59,59,999);
    } else {
      const range = dateRange(period);
      start = range.start; end = range.end;
    }
    const orders = await Order.find({
      status: 'completed',
      'payment.paidAt': { $gte: start, $lte: end },
    }).populate('cashier', 'username fullName');
    
    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      totalDiscount: orders.reduce((sum, o) => sum + o.discount, 0),
      orders: orders.map(o => ({
        id: o._id, orderNumber: o.orderNumber, total: o.total,
        discount: o.discount, cashier: o.cashier, createdAt: o.createdAt,
        paidAt: o.payment.paidAt,
      })),
    };
    res.json(summary);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET sales by cashier
router.get('/by-cashier', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: 'completed' };
    if (startDate && endDate) {
      filter['payment.paidAt'] = {
        $gte: new Date(startDate + 'T00:00:00'),
        $lte: new Date(endDate + 'T23:59:59'),
      };
    }
    const result = await Order.aggregate([
      { $match: filter },
      { $group: { _id: '$cashier', totalRevenue: { $sum: '$total' }, orderCount: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'cashierInfo' } },
      { $unwind: '$cashierInfo' },
      { $project: { cashier: '$cashierInfo.fullName', username: '$cashierInfo.username', totalRevenue: 1, orderCount: 1 } },
    ]);
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET top selling items
router.get('/top-items', auth, adminOnly, async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const todayOrders = await Order.find({ status: 'completed', 'payment.paidAt': { $gte: today, $lte: todayEnd } });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const MenuItem = require('../models/MenuItem');
    const lowStockItems = await MenuItem.find().then(items => items.filter(i => i.stock <= i.lowStockThreshold && i.available).length);
    const totalMenuItems = await MenuItem.countDocuments({ available: true });
    res.json({
      todayRevenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
      todayOrders: todayOrders.length,
      pendingOrders,
      lowStockItems,
      totalMenuItems,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
