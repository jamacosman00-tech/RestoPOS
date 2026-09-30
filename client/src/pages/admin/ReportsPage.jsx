import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Printer,
  Download,
  Users,
  PieChart,
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, bgGlow }) {
  return (
    <div className="card flex items-center gap-4 border border-slate-800 bg-[#0B132B]/80 backdrop-blur-md">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} ${bgGlow}`}
      >
        <Icon size={22} className="stroke-[2.5]" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-black text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('daily');
  const [salesData, setSalesData] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [byCashier, setByCashier] = useState([]);
  const [settings, setSettings] = useState({ currencySymbol: '$' });

  const fetchReports = () => {
    api.get(`/reports/sales?period=${period}`).then((r) => setSalesData(r.data)).catch(() => {});
    api.get('/reports/top-items').then((r) => setTopItems(r.data)).catch(() => {});
    api.get('/reports/by-cashier').then((r) => setByCashier(r.data)).catch(() => {});
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const sym = settings.currencySymbol || '$';

  const handlePrint = () => window.print();

  const handleExport = () => {
    if (!salesData?.orders) return;
    const rows = [
      ['Order #', 'Cashier', 'Total', 'Discount', 'Paid At'],
      ...salesData.orders.map((o) => [
        o.orderNumber,
        o.cashier?.fullName || '',
        `${sym}${o.total?.toFixed(2)}`,
        `${sym}${o.discount?.toFixed(2)}`,
        o.paidAt ? format(new Date(o.paidAt), 'yyyy-MM-dd HH:mm') : '',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${period}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Sales Reports & Analytics
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Revenue tracking, best selling menu items, and cashier shift performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-secondary text-xs py-2">
            <Printer size={15} /> Print
          </button>
          <button onClick={handleExport} className="btn-primary text-xs py-2">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {[
          ['daily', 'Today / Daily'],
          ['weekly', 'Weekly View'],
          ['monthly', 'Monthly View'],
          ['yearly', 'Yearly View'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              period === key
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Net Revenue"
          value={`${sym}${(salesData?.totalRevenue || 0).toFixed(2)}`}
          color="bg-emerald-600"
          bgGlow="shadow-emerald-950/50"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={salesData?.orderCount || 0}
          color="bg-blue-600"
          bgGlow="shadow-blue-950/50"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Ticket Size"
          value={`${sym}${(salesData?.averageOrderValue || 0).toFixed(2)}`}
          color="bg-purple-600"
          bgGlow="shadow-purple-950/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart size={18} className="text-emerald-400" />
              <span>Top 5 Best Selling Items</span>
            </h3>
          </div>

          <div className="p-4 space-y-3">
            {topItems.slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-white text-sm">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.totalQuantity} units sold</div>
                  </div>
                </div>
                <div className="font-black text-emerald-400 text-sm">
                  {sym}{(item.totalRevenue || 0).toFixed(2)}
                </div>
              </div>
            ))}

            {topItems.length === 0 && (
              <p className="text-center py-8 text-slate-500 text-xs">No sales recorded yet</p>
            )}
          </div>
        </div>

        {/* Sales by Cashier */}
        <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              <span>Cashier Shift Performance</span>
            </h3>
          </div>

          <div className="p-4 space-y-3">
            {byCashier.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
              >
                <div>
                  <div className="font-semibold text-white text-sm">
                    {c.cashierName || 'Cashier'}
                  </div>
                  <div className="text-xs text-slate-400">{c.orderCount} orders processed</div>
                </div>
                <div className="font-black text-emerald-400 text-sm">
                  {sym}{(c.totalRevenue || 0).toFixed(2)}
                </div>
              </div>
            ))}

            {byCashier.length === 0 && (
              <p className="text-center py-8 text-slate-500 text-xs">No cashier shift data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
