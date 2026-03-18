import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as satellite from 'satellite.js';

type Category = 'stations' | 'starlink' | 'gps-ops' | 'weather';

const CATEGORIES: { key: Category; label: string; color: number; url: string; pixelSize: number }[] = [
  { key: 'stations', label: 'Space Stations', color: 0x00FF96, url: '/celestrak/NORAD/elements/gp.php?GROUP=stations&FORMAT=TLE', pixelSize: 10 },
  { key: 'starlink', label: 'Starlink',        color: 0x00B4FF, url: '/celestrak/NORAD/elements/gp.php?GROUP=starlink&FORMAT=TLE', pixelSize: 10 },
  { key: 'gps-ops',  label: 'GPS',             color: 0xFFB020, url: '/celestrak/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=TLE', pixelSize: 10 },
  { key: 'weather',  label: 'Weather',         color: 0xFF80FF, url: '/celestrak/NORAD/elements/gp.php?GROUP=weather&FORMAT=TLE', pixelSize: 10 },
];

const SAT_VERT = `
  attribute vec3 aColor;
  varying vec3 vColor;
  uniform float uPointSize;
  void main() {
    vColor = aColor;
    gl_PointSize = uPointSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SAT_FRAG = `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float ring  = smoothstep(0.36, 0.44, d);
    float core  = 1.0 - smoothstep(0.0, 0.28, d);
    float alpha = core * 0.95 + ring * 0.8;
    gl_FragColor = vec4(vColor + ring * 0.4, alpha);
  }
`;

const EARTH_VERT = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_FRAG = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D cloudMap;
  uniform vec3 sunDir;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    float cosA  = dot(normalize(vWorldNormal), sunDir);
    vec3  day   = texture2D(dayMap,   vUv).rgb;
    vec3  night = texture2D(nightMap, vUv).rgb * 1.4;
    float cloud = texture2D(cloudMap, vUv).r;
    float t     = smoothstep(-0.1, 0.15, cosA);
    vec3  dayFinal   = mix(day,   vec3(1.0), cloud * 0.75);
    vec3  nightFinal = mix(night, vec3(0.0), cloud * 0.4);
    gl_FragColor = vec4(mix(nightFinal, dayFinal, t), 1.0);
  }
`;

// Approximate sun direction in Three.js scene space from current UTC time
function computeSunDirection(date: Date): THREE.Vector3 {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n  = jd - 2451545.0;
  const L  = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  const g  = (((357.528 + 0.9856003 * n) % 360 + 360) % 360) * Math.PI / 180;
  const lm = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  const ep = 23.439 * Math.PI / 180;
  // ECI (x,y,z) → Three.js (x, z, -y)
  return new THREE.Vector3(
    Math.cos(lm),
    Math.sin(lm) * Math.sin(ep),
    -Math.sin(lm) * Math.cos(ep),
  ).normalize();
}

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

