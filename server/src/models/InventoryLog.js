const mongoose = require('mongoose');
const inventoryLogSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  itemName: String,
  changeType: { type: String, enum: ['add', 'reduce', 'adjust'], required: true },
  quantity: { type: Number, required: true },
  previousStock: Number,
  newStock: Number,
  reason: { type: String, default: '' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
