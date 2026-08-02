import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/layout.jsx';
import Home from './pages/Home.jsx';
import WhyTrust from './pages/TrustStripe.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StyleGuide from './pages/StyleGuide';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages — full-screen, no shared Layout */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main app — wrapped in Layout (navbar + footer) */}
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
