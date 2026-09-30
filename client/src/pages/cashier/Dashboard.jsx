import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  ShoppingCart,
  Grid3X3,
  Receipt,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, bgGlow }) {
  return (
    <div className="card flex items-center gap-4 border border-slate-800 bg-[#0B132B]/80 backdrop-blur-md">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg ${color} ${bgGlow}`}
      >
        <Icon size={22} className="stroke-[2.5]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function CashierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [settings, setSettings] = useState({ currencySymbol: '$' });

  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data)).catch(() => {});
    api.get('/tables').then((r) => setTables(r.data)).catch(() => {});
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const sym = settings.currencySymbol || '$';
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Cashier's orders or all orders today
  const todayCompleted = orders.filter(
    (o) => o.status === 'completed' && new Date(o.createdAt) >= todayStart
  );
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const todayRevenue = todayCompleted.reduce((sum, o) => sum + (o.total || 0), 0);
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.fullName || user?.username}! 👋
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Cashier Station is ready for processing orders, table bookings, and bill settlements.
          </p>
        </div>

        <button
          onClick={() => navigate('/cashier/pos')}
          className="btn-primary py-3 px-6 text-sm font-bold shadow-xl shadow-emerald-950/60"
        >
          <ShoppingCart size={18} />
          <span>Launch POS Terminal</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={`${sym}${todayRevenue.toFixed(2)}`}
          color="bg-emerald-600"
          bgGlow="shadow-emerald-950/50"
        />
        <StatCard
          icon={ShoppingBag}
          label="Completed Orders"
          value={todayCompleted.length}
          color="bg-blue-600"
          bgGlow="shadow-blue-950/50"
        />
        <StatCard
          icon={Clock}
          label="Pending Orders"
          value={pendingOrders.length}
          color="bg-amber-600"
          bgGlow="shadow-amber-950/50"
        />
        <StatCard
          icon={Grid3X3}
          label="Occupied Tables"
          value={`${occupiedTables} / ${tables.length}`}
          color="bg-purple-600"
          bgGlow="shadow-purple-950/50"
        />
      </div>

      {/* Main Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/cashier/pos')}
          className="card cursor-pointer hover:border-emerald-500/50 hover:bg-slate-900 transition-all p-5 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingCart size={24} />
            </div>
            <ArrowRight size={18} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">New Order / POS</h3>
            <p className="text-xs text-slate-400">Create dine-in, takeaway, or delivery order</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/cashier/tables')}
          className="card cursor-pointer hover:border-purple-500/50 hover:bg-slate-900 transition-all p-5 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Grid3X3 size={24} />
            </div>
            <ArrowRight size={18} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Table Floor Plan</h3>
            <p className="text-xs text-slate-400">View live table statuses & open table orders</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/cashier/orders')}
          className="card cursor-pointer hover:border-blue-500/50 hover:bg-slate-900 transition-all p-5 group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Receipt size={24} />
            </div>
            <ArrowRight size={18} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Order History & Bills</h3>
            <p className="text-xs text-slate-400">Settle pending bills & reprint receipts</p>
          </div>
        </div>
      </div>

      {/* Pending Orders List */}
      {pendingOrders.length > 0 && (
        <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              <h2 className="text-base font-bold text-white">Active Pending Orders</h2>
              <span className="badge-yellow ml-1">{pendingOrders.length}</span>
            </div>
            <button
              onClick={() => navigate('/cashier/orders?status=pending')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              View all orders →
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {pendingOrders.slice(0, 5).map((order) => (
              <div
                key={order._id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {order.orderNumber}
                    </span>
                    <span className="badge-blue capitalize text-[10px]">
                      {order.type}
                    </span>
                    {order.table && (
                      <span className="text-xs text-slate-300 font-medium bg-slate-800 px-2 py-0.5 rounded">
                        Table {order.table.number}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {order.items?.length || 0} item(s) · Placed by {order.cashier?.fullName || 'Cashier'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-base font-black text-emerald-400">
                    {sym}{order.total.toFixed(2)}
                  </span>
                  <button
                    onClick={() => navigate('/cashier/orders')}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    Settle Bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
