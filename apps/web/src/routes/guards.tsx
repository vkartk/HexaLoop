import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { roleHome } from './role-home';
import type { components } from '@/lib/api/schema.gen';

type Role = components['schemas']['Role'];

type RequireAuthProps = {
  children: ReactNode;
  roles?: Role[];
};

export const RequireAuth = ({ children, roles }: RequireAuthProps) => {
  const { status, user } = useAuthStore();
  const location = useLocation();

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <>{children}</>;
};
