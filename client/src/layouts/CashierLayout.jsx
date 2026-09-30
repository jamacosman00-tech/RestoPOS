import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import TopNavbar from '../components/TopNavbar';
import {
  LayoutDashboard,
  ShoppingCart,
  Grid3X3,
  Receipt,
  X,
  Database,
  Wifi,
  Shield,
} from 'lucide-react';

const cashierNavItems = [
  { to: '/cashier', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/cashier/pos', label: 'POS Terminal', icon: ShoppingCart },
  { to: '/cashier/tables', label: 'Table Floor', icon: Grid3X3 },
  { to: '/cashier/orders', label: 'Orders & History', icon: Receipt },
];

export default function CashierLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0B132B] text-slate-200 w-64 min-w-64 border-r border-slate-800/80 select-none">
      {/* Active Workspace Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          ACTIVE WORKSPACE
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
          <Shield size={16} className="text-blue-400" />
          <span>Cashier Station</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {cashierNavItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Wifi size={13} className="text-emerald-400" /> Connection:
          </span>
          <span className="text-emerald-400 font-semibold">Offline / Local</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span className="flex items-center gap-1.5">
            <Database size={13} /> Database:
          </span>
          <span className="font-mono text-[11px] text-slate-400">MongoDB (127.0.0.1)</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#080d1a] text-slate-100">
      {/* Top Navbar */}
      <TopNavbar
        onToggleSidebar={() => setSidebarOpen(true)}
        activeWorkspaceTitle="Cashier Station"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-10 flex">
              <SidebarContent />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-white p-2 rounded-lg bg-slate-800/80"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#080d1a]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
