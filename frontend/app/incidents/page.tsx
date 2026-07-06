'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Incident {
  id: string;
  title?: string; // Using description as title from backend
  description: string;
  zone?: { name: string };
  severity: string;
  status: string;
  reported_by: string;
  created_at: string;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [desc, setDesc] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [severity, setSeverity] = useState('low');

  const fetchIncidents = () => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/incidents`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setIncidents(data);
        } else {
          throw new Error(data.error || 'Invalid data format received');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const resolveIncident = (id: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/incidents/${id}/resolve`, { method: 'PUT' })
      .then(() => fetchIncidents())
      .catch(console.error);
  };

  const submitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zone_id: zoneId || 'temp-id', // In a real app, select a real zone id
        description: desc,
        severity: severity,
        reported_by: 'Current User'
      })
    })
    .then(() => {
      setIsFormOpen(false);
      fetchIncidents();
    })
    .catch(console.error);
  };

  return (
    <main className="container">
      <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <h1 className={styles.title}>Incident Tracker</h1>
        <button onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancel' : '+ Report Incident'}
        </button>
      </div>

      {error && <p className="status-critical">Error: {error}. Backend must be running on port 5000.</p>}

      {isFormOpen && (
        <div className={`card ${styles.formContainer}`}>
          <h3>Report New Incident</h3>
          <form className={styles.form} onSubmit={submitIncident}>
            <div className={styles.formGroup}>
              <label>Description</label>
              <input type="text" required value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g., Broken Turnstile" />
            </div>
            <div className={styles.formGroup}>
              <label>Zone ID (Optional for MVP)</label>
              <input type="text" value={zoneId} onChange={e => setZoneId(e.target.value)} placeholder="e.g., North Gate" />
            </div>
            <div className={styles.formGroup}>
              <label>Severity</label>
              <select required value={severity} onChange={e => setSeverity(e.target.value)}>
                <option value="low">Low</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button type="submit">Submit Report</button>
          </form>
        </div>
      )}

      <div className="card" role="region" aria-label="Incidents List">
        {loading && <p aria-live="polite">Loading incidents...</p>}
        <table className={styles.table} aria-label="Stadium Incidents">
          <thead>
            <tr>
              <th scope="col">Description</th>
              <th scope="col">Location</th>
              <th scope="col">Severity</th>
              <th scope="col">Status</th>
              <th scope="col">Reported By</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td><strong>{incident.description}</strong></td>
                <td>{incident.zone?.name || 'Unknown Zone'}</td>
                <td>
                  <span className={`${styles.badge} ${styles[`badge${incident.severity}`] || styles.badgelow}`}>
                    {incident.severity}
                  </span>
                </td>
                <td>
                  <span className={incident.status === 'open' ? 'status-critical' : 'status-normal'}>
                    {incident.status.toUpperCase()}
                  </span>
                </td>
                <td>{incident.reported_by}</td>
                <td>
                  {incident.status === 'open' && (
                    <button 
                      className={styles.resolveBtn}
                      onClick={() => resolveIncident(incident.id)}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
