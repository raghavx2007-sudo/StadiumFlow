import styles from './page.module.css';

export default function Home() {
  return (
    <main className="container">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Overview</h1>
          <p className={styles.subtitle}>Real-time stadium status</p>
        </div>
        <div className={styles.matchInfo}>
          <span className={styles.liveIndicator}></span>
          <span>Active Match: Semi-Finals</span>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className="card">
          <h3>Total Attendance</h3>
          <p className={styles.statValue}>45,210</p>
          <p className="status-normal">82% of Capacity</p>
        </div>
        <div className="card">
          <h3>Active Incidents</h3>
          <p className={styles.statValue}>12</p>
          <p className="status-warning">3 Critical</p>
        </div>
        <div className="card">
          <h3>Staff Deployed</h3>
          <p className={styles.statValue}>340</p>
          <p className="status-normal">Optimal coverage</p>
        </div>
      </section>

      <section className={styles.recentIncidents}>
        <div className={styles.cardHeader}>
          <h2>Live Zones</h2>
          <button aria-label="View all stadium zones">View All</button>
        </div>
        <div className={styles.incidentList}>
          <div className={styles.incidentItem}>
            <div>
              <strong>Medical Emergency</strong>
              <p>South Stand, Section 14</p>
            </div>
            <span className={styles.badgeCritical}>Critical</span>
          </div>
          <div className={styles.incidentItem}>
            <div>
              <strong>Spill on Walkway</strong>
              <p>Food Court Level 2</p>
            </div>
            <span className={styles.badgeWarning}>Warning</span>
          </div>
        </div>
      </section>
    </main>
  );
}
