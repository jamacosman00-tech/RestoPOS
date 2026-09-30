# 🍽️ RestoPOS - Complete Offline Restaurant Management System

An offline-first, full-stack Restaurant Management and Point of Sale (POS) system designed to run on a local server without requiring an active internet connection.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide Icons, React Router v6, React Hot Toast, Date-fns
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, JWT, bcryptjs
- **Database**: Local MongoDB (`mongodb://127.0.0.1:27017/restaurant_pos`)

---

## 👥 User Roles & Permissions

### 1. 👑 Admin Role
- **Dashboard**: Real-time sales statistics, revenue, pending orders, and low-stock alerts.
- **User Management**: Create, edit, activate/deactivate cashiers and administrators, reset passwords.
- **Menu Management**: Categorized menu items with pricing, description, stock tracking, and availability status.
- **Category Management**: Create food & beverage categories with visual icons.
- **Table Management**: Manage restaurant tables (capacity, status: available, occupied, reserved).
- **Order Management**: Monitor all active, completed, and cancelled dine-in/takeaway orders.
- **Inventory Control**: Real-time stock alerts, add/reduce stock with audit trail logs.
- **Sales & Financial Reports**: Daily, weekly, and monthly sales breakdowns, sales by cashier, top-selling items, and CSV export.
- **System Settings & Offline Backup**: Custom restaurant branding, currency symbol, tax rate, cashier discount permissions, full JSON database backup and restore, and one-click demo data population.

### 2. 💼 Cashier Role
- **Cashier Dashboard**: Daily personal sales total, completed orders counter, pending order alerts.
- **POS / New Order**: Visual menu catalog with search & category filters, cart management, dine-in table assignment or takeaway mode.
- **Discounts & Payment**: Automatic subtotal, customizable discount rate (if allowed by admin), cash payment calculator with real-time change calculation.
- **Receipt Printing**: Integrated thermal receipt modal with print support.
- **Order History**: View personal orders, complete pending table orders, reprint receipts, and cancel orders.
- **Security**: Strict access control preventing access to system settings, user management, and sensitive reports.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally on default port `27017`

### 2. Start Backend Server
```bash
cd server
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

### 3. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 🔑 Default Credentials

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Click *"Initialize Admin Account"* on Login screen on first run |
| **Cashier** | `cashier1` | `cashier123` | Created automatically when loading sample data from Settings |

---

## 📴 Offline Operation & Backups

1. **No External APIs Required**: All data, authentication, inventory tracking, and reports are processed locally on your machine.
2. **Local Backup**: Go to **Admin > Settings > Export Local Backup** to download a `.json` snapshot of all orders, inventory, menu items, and settings.
3. **Database Restore**: Click **Restore Database From File** in Settings to restore from any previous backup file.
4. **Demo Data**: Click **Load Sample Demo Data** in Settings to instantly load categories, menu items, tables, and cashier accounts.
