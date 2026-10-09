import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, User, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const linkStyle = (path) => ({
    padding: '8px 16px', borderRadius: 10, textDecoration: 'none',
    fontSize: 14, fontWeight: 500, transition: 'all .2s',
    color: pathname === path ? '#fff' : 'var(--text-secondary)',
    background: pathname === path ? '#22c55e' : 'transparent',
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--header-bg)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      transition: 'background .3s, border-color .3s',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', gap: 24,
      }}>
        {/* Логотип */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#22c55e,#0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <Leaf size={20} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            Eco<span style={{ color: '#22c55e' }}>City</span>
          </span>
        </Link>

        {/* Навигация */}
        <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
          <Link to="/" style={linkStyle('/')}>Карта</Link>
          <Link to="/surveys" style={linkStyle('/surveys')}>Опросы</Link>

          {isAuthenticated && (
            <Link
              to="/profile"
              style={{ ...linkStyle('/profile'), display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <User size={16} /> Кабинет
            </Link>
          )}

          {/* Только для админа */}
          {user?.role === 'admin' && (
            <Link
              to="/operator"
              style={{ ...linkStyle('/operator'), display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <AlertTriangle size={16} /> Инциденты
            </Link>
          )}
        </nav>

        {/* Кнопки справа */}
        {loading ? (
          <div style={{
            width: 160, height: 36, borderRadius: 10,
            background: 'var(--bg-secondary)',
            opacity: 0.5,
          }} />
        ) : isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: 'var(--text-secondary)',
            }}>
              <User size={14} />
              {user?.email?.split('@')[0] ?? 'Пользователь'}
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
              }}
            >
              <LogOut size={14} /> Выйти
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: '#22c55e', color: '#fff',
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}
          >
            <LogIn size={16} /> Войти
          </Link>
        )}
      </div>
    </header>
  );
}