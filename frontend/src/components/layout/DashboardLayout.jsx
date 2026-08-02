import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  User as UserIcon, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  Mail,
  Fingerprint
} from 'lucide-react';
import logo from '../../assets/logo.png';

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
    { to: '/dashboard/profile', label: 'Profile & Trust', icon: UserIcon },
    { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare, badge: 'Soon' },
  ];

  return (
    <div className="min-h-screen bg-[#FDF6ED]/30 flex flex-col md:flex-row text-foreground">
      
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-card border-b border-border z-20">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="MT Pocket" className="w-8 h-8 object-contain" />
          <span className="font-bold tracking-tight text-primary text-base">MT Pocket</span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 rounded-lg border border-border text-foreground hover:bg-muted"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30 w-64 bg-card border-r border-border flex flex-col h-screen max-h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border hidden md:flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="MT Pocket" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold tracking-tight text-primary text-lg leading-tight">MT Pocket</h1>
              <span className="text-xs text-muted-foreground">P2P Lending Platform</span>
            </div>
          </Link>
        </div>

        {/* User Mini Profile Panel */}
        {user && (
          <div className="p-5 border-b border-border bg-[#FDF6ED]/20 flex items-center gap-3">
            <div className="relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg border border-primary/20">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
              )}
              {/* Active Dot */}
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{user.fullName || 'User Profile'}</p>
              <p className="text-xs text-muted-foreground capitalize leading-tight">{user.role} Account</p>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-border mt-auto space-y-1">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <ArrowLeft size={18} />
            <span>Go to Marketplace</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <main className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Background Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10 md:hidden"
        />
      )}
    </div>
  );
}
