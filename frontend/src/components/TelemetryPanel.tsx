import { useEffect, useState } from 'react';
import { searchBodies, getBodyDetail } from '../api';
import type { BodyDetail } from '../api';

interface Props {
  selectedBody: string;
}

function fmt(v: number | null | undefined, decimals = 2, suffix = ''): string {
  if (v == null) return '-';
  const s = v.toLocaleString(undefined, { maximumFractionDigits: decimals });
  return suffix ? `${s} ${suffix}` : s;
}

function fmtMass(kg: number | null | undefined): string {
  if (kg == null) return '-';
  const exp = Math.floor(Math.log10(Math.abs(kg)));
  const man = kg / Math.pow(10, exp);
  return `${man.toFixed(3)}×10^${exp} kg`;
}

function CompBar({ label, value, max, color }: {
  label: string; value: number | null | undefined; max: number; color: string;
}) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="comp-entry">
      <div className="comp-label-row">
        <span className="comp-label">{label}</span>
        <span className="comp-pct">{value != null ? fmt(value, 1) : '-'}</span>
      </div>
      <div className="comp-track">
        <div className="comp-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function TelemetryPanel({ selectedBody }: Props) {
  const [data, setData] = useState<BodyDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);

    searchBodies(selectedBody)
      .then((results) => {
        const match = results.find(
          (b) => b.name.toLowerCase() === selectedBody.toLowerCase()
        ) ?? results[0];
        if (!match) return null;
        return getBodyDetail(match.id);
      })
      .then((detail) => { if (detail) setData(detail); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBody]);

  const orb = data?.orbitalData;
  const phys = data?.physicalProperties;
  const moonCount = data?.moons?.length ?? 0;
  const isMonitored = ['Earth', 'Mars', 'Venus'].includes(selectedBody);

  return (
    <aside className="telemetry">
      {/* Header */}
      <div className="tele-header">
        <span className="tele-title">Telemetry - Selected Body</span>
        <span className="tele-body-name">
          {loading ? 'LOADING...' : (data?.name ?? selectedBody).toUpperCase()}
        </span>
        {data?.bodyType && (
          <span className="tele-type-badge">{data.bodyType.toUpperCase()}</span>
        )}
      </div>

      <div className="tele-divider" />

      {/* Orbital */}
      <div>
        <div className="tele-section-label">Orbital Parameters</div>
        <div className="tele-row">
          <span className="tele-key">Period</span>
          <span className="tele-val cyan">
            {orb?.periodDays != null
              ? orb.periodDays > 365
                ? `${(orb.periodDays / 365.25).toFixed(2)} yr`
                : `${orb.periodDays.toFixed(1)} d`
              : '-'}
          </span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Semi-Major Axis</span>
          <span className="tele-val cyan">{fmt(orb?.semiMajorAxis, 4, 'AU')}</span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Eccentricity</span>
          <span className="tele-val">{fmt(orb?.eccentricity, 5)}</span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Inclination</span>
          <span className="tele-val">{fmt(orb?.inclination, 2, '°')}</span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Velocity</span>
          <span className="tele-val">{fmt(orb?.velocityKmS, 2, 'km/s')}</span>
        </div>
      </div>

      <div className="tele-divider" />

      {/* Physical */}
      <div>
        <div className="tele-section-label">Physical Properties</div>
        <div className="tele-row">
          <span className="tele-key">Mean Temp</span>
          <span className="tele-val amber">
            {data?.meanTemp != null ? `${data.meanTemp} K` : '-'}
          </span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Radius</span>
          <span className="tele-val">{fmt(data?.radius, 0, 'km')}</span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Mass</span>
          <span className="tele-val" style={{ fontSize: 12 }}>{fmtMass(data?.mass)}</span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Gravity</span>
          <span className="tele-val">{fmt(phys?.gravity, 2, 'm/s²')}</span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Escape Speed</span>
          <span className="tele-val">{fmt(phys?.escapeSpeed, 2, 'km/s')}</span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Rotation</span>
          <span className="tele-val">
            {phys?.rotationPeriod != null
              ? `${Math.abs(phys.rotationPeriod).toFixed(1)} h${phys.rotationPeriod < 0 ? ' ®' : ''}`
              : '-'}
          </span>
        </div>
        <div className="tele-row">
          <span className="tele-key">Axial Tilt</span>
          <span className="tele-val">{fmt(phys?.axialTilt, 1, '°')}</span>
        </div>
        {data?.discoveredBy && (
          <div className="tele-row">
            <span className="tele-key">Discovered</span>
            <span className="tele-val" style={{ fontSize: 12 }}>{data.discoveredBy}</span>
          </div>
        )}
      </div>

      <div className="tele-divider" />

      {/* Moons */}
      <div>
        <div className="tele-section-label">Natural Satellites</div>
        <div className="tele-row">
          <span className="tele-key">Moon Count</span>
          <span className="tele-val green">{moonCount}</span>
        </div>
        {moonCount > 0 && data!.moons.slice(0, 5).map((m) => (
          <div key={m.id} className="tele-row">
            <span className="tele-key" style={{ paddingLeft: 8 }}>·</span>
            <span className="tele-val" style={{ fontSize: 12, color: 'var(--text-dim)' }}>{m.name}</span>
          </div>
        ))}
        {moonCount > 5 && (
          <div className="tele-row">
            <span className="tele-key" />
            <span className="tele-val" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              +{moonCount - 5} more
            </span>
          </div>
        )}
      </div>

      {/* Relative bars */}
      {phys && (
        <>
          <div className="tele-divider" />
          <div>
            <div className="tele-section-label">Relative Properties</div>
            <div className="comp-bar-row">
              <CompBar label="Gravity (m/s²)" value={phys.gravity} max={274} color="var(--cyan)" />
              <CompBar label="Escape Speed (km/s)" value={phys.escapeSpeed} max={617} color="var(--green)" />
              <CompBar label="Axial Tilt (°)" value={phys.axialTilt} max={180} color="var(--amber)" />
            </div>
          </div>
        </>
      )}

      {/* Threat indicator */}
      {isMonitored && (
        <>
          <div className="tele-divider" />
          <div className="threat-box">
            <span className="threat-dot" />
            <span className="threat-text">ACTIVE THREAT<br />MONITORING ONLINE</span>
          </div>
        </>
      )}
    </aside>
  );
}
