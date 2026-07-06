'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

/**
 * Sidebar: Primary navigation component for StadiumFlow.
 * Highlights the active route using aria-current for screen reader support.
 */
export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/zones', label: 'Zone Management' },
    { href: '/incidents', label: 'Incidents' },
  ];

  return (
    <aside className={styles.sidebar} aria-label="Main navigation">
      <div className={styles.brand}>
        <h2>StadiumFlow</h2>
        <p>Operations Center</p>
      </div>
      <nav className={styles.nav} aria-label="Site navigation">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={styles.link}
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className={styles.bottomNav}>
        <button className={styles.logoutBtn} aria-label="Log out of dashboard">
          Logout
        </button>
      </div>
    </aside>
  );
}
