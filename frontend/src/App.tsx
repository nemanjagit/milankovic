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
  // Track which views have been visited so we only mount them once
  const [visited, setVisited] = useState<Set<View>>(new Set(['dashboard']));

  const handleViewChange = (v: View) => {
    setVisited(prev => new Set([...prev, v]));
    setView(v);
  };

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
      <Navbar view={view} onViewChange={handleViewChange} onLogout={handleLogout} />

      <div style={{ display: view === 'dashboard' ? 'contents' : 'none' }}>
        <Sidebar selectedBody={selectedBody} onSelectBody={setSelectedBody} />
        <SolarSystem onSelectBody={setSelectedBody} />
        <TelemetryPanel selectedBody={selectedBody} />
      </div>

      {visited.has('bodies') && (
        <div className="full-view" style={{ display: view === 'bodies' ? undefined : 'none' }}><BodiesView /></div>
      )}

      {visited.has('missions') && (
        <div className="full-view" style={{ display: view === 'missions' ? undefined : 'none' }}><MissionsView /></div>
      )}

      {visited.has('threats') && (
        <div className="full-view" style={{ display: view === 'threats' ? undefined : 'none' }}><ThreatsView /></div>
      )}

      {visited.has('alerts') && (
        <div className="full-view" style={{ display: view === 'alerts' ? undefined : 'none' }}><AlertsView /></div>
      )}

      {visited.has('satellites') && (
        <div className="full-view" style={{ display: view === 'satellites' ? undefined : 'none' }}><SatellitesView /></div>
      )}

      <StatsBar />
    </div>
  );
}
