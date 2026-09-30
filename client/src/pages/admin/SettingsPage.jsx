import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Save,
  Download,
  Upload,
  Sparkles,
  Settings as SettingsIcon,
  Database,
  Building,
  DollarSign,
  Receipt,
  Shield,
} from 'lucide-react';

export default function SettingsPage() {
  const [form, setForm] = useState({
    restaurantName: 'Gourmet RestoPOS',
    address: '123 Main Street',
    phone: '+1 (555) 019-2834',
    email: 'admin@restopos.local',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 0,
    receiptFooter: 'Thank you for dining with us! Please come again.',
    allowCashierDiscount: true,
    maxCashierDiscount: 20,
    lowStockThreshold: 5,
  });
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/settings').then((r) => setForm(r.data)).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings', form);
      toast.success('Settings updated successfully!');
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      const [settings, users, categories, menu, tables, orders] =
        await Promise.all([
          api.get('/settings'),
          api.get('/users'),
          api.get('/categories'),
          api.get('/menu'),
          api.get('/tables'),
          api.get('/orders'),
        ]);
      const backup = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        settings: settings.data,
        users: users.data,
        categories: categories.data,
        menu: menu.data,
        tables: tables.data,
        orders: orders.data,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restopos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Offline backup file downloaded!');
    } catch (err) {
      toast.error('Backup creation failed');
    }
  };

  const handleFileRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        if (
          !confirm(
            'Restoring will overwrite current menu, categories, and tables. Continue?'
          )
        ) {
          e.target.value = '';
          return;
        }
        await api.post('/settings/restore', backupData);
        toast.success('Database restored successfully from file!');
        const res = await api.get('/settings');
        setForm(res.data);
      } catch (err) {
        toast.error(
          'Restore error: ' + (err.response?.data?.message || err.message)
        );
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSeedSample = async () => {
    if (
      !confirm(
        'Load realistic sample menu items, categories, tables, and cashier account?'
      )
    )
      return;
    setSeeding(true);
    try {
      const res = await api.post('/settings/seed-sample');
      toast.success(res.data.message || 'Sample database data loaded!');
      const s = await api.get('/settings');
      setForm(s.data);
    } catch (err) {
      toast.error('Seed error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              System Settings & Backup
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Configure restaurant information, currency, receipts, and offline database backup
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedSample}
          disabled={seeding}
          className="btn-secondary text-xs"
        >
          <Sparkles size={14} className="text-amber-400" />
          <span>{seeding ? 'Loading Sample...' : 'Load Sample Demo Data'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Restaurant Profile */}
          <div className="card border border-slate-800 bg-[#0B132B]/80 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building size={18} className="text-emerald-400" />
              <span>Restaurant Profile</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Restaurant Name
              </label>
              <input
                type="text"
                className="input-field"
                value={form.restaurantName}
                onChange={(e) =>
                  setForm({ ...form, restaurantName: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Address
              </label>
              <input
                type="text"
                className="input-field"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          {/* POS & Financials */}
          <div className="card border border-slate-800 bg-[#0B132B]/80 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <DollarSign size={18} className="text-emerald-400" />
              <span>POS & Financials</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="$"
                  value={form.currencySymbol}
                  onChange={(e) =>
                    setForm({ ...form, currencySymbol: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field"
                  value={form.taxRate}
                  onChange={(e) =>
                    setForm({ ...form, taxRate: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Max Cashier Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={form.maxCashierDiscount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxCashierDiscount: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lowStockThreshold: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Receipt Footer Message
              </label>
              <input
                type="text"
                className="input-field"
                value={form.receiptFooter}
                onChange={(e) =>
                  setForm({ ...form, receiptFooter: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Database Backup & Restore Section */}
        <div className="card border border-slate-800 bg-[#0B132B]/80 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database size={18} className="text-emerald-400" />
            <span>Offline Backup & Restore</span>
          </h2>

          <p className="text-xs text-slate-400">
            Export complete MongoDB restaurant database (Menu, Categories, Tables, Orders, Users, Settings) to an offline JSON file, or restore from a previous backup.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleBackup}
              className="btn-secondary text-xs py-2.5 px-4"
            >
              <Download size={15} className="text-emerald-400" />
              <span>Download Offline Backup (.json)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs py-2.5 px-4"
            >
              <Upload size={15} className="text-cyan-400" />
              <span>Restore from Backup File</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-3 px-8 text-sm font-bold shadow-xl shadow-emerald-950/60"
          >
            <Save size={16} />
            <span>{loading ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
