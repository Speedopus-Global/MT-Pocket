
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