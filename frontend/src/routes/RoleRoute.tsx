import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import type { UserRole } from '@/types';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/app/unauthorized" replace />;
  }

  return <>{children}</>;
}
