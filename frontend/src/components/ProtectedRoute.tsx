import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/roles';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div style={{ color: 'var(--text-secondary)', padding: 40 }}>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const current = normalizeRole(user?.role);
    const hasRole = allowedRoles.some((r) => normalizeRole(r) === current);
    if (!hasRole) {
      return (
        <div style={{ maxWidth: 520, margin: '60px auto', padding: 32, background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, color: 'var(--text-primary)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⛔</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Доступ запрещён</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Для этой страницы нужна роль: {allowedRoles.join(' / ')}.<br />
            Ваша роль: {user?.role ?? '—'}.
          </p>
          <Link to="/" style={{ color: '#22c55e', fontSize: 14, textDecoration: 'none' }}>
            ← Вернуться на карту
          </Link>
        </div>
      );
    }
  }

  return <>{children}</>;
}