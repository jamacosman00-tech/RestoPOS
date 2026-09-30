const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const InventoryLog = require('../models/InventoryLog');
const { auth, adminOnly } = require('../middleware/auth');

// GET settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update settings
router.put('/', auth, adminOnly, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    Object.assign(settings, req.body);
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST restore database backup
router.post('/restore', auth, adminOnly, async (req, res) => {
  try {
    const { settings, categories, menu, tables } = req.body;

    if (settings) {
      await Settings.deleteMany({});
      const { _id, ...cleanSettings } = settings;
      await Settings.create(cleanSettings);
    }

    if (categories && Array.isArray(categories)) {
      await Category.deleteMany({});
      await Category.insertMany(categories);
    }

    if (menu && Array.isArray(menu)) {
      await MenuItem.deleteMany({});
      await MenuItem.insertMany(menu);
    }

    if (tables && Array.isArray(tables)) {
      await Table.deleteMany({});
      await Table.insertMany(tables);
    }

    res.json({ message: 'Database restored successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Restore failed: ' + err.message });
  }
});

// POST seed realistic demo restaurant data
router.post('/seed-sample', auth, adminOnly, async (req, res) => {
  try {
    // 1. Settings
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    settings.restaurantName = 'Gourmet Bistro & Cafe';
    settings.address = '45 Avenue Montaigne, Suite 101';
    settings.phone = '+1 (555) 234-5678';
    settings.email = 'contact@gourmetbistro.local';
    settings.currency = 'USD';
    settings.currencySymbol = '$';
    settings.taxRate = 8.5;
    settings.receiptFooter = 'Thank you for dining with us! Come back soon.';
    settings.allowCashierDiscount = true;
    settings.maxCashierDiscount = 20;
    settings.lowStockThreshold = 10;
    await settings.save();

    // 2. Sample Cashier User & Admin check
    let cashier = await User.findOne({ username: 'cashier1' });
    if (!cashier) {
      cashier = new User({
        username: 'cashier1',
        password: 'cashier123',
        fullName: 'Sarah Connor (Cashier)',
        role: 'cashier',
        active: true,
        lastLogin: new Date(Date.now() - 36 * 60 * 60 * 1000),
      });
      await cashier.save();
    }

    // 3. Categories
    const categoriesData = [
      { name: 'Burgers & Sandwiches', icon: '🍔', description: 'Freshly grilled artisanal burgers and subs' },
      { name: 'Pizza & Pasta', icon: '🍕', description: 'Wood-fired authentic pizzas and handmade pastas' },
      { name: 'Appetizers & Sides', icon: '🍟', description: 'Crispy sides, wings, and shareables' },
      { name: 'Beverages & Coffee', icon: '☕', description: 'Espresso drinks, fresh juices, and sodas' },
      { name: 'Desserts & Sweets', icon: '🍰', description: 'Cakes, pastries, and house ice cream' },
    ];

    const categoryDocs = [];
    for (const cat of categoriesData) {
      let existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        existing = await Category.create(cat);
      }
      categoryDocs.push(existing);
    }

    // 4. Menu Items
    const menuData = [
      // Burgers
      { name: 'Classic Truffle Burger', category: categoryDocs[0]._id, price: 14.50, stock: 45, lowStockThreshold: 10, description: 'Angus beef patty, black truffle mayo, brioche bun' },
      { name: 'Smoky BBQ Bacon Burger', category: categoryDocs[0]._id, price: 15.95, stock: 32, lowStockThreshold: 8, description: 'Crispy applewood bacon, aged cheddar, smoky glaze' },
      { name: 'Crispy Chicken Club', category: categoryDocs[0]._id, price: 12.99, stock: 25, lowStockThreshold: 5, description: 'Buttermilk fried chicken, lettuce, herb aioli' },
      
      // Pizza & Pasta
      { name: 'Margherita Pizza 12"', category: categoryDocs[1]._id, price: 13.50, stock: 50, lowStockThreshold: 10, description: 'San Marzano tomatoes, fresh mozzarella, fresh basil' },
      { name: 'Pepperoni Supreme 12"', category: categoryDocs[1]._id, price: 16.00, stock: 40, lowStockThreshold: 10, description: 'Artisan pepperoni, spicy honey drizzle, mozzarella' },
      { name: 'Creamy Fettuccine Alfredo', category: categoryDocs[1]._id, price: 14.00, stock: 20, lowStockThreshold: 5, description: 'House parmesan cream sauce, garlic crostini' },

      // Appetizers
      { name: 'Loaded Cheese Fries', category: categoryDocs[2]._id, price: 7.50, stock: 60, lowStockThreshold: 15, description: 'Cheddar sauce, scallions, crispy bacon bits' },
      { name: 'Buffalo Chicken Wings (8pcs)', category: categoryDocs[2]._id, price: 11.50, stock: 18, lowStockThreshold: 8, description: 'Spicy buffalo sauce with homemade blue cheese dip' },
      { name: 'Garlic Butter Breadsticks', category: categoryDocs[2]._id, price: 5.50, stock: 4, lowStockThreshold: 10, description: 'Freshly baked with warm marinara dipping sauce' },

      // Beverages
      { name: 'Iced Caramel Macchiato', category: categoryDocs[3]._id, price: 4.75, stock: 80, lowStockThreshold: 20, description: 'Espresso, milk, vanilla syrup, caramel drizzle' },
      { name: 'Fresh Squeezed Lemonade', category: categoryDocs[3]._id, price: 3.95, stock: 65, lowStockThreshold: 15, description: 'Organic lemons, mint leaves, cane sugar' },
      { name: 'Italian Sparkling Mineral Water', category: categoryDocs[3]._id, price: 3.50, stock: 3, lowStockThreshold: 10, description: '500ml glass bottle' },

      // Desserts
      { name: 'Molten Chocolate Lava Cake', category: categoryDocs[4]._id, price: 8.50, stock: 15, lowStockThreshold: 5, description: 'Warm dark chocolate center with vanilla bean gelato' },
      { name: 'New York Style Cheesecake', category: categoryDocs[4]._id, price: 7.95, stock: 12, lowStockThreshold: 4, description: 'Rich cream cheese cake with strawberry reduction' },
    ];

    for (const item of menuData) {
      let existing = await MenuItem.findOne({ name: item.name });
      if (!existing) {
        await MenuItem.create(item);
      }
    }

    // 5. Tables
    const tablesData = [
      { number: 1, name: 'Window Booth 1', capacity: 4, status: 'available' },
      { number: 2, name: 'Window Booth 2', capacity: 4, status: 'available' },
      { number: 3, name: 'Center Table A', capacity: 2, status: 'available' },
      { number: 4, name: 'Center Table B', capacity: 2, status: 'available' },
      { number: 5, name: 'Patio Table 1', capacity: 6, status: 'available' },
      { number: 6, name: 'Patio Table 2', capacity: 6, status: 'available' },
      { number: 7, name: 'VIP Dining Room', capacity: 10, status: 'available' },
      { number: 8, name: 'Bar High-top', capacity: 2, status: 'available' },
    ];

    for (const t of tablesData) {
      let existing = await Table.findOne({ number: t.number });
      if (!existing) {
        await Table.create(t);
      }
    }

    res.json({
      message: 'Sample data created successfully! Cashier user: cashier1 / cashier123',
    });
  } catch (err) {
    res.status(500).json({ message: 'Seed failed: ' + err.message });
  }
});

module.exports = router;
