import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as satellite from 'satellite.js';

type Category = 'stations' | 'starlink' | 'gps-ops' | 'weather';

const CATEGORIES: { key: Category; label: string; color: number; url: string }[] = [
  { key: 'stations', label: 'Space Stations', color: 0x00FF96, url: '/celestrak/NORAD/elements/gp.php?GROUP=stations&FORMAT=TLE' },
  { key: 'starlink', label: 'Starlink',        color: 0x00B4FF, url: '/celestrak/NORAD/elements/gp.php?GROUP=starlink&FORMAT=TLE' },
  { key: 'gps-ops',  label: 'GPS',             color: 0xFFB020, url: '/celestrak/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=TLE' },
  { key: 'weather',  label: 'Weather',         color: 0xFF80FF, url: '/celestrak/NORAD/elements/gp.php?GROUP=weather&FORMAT=TLE' },
];

interface SatInfo {
  name: string;
  lat: number;
  lon: number;
  altKm: number;
  velKms: number;
  category: Category;
  color: number;
}

function parseTLE(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const result: { name: string; line1: string; line2: string }[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i].replace(/^0 /, '');
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (line1.startsWith('1') && line2.startsWith('2')) result.push({ name, line1, line2 });
  }
  return result;
}

function eciToVec3(pos: satellite.EciVec3<satellite.Kilometer>, earthR: number): THREE.Vector3 {
  const scale = earthR / 6371;
  return new THREE.Vector3(pos.x * scale, pos.z * scale, -pos.y * scale);
}

