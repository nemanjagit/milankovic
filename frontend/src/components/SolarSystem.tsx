import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface SolarSystemProps {
  onSelectBody: (name: string) => void;
}

interface PlanetDef {
  name: string;
  radius: number;
  orbitR: number;
  speed: number;
  texture: string;
  tint?: number;
  hasSaturnRing?: boolean;
  isDwarfPlanet?: boolean;
}

const PLANETS: PlanetDef[] = [
  { name: 'Mercury',  radius: 0.8,  orbitR: 8,   speed: 0.047,    texture: '/textures/2k_mercury.jpg' },
  { name: 'Venus',    radius: 1.2,  orbitR: 12,  speed: 0.035,    texture: '/textures/2k_venus_surface.jpg' },
  { name: 'Earth',    radius: 1.3,  orbitR: 17,  speed: 0.030,    texture: '/textures/2k_earth_daymap.jpg' },
  { name: 'Mars',     radius: 1.0,  orbitR: 23,  speed: 0.024,    texture: '/textures/2k_mars.jpg' },
  { name: 'Jupiter',  radius: 3.5,  orbitR: 36,  speed: 0.013,    texture: '/textures/2k_jupiter.jpg' },
  { name: 'Saturn',   radius: 3.0,  orbitR: 50,  speed: 0.009,    texture: '/textures/2k_saturn.jpg', hasSaturnRing: true },
  { name: 'Uranus',   radius: 2.0,  orbitR: 63,  speed: 0.006,    texture: '/textures/2k_uranus.jpg' },
  { name: 'Neptune',  radius: 1.9,  orbitR: 75,  speed: 0.005,    texture: '/textures/2k_neptune.jpg' },
  // Dwarf planets — positioned by compressed AU scale, speed by Kepler T∝a^1.5
  { name: 'Ceres',    radius: 0.5,  orbitR: 28,  speed: 0.0065,   texture: '/textures/2k_ceres_fictional.jpg',    isDwarfPlanet: true },
  { name: 'Pluto',    radius: 0.6,  orbitR: 84,  speed: 0.00121,  texture: '/textures/2k_mercury.jpg', tint: 0xc8a46a, isDwarfPlanet: true },
  { name: 'Haumea',   radius: 0.5,  orbitR: 91,  speed: 0.00106,  texture: '/textures/2k_haumea_fictional.jpg',   isDwarfPlanet: true },
  { name: 'Makemake', radius: 0.55, orbitR: 97,  speed: 0.000965, texture: '/textures/2k_makemake_fictional.jpg', isDwarfPlanet: true },
  { name: 'Eris',     radius: 0.6,  orbitR: 105, speed: 0.000537, texture: '/textures/2k_eris_fictional.jpg',     isDwarfPlanet: true },
];

