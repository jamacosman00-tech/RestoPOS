const mongoose = require('mongoose');
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  available: { type: Boolean, default: true },
  lowStockThreshold: { type: Number, default: 5 },
  image: { type: String, default: '' },
}, { timestamps: true });
module.exports = mongoose.model('MenuItem', menuItemSchema);
