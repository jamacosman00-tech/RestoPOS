const mongoose = require('mongoose');
const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: String,
  price: Number,
  quantity: { type: Number, required: true, min: 1 },
  subtotal: Number,
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  type: { type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'dine-in' },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payment: {
    method: { type: String, default: 'cash' },
    amountPaid: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    paidAt: { type: Date },
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
