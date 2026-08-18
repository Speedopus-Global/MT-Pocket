import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  User as UserIcon, 
  Settings as SettingsIcon,
  MessageSquare, 
  HelpCircle,
  LogOut, 
  Menu, 
  X, 
  ArrowLeft
} from 'lucide-react';
import MtPocketLogo from '../ui/MtPocketLogo';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/profile', label: 'Profile', icon: UserIcon },
    { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
    { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
    { to: '/dashboard/support', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-sidebar flex flex-col md:flex-row text-foreground font-sans">
      
      {/* ── Mobile Header Bar ─────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar/95 backdrop-blur-md border-b border-border">
        <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-2xs shrink-0">
            <MtPocketLogo className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-primary text-sm leading-none block">MT Pocket</span>
            <span className="text-[10px] text-muted-foreground leading-none">Member Portal</span>
          </div>
        </Link>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* ── Sidebar Navigation ────────────────────────────────────────── */}
      <aside 
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:sticky md:top-0 md:translate-x-0 md:shadow-none transition-transform duration-200 ease-in-out z-50 w-64 sm:w-72 md:w-60 max-w-[85vw] bg-sidebar border-r border-border flex flex-col h-screen max-h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-2xs shrink-0">
              <MtPocketLogo className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold tracking-tight text-primary text-sm leading-none">MT Pocket</h1>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Member Portal</p>
            </div>
          </Link>

          {/* Close button for mobile inside drawer */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Mini Profile Panel */}
        {user && (
          <div className="p-3 border-b border-border">
            <div className="rounded-lg bg-card border border-border/80 p-2.5 flex items-center gap-2.5">
              <div className="relative shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-md object-cover border border-border" />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-foreground leading-tight">{user.fullName || 'User Profile'}</p>
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider mt-0.5">{user.role || 'Member'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">
            Main Menu
          </p>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    size={16} 
                    className={`shrink-0 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} 
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="p-3 border-t border-border space-y-1">
          <Link 
            to="/marketplace" 
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Marketplace</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden min-w-0">
        <main className="flex-1 p-3 sm:p-5 lg:p-8 w-full max-w-[1600px] mx-auto flex flex-col min-w-0">
          <Outlet />
        </main>
      </div>

      {/* ── Background Overlay for mobile sidebar ─────────────────────── */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-background/70 backdrop-blur-xs z-40 md:hidden cursor-pointer"
        />
      )}
    </div>
  );
}