export default function SolarSystem({ onSelectBody }: SolarSystemProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelectBody);

  useEffect(() => {
    onSelectRef.current = onSelectBody;
  }, [onSelectBody]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const loader = new THREE.TextureLoader();

    // ── Renderer ────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1);
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ───────────────────────────────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 4000);
    camera.position.set(0, 55, 95);
    camera.lookAt(0, 0, 0);

    // ── Lights ───────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);

    const sunLight = new THREE.PointLight(0xfff5cc, 6, 500);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // ── Milky Way skybox ─────────────────────────────────────────────
    const skyTex = loader.load('/textures/8k.jpg');
    skyTex.minFilter = THREE.LinearMipmapLinearFilter;
    skyTex.magFilter = THREE.LinearFilter;
    skyTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const skyGeo = new THREE.SphereGeometry(1800, 128, 128);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      color: new THREE.Color(0.18, 0.18, 0.18),
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // ── Sun ──────────────────────────────────────────────────────────
    const sunGeo = new THREE.SphereGeometry(6.5, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ map: loader.load('/textures/2k_sun.jpg') });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    // Sun glow — radial gradient sprites with additive blending for smooth fade
    const makeGlowSprite = (size: number, innerColor: string, outerColor: string) => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0,   innerColor);
      grad.addColorStop(0.3, outerColor);
      grad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(c);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(size);
      scene.add(sprite);
      return sprite;
    };
    const halo1 = makeGlowSprite(22,  'rgba(255,240,180,0.9)', 'rgba(255,180,50,0.4)');
    const halo2 = makeGlowSprite(40,  'rgba(255,160,30,0.25)', 'rgba(255,80,0,0.08)');
    const halo3 = makeGlowSprite(65,  'rgba(255,60,0,0.08)',   'rgba(200,20,0,0.0)');
    const halo4 = makeGlowSprite(100, 'rgba(180,30,0,0.04)',   'rgba(0,0,0,0)');

    // ── Planet helpers ───────────────────────────────────────────────
    interface PlanetObj {
      name: string;
      mesh: THREE.Mesh;
      orbitR: number;
      speed: number;
      angle: number;
      pivot: THREE.Group;
    }

    const planetObjs: PlanetObj[] = [];
    const clickableMeshes: THREE.Mesh[] = [];

    PLANETS.forEach((def, i) => {
      // Orbit line
      const orbitPoints: THREE.Vector3[] = [];
      const SEG = 128;
      for (let s = 0; s <= SEG; s++) {
        const a = (s / SEG) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(a) * def.orbitR, 0, Math.sin(a) * def.orbitR));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: def.isDwarfPlanet ? 0x3a3a4a : 0x555555,
        transparent: true,
        opacity: def.isDwarfPlanet ? 0.12 : 0.25,
      });
      scene.add(new THREE.LineLoop(orbitGeo, orbitMat));

      // Planet sphere
      const geo = new THREE.SphereGeometry(def.radius, 48, 48);
      const mat = new THREE.MeshStandardMaterial({
        map: loader.load(def.texture),
        ...(def.tint !== undefined ? { color: new THREE.Color(def.tint) } : {}),
        roughness: 0.8,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { planetName: def.name };

      // Pivot group so we can rotate around origin
      const pivot = new THREE.Group();
      pivot.add(mesh);
      scene.add(pivot);

      // Initial position
      const initAngle = (i / PLANETS.length) * Math.PI * 2;
      mesh.position.set(def.orbitR, 0, 0);
      pivot.rotation.y = initAngle;

      // Saturn ring
      if (def.hasSaturnRing) {
        const inner = def.radius * 1.25, outer = def.radius * 2.55;
        const ringGeo = new THREE.RingGeometry(inner, outer, 80);

        // Remap UVs radially (RingGeometry lies in XY plane)
        const pos = ringGeo.attributes.position;
        const uv  = ringGeo.attributes.uv;
        for (let j = 0; j < pos.count; j++) {
          const x = pos.getX(j), y = pos.getY(j);
          const r = Math.sqrt(x * x + y * y);
          uv.setXY(j, (r - inner) / (outer - inner), 0.5);
        }
        uv.needsUpdate = true;

        const ringTex = loader.load('/textures/2k_saturn_ring_alpha.png');
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = 0.47;
        mesh.add(ring);
      }

      clickableMeshes.push(mesh);
      planetObjs.push({ name: def.name, mesh, orbitR: def.orbitR, speed: def.speed, angle: initAngle, pivot });
    });

    // ── Selection glow (inner + outer halo for natural falloff) ─────
    const glowInner = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x00B4FF, transparent: true, opacity: 0.35, depthWrite: false })
    );
    const glowOuter = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x0066cc, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.BackSide })
    );
    glowInner.visible = false;
    glowOuter.visible = false;
    scene.add(glowInner);
    scene.add(glowOuter);

    let selectedMesh: THREE.Mesh | null = null;

    // ── Raycaster / click ────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      if (isDragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const name = hits[0].object.userData.planetName as string;
        if (name) {
          selectedMesh = hits[0].object as THREE.Mesh;
          glowInner.visible = true;
          glowOuter.visible = true;
          onSelectRef.current(name);
        }
      } else {
        selectedMesh = null;
        glowInner.visible = false;
        glowOuter.visible = false;
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    // ── Manual orbit controls ────────────────────────────────────────
    let isDragging   = false;
    let prevMouse    = { x: 0, y: 0 };
    let spherical    = { theta: 0.3, phi: 0.95, radius: camera.position.length() };
    let autoRotate   = true;

    const updateCamera = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);
    };

    spherical.radius = camera.position.length();
    spherical.theta  = Math.atan2(camera.position.x, camera.position.z);
    spherical.phi    = Math.acos(camera.position.y / spherical.radius);

    const onMouseDown = (e: MouseEvent) => {
      isDragging  = true;
      autoRotate  = false;
      prevMouse   = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };
      spherical.theta -= dx * 0.005;
      spherical.phi    = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.005));
      updateCamera();
    };
    const onWheel = (e: WheelEvent) => {
      spherical.radius = Math.max(20, Math.min(400, spherical.radius + e.deltaY * 0.08));
      updateCamera();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });

    // ── Resize handler ───────────────────────────────────────────────
    const handleResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(mount);

    // ── Animation loop ───────────────────────────────────────────────
    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      sun.rotation.y += delta * 0.05;

      // Pulse sun halos
      const sp = Math.sin(performance.now() * 0.0008);
      (halo1.material as THREE.SpriteMaterial).opacity = 1.0 + sp * 0.08;
      (halo2.material as THREE.SpriteMaterial).opacity = 1.0 + sp * 0.05;
      (halo3.material as THREE.SpriteMaterial).opacity = 1.0 + sp * 0.03;
      (halo4.material as THREE.SpriteMaterial).opacity = 1.0 + sp * 0.02;

      planetObjs.forEach((p) => {
        p.angle += p.speed * delta * 10;
        p.pivot.rotation.y = p.angle;
        p.mesh.rotation.y += delta * 0.2;
      });

      // Track glow to selected planet and pulse it
      if (selectedMesh && glowInner.visible) {
        const worldPos = new THREE.Vector3();
        selectedMesh.getWorldPosition(worldPos);
        glowInner.position.copy(worldPos);
        glowOuter.position.copy(worldPos);
        const r = (selectedMesh.geometry as THREE.SphereGeometry).parameters.radius;
        const pulse = Math.sin(performance.now() * 0.003) * 0.08;
        glowInner.scale.setScalar(r * (1.15 + pulse));
        glowOuter.scale.setScalar(r * (1.55 + pulse));
        (glowInner.material as THREE.MeshBasicMaterial).opacity = 0.30 + pulse * 0.5;
        (glowOuter.material as THREE.MeshBasicMaterial).opacity = 0.10 + pulse * 0.2;
      }

      if (autoRotate) {
        spherical.theta += 0.0008;
        updateCamera();
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ──────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      resizeObs.disconnect();
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="scene-area" ref={mountRef}>
      <div className="scene-label">SOLAR SYSTEM — DRAG TO ROTATE · SCROLL TO ZOOM · CLICK PLANET</div>
    </div>
  );
}