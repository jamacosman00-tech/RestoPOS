import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Search,
  Eye,
  CreditCard,
  XCircle,
  Printer,
  CheckCircle2,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import Modal from '../../components/Modal';
import ReceiptModal from '../../components/ReceiptModal';

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [payOrder, setPayOrder] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [settings, setSettings] = useState({ currencySymbol: '$' });
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = () => {
    const params = {};
    if (filter) params.status = filter;
    api
      .get('/orders', { params })
      .then((r) => setOrders(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
  }, [filter]);

  const sym = settings.currencySymbol || '$';

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    return (
      !search ||
      o.orderNumber?.toLowerCase().includes(term) ||
      o.table?.number?.toString().includes(term) ||
      o.type?.toLowerCase().includes(term) ||
      o.cashier?.fullName?.toLowerCase().includes(term)
    );
  });

  const handleOpenPay = (order) => {
    setPayOrder(order);
    setAmountPaid(order.total.toFixed(2));
  };

  const handleCompletePayment = async () => {
    if (!amountPaid || Number(amountPaid) < payOrder.total) {
      toast.error('Insufficient payment amount');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/orders/${payOrder._id}/complete`, {
        amountPaid: Number(amountPaid),
      });
      toast.success('Order completed successfully!');
      setReceipt({
        order: res.data.order,
        change: res.data.change,
        amountPaid: Number(amountPaid),
        settings,
      });
      setPayOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
      if (viewOrder?._id === orderId) setViewOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
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

  const change =
    amountPaid && payOrder ? Math.max(0, Number(amountPaid) - payOrder.total) : 0;
  const quickAmounts = payOrder
    ? [
        payOrder.total,
        Math.ceil(payOrder.total / 5) * 5,
        Math.ceil(payOrder.total / 10) * 10,
        Math.ceil(payOrder.total / 20) * 20,
        Math.ceil(payOrder.total / 50) * 50,
      ].filter((v, i, arr) => v >= payOrder.total && arr.indexOf(v) === i)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptIcon size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Order History & Bills
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Review active tables, process pending bills, and reprint customer receipts
          </p>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
        {/* Search & Filter */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="input-field pl-10"
              placeholder="Search by order #, table, cashier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-field !w-40 text-xs"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Orders</option>
            <option value="pending">Pending Orders</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">ORDER #</th>
                <th className="py-4 px-5">TYPE</th>
                <th className="py-4 px-5">TABLE</th>
                <th className="py-4 px-5">ITEMS</th>
                <th className="py-4 px-5">TOTAL</th>
                <th className="py-4 px-5">STATUS</th>
                <th className="py-4 px-5">TIME</th>
                <th className="py-4 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredOrders.map((order) => {
                const isPending = order.status === 'pending';
                const isCompleted = order.status === 'completed';

                return (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-white">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="badge-blue capitalize text-xs">
                        {order.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      {order.table ? (
                        <span className="font-semibold text-emerald-400">
                          Table {order.table.number}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      {order.items?.length || 0} item(s)
                    </td>
                    <td className="py-3.5 px-5 font-black text-emerald-400">
                      {sym}{order.total.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5">
                      {order.status === 'completed' && (
                        <span className="badge-green">Completed</span>
                      )}
                      {order.status === 'pending' && (
                        <span className="badge-yellow">Pending</span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="badge-red">Cancelled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 text-xs">
                      {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && (
                          <button
                            onClick={() => handleOpenPay(order)}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            <CreditCard size={13} /> Settle Bill
                          </button>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => handleReprintReceipt(order)}
                            title="Reprint Receipt"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Printer size={16} />
                          </button>
                        )}

                        <button
                          onClick={() => setViewOrder(order)}
                          title="View Order Details"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        {isPending && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            title="Cancel Order"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <ReceiptIcon size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-base font-medium text-slate-400">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Order Modal */}
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

            {/* Items table */}
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

            {/* Order Financials */}
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

            {viewOrder.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setViewOrder(null);
                    handleOpenPay(viewOrder);
                  }}
                  className="btn-primary flex-1 py-2.5"
                >
                  <CreditCard size={16} /> Settle Bill
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        open={!!payOrder}
        onClose={() => setPayOrder(null)}
        title={`Settle Bill: ${payOrder?.orderNumber}`}
        maxWidth="max-w-md"
      >
        {payOrder && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center">
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                Total Amount Due
              </p>
              <p className="text-3xl font-black text-white mt-1">
                {sym}{payOrder.total.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount Received ({sym})
              </label>
              <input
                type="number"
                step="0.01"
                min={payOrder.total}
                className="input-field text-2xl text-center font-black text-emerald-400 py-3"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.slice(0, 6).map((amt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAmountPaid(amt.toFixed(2))}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  {sym}{amt.toFixed(amt % 1 === 0 ? 0 : 2)}
                </button>
              ))}
            </div>

            {amountPaid && Number(amountPaid) >= payOrder.total && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Change Due</p>
                  <p className="text-2xl font-extrabold text-cyan-400">
                    {sym}{change.toFixed(2)}
                  </p>
                </div>
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
            )}

            <button
              onClick={handleCompletePayment}
              disabled={submitting || !amountPaid || Number(amountPaid) < payOrder.total}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              <CreditCard size={18} />
              <span>{submitting ? 'Processing...' : 'Complete Payment & Print'}</span>
            </button>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}
