import { Link, useLocation } from 'react-router-dom';
import { Leaf, User } from 'lucide-react';

export default function Header() {
  const { pathname } = useLocation();

  const linkStyle = (path) => ({
    padding: '8px 16px', borderRadius: 10, textDecoration: 'none',
    fontSize: 14, fontWeight: 500, transition: 'all .2s',
    color: pathname === path ? '#fff' : 'var(--text-secondary)',
    background: pathname === path ? '#22c55e' : 'transparent',
  });

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

        <nav style={{ display: 'flex', gap: 4 }}>
          <Link to="/" style={linkStyle('/')}>Карта</Link>
          <Link to="/surveys" style={linkStyle('/surveys')}>Опросы</Link>
          <Link to="/profile" style={{ ...linkStyle('/profile'), display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={16} /> Кабинет
          </Link>
        </nav>
      </div>
    </header>
  );
}