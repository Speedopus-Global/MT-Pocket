import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/layout.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import RequireAuth from './components/guards/RequireAuth.jsx';
import RequireAdmin from './components/guards/RequireAdmin.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
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
import HelpAndSupport from './pages/HelpAndSupport';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="fixed bottom-4 right-4 z-[1001]">
          <ThemeToggle />
        </div>
        <Routes>
          {/* Auth pages — public guest access */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard pages — requires logged-in user */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="messages" element={<Chat />} />
              <Route path="support" element={<HelpAndSupport />} />
            </Route>
            <Route path="/chat" element={<Navigate to="/dashboard/messages" replace />} />
            <Route path="/messages" element={<Navigate to="/dashboard/messages" replace />} />
          </Route>

          {/* Unauthorized access fallback */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Main website layout pages */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="how-it-works" element={<Home />} />
            <Route path="trust-safety" element={<Home />} />
            <Route path="trust" element={<Home />} />
            <Route path="faq" element={<Home />} />
            <Route path="contact" element={<Home />} />
            <Route path="support" element={<HelpAndSupport />} />
          </Route>

          {/* Marketplace & Member public profiles */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/users/:id" element={<UserProfile />} />

          {/* Protected Admin pages — requires admin role */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

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

          {/* 404 Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;