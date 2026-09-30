import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Please enter both username and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password);
      toast.success(`Welcome, ${user.fullName || user.username}!`);
      navigate(user.role === 'admin' ? '/admin' : '/cashier');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast('Please contact your administrator to reset credentials', {
      icon: '🔒',
      style: {
        background: '#1e293b',
        color: '#f8fafc',
      },
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 select-none"
      style={{ background: '#4da6d9' }}
    >
      {/* Outer wrapper – gives room for the overflowing avatar */}
      <div className="relative w-full max-w-[360px] pt-16">

        {/* ── Avatar (overflows card top) ── */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <div
            className="w-[100px] h-[100px] rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 38% 38%, #5bb8e8, #2a7db5)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}
          >
            {/* Person silhouette */}
            <svg
              viewBox="0 0 100 100"
              className="w-[70px] h-[70px]"
              fill="#daeaf5"
            >
              {/* Head */}
              <circle cx="50" cy="33" r="18" />
              {/* Body / shoulders */}
              <ellipse cx="50" cy="80" rx="28" ry="22" />
            </svg>
          </div>
        </div>

        {/* ── Card ── */}
        <div
          className="rounded-[28px] px-8 pb-8 pt-16 flex flex-col items-center"
          style={{
            background: 'rgba(255,255,255,0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: '1px solid rgba(255,255,255,0.28)',
          }}
        >
          {/* Title */}
          <h1
            className="text-white font-semibold text-2xl tracking-[0.25em] mb-6"
            style={{ fontFamily: 'sans-serif' }}
          >
            LOGIN
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">

            {/* Username */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3b8fc4]">
                <User size={17} strokeWidth={2.5} />
              </span>
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value.toLowerCase().trim() })
                }
                className="w-full bg-white rounded-md pl-9 pr-3 py-[9px] text-sm text-slate-700 placeholder-[#7faedb] focus:outline-none focus:ring-2 focus:ring-[#2a7db5] shadow-sm"
                required
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3b8fc4]">
                <Lock size={17} strokeWidth={2.5} />
              </span>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white rounded-md pl-9 pr-9 py-[9px] text-sm text-slate-700 placeholder-[#7faedb] focus:outline-none focus:ring-2 focus:ring-[#2a7db5] shadow-sm"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3b8fc4] transition-colors"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white/90 pt-0.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-[14px] h-[14px] accent-[#2a7db5] rounded cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            {/* Login button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-[160px] py-[9px] rounded-full text-white text-xs font-bold tracking-widest uppercase transition-all duration-150 active:scale-95 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(180deg,#4daad8 0%,#2a7db5 100%)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                {loading ? 'LOGGING IN…' : 'LOGIN'}
              </button>
            </div>

            {/* Forgot link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] text-white/80 hover:text-white transition-colors"
              >
                Forgot Username / Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
