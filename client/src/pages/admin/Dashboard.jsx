import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  DollarSign,
  ShoppingBag,
  UtensilsCrossed,
  AlertTriangle,
  Clock,
  TrendingUp,
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  ArrowRight,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub, bgGlow }) {
  return (
    <div className="card flex items-start gap-4 border border-slate-800 bg-[#0B132B]/80 backdrop-blur-md">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg ${color} ${bgGlow}`}
      >
        <Icon size={22} className="stroke-[2.5]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [settings, setSettings] = useState({ currencySymbol: '$' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/dashboard').then((r) => setStats(r.data)).catch(() => {});
    api.get('/orders?status=completed').then((r) => setRecentOrders(r.data.slice(0, 6))).catch(() => {});
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const sym = settings.currencySymbol || '$';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Executive Dashboard
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time restaurant revenue, active orders, and sales performance
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/pos')}
          className="btn-primary py-2.5 px-5 text-sm font-bold shadow-lg shadow-emerald-950/50"
        >
          <ShoppingCart size={16} />
          <span>Open POS Terminal</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          color="bg-emerald-600"
          bgGlow="shadow-emerald-950/50"
          value={`${sym}${(stats?.todayRevenue || 0).toFixed(2)}`}
          sub={`${stats?.todayOrders || 0} orders today`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Pending Orders"
          color="bg-amber-600"
          bgGlow="shadow-amber-950/50"
          value={stats?.pendingOrders ?? '0'}
          sub="Awaiting completion"
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Menu Items"
          color="bg-blue-600"
          bgGlow="shadow-blue-950/50"
          value={stats?.totalMenuItems ?? '—'}
          sub="Catalog inventory"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          color="bg-red-600"
          bgGlow="shadow-red-950/50"
          value={stats?.lowStockItems ?? '0'}
          sub="Requires restock"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'POS Terminal', path: '/admin/pos', icon: ShoppingCart, color: 'text-emerald-400' },
          { label: 'Order History', path: '/admin/orders', icon: Receipt, color: 'text-blue-400' },
          { label: 'Menu & Stock', path: '/admin/menu', icon: UtensilsCrossed, color: 'text-amber-400' },
          { label: 'Cashiers & Staff', path: '/admin/users', icon: Users, color: 'text-purple-400' },
        ].map(({ label, path, icon: Icon, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="p-4 rounded-xl border border-slate-800 bg-[#0B132B]/80 hover:bg-slate-800 hover:border-slate-700 transition-all text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Icon size={20} className={color} />
              <span className="text-sm font-bold text-white">{label}</span>
            </div>
            <ArrowRight size={16} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      {/* Recent Completed Orders Table */}
      <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <h2 className="text-base font-bold text-white">Recent Completed Orders</h2>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            View all orders →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12">
            No completed orders recorded today yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">ORDER #</th>
                  <th className="py-3.5 px-5">CASHIER</th>
                  <th className="py-3.5 px-5">TYPE</th>
                  <th className="py-3.5 px-5">TOTAL</th>
                  <th className="py-3.5 px-5">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-white">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      {order.cashier?.fullName || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="badge-blue capitalize text-xs">
                        {order.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-black text-emerald-400">
                      {sym}{order.total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 text-xs">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
