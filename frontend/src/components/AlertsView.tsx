import { useEffect, useState, useCallback } from 'react';
import { getAlertsDashboard, getAlerts, escalateAlert, clearCache } from '../api';
import type { Alert, AlertDashboard } from '../api';

const SEV_COLOR: Record<string, string> = {
  LOW:      'var(--green)',
  MED:      'var(--amber)',
  HIGH:     'var(--red)',
  CRITICAL: 'var(--red)',
};

const SEV_ORDER = ['CRITICAL', 'HIGH', 'MED', 'LOW'];

const PAGE_SIZE = 30;

function SeverityBadge({ sev }: { sev: string }) {
  return (
    <span
      className="sev-badge"
      style={{
        color: SEV_COLOR[sev] ?? 'var(--text)',
        borderColor: SEV_COLOR[sev] ?? 'var(--glass-border)',
        boxShadow: sev === 'CRITICAL' ? `0 0 8px ${SEV_COLOR[sev]}` : 'none',
      }}
    >
      {sev}
    </span>
  );
}

export default function AlertsView() {
  const [dashboard, setDashboard] = useState<AlertDashboard | null>(null);
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [escalating, setEscalating] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, alertList] = await Promise.all([
        getAlertsDashboard(),
        getAlerts(),
      ]);
      setDashboard(dash);
      setAllAlerts(alertList);
    } catch (e) {
      console.error('AlertsView fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEscalate = async (id: number) => {
    setEscalating(id);
    try {
      await escalateAlert(id);
      clearCache();
      await fetchData();
    } catch (e) {
      console.error('Escalate failed:', e);
    } finally {
      setEscalating(null);
    }
  };

  const handleFilterClick = (s: string) => {
    setFilter((prev) => (prev === s ? 'ALL' : s));
    setPage(0);
  };

  const filtered = filter === 'ALL' ? allAlerts : allAlerts.filter((a) => a.severity === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="alerts-view">
      {/* Dashboard cards */}
      <div className="alerts-dash">
        {SEV_ORDER.map((s) => (
          <div
            key={s}
            className={`adash-card glass-panel${filter === s ? ' adash-card--active' : ''}`}
            style={{ borderColor: filter === s ? SEV_COLOR[s] : undefined }}
            onClick={() => handleFilterClick(s)}
          >
            <span
              className="adash-value"
              style={{ color: SEV_COLOR[s], textShadow: `0 0 12px ${SEV_COLOR[s]}` }}
            >
              {dashboard?.openAlertsBySeverity[s] ?? '-'}
            </span>
            <span className="adash-label">{s}</span>
          </div>
        ))}
        <div className="adash-card glass-panel">
          <span className="adash-value" style={{ color: 'var(--cyan)', textShadow: '0 0 12px rgba(0,180,255,0.5)' }}>
            {dashboard?.alertsLast30Days ?? '-'}
          </span>
          <span className="adash-label">30-DAY TOTAL</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="alerts-filter-bar">
        <span className="alerts-filter-label">
          SHOWING: {filter === 'ALL' ? 'ALL SEVERITIES' : filter}
          {filter !== 'ALL' && (
            <button className="filter-clear" onClick={() => { setFilter('ALL'); setPage(0); }}>× CLEAR</button>
          )}
        </span>
        <span className="alerts-count">{filtered.length} records · page {page + 1}/{totalPages || 1}</span>
      </div>

      {/* Alert table */}
      {!loading && allAlerts.length === 0 && (
        <div className="alerts-empty">
          <span>No alerts in database — scan pending.</span>
        </div>
      )}
      {loading ? (
        <div className="alerts-loading">SCANNING THREAT DATABASE...</div>
      ) : (
        <div className="alerts-table-wrap">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>SEV</th>
                <th>PLANET</th>
                <th>BODY ID</th>
                <th>DIST (AU)</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id} className={`alert-row alert-row--${a.severity.toLowerCase()}`}>
                  <td><SeverityBadge sev={a.severity} /></td>
                  <td className="ac-planet">{a.planetName ?? '-'}</td>
                  <td className="ac-body">{a.bodyId ?? '-'}</td>
                  <td className="ac-dist">{a.distanceAu?.toFixed(4) ?? '-'}</td>
                  <td>
                    <span className={`status-pill status-pill--${(a.status ?? 'OPEN').toLowerCase()}`}>
                      {a.status ?? 'OPEN'}
                    </span>
                  </td>
                  <td className="ac-time">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <button
                      className="escalate-btn"
                      disabled={a.severity === 'CRITICAL' || escalating === a.id}
                      onClick={() => handleEscalate(a.id)}
                    >
                      {escalating === a.id ? '...' : '↑'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="alerts-pagination">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← PREV
          </button>
          <span className="page-info">PAGE {page + 1} / {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}
