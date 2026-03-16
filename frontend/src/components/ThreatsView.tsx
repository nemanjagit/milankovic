import { useEffect, useState } from 'react';
import { getHazardous, getThreatApproaches } from '../api';
import type { SmallBody, ApproachEntry } from '../api';

const PLANETS = ['Earth'];

function distColor(au: number) {
  if (au < 0.01) return 'var(--red)';
  if (au < 0.05) return 'var(--amber)';
  return 'var(--green)';
}

export default function ThreatsView() {
  const [hazardous, setHazardous] = useState<SmallBody[]>([]);
  const [approaches, setApproaches] = useState<ApproachEntry[]>([]);
  const [planet, setPlanet] = useState('Earth');
  const [loading, setLoading] = useState(true);
  const [approachLoading, setApproachLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getHazardous()
      .then(setHazardous)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setApproachLoading(true);
    getThreatApproaches(planet)
      .then(setApproaches)
      .catch(console.error)
      .finally(() => setApproachLoading(false));
  }, [planet]);

  const filtered = hazardous.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="threats-view">
      {/* Left: hazardous bodies */}
      <div className="threats-left">
        <div className="threats-section-head">
          <span className="threats-title">HAZARDOUS BODIES</span>
          <span className="threats-count">{hazardous.length} objects</span>
        </div>

        <input
          className="threats-search"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="threats-loading">SCANNING CATALOG...</div>
        ) : (
          <div className="threats-body-list">
            {filtered.slice(0, 200).map((b) => (
              <div className="threat-body-row" key={b.id}>
                <span
                  className="threat-body-dot"
                  style={{
                    background: distColor(0.05),
                    boxShadow: `0 0 6px ${distColor(0.05)}`,
                  }}
                />
                <div className="threat-body-info">
                  <span className="threat-body-name">{b.name}</span>
                  <div className="threat-body-meta">
                    <span className="threat-body-tag">H={b.absMagnitude?.toFixed(1) ?? '?'}</span>
                    <span className="threat-body-tag">
                      Ø {b.diameterKm != null
                        ? b.diameterKm < 1
                          ? `${(b.diameterKm * 1000).toFixed(0)} m`
                          : `${b.diameterKm.toFixed(2)} km`
                        : '?'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: close approaches */}
      <div className="threats-right">
        <div className="threats-section-head">
          <span className="threats-title">CLOSE APPROACHES</span>
          <div className="planet-tabs">
            {PLANETS.map((p) => (
              <button
                key={p}
                className={`planet-tab${planet === p ? ' planet-tab--active' : ''}`}
                onClick={() => setPlanet(p)}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {approachLoading ? (
          <div className="threats-loading">
            COMPUTING TRAJECTORIES<span className="traj-dots" />
          </div>
        ) : (
          <div className="approach-table-wrap">
            <table className="approach-table">
              <thead>
                <tr>
                  <th>BODY</th>
                  <th>DATE</th>
                  <th>AU</th>
                  <th>LD</th>
                  <th>RISK</th>
                </tr>
              </thead>
              <tbody>
                {approaches.slice(0, 100).map((a, i) => (
                  <tr key={i} className="approach-row">
                    <td className="ap-name">{a.bodyName}</td>
                    <td className="ap-date">{a.date}</td>
                    <td style={{ color: distColor(a.distanceAu), fontFamily: 'var(--font)' }}>
                      {a.distanceAu?.toFixed(5)}
                    </td>
                    <td className="ap-ld">{a.distanceLd?.toFixed(2)}</td>
                    <td>
                      <span
                        className="risk-bar"
                        style={{
                          background: distColor(a.distanceAu),
                          width: `${Math.min(100, (0.1 / (a.distanceAu + 0.001)) * 10)}%`,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
