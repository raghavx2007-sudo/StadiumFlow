'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

interface Incident {
  id: string;
  title?: string;
  description: string;
  zone?: { name: string };
  severity: string;
  status: string;
  reported_by: string;
  created_at: string;
}

/** Valid severity values for incident reports */
const SEVERITY_OPTIONS = ['low', 'warning', 'critical'] as const;
type Severity = typeof SEVERITY_OPTIONS[number];

/**
 * IncidentsPage: Displays the stadium incident tracker with the ability
 * to report new incidents and resolve existing ones in real-time.
 */
export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [desc, setDesc] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [severity, setSeverity] = useState<Severity>('low');

  // Ref to abort in-flight fetch on unmount
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Fetches all incidents from the backend API.
   * Uses an AbortController so pending requests are cancelled on unmount.
   */
  const fetchIncidents = () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/incidents`, { signal: controller.signal })
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
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIncidents();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sends a PUT request to mark an incident as resolved,
   * then refreshes the incidents list.
   * @param id - The incident ID to resolve
   */
  const resolveIncident = (id: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/incidents/${id}/resolve`, { method: 'PUT' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to resolve incident');
        return fetchIncidents();
      })
      .catch(err => setError(err.message));
  };

  /**
   * Submits a new incident report to the backend.
   * Validates that description is non-empty before sending.
   * @param e - The form submit event
   */
  const submitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zone_id: zoneId || null,
        description: desc.trim(),
        severity,
        reported_by: 'Current User'
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit incident');
        setIsFormOpen(false);
        setDesc('');
        setZoneId('');
        setSeverity('low');
        return fetchIncidents();
      })
      .catch(err => setError(err.message));
  };

  return (
    <main className="container" role="main">
      <div className="flex items-center justify-between" style={{ marginBottom: '2rem' }}>
        <div className={styles.header}>
          <h1 className={styles.title}>Incident Management</h1>
          <button
            aria-label={isFormOpen ? 'Cancel incident report' : 'Report a new incident'}
            aria-expanded={isFormOpen}
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? 'Cancel' : '+ Report Incident'}
          </button>
        </div>
      </div>

      {error && (
        <p className="status-critical" role="alert" aria-live="assertive">
          Error: {error}. Please ensure the backend is running.
        </p>
      )}

      {isFormOpen && (
        <div className={`card ${styles.formContainer}`} role="region" aria-label="Report New Incident Form">
          <h2 id="form-heading">Report New Incident</h2>
          <form className={styles.form} onSubmit={submitIncident} aria-labelledby="form-heading" noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="description">Incident Description <span aria-hidden="true">*</span></label>
              <input
                id="description"
                type="text"
                required
                maxLength={500}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="e.g., Broken Turnstile"
                aria-required="true"
                aria-describedby="desc-hint"
              />
              <span id="desc-hint" style={{ fontSize: '0.75rem', color: '#999' }}>
                {desc.length}/500 characters
              </span>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="zoneId">Zone ID (Optional)</label>
              <input
                id="zoneId"
                type="text"
                value={zoneId}
                onChange={e => setZoneId(e.target.value)}
                placeholder="e.g., North Stand zone ID"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="severity">Severity Level <span aria-hidden="true">*</span></label>
              <select
                id="severity"
                required
                value={severity}
                onChange={e => setSeverity(e.target.value as Severity)}
                aria-required="true"
              >
                {SEVERITY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <button type="submit" aria-label="Submit the incident report">Submit Report</button>
            </div>
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
          <tbody aria-live="polite" aria-relevant="additions removals">
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
                      aria-label={`Mark incident "${incident.description}" as resolved`}
                      className={styles.resolveBtn}
                      onClick={() => resolveIncident(incident.id)}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && incidents.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
                  No incidents reported.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
