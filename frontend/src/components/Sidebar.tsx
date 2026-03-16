import { useState, useEffect, useRef } from 'react';
import { searchBodies } from '../api';
import type { BodySummary } from '../api';

interface Props {
  selectedBody: string;
  onSelectBody: (name: string) => void;
}

const PLANETS = [
  { name: 'Mercury',  color: '#b5b5b5', type: 'Planet' },
  { name: 'Venus',    color: '#e8c87a', type: 'Planet' },
  { name: 'Earth',    color: '#4fa3e0', type: 'Planet' },
  { name: 'Mars',     color: '#c1440e', type: 'Planet' },
  { name: 'Jupiter',  color: '#c88b3a', type: 'Planet' },
  { name: 'Saturn',   color: '#e4d191', type: 'Planet' },
  { name: 'Uranus',   color: '#7de8e8', type: 'Planet' },
  { name: 'Neptune',  color: '#3f54ba', type: 'Planet' },
  { name: 'Ceres',    color: '#c4a87a', type: 'Dwarf Planet' },
  { name: 'Pluto',    color: '#c4a87a', type: 'Dwarf Planet' },
  { name: 'Haumea',   color: '#c4a87a', type: 'Dwarf Planet' },
  { name: 'Makemake', color: '#c4a87a', type: 'Dwarf Planet' },
  { name: 'Eris',     color: '#c4a87a', type: 'Dwarf Planet' },
];

const TYPE_COLOR: Record<string, string> = {
  planet:          '#4fa3e0',
  asteroid:        '#ff8040',
  comet:           '#00FF96',
  moon:            '#aaaaaa',
  star:            '#FFB020',
  'dwarf planet':  '#c4a87a',
};
function bodyColor(type: string) {
  return TYPE_COLOR[type?.toLowerCase()] ?? '#4a6a82';
}

export default function Sidebar({ selectedBody, onSelectBody }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BodySummary[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      searchBodies(query.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
  }, [query]);

  const showResults = query.trim().length > 0;

  return (
    <aside className="sidebar">
      {/* Search box */}
      <div className="sidebar-search-wrap">
        <input
          className="sidebar-search"
          placeholder="Search 515 bodies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <span className="sidebar-search-spinner">◌</span>}
      </div>

      {/* Search results */}
      {showResults && (
        <>
          <div className="sidebar-group-label">
            {searching ? 'Searching...' : results.length > 0 ? `${results.length} matches` : 'No results'}
          </div>
          {results.map((b) => (
            <div
              key={b.id}
              className={`sidebar-item${selectedBody === b.name ? ' active' : ''}`}
              onClick={() => onSelectBody(b.name)}
            >
              <span
                className="sidebar-dot"
                style={{ background: bodyColor(b.bodyType), boxShadow: `0 0 5px ${bodyColor(b.bodyType)}` }}
              />
              <div className="sidebar-info">
                <span className="sidebar-name">{b.name}</span>
                <div className="sidebar-meta">
                  <span className="sidebar-badge">{b.bodyType}</span>
                  {b.radius != null && (
                    <span className="sidebar-mass">{b.radius.toFixed(0)} km</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Default planet list */}
      {!showResults && (
        <>
          <div className="sidebar-group-label">Planets</div>
          {PLANETS.filter((p) => p.type === 'Planet').map((p) => (
            <div
              key={p.name}
              className={`sidebar-item${selectedBody === p.name ? ' active' : ''}`}
              onClick={() => onSelectBody(p.name)}
            >
              <span
                className="sidebar-dot"
                style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }}
              />
              <div className="sidebar-info">
                <span className="sidebar-name">{p.name}</span>
                <span className="sidebar-meta">
                  <span className="sidebar-badge">Planet</span>
                </span>
              </div>
            </div>
          ))}
          <div className="sidebar-group-label">Dwarf Planets</div>
          {PLANETS.filter((p) => p.type === 'Dwarf Planet').map((p) => (
            <div
              key={p.name}
              className={`sidebar-item${selectedBody === p.name ? ' active' : ''}`}
              onClick={() => onSelectBody(p.name)}
            >
              <span
                className="sidebar-dot"
                style={{ background: p.color, boxShadow: `0 0 4px ${p.color}` }}
              />
              <div className="sidebar-info">
                <span className="sidebar-name">{p.name}</span>
                <span className="sidebar-meta">
                  <span className="sidebar-badge">Dwarf Planet</span>
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </aside>
  );
}
