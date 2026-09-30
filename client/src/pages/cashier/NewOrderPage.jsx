import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Send,
  Utensils,
  CheckCircle2,
} from 'lucide-react';
import ReceiptModal from '../../components/ReceiptModal';
import Modal from '../../components/Modal';

export default function NewOrderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [settings, setSettings] = useState({
    currencySymbol: '$',
    allowCashierDiscount: true,
    maxCashierDiscount: 20,
  });

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [selectedTable, setSelectedTable] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percent');
  const [notes, setNotes] = useState('');

  // Payment states
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load data
  const loadData = () => {
    api.get('/menu?available=true').then((r) => setMenuItems(r.data)).catch(() => {});
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
    api.get('/tables').then((r) => {
      setTables(r.data);
      // Preselect table from query param if available
      const queryTable = searchParams.get('tableId');
      if (queryTable) {
        setSelectedTable(queryTable);
        setOrderType('dine-in');
      }
    }).catch(() => {});
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const sym = settings.currencySymbol || '$';

  const filteredItems = menuItems.filter(
    (item) =>
      (!filterCat || item.category?._id === filterCat) &&
      (!search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (item) => {
    if (item.stock === 0) {
      toast.error('Item is out of stock');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((c) => c.menuItem === item._id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          toast.error(`Only ${item.stock} in stock`);
          return prev;
        }
        return prev.map((c) =>
          c.menuItem === item._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        { menuItem: item._id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    const item = menuItems.find((m) => m._id === id);
    if (item && qty > item.stock) {
      toast.error(`Only ${item.stock} in stock`);
      return;
    }
    setCartItems((prev) =>
      prev.map((c) => (c.menuItem === id ? { ...c, quantity: qty } : c))
    );
  };

  const removeFromCart = (id) =>
    setCartItems((prev) => prev.filter((c) => c.menuItem !== id));

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setNotes('');
    setSelectedTable('');
  };

  const subtotal = cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const maxDisc = settings.maxCashierDiscount || 20;
  const safeDiscount = Math.min(discount || 0, discountType === 'percent' ? maxDisc : subtotal);
  const discountAmt =
    discountType === 'percent'
      ? (subtotal * safeDiscount) / 100
      : Math.min(safeDiscount, subtotal);
  const total = Math.max(0, subtotal - discountAmt);
  const change = amountPaid ? Math.max(0, Number(amountPaid) - total) : 0;

  // 1. Hold / Send to Table (Pending order)
  const handleHoldOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty! Please click menu items on the left to add them.');
      return;
    }
    if (orderType === 'dine-in' && !selectedTable) {
      toast.error('Please select a dining table for this Dine-In order');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        type: orderType,
        table: orderType === 'dine-in' ? selectedTable : null,
        items: cartItems,
        discount: safeDiscount,
        discountType,
        notes,
      });

      toast.success(`Order #${res.data.orderNumber} sent to kitchen/table!`);
      clearCart();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Open instant pay modal
  const handleOpenPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty! Please click menu items on the left to add them.');
      return;
    }
    if (orderType === 'dine-in' && !selectedTable) {
      toast.error('Please select a dining table for this Dine-In order');
      return;
    }
    setAmountPaid(total.toFixed(2));
    setPayModalOpen(true);
  };

  // 3. Process Instant Payment
  const handleCompletePayment = async () => {
    if (!amountPaid || Number(amountPaid) < total) {
      toast.error('Insufficient payment amount');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create order
      const orderRes = await api.post('/orders', {
        type: orderType,
        table: orderType === 'dine-in' ? selectedTable : null,
        items: cartItems,
        discount: safeDiscount,
        discountType,
        notes,
      });

      // 2. Complete order with payment
      const completeRes = await api.post(`/orders/${orderRes.data._id}/complete`, {
        amountPaid: Number(amountPaid),
      });

      setReceipt({
        order: completeRes.data.order,
        change: completeRes.data.change,
        amountPaid: Number(amountPaid),
        settings,
      });

      setPayModalOpen(false);
      clearCart();
      toast.success('Order completed and paid!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing payment');
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [
    total,
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
    Math.ceil(total / 50) * 50,
    100,
  ].filter((v, i, arr) => v >= total && arr.indexOf(v) === i);

  return (
    <div className="flex flex-col xl:flex-row gap-5 h-[calc(100vh-6.5rem)] min-h-[600px]">
      {/* Left: Menu Items Catalog */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B132B]/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        {/* Top Controls: Search and Category Tabs */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search food, beverages, snacks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Showing <span className="text-emerald-400 font-bold">{filteredItems.length}</span> items
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setFilterCat('')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                !filterCat
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700'
              }`}
            >
              <span>🍽️</span> All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setFilterCat(cat._id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                  filterCat === cat._id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700'
                }`}
              >
                <span>{cat.icon || '🍽️'}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredItems.map((item) => {
              const inCart = cartItems.find((c) => c.menuItem === item._id);
              const isOutOfStock = item.stock === 0;

              return (
                <button
                  key={item._id}
                  onClick={() => addToCart(item)}
                  disabled={isOutOfStock}
                  className={`relative text-left p-3.5 rounded-2xl border transition-all duration-150 flex flex-col justify-between group ${
                    inCart
                      ? 'border-emerald-500/80 bg-emerald-950/30 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60'
                  } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                >
                  {/* Cart Quantity Badge */}
                  {inCart && (
                    <span className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-in zoom-in-50">
                      {inCart.quantity}
                    </span>
                  )}

                  <div>
                    <div className="text-3xl mb-2 filter drop-shadow">
                      {item.category?.icon || '🍽️'}
                    </div>
                    <div className="font-semibold text-sm text-white leading-tight mb-1 line-clamp-2">
                      {item.name}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-emerald-400 font-bold text-sm tracking-tight">
                      {sym}{item.price.toFixed(2)}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[10px] text-red-400 font-medium">Out</span>
                    ) : item.stock <= (settings.lowStockThreshold || 5) ? (
                      <span className="text-[10px] text-amber-400 font-medium">
                        {item.stock} left
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-500">
                <Utensils size={40} className="mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-base font-medium text-slate-400">No menu items found</p>
                <p className="text-xs text-slate-500 mt-1">Try another category or search term</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Order Cart & Checkout Station */}
      <div className="w-full xl:w-[420px] flex-shrink-0 flex flex-col bg-[#0B132B]/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Current Order</h2>
              <div className="text-[11px] text-slate-400">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} item(s) in cart
              </div>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} /> Clear
            </button>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden space-y-3">
          {/* Order Type Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            {['dine-in', 'takeaway', 'delivery'].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${
                  orderType === type
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Table Selector for Dine-In */}
          {orderType === 'dine-in' && (
            <div className="flex-shrink-0">
              <select
                className="input-field text-xs py-2"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                <option value="">-- Select Dining Table --</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Table {t.number} {t.name ? `(${t.name})` : ''} - {t.capacity} seats [{t.status}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
            {cartItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center h-full">
                <ShoppingCart size={36} className="mb-2 opacity-30 text-slate-400" />
                <p className="text-sm font-medium text-slate-400">Cart is empty</p>
                <p className="text-xs text-slate-500 mt-0.5">Click items to add to this order</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.menuItem}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-xs font-semibold text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                      {sym}{(item.price * item.quantity).toFixed(2)}
                      <span className="text-slate-500 font-normal ml-1">
                        ({sym}{item.price.toFixed(2)} ea)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateQty(item.menuItem, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.menuItem, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.menuItem)}
                      className="w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 flex items-center justify-center ml-0.5 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notes & Discount */}
          <div className="space-y-2 pt-2 border-t border-slate-800 flex-shrink-0">
            <input
              type="text"
              className="input-field text-xs py-2"
              placeholder="Order notes (e.g., Less spicy, no onions)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {settings.allowCashierDiscount && (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
                <span className="text-xs font-semibold text-slate-400 pl-1.5 whitespace-nowrap">
                  Discount:
                </span>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percent' ? maxDisc : subtotal}
                  className="bg-transparent text-slate-100 text-xs py-1 px-1 flex-1 focus:outline-none placeholder-slate-500 font-bold"
                  placeholder={`0 (Max ${discountType === 'percent' ? `${maxDisc}%` : `${sym}${subtotal.toFixed(2)}`})`}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                />
                <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      discountType === 'percent'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      discountType === 'fixed'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sym}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Totals Summary */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs flex-shrink-0">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{sym}{subtotal.toFixed(2)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Discount</span>
                <span>-{sym}{discountAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800/80">
              <span>Total Payable</span>
              <span className="text-emerald-400 text-base">{sym}{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Dual POS Actions: Hold / Send to Table OR Instant Pay */}
          <div className="grid grid-cols-2 gap-2 pt-1 flex-shrink-0">
            <button
              onClick={handleHoldOrder}
              disabled={submitting}
              className={`text-xs font-semibold py-3 flex items-center justify-center gap-1.5 rounded-xl transition-all ${
                cartItems.length > 0
                  ? 'btn-secondary shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Send size={15} className="text-cyan-400" />
              <span>Hold / Table</span>
            </button>

            <button
              onClick={handleOpenPayment}
              disabled={submitting}
              className={`text-xs font-bold py-3 flex items-center justify-center gap-1.5 rounded-xl transition-all ${
                cartItems.length > 0
                  ? 'btn-primary shadow-lg shadow-emerald-950/60 animate-pulse'
                  : 'bg-emerald-800/50 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/40'
              }`}
            >
              <CreditCard size={15} />
              <span>Pay & Print {cartItems.length > 0 ? `(${sym}${total.toFixed(2)})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Complete Payment & Settle Bill"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {/* Total Due Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Total Amount Due
            </p>
            <p className="text-3xl font-black text-white mt-1">
              {sym}{total.toFixed(2)}
            </p>
          </div>

          {/* Amount Paid Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Cash Received Amount ({sym})
            </label>
            <input
              type="number"
              step="0.01"
              min={total}
              className="input-field text-2xl text-center font-black text-emerald-400 py-3"
              placeholder="0.00"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              autoFocus
            />
          </div>

          {/* Quick Cash Buttons */}
          <div>
            <div className="text-[11px] text-slate-400 mb-1.5 font-medium">
              Quick Tender:
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
          </div>

          {/* Change Banner */}
          {amountPaid && Number(amountPaid) >= total && (
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

          {/* Submit Button */}
          <button
            onClick={handleCompletePayment}
            disabled={submitting || !amountPaid || Number(amountPaid) < total}
            className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2"
          >
            <CreditCard size={18} />
            <span>{submitting ? 'Processing...' : 'Complete & Generate Receipt'}</span>
          </button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}
