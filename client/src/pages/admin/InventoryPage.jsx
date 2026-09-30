import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';
import { AlertTriangle, Package, History, TrendingDown, TrendingUp } from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('items');
  const [settings, setSettings] = useState({ currencySymbol: '$' });

  useEffect(() => {
    api.get('/menu').then((r) => setItems(r.data)).catch(() => {});
    api.get('/inventory/low-stock').then((r) => setLowStock(r.data)).catch(() => {});
    api.get('/inventory/logs').then((r) => setLogs(r.data)).catch(() => {});
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Package size={24} className="text-emerald-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Inventory & Stock Tracking
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Monitor real-time inventory levels, restock alerts, and transaction audit trails
        </p>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStock.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 shadow-xl">
          <div className="flex items-center gap-2 text-red-400 font-bold mb-2 text-sm">
            <AlertTriangle size={18} />
            <span>{lowStock.length} Item(s) Below Minimum Stock Threshold</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <span
                key={item._id}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-900/60 text-red-200 border border-red-700/50"
              >
                {item.name}: <strong className="text-white">{item.stock} left</strong> (min {item.lowStockThreshold || 5})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        {[
          ['items', 'Current Stock Levels'],
          ['logs', 'Inventory Audit Logs'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              tab === key
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">ITEM</th>
                  <th className="py-4 px-5">CATEGORY</th>
                  <th className="py-4 px-5">CURRENT STOCK</th>
                  <th className="py-4 px-5">MIN THRESHOLD</th>
                  <th className="py-4 px-5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {items.map((item) => {
                  const isLow = item.stock <= (item.lowStockThreshold || 5);
                  const isOut = item.stock === 0;

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-white">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-5 text-slate-300 text-xs">
                        {item.category?.name || '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`font-black text-base ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 text-xs">
                        {item.lowStockThreshold || 5} units
                      </td>
                      <td className="py-3.5 px-5">
                        {isOut ? (
                          <span className="badge-red">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge-yellow">Low Stock</span>
                        ) : (
                          <span className="badge-green">In Stock</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">DATE & TIME</th>
                  <th className="py-4 px-5">ITEM</th>
                  <th className="py-4 px-5">TYPE</th>
                  <th className="py-4 px-5">QUANTITY</th>
                  <th className="py-4 px-5">STOCK CHANGE</th>
                  <th className="py-4 px-5">REASON / ORDER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 text-slate-400 text-xs">
                      {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-white">
                      {log.itemName || log.menuItem?.name || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.changeType === 'add'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-950/80 text-red-400 border border-red-500/30'
                      }`}>
                        {log.changeType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-white">
                      {log.quantity}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-300">
                      {log.previousStock} → <strong className="text-white">{log.newStock}</strong>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 text-xs">
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No stock log events recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