export default function SatellitesView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(['stations']));
  const [selected, setSelected] = useState<SatInfo | null>(null);
  const [status, setStatus] = useState('FETCHING TLE DATA');
  const [loading, setLoading] = useState(true);
  const [satCount, setSatCount] = useState(0);

  const activeCatRef = useRef<Set<Category>>(new Set(['stations']));
  useEffect(() => { activeCatRef.current = activeCategories; }, [activeCategories]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const EARTH_R = 16;

    const { width: initW, height: initH } = mount.getBoundingClientRect();
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000408);
    renderer.setSize(initW || 800, initH || 600);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, (initW || 800) / (initH || 600), 0.1, 2000);
    camera.position.set(0, 0, 55);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x223355, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(100, 50, 80);
    scene.add(sun);

    // Stars
    const sp: number[] = [];
    for (let i = 0; i < 3000; i++) {
      const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = 400 + Math.random() * 300;
      sp.push(r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p));
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, sizeAttenuation: true })));

    // Earth
    const loader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(EARTH_R, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map:          loader.load('/textures/8k_earth_daymap.jpg'),
      emissiveMap:  loader.load('/textures/8k_earth_nightmap.jpg'),
      emissive:     new THREE.Color(0xffffff),
      emissiveIntensity: 0.6,
      roughness: 0.7, metalness: 0.05,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Clouds
    const cloudGeo = new THREE.SphereGeometry(EARTH_R * 1.01, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: loader.load('/textures/8k_earth_clouds.jpg'),
      transparent: true, opacity: 0.25,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(clouds);

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(EARTH_R * 1.06, 32, 32);
    const atmMat = new THREE.MeshBasicMaterial({ color: 0x3366cc, transparent: true, opacity: 0.06, side: THREE.BackSide });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Satellite data per category
    const catSatrecs = new Map<Category, satellite.SatRec[]>();
    const catNames   = new Map<Category, string[]>();
    const catPoints  = new Map<Category, THREE.Points>();
    const satInfoMap = new Map<Category, SatInfo[]>();

    let totalLoaded = 0;
    const errors: string[] = [];
    const fetchPromises = CATEGORIES.map(async (cat) => {
      try {
        const res  = await fetch(cat.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!text.trim()) throw new Error('empty response');
        const tles = parseTLE(text);
        if (tles.length === 0) throw new Error(`0 TLEs parsed — first 100 chars: ${text.slice(0, 100)}`);

        const satrecs: satellite.SatRec[] = [];
        const names: string[] = [];
        tles.forEach(({ name, line1, line2 }) => {
          try { satrecs.push(satellite.twoline2satrec(line1, line2)); names.push(name); } catch { /* skip invalid */ }
        });
        catSatrecs.set(cat.key, satrecs);
        catNames.set(cat.key, names);

        const positions = new Float32Array(satrecs.length * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: cat.color, size: 0.5, sizeAttenuation: true }));
        pts.frustumCulled = false;
        pts.visible = cat.key === 'stations';
        scene.add(pts);
        catPoints.set(cat.key, pts);
        satInfoMap.set(cat.key, []);

        totalLoaded += satrecs.length;
        setSatCount(totalLoaded);
      } catch (err) {
        errors.push(`${cat.label}: ${err}`);
      }
    });
    Promise.all(fetchPromises).then(() => {
      setLoading(false);
      if (errors.length > 0) setStatus(errors.join(' | '));
      else setStatus('');
    });

    // Orbit line for selected satellite
    let orbitLine: THREE.Line | null = null;

    // Orbit controls — use pointer capture so drag doesn't bleed out
    let dragging = false, dragMoved = false;
    let prevX = 0, prevY = 0;
    let sph = { theta: 0, phi: Math.PI / 2, radius: 55 };

    const updCam = () => {
      camera.position.set(
        sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.radius * Math.cos(sph.phi),
        sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta),
      );
      camera.lookAt(0, 0, 0);
    };

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points!.threshold = 1.0;
    const mouse = new THREE.Vector2();

    const computeOrbit = (satrec: satellite.SatRec, color: number) => {
      if (orbitLine) { scene.remove(orbitLine); orbitLine.geometry.dispose(); orbitLine = null; }
      const periodMin = (2 * Math.PI) / satrec.no;
      const steps = 90;
      const orbitPts: number[] = [];
      const base = new Date();
      for (let s = 0; s <= steps; s++) {
        const t = new Date(base.getTime() + (s / steps) * periodMin * 60 * 1000);
        try {
          const pv = satellite.propagate(satrec, t);
          if (!pv || !pv.position || typeof pv.position === 'boolean') continue;
          const v3 = eciToVec3(pv.position as satellite.EciVec3<satellite.Kilometer>, EARTH_R);
          orbitPts.push(v3.x, v3.y, v3.z);
        } catch { /* skip */ }
      }
      if (orbitPts.length >= 6) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPts, 3));
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 });
        orbitLine = new THREE.Line(geo, mat);
        orbitLine.frustumCulled = false;
        scene.add(orbitLine);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true; dragMoved = false;
      prevX = e.clientX; prevY = e.clientY;
      (e.target as Element).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      dragMoved = true;
      sph.theta -= (e.clientX - prevX) * 0.005;
      sph.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi - (e.clientY - prevY) * 0.005));
      prevX = e.clientX; prevY = e.clientY;
      updCam();
    };
    const onPointerUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sph.radius = Math.max(20, Math.min(150, sph.radius + e.deltaY * 0.05));
      updCam();
    };
    const onClick = (e: MouseEvent) => {
      if (dragMoved) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      let hit = false;
      for (const cat of CATEGORIES) {
        const pts = catPoints.get(cat.key);
        if (!pts?.visible) continue;
        const hits = raycaster.intersectObject(pts, false);
        if (hits.length > 0) {
          const idx = hits[0].index ?? 0;
          const info = (satInfoMap.get(cat.key) ?? [])[idx];
          if (info) {
            setSelected(info);
            const satrec = (catSatrecs.get(cat.key) ?? [])[idx];
            if (satrec) computeOrbit(satrec, cat.color);
            hit = true;
          }
          break;
        }
      }
      if (!hit) {
        setSelected(null);
        if (orbitLine) { scene.remove(orbitLine); orbitLine.geometry.dispose(); orbitLine = null; }
      }
    };

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('click', onClick);

    const resizeObs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    });
    resizeObs.observe(mount);

    // Animation
    let animId = 0, lastSecond = -1;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      earth.rotation.y  += 0.0001;
      clouds.rotation.y += 0.00012;

      const now = new Date();
      const sec = Math.floor(now.getTime() / 1000);
      if (sec !== lastSecond) {
        lastSecond = sec;
        const gmst = satellite.gstime(now);

        for (const cat of CATEGORIES) {
          const satrecs = catSatrecs.get(cat.key);
          const names   = catNames.get(cat.key);
          const pts     = catPoints.get(cat.key);
          if (!satrecs || !pts || !names) continue;

          const pos = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
          const infos: SatInfo[] = [];

          for (let i = 0; i < satrecs.length; i++) {
            try {
              const pv = satellite.propagate(satrecs[i], now);
              if (!pv || !pv.position || typeof pv.position === 'boolean') {
                pos[i*3] = pos[i*3+1] = pos[i*3+2] = 0;
                infos.push(null as unknown as SatInfo);
                continue;
              }
              const eciPos = pv.position as satellite.EciVec3<satellite.Kilometer>;
              const eciVel = (pv.velocity ?? { x: 0, y: 0, z: 0 }) as satellite.EciVec3<satellite.KilometerPerSecond>;
              const v3 = eciToVec3(eciPos, EARTH_R);
              // Filter bogus propagation results (> ~60 000 km altitude)
              if (v3.length() > 150) {
                pos[i*3] = pos[i*3+1] = pos[i*3+2] = 0;
                infos.push(null as unknown as SatInfo);
                continue;
              }
              pos[i*3] = v3.x; pos[i*3+1] = v3.y; pos[i*3+2] = v3.z;
              const geo = satellite.eciToGeodetic(eciPos, gmst);
              infos.push({
                name: names[i],
                lat: satellite.degreesLat(geo.latitude),
                lon: satellite.degreesLong(geo.longitude),
                altKm: geo.height,
                velKms: Math.sqrt(eciVel.x**2 + eciVel.y**2 + eciVel.z**2),
                category: cat.key,
                color: cat.color,
              });
            } catch {
              pos[i*3] = pos[i*3+1] = pos[i*3+2] = 0;
              infos.push(null as unknown as SatInfo);
            }
          }

          satInfoMap.set(cat.key, infos);
          pts.geometry.attributes.position.needsUpdate = true;
        }
      }

      for (const cat of CATEGORIES) {
        const pts = catPoints.get(cat.key);
        if (pts) pts.visible = activeCatRef.current.has(cat.key);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObs.disconnect();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('click', onClick);
      if (orbitLine) { orbitLine.geometry.dispose(); orbitLine = null; }
      renderer.dispose();
      if (mount.contains(el)) mount.removeChild(el);
    };
  }, []);

  const toggleCategory = (key: Category) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="sat-view">
      {/* 3D Canvas */}
      <div className="sat-canvas" ref={mountRef}>
        {status && (
          <div className="sat-loading">
            {status}{loading && <span className="traj-dots" />}
          </div>
        )}
        <div className="sat-hint">DRAG · SCROLL · CLICK SATELLITE</div>

        <div className="sat-toggles">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`sat-toggle-btn${activeCategories.has(cat.key) ? ' active' : ''}`}
              style={{ '--cat-color': `#${cat.color.toString(16).padStart(6, '0')}` } as React.CSSProperties}
              onClick={() => toggleCategory(cat.key)}
            >
              <span className="sat-toggle-dot" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className="sat-panel glass-panel">
        <div className="tele-section-label">LIVE TRACKING</div>
        <div className="tele-divider" />

        <div className="tele-row"><span className="tele-key">Satellites</span><span className="tele-val cyan">{satCount.toLocaleString()}</span></div>
        <div className="tele-row"><span className="tele-key">Data Source</span><span className="tele-val">Celestrak TLE</span></div>
        <div className="tele-row"><span className="tele-key">Update Rate</span><span className="tele-val green">1 Hz</span></div>

        <div className="tele-divider" />
        <div className="tele-section-label">CATEGORIES</div>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="tele-row" style={{ opacity: activeCategories.has(cat.key) ? 1 : 0.35 }}>
            <span className="legend-dot" style={{ background: `#${cat.color.toString(16).padStart(6,'0')}`, boxShadow: `0 0 5px #${cat.color.toString(16).padStart(6,'0')}` }} />
            <span className="tele-key">{cat.label}</span>
          </div>
        ))}

        <div className="tele-divider" />

        {selected ? (
          <>
            <div className="tele-section-label">SELECTED</div>
            <div className="tele-row"><span className="tele-key">Name</span><span className="tele-val cyan">{selected.name}</span></div>
            <div className="tele-row">
              <span className="tele-key">Type</span>
              <span className="tele-val" style={{ color: `#${selected.color.toString(16).padStart(6,'0')}` }}>
                {CATEGORIES.find((c) => c.key === selected.category)?.label}
              </span>
            </div>
            <div className="tele-row"><span className="tele-key">Altitude</span><span className="tele-val amber">{selected.altKm.toFixed(0)} km</span></div>
            <div className="tele-row"><span className="tele-key">Velocity</span><span className="tele-val">{selected.velKms.toFixed(2)} km/s</span></div>
            <div className="tele-row"><span className="tele-key">Latitude</span><span className="tele-val">{selected.lat.toFixed(4)}°</span></div>
            <div className="tele-row"><span className="tele-key">Longitude</span><span className="tele-val">{selected.lon.toFixed(4)}°</span></div>
          </>
        ) : (
          <p className="missions-hint">Click a dot to inspect a satellite</p>
        )}
      </div>
    </div>
  );
}