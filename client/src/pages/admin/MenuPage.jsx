import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  UtensilsCrossed,
  Layers,
  Sparkles,
} from 'lucide-react';
import Modal from '../../components/Modal';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  price: '',
  stock: '',
  available: true,
  lowStockThreshold: 5,
};

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stockItem, setStockItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [stockForm, setStockForm] = useState({
    changeType: 'add',
    quantity: '',
    reason: '',
  });
  const [settings, setSettings] = useState({ currencySymbol: '$' });

  const fetchItems = () => {
    const params = {};
    if (filterCat) params.category = filterCat;
    if (search) params.search = search;
    api.get('/menu', { params }).then((r) => setItems(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchItems();
  }, [search, filterCat]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category?._id || '',
      description: item.description || '',
      price: item.price,
      stock: item.stock,
      available: item.available ?? true,
      lowStockThreshold: item.lowStockThreshold || 5,
    });
    setModalOpen(true);
  };

  const openStock = (item) => {
    setStockItem(item);
    setStockForm({ changeType: 'add', quantity: '', reason: '' });
    setStockModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
      };
      if (editing) await api.put(`/menu/${editing._id}`, payload);
      else await api.post('/menu', payload);
      toast.success(editing ? 'Item updated!' : 'Item created!');
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving menu item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Item deleted');
      fetchItems();
    } catch (err) {
      toast.error('Error deleting item');
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inventory/adjust`, {
        menuItemId: stockItem._id,
        changeType: stockForm.changeType,
        quantity: Number(stockForm.quantity),
        reason: stockForm.reason || 'Manual Adjustment',
      });
      toast.success('Stock adjusted successfully!');
      setStockModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating stock');
    }
  };

  const sym = settings.currencySymbol || '$';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Menu & Inventory Catalog
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage recipes, sales pricing, stock quantities, and product availability
          </p>
        </div>

        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} className="stroke-[2.5]" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search items by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-field !w-44 text-xs"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">ITEM</th>
                <th className="py-4 px-5">CATEGORY</th>
                <th className="py-4 px-5">PRICE</th>
                <th className="py-4 px-5">STOCK LEVEL</th>
                <th className="py-4 px-5">STATUS</th>
                <th className="py-4 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {items.map((item) => {
                const isLowStock = item.stock <= (item.lowStockThreshold || 5);
                const isOutOfStock = item.stock === 0;

                return (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.category?.icon || '🍽️'}</span>
                        <div>
                          <div className="font-semibold text-white">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-slate-400 line-clamp-1">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-slate-300 text-xs">
                      {item.category?.name || '—'}
                    </td>

                    <td className="py-3.5 px-5 font-black text-emerald-400">
                      {sym}{item.price.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                          {item.stock}
                        </span>
                        <button
                          onClick={() => openStock(item)}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          + Adjust
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      {item.available ? (
                        <span className="badge-green">Available</span>
                      ) : (
                        <span className="badge-red">Disabled</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No menu items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Menu Item' : 'Add New Menu Item'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Classic Bacon Cheeseburger"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Price ({sym})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="9.99"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="50"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Crisp lettuce, tomato, cheddar cheese..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
            <div>
              <div className="text-sm font-semibold text-white">Item Availability</div>
              <div className="text-xs text-slate-400">Available on POS terminals</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.available}
                onChange={(e) => setForm({ ...form, available: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-2.5">
              {editing ? 'Update Item' : 'Create Item'}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1 py-2.5"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`Adjust Stock: ${stockItem?.name}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleStockUpdate} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center">
            <span className="text-slate-400">Current Stock:</span>
            <span className="font-bold text-white text-sm">{stockItem?.stock} units</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Adjustment Type
            </label>
            <select
              className="input-field"
              value={stockForm.changeType}
              onChange={(e) => setStockForm({ ...stockForm, changeType: e.target.value })}
            >
              <option value="add">Add Units (+) Restock</option>
              <option value="reduce">Reduce Units (-) Waste/Spoilage</option>
              <option value="set">Set Exact Count (=)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              className="input-field"
              placeholder="e.g. 20"
              value={stockForm.quantity}
              onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Supplier delivery"
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-2.5">
              Save Adjustment
            </button>
            <button
              type="button"
              onClick={() => setStockModalOpen(false)}
              className="btn-secondary flex-1 py-2.5"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
