const mongoose = require('mongoose');
const settingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: 'My Restaurant' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  currencySymbol: { type: String, default: '$' },
  taxRate: { type: Number, default: 0 },
  receiptFooter: { type: String, default: 'Thank you for dining with us!' },
  allowCashierDiscount: { type: Boolean, default: false },
  maxCashierDiscount: { type: Number, default: 10 },
  lowStockThreshold: { type: Number, default: 5 },
}, { timestamps: true });
module.exports = mongoose.model('Settings', settingsSchema);
