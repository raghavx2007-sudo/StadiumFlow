import styles from './page.module.css';

/**
 * Home: Main dashboard overview displaying real-time stadium stats
 * including attendance, active incidents, staff deployment, and live zone feed.
 */
export default function Home() {
  return (
    <main className="container" role="main">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Overview</h1>
          <p className={styles.subtitle}>Real-time stadium status</p>
        </div>
        <div className={styles.matchInfo} aria-label="Current match information">
          <span className={styles.liveIndicator} aria-hidden="true" />
          <span>Active Match: Semi-Finals</span>
        </div>
      </header>

      <section className={styles.statsGrid} aria-label="Stadium Statistics">
        <div className="card" role="region" aria-label="Total Attendance">
          <h2>Total Attendance</h2>
          <p className={styles.statValue} aria-label="45,210 attendees">45,210</p>
          <p className="status-normal">82% of Capacity</p>
        </div>
        <div className="card" role="region" aria-label="Active Incidents">
          <h2>Active Incidents</h2>
          <p className={styles.statValue} aria-label="12 active incidents">12</p>
          <p className="status-warning">3 Critical</p>
        </div>
        <div className="card" role="region" aria-label="Staff Deployed">
          <h2>Staff Deployed</h2>
          <p className={styles.statValue} aria-label="340 staff deployed">340</p>
          <p className="status-normal">Optimal coverage</p>
        </div>
      </section>

      <section className={styles.recentIncidents} aria-labelledby="live-zones-heading">
        <div className={styles.cardHeader}>
          <h2 id="live-zones-heading">Live Zones</h2>
          <a href="/zones" aria-label="View all stadium zones">View All</a>
        </div>
        <div className={styles.incidentList} aria-live="polite" aria-relevant="additions removals">
          <div className={styles.incidentItem} role="article">
            <div>
              <strong>Medical Emergency</strong>
              <p>South Stand, Section 14</p>
            </div>
            <span className={styles.badgeCritical} role="status" aria-label="Critical severity">Critical</span>
          </div>
          <div className={styles.incidentItem} role="article">
            <div>
              <strong>Spill on Walkway</strong>
              <p>Food Court Level 2</p>
            </div>
            <span className={styles.badgeWarning} role="status" aria-label="Warning severity">Warning</span>
          </div>
        </div>
      </section>
    </main>
  );
}
