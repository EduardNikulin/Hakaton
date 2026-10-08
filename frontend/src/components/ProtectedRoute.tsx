import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div style={{ color: '#94a3b8', padding: 40 }}>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    // Редирект на /login с сохранением текущего пути
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const hasRole = allowedRoles.includes(user.role?.toLowerCase() ?? '');
    if (!hasRole) {
      return (
        <div style={{ color: '#ef4444', padding: 40 }}>
          ⛔ Доступ запрещён. Требуемая роль: {allowedRoles.join(' / ')}
        </div>
      );
    }
  }

  return <>{children}</>;
}