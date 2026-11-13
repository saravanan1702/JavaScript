import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity, BookOpen, ChartColumn, Inbox, LayoutDashboard, LogOut, Megaphone, Menu, Settings, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/logs', label: 'Logs', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-brand via-brand-500 to-accent-500 text-lg shadow-lg shadow-brand-500/30">
        💬
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-white">Reel Automation</p>
        <p className="text-xs text-slate-400">Admin console</p>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }) {
  const { admin, logout } = useAuth();
  return (
    <div className="flex h-full flex-col bg-ink-900 px-4 py-6">
      <Brand />
      <nav className="mt-8 flex-1 space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-xl bg-ink-800 p-3">
        <p className="truncate text-sm font-medium text-white">{admin?.name}</p>
        <p className="truncate text-xs text-slate-400">{admin?.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-2xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-6 rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">Reel Automation</span>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
