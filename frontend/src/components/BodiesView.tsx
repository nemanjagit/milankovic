import { useEffect, useState, useCallback } from 'react';
import { getBodies, getBodyDetail, getBodyStats } from '../api';
import type { BodySummary, BodyDetail, BodyStats } from '../api';


const TYPE_COLOR: Record<string, string> = {
  planet:          '#4fa3e0',
  asteroid:        '#ff8040',
  comet:           '#00FF96',
  moon:            '#888888',
  star:            '#FFB020',
  'dwarf planet':  '#c4a87a',
};
function typeColor(t: string) { return TYPE_COLOR[t?.toLowerCase()] ?? '#4a6a82'; }

function fmtMass(kg: number | null | undefined): string {
  if (kg == null) return '—';
  const exp = Math.floor(Math.log10(Math.abs(kg)));
  const man = kg / Math.pow(10, exp);
  return `${man.toFixed(2)}e${exp}`;
}

function fmt(v: number | null | undefined, d = 2, sfx = ''): string {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { maximumFractionDigits: d }) + (sfx ? ' ' + sfx : '');
}

export default function BodiesView() {
  const [stats, setStats] = useState<BodyStats | null>(null);
  const [bodies, setBodies] = useState<BodySummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [selected, setSelected] = useState<BodyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBodyStats().then(setStats).catch(console.error);
  }, []);

  const fetchBodies = useCallback(() => {
    setLoading(true);
    const type = typeFilter === 'All' ? undefined : typeFilter;
    getBodies(page, 24, type)
      .then((p) => {
        setBodies(p.content);
        setTotalPages(p.totalPages);
        setTotalElements(p.totalElements);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, typeFilter]);

  useEffect(() => { fetchBodies(); }, [fetchBodies]);

  const handleTypeChange = (t: string) => { setTypeFilter(t); setPage(0); setSelected(null); };

  const handleSelect = (b: BodySummary) => {
    setDetailLoading(true);
    setSelected(null);
    getBodyDetail(b.id)
      .then(setSelected)
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  };

  return (
    <div className="bodies-view">
      {/* Left: list */}
      <div className="bodies-left">
        {/* Stats filter pills */}
        {stats && (
          <div className="bodies-stats">
            <div
              className={`bstat-pill${typeFilter === 'All' ? ' bstat-pill--active' : ''}`}
              style={{ borderColor: typeFilter === 'All' ? 'var(--cyan)' : undefined }}
              onClick={() => handleTypeChange('All')}
            >
              <span className="bstat-count" style={{ color: 'var(--cyan)' }}>{stats.totalBodies}</span>
              <span className="bstat-label">All</span>
            </div>
            {Object.entries(stats.countByType).sort(([,a],[,b]) => b - a).map(([type, count]) => (
              <div
                key={type}
                className={`bstat-pill${typeFilter === type ? ' bstat-pill--active' : ''}`}
                style={{ borderColor: typeFilter === type ? typeColor(type) : undefined }}
                onClick={() => handleTypeChange(typeFilter === type ? 'All' : type)}
              >
                <span className="bstat-count" style={{ color: typeColor(type) }}>{count}</span>
                <span className="bstat-label">{type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Count */}
        <div className="bodies-count-row">
          <span className="bodies-count">{totalElements.toLocaleString()} bodies</span>
          <span className="bodies-page-info">Page {page + 1} / {totalPages || 1}</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="bodies-loading">SCANNING CATALOG...</div>
        ) : (
          <div className="bodies-grid">
            {bodies.map((b) => (
              <div
                key={b.id}
                className={`body-card glass-panel${selected?.id === b.id ? ' body-card--active' : ''}`}
                onClick={() => handleSelect(b)}
                style={{ borderColor: selected?.id === b.id ? typeColor(b.bodyType) : undefined }}
              >
                <div className="body-card-dot" style={{
                  background: typeColor(b.bodyType),
                  boxShadow: `0 0 10px ${typeColor(b.bodyType)}`,
                }} />
                <span className="body-card-name">{b.name}</span>
                <span className="body-card-type">{b.bodyType}</span>
                <div className="body-card-stats">
                  {b.radius != null && <span>{b.radius.toFixed(0)} km</span>}
                  {b.mass != null && <span>{fmtMass(b.mass)} kg</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bodies-pagination">
            <button className="page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← PREV</button>
            <span className="page-info">{page + 1} / {totalPages}</span>
            <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>NEXT →</button>
          </div>
        )}
      </div>

      {/* Right: detail panel */}
      <div className="bodies-detail glass-panel">
        {detailLoading && (
          <div className="bodies-detail-loading">LOADING TELEMETRY...</div>
        )}

        {!detailLoading && !selected && (
          <div className="bodies-detail-empty">
            <div className="bodies-detail-hint">← Select a body to view telemetry</div>
          </div>
        )}

        {!detailLoading && selected && (
          <>
            <div className="bd-header">
              <div
                className="bd-dot"
                style={{ background: typeColor(selected.bodyType), boxShadow: `0 0 14px ${typeColor(selected.bodyType)}` }}
              />
              <div>
                <div className="bd-name">{selected.name}</div>
                <div className="bd-type">{selected.bodyType?.toUpperCase()}</div>
              </div>
            </div>

            <div className="tele-divider" />

            <div className="tele-section-label">Orbital Parameters</div>
            <div className="tele-row"><span className="tele-key">Period</span>
              <span className="tele-val cyan">
                {selected.orbitalData?.periodDays != null
                  ? selected.orbitalData.periodDays > 365
                    ? `${(selected.orbitalData.periodDays / 365.25).toFixed(2)} yr`
                    : `${selected.orbitalData.periodDays.toFixed(1)} d`
                  : '—'}
              </span>
            </div>
            <div className="tele-row"><span className="tele-key">Semi-Major Axis</span>
              <span className="tele-val cyan">{fmt(selected.orbitalData?.semiMajorAxis, 4, 'AU')}</span>
            </div>
            <div className="tele-row"><span className="tele-key">Eccentricity</span>
              <span className="tele-val">{fmt(selected.orbitalData?.eccentricity, 5)}</span>
            </div>
            <div className="tele-row"><span className="tele-key">Inclination</span>
              <span className="tele-val">{fmt(selected.orbitalData?.inclination, 2, '°')}</span>
            </div>
            <div className="tele-row"><span className="tele-key">Velocity</span>
              <span className="tele-val">{fmt(selected.orbitalData?.velocityKmS, 2, 'km/s')}</span>
            </div>

            <div className="tele-divider" />

            <div className="tele-section-label">Physical Properties</div>
            <div className="tele-row"><span className="tele-key">Radius</span>
              <span className="tele-val">{fmt(selected.radius, 0, 'km')}</span>
            </div>
            <div className="tele-row"><span className="tele-key">Mass</span>
              <span className="tele-val" style={{ fontSize: 12 }}>{fmtMass(selected.mass)}</span>
            </div>
            <div className="tele-row"><span className="tele-key">Mean Temp</span>
              <span className="tele-val amber">{selected.meanTemp != null ? `${selected.meanTemp} K` : '—'}</span>
            </div>
            <div className="tele-row"><span className="tele-key">Gravity</span>
              <span className="tele-val">{fmt(selected.physicalProperties?.gravity, 2, 'm/s²')}</span>
            </div>
            <div className="tele-row"><span className="tele-key">Escape Speed</span>
              <span className="tele-val">{fmt(selected.physicalProperties?.escapeSpeed, 2, 'km/s')}</span>
            </div>
            <div className="tele-row"><span className="tele-key">Rotation</span>
              <span className="tele-val">
                {selected.physicalProperties?.rotationPeriod != null
                  ? `${Math.abs(selected.physicalProperties.rotationPeriod).toFixed(1)} h`
                  : '—'}
              </span>
            </div>
            <div className="tele-row"><span className="tele-key">Axial Tilt</span>
              <span className="tele-val">{fmt(selected.physicalProperties?.axialTilt, 1, '°')}</span>
            </div>
            {selected.discoveredBy && (
              <div className="tele-row"><span className="tele-key">Discovered</span>
                <span className="tele-val" style={{ fontSize: 12 }}>{selected.discoveredBy}</span>
              </div>
            )}

            {selected.moons.length > 0 && (
              <>
                <div className="tele-divider" />
                <div className="tele-section-label">Moons ({selected.moons.length})</div>
                <div className="bd-moons">
                  {selected.moons.map((m) => (
                    <span key={m.id} className="bd-moon-tag">{m.name}</span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
