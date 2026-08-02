import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  User as UserIcon, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  ArrowLeft
} from 'lucide-react';
import logo from '../../assets/logo.png';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
    <div className="min-h-screen bg-[#FDF6ED]/20 flex flex-col md:flex-row text-foreground font-sans">
      
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-card/85 backdrop-blur-md border-b border-border/60 z-20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-primary/40 overflow-hidden bg-primary/5 flex items-center justify-center shadow-sm">
            <img src={logo} alt="MT Pocket" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-extrabold tracking-tight text-primary text-base">MT Pocket</span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-xl border border-border/80 text-foreground hover:bg-muted/80 transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:sticky md:top-0 md:translate-x-0 transition-transform duration-300 ease-in-out z-30 w-64 bg-card/90 backdrop-blur-lg border-r border-border/60 flex flex-col h-screen max-h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border/55 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary/70 bg-primary/5 flex items-center justify-center shadow-md shadow-primary/5 transition-transform duration-300 hover:scale-105">
            <img src={logo} alt="MT Pocket" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-primary text-lg leading-none">MT Pocket</h1>
          </div>
        </div>

        {/* User Mini Profile Panel */}
        {user && (
          <div className="p-5 border-b border-border/55 bg-[#FDF6ED]/15 flex items-center gap-3">
            <div className="relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg border border-primary/20">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card shadow-sm animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-foreground leading-tight">{user.fullName || 'User Profile'}</p>
              <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-0.5">{user.role}</p>
            </div>
          </div>
        )}

        {/* Navigation Items with Sliding Indicator */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto relative">
          {navItems.map((item, idx) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setIsSidebarOpen(false)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 z-10 group"
            >
              {({ isActive }) => {
                const isSelected = isActive;
                const isHovered = hoveredIndex === idx;

                return (
                  <>
                    {/* Sliding Highlight Pill */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute inset-0 bg-primary rounded-xl z-[-1] shadow-md shadow-primary/15"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      {!isSelected && isHovered && (
                        <motion.div
                          layoutId="hover-indicator"
                          className="absolute inset-0 bg-muted/60 rounded-xl z-[-2]"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-3">
                      <item.icon 
                        size={18} 
                        className={`transition-colors duration-200 ${
                          isSelected 
                            ? 'text-primary-foreground' 
                            : 'text-muted-foreground group-hover:text-foreground'
                        }`} 
                      />
                      <span className={isSelected ? 'text-primary-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}>
                        {item.label}
                      </span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wider transition-colors duration-200 ${
                        isSelected 
                          ? 'bg-primary-foreground/20 text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="p-4 border-t border-border/55 mt-auto space-y-1.5">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <ArrowLeft size={18} />
            <span>Go to Marketplace</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Background Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}
    </div>
  );
}
