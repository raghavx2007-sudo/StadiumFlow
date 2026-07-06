'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

interface Zone {
  id: string;
  name: string;
  capacity: number;
  current_occupancy: number;
  status: string;
}

/**
 * ZonesPage: Displays all stadium zones with real-time occupancy data,
 * capacity progress bars, and status indicators (Normal/Warning/Critical).
 */
export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Abort controller ref to cancel pending fetches on unmount
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/zones`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch zones');
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid data format');
        setZones(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="container" role="main">
      <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <h1 className={styles.title}>Zone Management</h1>
        <button aria-label="Add new stadium zone">+ Add Zone</button>
      </div>

      {loading && (
        <p aria-live="polite" aria-busy="true">Loading zones from backend...</p>
      )}
      {error && (
        <p className="status-critical" role="alert" aria-live="assertive">
          Error: {error}. Please ensure the backend is running.
        </p>
      )}

      {!loading && !error && zones.length === 0 && (
        <p aria-live="polite">No zones found.</p>
      )}

      <div className={styles.zonesGrid} role="region" aria-label="Stadium Zones">
        {zones.map((zone) => {
          const occupancyPercentage = zone.capacity > 0
            ? Math.min((zone.current_occupancy / zone.capacity) * 100, 100)
            : 0;
          const occupancyRounded = Math.round(occupancyPercentage);

          let statusClass = styles.statusNormal;
          if (zone.status === 'Warning') statusClass = styles.statusWarning;
          if (zone.status === 'Critical') statusClass = styles.statusCritical;

          return (
            <div
              key={zone.id}
              className="card"
              role="article"
              aria-labelledby={`zone-title-${zone.id}`}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3 id={`zone-title-${zone.id}`}>{zone.name}</h3>
                <span
                  className={`${styles.badge} ${statusClass}`}
                  role="status"
                  aria-label={`Status: ${zone.status}`}
                >
                  {zone.status}
                </span>
              </div>

              <div className={styles.progressContainer}>
                <div
                  className="flex items-center justify-between"
                  style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}
                >
                  <span>Occupancy</span>
                  <span aria-label={`${zone.current_occupancy.toLocaleString()} of ${zone.capacity.toLocaleString()} capacity`}>
                    {zone.current_occupancy.toLocaleString()} / {zone.capacity.toLocaleString()}
                  </span>
                </div>
                {/* Accessible progress bar */}
                <div
                  className={styles.progressBar}
                  role="progressbar"
                  aria-valuenow={occupancyRounded}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${zone.name} occupancy at ${occupancyRounded}%`}
                >
                  <div
                    className={`${styles.progressFill} ${statusClass}`}
                    style={{ width: `${occupancyPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