async function fetchWithRetry(url: string, retries = 1): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.trim()) throw new Error('empty response');
      return text;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw new Error('unreachable');
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
  const [loadingCats, setLoadingCats] = useState<Set<Category>>(new Set());

  const activeCatRef = useRef<Set<Category>>(new Set(['stations']));
  useEffect(() => { activeCatRef.current = activeCategories; }, [activeCategories]);

  // Ref to fetchCategory inside the Three.js effect closure
  const fetchCatFnRef = useRef<((key: Category) => void) | null>(null);

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

    scene.add(new THREE.AmbientLight(0x334466, 1.2));
    const now0    = new Date();
    const sunDir0 = computeSunDirection(now0);
    const sun = new THREE.DirectionalLight(0xfff5e0, 2.2);
    sun.position.copy(sunDir0).multiplyScalar(200);
    scene.add(sun);

    // Earth — day/night shader driven by real sun position
    const loader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(EARTH_R, 64, 64);
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        dayMap:   { value: loader.load('/textures/8k_earth_daymap.jpg') },
        nightMap: { value: loader.load('/textures/8k_earth_nightmap.jpg') },
        cloudMap: { value: loader.load('/textures/8k_earth_clouds.jpg') },
        sunDir:   { value: sunDir0.clone() },
      },
      vertexShader:   EARTH_VERT,
      fragmentShader: EARTH_FRAG,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    // One-time GMST alignment so Belgrade sits at its real longitude — no continuous sync
    earth.rotation.y = -satellite.gstime(now0);
    scene.add(earth);

    // Thin cloud layer on top for parallax depth
    const cloudGeo = new THREE.SphereGeometry(EARTH_R * 1.012, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: loader.load('/textures/8k_earth_clouds.jpg'),
      transparent: true, opacity: 0.18, depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(clouds);

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(EARTH_R * 1.06, 32, 32);
    const atmMat = new THREE.MeshBasicMaterial({ color: 0x3366cc, transparent: true, opacity: 0.07, side: THREE.BackSide });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Prevents the abandoned StrictMode first-run from touching the scene after cleanup
    let aborted = false;

    // Satellite data — local Maps, so StrictMode double-invoke each get fresh state
    const catSatrecs = new Map<Category, satellite.SatRec[]>();
    const catNames   = new Map<Category, string[]>();
    const catPoints  = new Map<Category, THREE.Points>();
    const satInfoMap = new Map<Category, SatInfo[]>();

    // Guard: catSatrecs.has() is local to this closure — no stale ref across re-mounts
    const fetchCategory = async (cat: typeof CATEGORIES[0]) => {
      if (catSatrecs.has(cat.key)) return;
      // Reserve the slot immediately to prevent concurrent double-fetch
      catSatrecs.set(cat.key, []);
      setLoadingCats(prev => new Set([...prev, cat.key]));
      try {
        const text = await fetchWithRetry(cat.url);
        if (aborted) return;
        const tles = parseTLE(text);
        if (tles.length === 0) throw new Error('0 TLEs parsed');

        const satrecs: satellite.SatRec[] = [];
        const names: string[] = [];
        tles.forEach(({ name, line1, line2 }) => {
          try { satrecs.push(satellite.twoline2satrec(line1, line2)); names.push(name); } catch { /* skip */ }
        });
        catSatrecs.set(cat.key, satrecs);
        catNames.set(cat.key, names);

        const positions = new Float32Array(satrecs.length * 3);
        const colors    = new Float32Array(satrecs.length * 3);
        const r = ((cat.color >> 16) & 0xff) / 255;
        const g = ((cat.color >>  8) & 0xff) / 255;
        const b = ( cat.color        & 0xff) / 255;
        for (let i = 0; i < satrecs.length; i++) { colors[i*3] = r; colors[i*3+1] = g; colors[i*3+2] = b; }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('aColor',   new THREE.BufferAttribute(colors,    3));
        const mat = new THREE.ShaderMaterial({
          vertexShader: SAT_VERT, fragmentShader: SAT_FRAG,
          uniforms: { uPointSize: { value: cat.pixelSize } },
          transparent: true, depthWrite: false,
        });
        const pts = new THREE.Points(geo, mat);
        pts.frustumCulled = false;
        pts.visible = activeCatRef.current.has(cat.key);
        scene.add(pts);
        catPoints.set(cat.key, pts);
        satInfoMap.set(cat.key, []);

        setSatCount(prev => prev + satrecs.length);
        if (cat.key === 'stations') { setLoading(false); setStatus(''); }
      } catch (err) {
        if (aborted) return;
        // Remove reservation so user can retry by toggling again
        catSatrecs.delete(cat.key);
        if (cat.key === 'stations') { setLoading(false); setStatus(`${cat.label}: failed to load`); }
        else { setStatus(`${cat.label}: failed to load`); }
      } finally {
        if (!aborted) setLoadingCats(prev => { const n = new Set(prev); n.delete(cat.key); return n; });
      }
    };

    // Expose to toggleCategory outside this closure
    fetchCatFnRef.current = (key: Category) => {
      const cat = CATEGORIES.find(c => c.key === key);
      if (cat) fetchCategory(cat);
    };

    // Load stations on mount (it's the default visible category)
    fetchCategory(CATEGORIES[0]);

    // Orbit line for selected satellite
    let orbitLine: THREE.Line | null = null;

    const computeOrbit = (satrec: satellite.SatRec, color: number) => {
      if (orbitLine) { scene.remove(orbitLine); orbitLine.geometry.dispose(); orbitLine = null; }
      if (!satrec.no || satrec.no <= 0 || !isFinite(satrec.no)) return;
      const periodMin = (2 * Math.PI) / satrec.no;
      if (!isFinite(periodMin) || periodMin <= 0 || periodMin > 60_000) return;
      const steps = 120;
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

    // Orbit controls
    let dragging = false, dragMoved = false;
    let prevX = 0, prevY = 0, startX = 0, startY = 0;
    let sph = { theta: 0, phi: Math.PI / 2, radius: 55 };

    const updCam = () => {
      camera.position.set(
        sph.radius * Math.sin(sph.phi) * Math.sin(sph.theta),
        sph.radius * Math.cos(sph.phi),
        sph.radius * Math.sin(sph.phi) * Math.cos(sph.theta),
      );
      camera.lookAt(0, 0, 0);
    };

    // Hover ring — flat ring that always faces the camera
    const hoverRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.28, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
    );
    hoverRing.visible = false;
    hoverRing.frustumCulled = false;
    scene.add(hoverRing);

    // Store category+index at hover time — avoids stale object-reference lookup on click
    let hoveredInfo: SatInfo | null = null;
    let hoveredCatKey: Category | null = null;
    let hoveredIdx = -1;

    const hoverRay = new THREE.Raycaster();
    hoverRay.params.Points!.threshold = 0.15;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true; dragMoved = false;
      prevX = startX = e.clientX; prevY = startY = e.clientY;
      (e.target as Element).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragging) {
        if (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4) dragMoved = true;
        sph.theta -= (e.clientX - prevX) * 0.005;
        sph.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sph.phi - (e.clientY - prevY) * 0.005));
        prevX = e.clientX; prevY = e.clientY;
        updCam();
        hoverRing.visible = false;
        el.style.cursor = 'default';
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      const hMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      camera.updateMatrixWorld();
      hoverRay.setFromCamera(hMouse, camera);
      hoveredInfo = null; hoveredCatKey = null; hoveredIdx = -1;
      hoverRing.visible = false;
      el.style.cursor = 'default';
      for (const cat of CATEGORIES) {
        const pts = catPoints.get(cat.key);
        if (!pts?.visible) continue;
        const hits = hoverRay.intersectObject(pts, false);
        if (hits.length > 0) {
          for (const h of hits) {
            const idx = h.index ?? 0;
            const info = (satInfoMap.get(cat.key) ?? [])[idx];
            if (info) {
              hoveredInfo = info;
              hoveredCatKey = cat.key;
              hoveredIdx = idx;
              const posAttr = pts.geometry.attributes.position;
              hoverRing.position.set(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
              (hoverRing.material as THREE.MeshBasicMaterial).color.setHex(cat.color);
              hoverRing.visible = true;
              el.style.cursor = 'pointer';
              break;
            }
          }
          // Only stop checking categories if we found a valid hit
          if (hoveredInfo) break;
        }
      }
    };
    const onPointerUp = () => { dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sph.radius = Math.max(20, Math.min(150, sph.radius + e.deltaY * 0.05));
      updCam();
    };
    const onClick = () => {
      if (dragMoved) return;
      if (hoveredInfo && hoveredCatKey !== null && hoveredIdx !== -1) {
        setSelected(hoveredInfo);
        const satrec = (catSatrecs.get(hoveredCatKey) ?? [])[hoveredIdx];
        const cat = CATEGORIES.find(c => c.key === hoveredCatKey);
        if (satrec && cat) computeOrbit(satrec, cat.color);
      } else {
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
      const nowAnim = new Date();
      earth.rotation.y  = -satellite.gstime(nowAnim);
      clouds.rotation.y = -satellite.gstime(nowAnim) + nowAnim.getTime() * 1.1e-8;

      const now = new Date();
      const sec = Math.floor(now.getTime() / 1000);
      if (sec !== lastSecond) {
        lastSecond = sec;
        // Update sun direction once per minute (it changes ~0.04°/min)
        if (sec % 60 === 0) {
          const sd = computeSunDirection(now);
          sun.position.copy(sd).multiplyScalar(200);
          earthMat.uniforms.sunDir.value.copy(sd);
        }
        const gmst = satellite.gstime(now);

        for (const cat of CATEGORIES) {
          const satrecs = catSatrecs.get(cat.key);
          const names   = catNames.get(cat.key);
          const pts     = catPoints.get(cat.key);
          if (!satrecs?.length || !pts || !names) continue;

          const pos = (pts.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
          const infos: SatInfo[] = [];

          for (let i = 0; i < satrecs.length; i++) {
            try {
              const pv = satellite.propagate(satrecs[i], now);
              if (!pv || !pv.position || typeof pv.position === 'boolean') {
                pos[i*3] = pos[i*3+1] = pos[i*3+2] = 1e5;
                infos.push(null as unknown as SatInfo);
                continue;
              }
              const eciPos = pv.position as satellite.EciVec3<satellite.Kilometer>;
              const eciVel = (pv.velocity ?? { x: 0, y: 0, z: 0 }) as satellite.EciVec3<satellite.KilometerPerSecond>;
              const v3 = eciToVec3(eciPos, EARTH_R);
              if (v3.length() > 150) {
                pos[i*3] = pos[i*3+1] = pos[i*3+2] = 1e5;
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
              pos[i*3] = pos[i*3+1] = pos[i*3+2] = 1e5;
              infos.push(null as unknown as SatInfo);
            }
          }

          satInfoMap.set(cat.key, infos);
          pts.geometry.attributes.position.needsUpdate = true;
          pts.geometry.boundingSphere = null; // force recompute so raycaster uses updated positions
        }
      }

      for (const cat of CATEGORIES) {
        const pts = catPoints.get(cat.key);
        if (pts) pts.visible = activeCatRef.current.has(cat.key);
      }

      if (hoverRing.visible) hoverRing.quaternion.copy(camera.quaternion);
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
      aborted = true;
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
    // Trigger lazy fetch — fetchCategory inside the closure guards against double-loads
    fetchCatFnRef.current?.(key);
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
          <button
            key={cat.key}
            className={`sat-toggle-btn${activeCategories.has(cat.key) ? ' active' : ''}`}
            style={{ '--cat-color': `#${cat.color.toString(16).padStart(6, '0')}`, width: '100%', marginBottom: 4 } as React.CSSProperties}
            onClick={() => toggleCategory(cat.key)}
          >
            {loadingCats.has(cat.key)
              ? <span className="sat-toggle-spinner" />
              : <span className="sat-toggle-dot" />}
            {cat.label}
          </button>
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