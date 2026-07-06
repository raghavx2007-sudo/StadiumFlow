import Link from 'next/link';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h2>StadiumFlow</h2>
        <p>Operations Center</p>
      </div>
      <nav className={styles.nav}>
        <Link href="/" className={styles.link}>
          Dashboard
        </Link>
        <Link href="/zones" className={styles.link}>
          Zone Management
        </Link>
        <Link href="/incidents" className={styles.link}>
          Incidents
        </Link>
      </nav>
      <div className={styles.bottomNav}>
        <button className={styles.logoutBtn} aria-label="Log out of dashboard">Logout</button>
      </div>
    </aside>
  );
}
