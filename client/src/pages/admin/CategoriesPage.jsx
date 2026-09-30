import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import Modal from '../../components/Modal';

const emptyForm = { name: '', description: '', icon: '🍽️' };
const ICONS = ['🍽️', '🍕', '🍔', '🍜', '🍣', '🥗', '🍰', '☕', '🥤', '🍺', '🥩', '🌮', '🍱', '🍦', '🧃', '🥪', '🍟', '🍩', '🥐', '🍲'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCategories = () => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '', icon: c.icon || '🍽️' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/categories/${editing._id}`, form);
      else await api.post('/categories', form);
      toast.success(editing ? 'Category updated!' : 'Category created!');
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Menu Categories
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Organize food and beverage offerings into intuitive ordering groups
          </p>
        </div>

        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} className="stroke-[2.5]" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="card p-5 border border-slate-800 bg-[#0B132B]/80 hover:border-slate-700 hover:bg-slate-900 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl filter drop-shadow">{cat.icon || '🍽️'}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{cat.name}</h3>
              {cat.description && (
                <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
              )}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-16 card">
            <Tag size={40} className="mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-base font-medium text-slate-400">No categories found</p>
            <button onClick={openAdd} className="btn-primary mx-auto mt-4 text-xs">
              + Create Category
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add New Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Burgers & Wraps"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Fresh handmade patties"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Icon
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    form.icon === icon
                      ? 'bg-emerald-600/40 border border-emerald-500 scale-110'
                      : 'hover:bg-slate-800'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-2.5">
              {editing ? 'Update Category' : 'Create Category'}
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
