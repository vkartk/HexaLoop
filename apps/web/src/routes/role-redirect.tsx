import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { roleHome } from './role-home';

export const RoleRedirect = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome(user.role)} replace />;
};
