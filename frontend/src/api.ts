// ── Token management ─────────────────────────────────────────────────────────
export const getToken   = ()           => localStorage.getItem('jwtToken');
export const setToken   = (t: string)  => localStorage.setItem('jwtToken', t);
export const clearToken = ()           => localStorage.removeItem('jwtToken');

// ── In-memory cache (5-minute TTL) ───────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; ts: number }>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

export function clearCache() { cache.clear(); }

// ── Base fetch ────────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, opts: RequestInit = {}, useCache = false): Promise<T> {
  if (useCache && opts.method === undefined) {
    const cached = cacheGet<T>(path);
    if (cached !== null) return cached;
  }
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(path, { ...opts, headers });
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error('401 Unauthorized');
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json() as T;
  if (useCache && opts.method === undefined) cacheSet(path, data);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(username: string, password: string): Promise<string> {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const data = await res.json() as { token: string };
  setToken(data.token);
  return data.token;
}

// ── Bodies ────────────────────────────────────────────────────────────────────
export interface PagedResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  page?: { totalElements: number; totalPages: number; size: number; number: number };
}

export interface BodySummary {
  id: string;           // String in backend
  name: string;
  bodyType: string;
  mass: number | null;
  radius: number | null;
  meanTemp: number | null;
  discoveredBy: string | null;
}

export interface OrbitalData {
  semiMajorAxis: number | null;
  periodDays: number | null;
  eccentricity: number | null;
  inclination: number | null;
  velocityKmS: number | null;
}

export interface PhysicalProperties {
  gravity: number | null;
  escapeSpeed: number | null;
  rotationPeriod: number | null;
  axialTilt: number | null;
  surfacePressure: number | null;
}

export interface MoonSummary {
  id: string;
  name: string;
}

export interface BodyDetail {
  id: string;
  name: string;
  bodyType: string;
  mass: number | null;
  radius: number | null;
  meanTemp: number | null;
  discoveredBy: string | null;
  orbitalData: OrbitalData | null;
  physicalProperties: PhysicalProperties | null;
  moons: MoonSummary[];
}

export interface BodyStats {
  countByType: Record<string, number>;
  averageMass: number;
  totalBodies: number;
}

export function getBodies(page = 0, size = 20, type?: string) {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (type) q.set('type', type);
  return apiFetch<PagedResponse<BodySummary>>(`/bodies?${q}`);
}

export function getBodyStats() {
  return apiFetch<BodyStats>('/bodies/stats');
}

export async function getBodyDetail(id: string): Promise<BodyDetail> {
  const [body, moons] = await Promise.all([
    apiFetch<BodyDetail>(`/bodies/${id}`),
    apiFetch<MoonSummary[]>(`/bodies/${id}/moons`).catch(() => [] as MoonSummary[]),
  ]);
  return { ...body, moons };
}

export function searchBodies(name: string) {
  return apiFetch<BodySummary[]>(`/bodies/search?name=${encodeURIComponent(name)}`);
}

// ── Missions ──────────────────────────────────────────────────────────────────
export interface Mission {
  id: string;
  name: string;
  date: string;
  status: string;
  costUsd: number | null;
}

export interface Agency {
  name: string;
  country: string;
  type: string;
  missionCount?: number;
}

export function getMissions(page = 0, size = 50) {
  return apiFetch<PagedResponse<Mission>>(`/missions?page=${page}&size=${size}`, {}, true);
}

export function getAgencies() {
  return apiFetch<Agency[]>('/agencies', {}, true);
}

export function getAgencyMissions(name: string) {
  return apiFetch<Mission[]>(`/agencies/${encodeURIComponent(name)}/missions`, {}, true);
}

export interface PageRankEntry { entity: string; score: number; }
export function getPageRank() {
  return apiFetch<PageRankEntry[]>('/analytics/pagerank', {}, true);
}

export interface CollaborationEdge { source: string; target: string; weight: number; }
export function getCollaborations() {
  return apiFetch<CollaborationEdge[]>('/agencies/collaborations', {}, true);
}

export interface MissionSummary { agencyName: string; agencyCountry: string; status: string; date: string; }
export function getMissionSummaries() {
  return apiFetch<MissionSummary[]>('/missions/summary', {}, true);
}

export interface AgencyCommunity { agencyName: string; communityId: number; }
export function getAgencyCommunities() {
  return apiFetch<AgencyCommunity[]>('/analytics/agency-communities', {}, true);
}

export interface SimilarityPair { agency1: string; agency2: string; similarity: number; }
export function getSimilarity() {
  return apiFetch<SimilarityPair[]>('/analytics/similarity', {}, true);
}

export interface ConnectivityComponent { componentId: number; size: number; members: string[]; }
export function getConnectivity() {
  return apiFetch<ConnectivityComponent[]>('/analytics/connectivity', {}, true);
}

export interface TargetStats { name: string; type: string; missionCount: number; }
export function getTargets() {
  return apiFetch<TargetStats[]>('/targets', {}, true);
}

export function getTargetMissions(name: string) {
  return apiFetch<Mission[]>(`/targets/${encodeURIComponent(name)}/missions`, {}, true);
}

// ── Threats ───────────────────────────────────────────────────────────────────
export interface SmallBody {
  id: string;
  name: string;
  absMagnitude: number | null;
  diameterKm: number | null;
  hazardous: boolean;
}

interface SmallBodyWithApproaches extends SmallBody {
  approaches: { date: string; distanceAu: number }[];
}

export interface ApproachEntry {
  bodyName: string;
  date: string;
  distanceAu: number;
  distanceLd: number;
}

export function getHazardous() {
  return apiFetch<SmallBody[]>('/threats/hazardous', {}, true);
}

export async function getThreatApproaches(planet: string): Promise<ApproachEntry[]> {
  const bodies = await apiFetch<SmallBodyWithApproaches[]>(
    `/threats/approaches?planet=${encodeURIComponent(planet)}`, {}, true
  );
  return bodies
    .flatMap((b) =>
      (b.approaches ?? []).map((a) => ({
        bodyName: b.name,
        date: a.date,
        distanceAu: a.distanceAu,
        distanceLd: a.distanceAu / 0.00257,
      }))
    )
    .sort((x, y) => x.distanceAu - y.distanceAu);
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export interface Alert {
  id: number;
  severity: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
  status: string;
  planetName: string;
  bodyId: string;
  distanceAu: number | null;
  createdAt: string;
}

export interface AlertDashboard {
  openAlertsBySeverity: Record<string, number>;
  mostThreatenedPlanets: Record<string, number>;
  alertsLast30Days: number;
  totalOpenAlerts: number;
}

export function getAlertsDashboard() {
  return apiFetch<AlertDashboard>('/alerts/dashboard', {}, true);
}

export function getAlerts() {
  return apiFetch<Alert[]>('/alerts', {}, true);
}

export async function escalateAlert(id: number) {
  return apiFetch<Alert>(`/alerts/${id}/escalate`, { method: 'POST' });
}