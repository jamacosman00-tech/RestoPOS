import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
  Search,
  Users as UsersIcon,
  Crown,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  username: '',
  password: '',
  fullName: '',
  role: 'cashier',
  active: true,
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  // Reset Password Modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setUserForm(emptyForm);
    setShowPassword(false);
    setUserModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      active: u.active ?? true,
      password: '',
    });
    setShowPassword(false);
    setUserModalOpen(true);
  };

  const openResetModal = (u) => {
    setResetTargetUser(u);
    setNewPassword('');
    setShowResetPassword(false);
    setResetModalOpen(true);
  };

  const generateRandomPassword = (targetSetter) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    targetSetter(pwd);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...userForm };
      if (editingUser && !payload.password) {
        delete payload.password;
      }
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, payload);
        toast.success('User updated successfully!');
      } else {
        await api.post('/users', payload);
        toast.success('New user account created!');
      }
      setUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast.error('Password must be at least 4 characters long');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/users/${resetTargetUser._id}/reset-password`, {
        password: newPassword,
      });
      toast.success(`Password updated for @${resetTargetUser.username}!`);
      setResetModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user._id === currentUser?.id) {
      toast.error('You cannot deactivate your own active session');
      return;
    }
    try {
      await api.patch(`/users/${user._id}/toggle`);
      toast.success(`Account ${user.active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user._id === currentUser?.id) {
      toast.error('You cannot delete your own active account');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete user "${user.fullName}" (@${user.username})?`)) {
      return;
    }
    try {
      await api.delete(`/users/${user._id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'active' ? u.active : !u.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <UsersIcon size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">
              Staff & Cashier Accounts
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage system access, create cashiers, assign permissions, and reset credentials
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} className="stroke-[2.5]" />
          <span>Add Cashier / User</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card !p-0 overflow-hidden border border-slate-800 bg-[#0B132B]/80 shadow-2xl backdrop-blur-md">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search by name or @username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="input-field !w-36 text-xs"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
            </select>

            <select
              className="input-field !w-36 text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table matching screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">USER</th>
                <th className="py-4 px-5">USERNAME</th>
                <th className="py-4 px-5">ROLE</th>
                <th className="py-4 px-5">ACCOUNT STATUS</th>
                <th className="py-4 px-5">LAST LOGIN</th>
                <th className="py-4 px-5">CREATED DATE</th>
                <th className="py-4 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredUsers.map((u) => {
                const isCurrent = u._id === currentUser?.id || u.username === currentUser?.username;
                const isAdmin = u.role === 'admin';
                const initial = u.fullName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || 'U';

                return (
                  <tr
                    key={u._id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* USER Column */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md flex-shrink-0 ${
                            isAdmin
                              ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 border border-amber-400/40'
                              : 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 border border-blue-400/40'
                          }`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                            <span>{u.fullName}</span>
                            {isCurrent && (
                              <span className="text-emerald-400 text-xs font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* USERNAME Column */}
                    <td className="py-3.5 px-5">
                      <span className="text-slate-400 font-mono text-xs">
                        @{u.username}
                      </span>
                    </td>

                    {/* ROLE Column */}
                    <td className="py-3.5 px-5">
                      {isAdmin ? (
                        <span className="badge-admin">
                          <Crown size={12} className="text-amber-400" /> Admin
                        </span>
                      ) : (
                        <span className="badge-cashier">
                          <Shield size={12} className="text-blue-400" /> Cashier
                        </span>
                      )}
                    </td>

                    {/* ACCOUNT STATUS Column */}
                    <td className="py-3.5 px-5">
                      {u.active ? (
                        <span className="badge-active">
                          <CheckCircle2 size={12} className="text-emerald-400" /> Active
                        </span>
                      ) : (
                        <span className="badge-inactive">
                          <XCircle size={12} className="text-red-400" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* LAST LOGIN Column */}
                    <td className="py-3.5 px-5 text-slate-300 text-xs">
                      {u.lastLogin ? (
                        format(new Date(u.lastLogin), 'MMM d, hh:mm a')
                      ) : (
                        <span className="text-slate-500 italic">Never</span>
                      )}
                    </td>

                    {/* CREATED DATE Column */}
                    <td className="py-3.5 px-5 text-slate-400 text-xs">
                      {u.createdAt ? format(new Date(u.createdAt), 'M/d/yyyy') : '—'}
                    </td>

                    {/* ACTIONS Column */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reset Password Key Button */}
                        <button
                          onClick={() => openResetModal(u)}
                          title="Reset Password"
                          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/30"
                        >
                          <KeyRound size={16} />
                        </button>

                        {/* Edit User Button */}
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Toggle Active/Inactive */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isCurrent}
                          title={u.active ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                            isCurrent
                              ? 'opacity-30 cursor-not-allowed text-slate-600'
                              : u.active
                              ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30'
                              : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                          }`}
                        >
                          {u.active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={isCurrent}
                          title={isCurrent ? 'Cannot delete yourself' : 'Delete User'}
                          className={`p-1.5 rounded-lg transition-colors border border-transparent ${
                            isCurrent
                              ? 'opacity-30 cursor-not-allowed text-slate-600'
                              : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <UsersIcon size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-base font-medium text-slate-400">No accounts found</p>
                    <p className="text-xs text-slate-500 mt-0.5">Try adjusting your search or role filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? `Edit Account: @${editingUser.username}` : 'Add New Cashier / User'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Sarah Connor"
              value={userForm.fullName}
              onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono">
                @
              </span>
              <input
                type="text"
                className="input-field pl-8 font-mono"
                placeholder="cashier1"
                value={userForm.username}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              </label>
              {!editingUser && (
                <button
                  type="button"
                  onClick={() =>
                    generateRandomPassword((pwd) => setUserForm({ ...userForm, password: pwd }))
                  }
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Sparkles size={12} /> Auto-generate
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder={editingUser ? '••••••••' : 'Enter account password'}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                required={!editingUser}
                minLength={4}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Access Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  userForm.role === 'cashier'
                    ? 'border-blue-500/80 bg-blue-950/40 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="cashier"
                  checked={userForm.role === 'cashier'}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="hidden"
                />
                <Shield size={18} className={userForm.role === 'cashier' ? 'text-blue-400' : 'text-slate-500'} />
                <div>
                  <div className="font-semibold text-sm">Cashier</div>
                  <div className="text-[11px] text-slate-400">POS & orders</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  userForm.role === 'admin'
                    ? 'border-amber-500/80 bg-amber-950/40 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={userForm.role === 'admin'}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="hidden"
                />
                <Crown size={18} className={userForm.role === 'admin' ? 'text-amber-400' : 'text-slate-500'} />
                <div>
                  <div className="font-semibold text-sm">Admin</div>
                  <div className="text-[11px] text-slate-400">Full system access</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60">
            <div>
              <div className="text-sm font-semibold text-white">Account Status</div>
              <div className="text-xs text-slate-400">Allow user to sign in to system</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={userForm.active}
                onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-2.5"
            >
              {loading ? 'Saving...' : editingUser ? 'Update Account' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => setUserModalOpen(false)}
              className="btn-secondary flex-1 py-2.5"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Reset Password: @${resetTargetUser?.username}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <KeyRound size={20} />
            </div>
            <div>
              <div className="font-semibold text-white">{resetTargetUser?.fullName}</div>
              <div className="text-xs text-slate-400 font-mono">@{resetTargetUser?.username}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                New Password / PIN
              </label>
              <button
                type="button"
                onClick={() => generateRandomPassword(setNewPassword)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Sparkles size={12} /> Auto-generate
              </button>
            </div>
            <div className="relative">
              <input
                type={showResetPassword ? 'text' : 'password'}
                className="input-field pr-10 font-mono"
                placeholder="Enter new password (min 4 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={4}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !newPassword}
              className="btn-warning flex-1 py-2.5"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
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
