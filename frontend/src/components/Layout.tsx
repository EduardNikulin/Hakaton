import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Layout.module.css';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? styles.navLinkActive : styles.navLink;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.logo}>ЭкоКарта</div>
        <nav className={styles.nav}>
          <NavLink to="/" end className={navLinkClass}>Карта</NavLink>
          <NavLink to="/incidents" className={navLinkClass}>Инциденты</NavLink>
          <NavLink to="/analytics" className={navLinkClass}>Аналитика</NavLink>
          <NavLink to="/surveys" className={navLinkClass}>Опросы</NavLink>
          <NavLink to="/profile" className={navLinkClass}>Профиль</NavLink>
        </nav>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}