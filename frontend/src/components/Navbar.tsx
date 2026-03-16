import type { View } from '../App';

interface NavbarProps {
  view: View;
  onViewChange: (v: View) => void;
  onLogout: () => void;
}

const LINKS: { label: string; view: View }[] = [
  { label: 'Dashboard', view: 'dashboard' },
  { label: 'Bodies',    view: 'bodies'    },
  { label: 'Missions',  view: 'missions'  },
  { label: 'Threats',   view: 'threats'   },
  { label: 'Alerts',     view: 'alerts'     },
  { label: 'Satellites', view: 'satellites' },
];

export default function Navbar({ view, onViewChange, onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="pulse-dot" />
        MILANKOVIC
      </div>

      <ul className="navbar-links">
        {LINKS.map((l) => (
          <li key={l.view}>
            <a
              href="#"
              className={view === l.view ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); onViewChange(l.view); }}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="navbar-right">
        <div className="live-pill">
          <span className="live-dot" />
          LIVE
        </div>
        <button className="logout-btn" onClick={onLogout}>LOGOUT</button>
      </div>
    </nav>
  );
}