import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import CashierLayout from './layouts/CashierLayout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/UsersPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import MenuPage from './pages/admin/MenuPage';
import TablesPage from './pages/admin/TablesPage';
import OrdersPage from './pages/admin/OrdersPage';
import InventoryPage from './pages/admin/InventoryPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Cashier Pages
import CashierDashboard from './pages/cashier/Dashboard';
import NewOrderPage from './pages/cashier/NewOrderPage';
import CashierOrdersPage from './pages/cashier/OrdersPage';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080d1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          <span className="text-xs font-semibold text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> always send to Login page first
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role protection: Only admin for admin routes, only cashier for cashier routes
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/cashier'} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#080d1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          <span className="text-xs font-semibold text-slate-400">Loading RestoPOS...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root Path: Login page is first for everyone who isn't authenticated */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin' : '/cashier'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Login Page */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin' : '/cashier'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Admin Only Routes: Only authenticated users with role="admin" */}
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="pos" element={<NewOrderPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Cashier Only Routes: Only authenticated users with role="cashier" */}
      <Route
        path="/cashier"
        element={
          <PrivateRoute role="cashier">
            <CashierLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<CashierDashboard />} />
        <Route path="pos" element={<NewOrderPage />} />
        <Route path="new-order" element={<Navigate to="/cashier/pos" replace />} />
        <Route path="tables" element={<TablesPage />} />
        <Route path="orders" element={<CashierOrdersPage />} />
      </Route>

      {/* Catch-all unknown paths -> Redirect to login */}
      <Route
        path="*"
        element={
          <Navigate
            to={user ? (user.role === 'admin' ? '/admin' : '/cashier') : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0F172A',
              color: '#F8FAFC',
              border: '1px solid #334155',
              borderRadius: '12px',
            },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
