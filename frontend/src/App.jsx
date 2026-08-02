import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/layout.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import StyleGuide from './pages/StyleGuide';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages — full-screen, no shared Layout */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard pages — wrapped in DashboardLayout (with sidebar) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Main app marketplace — wrapped in Layout (navbar + footer) */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
          </Route>

          {/* Dev only */}
          <Route path="/style-guide" element={<StyleGuide />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
