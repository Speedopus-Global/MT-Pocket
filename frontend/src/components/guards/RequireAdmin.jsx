/**
 * RequireAdmin.jsx — route-level admin guard
 * Suggested path: src/components/guards/RequireAdmin.jsx
 *
 * Usage in App.jsx:
 *   <Route element={<RequireAdmin />}>
 *     <Route path="/admin/*" element={<AdminDashboard />} />
 *   </Route>
 *
 * Renders nothing (redirect) while auth is still loading so there's no
 * flash of the "unauthorized" screen on page refresh.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RequireAdmin() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) return <Navigate to="/unauthorized" replace />;

if (!['reviewer', 'super_admin'].includes(user.systemRole)) {
  return <Navigate to="/unauthorized" replace />;
}
  return <Outlet />;
}