import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

export function AppHome() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/app/admin/health" replace />;
  if (user?.role === 'employer') return <Navigate to="/app/employer/dashboard" replace />;
  return <Navigate to="/app/jobs" replace />;
}
