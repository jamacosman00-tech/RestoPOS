const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const tables = await Table.find().populate('currentOrder').sort({ number: 1 });
    res.json(tables);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json(table);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(table);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(table);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
