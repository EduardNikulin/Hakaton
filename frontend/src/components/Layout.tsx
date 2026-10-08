import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasAnyRole } from '../utils/roles';
import styles from './Layout.module.css';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? styles.navLinkActive : styles.navLink;

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  roles: string[] | null; // null — доступно всем (в т.ч. гостю)
}

// Пункты меню с ограничением по ролям (resident | author | admin).
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Карта', end: true, roles: null },
  { to: '/incidents', label: 'Инциденты', roles: ['resident', 'author'] },
  { to: '/operator', label: 'Оператор', roles: ['admin'] },
  { to: '/analytics', label: 'Аналитика', roles: ['author', 'admin'] },
  { to: '/surveys', label: 'Опросы', roles: ['author', 'admin'] },
  { to: '/reports/my', label: 'Мои жалобы', roles: ['resident', 'author', 'admin'] },
  { to: '/profile', label: 'Профиль', roles: ['resident', 'author', 'admin'] },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles === null || hasAnyRole(role, item.roles),
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.logo}>ЭкоКарта</div>
        <nav className={styles.nav}>
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.navRight}>
          {isLoading ? (
            <span className={styles.userEmail}>...</span>
          ) : isAuthenticated && user ? (
            <>
              <span className={styles.userEmail}>{user.email}</span>
              <button className={styles.authBtn} onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <NavLink to="/login" className={styles.loginBtn}>Войти</NavLink>
          )}
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}