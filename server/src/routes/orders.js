const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const InventoryLog = require('../models/InventoryLog');
const { auth } = require('../middleware/auth');

// GET all orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, cashier, date, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (cashier) filter.cashier = cashier;
    if (type) filter.type = type;
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }
    const orders = await Order.find(filter)
      .populate('cashier', 'username fullName')
      .populate('table', 'number name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('cashier', 'username fullName')
      .populate('table', 'number name')
      .populate('items.menuItem', 'name price');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create order
router.post('/', auth, async (req, res) => {
  try {
    const { type, table: tableId, items, discount, discountType, notes } = req.body;
    
    // Calculate items with current prices
    const orderItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) return res.status(400).json({ message: `Item not found: ${item.menuItem}` });
      const subtotal = menuItem.price * item.quantity;
      orderItems.push({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: item.quantity, subtotal });
    }
    
    const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
    let discountAmt = 0;
    if (discount) {
      discountAmt = discountType === 'percent' ? (subtotal * discount / 100) : discount;
    }
    const total = Math.max(0, subtotal - discountAmt);
    
    const order = new Order({
      type, items: orderItems, subtotal, discount: discountAmt,
      discountType: discountType || 'percent', total,
      cashier: req.user.id, notes: notes || '',
    });
    
    if (type === 'dine-in' && tableId) {
      order.table = tableId;
      await Table.findByIdAndUpdate(tableId, { status: 'occupied', currentOrder: order._id });
    }
    
    await order.save();
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update order
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Cannot modify completed/cancelled order' });
    
    const { items, discount, discountType, notes, type, table: tableId } = req.body;
    if (items) {
      const orderItems = [];
      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem) continue;
        const subtotal = menuItem.price * item.quantity;
        orderItems.push({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: item.quantity, subtotal });
      }
      order.items = orderItems;
      order.subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
      let discountAmt = 0;
      if (discount !== undefined) {
        discountAmt = discountType === 'percent' ? (order.subtotal * discount / 100) : (discount || 0);
      }
      order.discount = discountAmt;
      order.total = Math.max(0, order.subtotal - discountAmt);
    }
    if (notes !== undefined) order.notes = notes;
    if (type) order.type = type;
    await order.save();
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST complete order (payment)
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { amountPaid } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Order already processed' });
    
    const change = amountPaid - order.total;
    if (change < 0) return res.status(400).json({ message: 'Insufficient payment' });
    
    order.status = 'completed';
    order.payment = { method: 'cash', amountPaid, change, paidAt: new Date() };
    await order.save();
    
    // Reduce stock for each item
    for (const item of order.items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem) {
        const previousStock = menuItem.stock;
        menuItem.stock = Math.max(0, menuItem.stock - item.quantity);
        await menuItem.save();
        await InventoryLog.create({
          menuItem: menuItem._id, itemName: menuItem.name, changeType: 'reduce',
          quantity: item.quantity, previousStock, newStock: menuItem.stock,
          reason: `Order ${order.orderNumber}`, performedBy: req.user.id,
        });
      }
    }
    
    // Free the table
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, { status: 'available', currentOrder: null });
    }
    
    res.json({ order, change });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST cancel order
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Order already processed' });
    order.status = 'cancelled';
    await order.save();
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, { status: 'available', currentOrder: null });
    }
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
