import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, List, Settings, LogOut, Zap, Users, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const sidebarLinks = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, superOnly: false },
  { path: '/admin/rates', label: 'Taux', icon: TrendingUp, superOnly: false },
  { path: '/admin/transactions', label: 'Transactions', icon: List, superOnly: false },
  { path: '/admin/settings', label: 'Parametres', icon: Settings, superOnly: false },
  { path: '/admin/users', label: 'Utilisateurs', icon: Users, superOnly: true },
];

export default function AdminLayout() {
  const { isAuthenticated, isSuperAdmin, logout, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const visibleLinks = sidebarLinks.filter((link) => !link.superOnly || isSuperAdmin);

  return (
    <div className="min-h-screen flex bg-dark-900">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 border-r border-emerald-primary/10 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-dark-600">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-primary" />
            </div>
            <span className="font-display text-lg text-bone tracking-wide">
              ADORO<span className="text-emerald-primary">ADMIN</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleLinks.map((link) => {
            const isActive =
              link.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-primary/10 text-emerald-primary'
                    : 'text-ash hover:text-bone hover:bg-dark-700'
                }`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-dark-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-primary">
                {user?.firstName?.[0] || user?.username?.[0] || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-bone text-sm truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username}
              </p>
              <div className="flex items-center gap-1.5">
                {isSuperAdmin && <ShieldCheck size={10} className="text-amber-400" />}
                <p className="text-ash text-xs truncate">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm text-ash hover:text-red-400 hover:bg-dark-700 transition-colors"
          >
            <LogOut size={16} />
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
