import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Карта' },
  { to: '/incidents', label: 'Инциденты' },
  { to: '/analytics', label: 'Аналитика' },
  { to: '/surveys', label: 'Опросы' },
  { to: '/reports/my', label: 'Мои жалобы' },
];

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56, background: '#1e293b',
      borderBottom: '1px solid #334155',
    }}>
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>ЭкоКарта</span>
      </NavLink>

      <nav style={{ display: 'flex', gap: 4 }}>
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              padding: '8px 14px',
              borderRadius: 6,
              color: isActive ? '#fff' : '#94a3b8',
              background: isActive ? '#0ea5e9' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isLoading ? (
          <span style={{ color: '#64748b', fontSize: 13 }}>...</span>
        ) : isAuthenticated && user ? (
          <>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 13 }}
            >
              Выйти
            </button>
          </>
        ) : (
          <NavLink to="/login" style={{ textDecoration: 'none' }}>
            <span style={{ padding: '8px 16px', borderRadius: 6, background: '#22c55e', color: '#fff', fontSize: 14, fontWeight: 600 }}>
              Войти
            </span>
          </NavLink>
        )}
      </div>
    </header>
  );
}