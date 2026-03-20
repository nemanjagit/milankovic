import { useEffect, useState } from 'react';
import {
  getAgencies, getPageRank, getAgencyCommunities, getSimilarity, getConnectivity,
} from '../api';
import type {
  Agency, PageRankEntry, AgencyCommunity, SimilarityPair, ConnectivityComponent,
} from '../api';

// Community colour palette
const COMMUNITY_COLORS = [
  '#00B4FF', '#FF3D5A', '#FFB020', '#00FF96', '#FF80FF', '#FF8040',
];
const COMMUNITY_LABELS = [
  'Cold War US Bloc', 'Soviet / Russian Bloc', 'Asian Programs',
  'European / ESA', 'Commercial Era', 'Emerging Programs',
];

export default function MissionsView() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pagerank' | 'community' | 'similarity' | 'wcc'>('pagerank');

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [pageRank, setPageRank] = useState<PageRankEntry[]>([]);
  const [communities, setCommunities] = useState<AgencyCommunity[]>([]);
  const [similarity, setSimilarity] = useState<SimilarityPair[]>([]);
  const [connectivity, setConnectivity] = useState<ConnectivityComponent[]>([]);

  useEffect(() => {
    Promise.all([
      getAgencies().catch((): Agency[] => []),
      getPageRank().catch((): PageRankEntry[] => []),
      getAgencyCommunities().catch((): AgencyCommunity[] => []),
      getSimilarity().catch((): SimilarityPair[] => []),
      getConnectivity().catch((): ConnectivityComponent[] => []),
    ]).then(([agencyList, pr, comm, sim, conn]) => {
      setAgencies(agencyList);
      setPageRank(pr);
      setCommunities(comm);
      setSimilarity(sim);
      setConnectivity(conn);
      setLoading(false);
    }).catch(console.error);
  }, []);

  // Community data
  const freq: Record<number, number> = {};
  communities.forEach((c) => { freq[c.communityId] = (freq[c.communityId] ?? 0) + 1; });
  const topIds = Object.entries(freq).sort((a, b) => +b[1] - +a[1]).slice(0, 6).map(([id]) => +id);
  const byComm: Record<number, string[]> = {};
  communities.forEach((c) => {
    if (!byComm[c.communityId]) byComm[c.communityId] = [];
    byComm[c.communityId].push(c.agencyName);
  });
  const topComms = topIds.map((id) => ({ id, members: byComm[id] ?? [] }));

  const totalNodes = connectivity.reduce((s, c) => s + c.size, 0);
  const mainComp = connectivity[0];

  if (loading) {
    return (
      <div className="missions-view">
        <div className="missions-loading">LOADING GDS DATA<span className="traj-dots" /></div>
      </div>
    );
  }

  return (
    <div className="missions-view">
      {/* Tab bar */}
      <div className="missions-top-bar">
        {(['pagerank', 'community', 'similarity', 'wcc'] as const).map((t) => (
          <button
            key={t}
            className={`mode-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'pagerank' && 'PAGERANK'}
            {t === 'community' && 'LOUVAIN'}
            {t === 'similarity' && 'NODE SIMILARITY'}
            {t === 'wcc' && 'WCC'}
          </button>
        ))}
      </div>

      <div className="analytics-full">
        <div className="analytics-panel">

          {/* PageRank */}
          {tab === 'pagerank' && (
            <>
              <div className="algo-description">
                <span className="algo-label">CENTRALITY - PageRank</span>
                <p className="algo-text">
                  Measures each agency's influence in the global space exploration network -
                  not just by mission count, but by connectedness to other agencies, rockets
                  and celestial targets.
                </p>
              </div>
              <div className="tele-divider" />
              {pageRank.slice(0, 12).map((e, i) => {
                const max = pageRank[0].score;
                const pct = (e.score / max) * 100;
                const agency = agencies.find((a) => a.name === e.entity);
                return (
                  <div key={e.entity} className="pr-row">
                    <span className="pr-rank">#{i + 1}</span>
                    <div className="pr-bar-wrap">
                      <div className="pr-label">{e.entity}</div>
                      <div className="pr-bar-track">
                        <div className="pr-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="pr-score">{e.score.toFixed(3)}</span>
                    {agency?.country && agency.country !== 'Unknown' && (
                      <span className="pr-country">{agency.country}</span>
                    )}
                  </div>
                );
              })}
              <div className="algo-insight">
                ↑ {pageRank[0]?.entity} ranks #1 - most influential actor in the space exploration graph
              </div>
            </>
          )}

          {/* Louvain */}
          {tab === 'community' && (
            <>
              <div className="algo-description">
                <span className="algo-label">COMMUNITY DETECTION - Louvain</span>
                <p className="algo-text">
                  Groups agencies into communities based on shared rockets, missions and
                  co-targeted bodies. Communities reflect geopolitical blocs and eras.
                </p>
              </div>
              <div className="tele-divider" />
              {topComms.map((comm, i) => (
                <div key={comm.id} className="comm-block">
                  <div className="comm-header">
                    <span className="comm-dot" style={{ background: COMMUNITY_COLORS[i] }} />
                    <span className="comm-name">{COMMUNITY_LABELS[i]}</span>
                    <span className="comm-size">{comm.members.length} agencies</span>
                  </div>
                  <div className="comm-members">
                    {comm.members.slice(0, 5).join(' · ')}
                    {comm.members.length > 5 && ` +${comm.members.length - 5} more`}
                  </div>
                </div>
              ))}
              <div className="algo-insight">
                ↑ Louvain detected {Object.keys(byComm).length} communities - top 6 shown
              </div>
            </>
          )}

          {/* Node Similarity */}
          {tab === 'similarity' && (
            <>
              <div className="algo-description">
                <span className="algo-label">SIMILARITY - Node Similarity</span>
                <p className="algo-text">
                  Identifies agency pairs with the most overlapping mission portfolios -
                  same rockets, same targets. High similarity reveals natural competitors or
                  potential collaboration partners.
                </p>
              </div>
              <div className="tele-divider" />
              {similarity.slice(0, 10).map((s, i) => (
                <div key={i} className="sim-row">
                  <div className="sim-agencies">
                    <span className="sim-a">{s.agency1}</span>
                    <span className="sim-arrow">↔</span>
                    <span className="sim-b">{s.agency2}</span>
                  </div>
                  <div className="sim-bar-track">
                    <div className="sim-bar-fill" style={{ width: `${s.similarity * 100}%` }} />
                  </div>
                  <span className="sim-score">{(s.similarity * 100).toFixed(1)}%</span>
                </div>
              ))}
              <div className="algo-insight">
                ↑ {similarity[0]?.agency1} and {similarity[0]?.agency2} share the most overlapping missions
              </div>
            </>
          )}

          {/* WCC */}
          {tab === 'wcc' && (
            <>
              <div className="algo-description">
                <span className="algo-label">CONNECTIVITY - Weakly Connected Components</span>
                <p className="algo-text">
                  Finds isolated subgraphs. A single dominant component means the global
                  space program is deeply interconnected. Small outliers are short-lived
                  national programs with no shared rockets or targets.
                </p>
              </div>
              <div className="tele-divider" />
              {mainComp && (
                <div className="wcc-main">
                  <div className="tele-row">
                    <span className="tele-key">Main component</span>
                    <span className="tele-val green">{mainComp.size} nodes</span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Coverage</span>
                    <span className="tele-val cyan">
                      {totalNodes > 0 ? ((mainComp.size / totalNodes) * 100).toFixed(1) : '-'}%
                    </span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Total components</span>
                    <span className="tele-val">{connectivity.length}</span>
                  </div>
                  <div className="tele-row">
                    <span className="tele-key">Total nodes</span>
                    <span className="tele-val">{totalNodes}</span>
                  </div>
                </div>
              )}
              <div className="tele-divider" />
              <div className="tele-section-label">ALL COMPONENTS</div>
              {connectivity.map((c, i) => (
                <div key={c.componentId} className="wcc-row">
                  <span className="wcc-rank" style={{ color: i === 0 ? 'var(--green)' : 'var(--dim)' }}>
                    #{i + 1}
                  </span>
                  <span className="wcc-members">
                    {c.members.slice(0, 3).join(', ')}
                    {c.members.length > 3 && '...'}
                  </span>
                  <span className="wcc-size">{c.size}</span>
                </div>
              ))}
              <div className="algo-insight">
                ↑ {mainComp && totalNodes > 0
                  ? `${((mainComp.size / totalNodes) * 100).toFixed(0)}% of all nodes form one connected network`
                  : 'Graph is fully connected'}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}