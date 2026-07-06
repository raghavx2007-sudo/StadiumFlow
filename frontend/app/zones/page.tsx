'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Zone {
  id: string;
  name: string;
  capacity: number;
  current_occupancy: number;
  status: string;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/zones`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch zones');
        return res.json();
      })
      .then(data => {
        setZones(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="container" role="main">
      <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <h1 className={styles.title} aria-label="Zone Management Dashboard">Zone Management</h1>
        <button aria-label="Add new stadium zone">+ Add Zone</button>
      </div>

      {loading && <p aria-live="polite">Loading zones from backend...</p>}
      {error && <p className="status-critical" role="alert">Error: {error}. Please ensure the backend is running on port 5000.</p>}

      <div className={styles.zonesGrid} role="region" aria-label="Stadium Zones">
        {zones.map((zone) => {
          const occupancyPercentage = (zone.capacity > 0) ? (zone.current_occupancy / zone.capacity) * 100 : 0;
          let statusClass = styles.statusNormal;
          if (zone.status === 'Warning') statusClass = styles.statusWarning;
          if (zone.status === 'Critical') statusClass = styles.statusCritical;

          return (
            <div key={zone.id} className="card" role="article" aria-labelledby={`zone-title-${zone.id}`}>
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3 id={`zone-title-${zone.id}`}>{zone.name}</h3>
                <span className={`${styles.badge} ${statusClass}`} role="status">{zone.status}</span>
              </div>
              
              <div className={styles.progressContainer} aria-label={`Occupancy for ${zone.name}`}>
                <div className="flex items-center justify-between" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>Occupancy</span>
                  <span>{zone.current_occupancy.toLocaleString()} / {zone.capacity.toLocaleString()}</span>
                </div>
                <div className={styles.progressBar} aria-hidden="true">
                  <div 
                    className={`${styles.progressFill} ${statusClass}`} 
                    style={{ width: `${occupancyPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
