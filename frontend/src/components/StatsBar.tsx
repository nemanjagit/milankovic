import { useEffect, useState } from 'react';
import { getBodyStats, getAlertsDashboard, getMissions } from '../api';

export default function StatsBar() {
  const [bodies, setBodies]     = useState<number | null>(null);
  const [missions, setMissions] = useState<number | null>(null);
  const [alerts, setAlerts]     = useState<number | null>(null);

  useEffect(() => {
    getBodyStats()
      .then((s) => { if (s.totalBodies != null) setBodies(s.totalBodies); })
      .catch(() => {});

    getMissions(0, 1)
      .then((p) => { const total = p.page?.totalElements ?? p.totalElements; if (total != null) setMissions(total); })
      .catch(() => {});

    getAlertsDashboard()
      .then((d) => { if (d.totalOpenAlerts != null) setAlerts(d.totalOpenAlerts); })
      .catch(() => {});
  }, []);

  const fmt = (n: number | null) => n == null ? '—' : n.toLocaleString();

  return (
    <div className="statsbar glass-panel">
      <div className="stat-card">
        <span className="stat-value cyan">{fmt(bodies)}</span>
        <span className="stat-label">Total Bodies</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-card">
        <span className="stat-value green">{fmt(missions)}</span>
        <span className="stat-label">Space Missions</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-card">
        <span className="stat-value red">{fmt(alerts)}</span>
        <span className="stat-label">Open Alerts</span>
      </div>
    </div>
  );
}