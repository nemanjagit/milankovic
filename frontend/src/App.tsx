import { useState, useEffect } from 'react';
import './App.css';
import { getToken, clearToken } from './api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SolarSystem from './components/SolarSystem';
import TelemetryPanel from './components/TelemetryPanel';
import StatsBar from './components/StatsBar';
import LoginOverlay from './components/LoginOverlay';
import AlertsView from './components/AlertsView';
import MissionsView from './components/MissionsView';
import ThreatsView from './components/ThreatsView';
import BodiesView from './components/BodiesView';
import SatellitesView from './components/SatellitesView';

export type View = 'dashboard' | 'bodies' | 'missions' | 'threats' | 'alerts' | 'satellites';

export default function App() {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [view, setView] = useState<View>('dashboard');
  const [selectedBody, setSelectedBody] = useState<string>('Earth');

  useEffect(() => {
    const handler = () => setToken(null);
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const handleLogin = () => setToken(getToken());
  const handleLogout = () => { clearToken(); setToken(null); };

  if (!token) return <LoginOverlay onLogin={handleLogin} />;

  return (
    <div className={`app-root app-root--${view}`}>
      <Navbar view={view} onViewChange={setView} onLogout={handleLogout} />

      {view === 'dashboard' && (
        <>
          <Sidebar selectedBody={selectedBody} onSelectBody={setSelectedBody} />
          <SolarSystem onSelectBody={setSelectedBody} />
          <TelemetryPanel selectedBody={selectedBody} />
        </>
      )}

      {view === 'bodies' && (
        <div className="full-view"><BodiesView /></div>
      )}

      {view === 'missions' && (
        <div className="full-view"><MissionsView /></div>
      )}

      {view === 'threats' && (
        <div className="full-view"><ThreatsView /></div>
      )}

      {view === 'alerts' && (
        <div className="full-view"><AlertsView /></div>
      )}

      {view === 'satellites' && (
        <div className="full-view"><SatellitesView /></div>
      )}

      <StatsBar />
    </div>
  );
}
