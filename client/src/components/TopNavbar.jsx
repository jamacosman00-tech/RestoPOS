import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Utensils, Menu, Crown, Shield } from 'lucide-react';

export default function TopNavbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';
  const isAdmin = user?.role === 'admin';

  return (
    <header className="h-16 bg-[#0B132B]/95 border-b border-slate-800/90 px-4 lg:px-6 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu size={22} />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-emerald-400">
            <Utensils size={20} className="stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-base tracking-wider">RESTOPOS</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Offline Ready
            </span>
          </div>
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-white leading-tight">
            {user?.fullName || user?.username}
          </div>
          <div className="flex justify-end mt-0.5">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Crown size={10} className="text-amber-400" /> ADMIN
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                <Shield size={10} className="text-blue-400" /> CASHIER
              </span>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${
          isAdmin
            ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 border border-amber-400/40'
            : 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 border border-blue-400/40'
        }`}>
          {initial}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl border border-transparent hover:border-red-500/30 transition-all duration-150"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
