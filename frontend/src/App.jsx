import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/layout.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import StyleGuide from './pages/StyleGuide';
import RequireAdmin from './components/guards/RequireAdmin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import ThemeToggle from './components/ui/ThemeToggle';
import Marketplace from './pages/MarketPlace';
import UserProfile from './pages/UserProfile';
import AboutUs from './pages/AboutUs';
import TermsConditions from './pages/TermsConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import KYCConsentNotice from './pages/Kyconsentnotice';
import RefundPolicy from './pages/RefundPolicy';
import CookiePolicy from './pages/CookiePolicy';
import CommunityGuidelines from './pages/CommunityGuidelines';
import Chat from './pages/Chat';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <div className="fixed bottom-4 right-4 z-[1001]">
              <ThemeToggle />
            </div>
        <Routes>
          {/* Auth pages — full-screen, no shared Layout */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard pages — wrapped in DashboardLayout (with sidebar) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="messages" element={<Chat />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Main app marketplace — wrapped in Layout (navbar + footer) */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
           
          </Route>
           <Route path="marketplace" element={<Marketplace />} />
            <Route path="users/:id" element={<UserProfile />} />

          {/* Admin */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Dev only */}
          {/* Legal / Policy pages */}
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/Terms" element={<TermsConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/Privacy" element={<PrivacyPolicy />} />
          <Route path="/kyc-consent" element={<KYCConsentNotice />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/About" element={<AboutUs />} />

           
         
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;