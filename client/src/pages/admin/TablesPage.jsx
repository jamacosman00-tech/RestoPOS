import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Grid3X3, Users, ShoppingCart, CheckCircle, ArrowRight } from 'lucide-react';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { number: '', name: '', capacity: 4 };

export default function TablesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const isAdmin = user?.role === 'admin';

  const fetchTables = () => {
    api.get('/tables').then((r) => setTables(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ number: t.number, name: t.name || '', capacity: t.capacity });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        number: Number(form.number),
        capacity: Number(form.capacity),
      };
      if (editing) await api.put(`/tables/${editing._id}`, payload);
      else await api.post('/tables', payload);
      toast.success(editing ? 'Table updated!' : 'Table created!');
      setModalOpen(false);
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving table');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success('Table deleted');
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting table');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/tables/${id}/status`, { status });
      fetchTables();
      toast.success(`Table marked as ${status}`);
    } catch (err) {
      toast.error('Error changing status');
    }
  };

  const handleOpenOrder = (table) => {
    const basePath = isAdmin ? '/admin/pos' : '/cashier/pos';
    navigate(`${basePath}?tableId=${table._id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Grid3X3 size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Restaurant Table Floor
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time floor layout, table seating capacity, and active dining orders
          </p>
        </div>

        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={18} className="stroke-[2.5]" />
            <span>Add Table</span>
          </button>
        )}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const isAvailable = table.status === 'available';
          const isOccupied = table.status === 'occupied';
          const isReserved = table.status === 'reserved';

          return (
            <div
              key={table._id}
              className={`card p-5 border flex flex-col justify-between transition-all duration-200 ${
                isAvailable
                  ? 'border-emerald-500/40 bg-[#0B132B]/80 hover:border-emerald-500/70 hover:shadow-emerald-950/40'
                  : isOccupied
                  ? 'border-red-500/40 bg-red-950/20 hover:border-red-500/70'
                  : 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">
                      Table {table.number}
                    </h3>
                    {table.name && (
                      <p className="text-xs text-slate-400 font-medium">{table.name}</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  {isAvailable && (
                    <span className="badge-green">Available</span>
                  )}
                  {isOccupied && (
                    <span className="badge-red">Occupied</span>
                  )}
                  {isReserved && (
                    <span className="badge-yellow">Reserved</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <Users size={14} className="text-slate-500" />
                  <span>Seating Capacity: <strong className="text-slate-200">{table.capacity}</strong> persons</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenOrder(table)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isAvailable
                        ? 'btn-primary'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <ShoppingCart size={13} />
                    <span>{isAvailable ? 'Take Order' : 'Manage Order'}</span>
                  </button>

                  <select
                    className="bg-slate-900 border border-slate-700 rounded-xl text-[11px] text-slate-300 px-2 py-2 focus:outline-none"
                    value={table.status}
                    onChange={(e) => handleStatusChange(table._id, e.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>

                {isAdmin && (
                  <div className="flex justify-end gap-1 pt-1">
                    <button
                      onClick={() => openEdit(table)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="Edit Table"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(table._id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Table"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {tables.length === 0 && (
          <div className="col-span-full text-center py-16 card">
            <Grid3X3 size={40} className="mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-base font-medium text-slate-400">No dining tables configured</p>
            {isAdmin && (
              <button onClick={openAdd} className="btn-primary mx-auto mt-4 text-xs">
                + Create Table
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Table Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Table ${editing.number}` : 'Add New Table'}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Table Number
            </label>
            <input
              type="number"
              min="1"
              className="input-field"
              placeholder="e.g. 1"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Table Name / Location
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Patio Booth, Window View"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Seating Capacity
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="input-field"
              placeholder="4"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-2.5">
              {editing ? 'Update Table' : 'Add Table'}
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
    </div>
  );
}
