import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';
import { Search, Eye, Receipt, Printer, XCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import ReceiptModal from '../../components/ReceiptModal';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [settings, setSettings] = useState({ currencySymbol: '$' });

  const fetchOrders = () => {
    const params = {};
    if (filter) params.status = filter;
    api.get('/orders', { params }).then((r) => setOrders(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
  }, [filter]);

  const filtered = orders.filter(
    (o) =>
      !search ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.cashier?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      o.table?.number?.toString().includes(search)
  );

  const sym = settings.currencySymbol || '$';

  const handleCancelOrder = async (id) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
      if (viewOrder?._id === id) setViewOrder(null);
    } catch (err) {
      toast.error('Failed to cancel order');
    }
  };

  const handleReprintReceipt = (order) => {
    setReceipt({
      order,
      change: order.payment?.change || 0,
      amountPaid: order.payment?.amountPaid || order.total,
      settings,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              All Orders & History
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Browse and inspect customer orders across all cashiers and shifts
          </p>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
        {/* Search and Filters */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="input-field pl-10"
              placeholder="Search order #, cashier, table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-field !w-40 text-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">ORDER #</th>
                <th className="py-4 px-5">TYPE</th>
                <th className="py-4 px-5">TABLE</th>
                <th className="py-4 px-5">ITEMS</th>
                <th className="py-4 px-5">TOTAL</th>
                <th className="py-4 px-5">CASHIER</th>
                <th className="py-4 px-5">STATUS</th>
                <th className="py-4 px-5">TIME</th>
                <th className="py-4 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filtered.map((order) => (
                <tr key={order._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-white">
                    {order.orderNumber}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="badge-blue capitalize text-xs">
                      {order.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-300">
                    {order.table ? `Table ${order.table.number}` : '—'}
                  </td>
                  <td className="py-3.5 px-5 text-slate-300">
                    {order.items?.length || 0}
                  </td>
                  <td className="py-3.5 px-5 font-black text-emerald-400">
                    {sym}{order.total.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-5 text-slate-300 text-xs">
                    {order.cashier?.fullName || '—'}
                  </td>
                  <td className="py-3.5 px-5">
                    {order.status === 'completed' && <span className="badge-green">Completed</span>}
                    {order.status === 'pending' && <span className="badge-yellow">Pending</span>}
                    {order.status === 'cancelled' && <span className="badge-red">Cancelled</span>}
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 text-xs">
                    {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status === 'completed' && (
                        <button
                          onClick={() => handleReprintReceipt(order)}
                          title="Print Receipt"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Printer size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => setViewOrder(order)}
                        title="View Details"
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <Modal
        open={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={`Order Details: ${viewOrder?.orderNumber}`}
        maxWidth="max-w-lg"
      >
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Type:</span>{' '}
                <span className="font-semibold text-white capitalize">{viewOrder.type}</span>
              </div>
              <div>
                <span className="text-slate-400">Table:</span>{' '}
                <span className="font-semibold text-white">
                  {viewOrder.table ? `Table ${viewOrder.table.number}` : 'Takeaway'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Cashier:</span>{' '}
                <span className="font-semibold text-white">{viewOrder.cashier?.fullName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>{' '}
                <span className="font-semibold text-emerald-400 capitalize">{viewOrder.status}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <th className="p-2.5 text-left">Item</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-white">{item.name}</td>
                      <td className="p-2.5 text-center text-slate-300">{item.quantity}</td>
                      <td className="p-2.5 text-right text-slate-400">{sym}{item.price.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">
                        {sym}{(item.subtotal || item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{sym}{viewOrder.subtotal?.toFixed(2)}</span>
              </div>
              {viewOrder.discount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Discount</span>
                  <span>-{sym}{viewOrder.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                <span>Total</span>
                <span className="text-emerald-400">{sym}{viewOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleReprintReceipt(viewOrder)}
                className="btn-secondary flex-1 py-2.5"
              >
                <Printer size={15} /> Print Receipt
              </button>
              {viewOrder.status === 'pending' && (
                <button
                  onClick={() => handleCancelOrder(viewOrder._id)}
                  className="btn-danger flex-1 py-2.5"
                >
                  <XCircle size={15} /> Cancel Order
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}
