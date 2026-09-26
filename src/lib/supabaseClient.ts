import { createClient } from '@supabase/supabase-js';
import { Competitor, Match, SportId, UserRoster } from '../types';
import { getDeviceId } from './deviceIdentity';
import { getCurrentNFLWeek } from './espnSync';
import {
  DEFAULT_NFL_COMPETITORS,
  DEFAULT_NFL_MATCHES,
  getTeamColors,
  getTeamFullName,
  getUniformNumber,
  sortMatchesByKickoffAndStatus,
} from '../utils/teamData';
import { getStarterManifestDepth, isRetiredPlayer, ROSTER_CACHE_VERSION } from '../data/nflRosterManifest';
import {
  DEFAULT_NBA_COMPETITORS,
  DEFAULT_NBA_MATCHES,
  getNBATeamColors,
  getNBATeamFullName,
} from '../utils/nbaTeamData';

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
const procEnv = typeof process !== 'undefined' ? process.env : {};

export const SUPABASE_URL =
  procEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  procEnv?.VITE_SUPABASE_URL ||
  procEnv?.SUPABASE_URL ||
  metaEnv?.VITE_SUPABASE_URL ||
  'https://sqntjgjqtwbcqpxcqzbg.supabase.co';

export function resolveSupabaseAnonKey(): string {
  // 1. Check URL query params (?k= or ?anonKey=)
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const p = new URLSearchParams(window.location.search);
      const urlKey = p.get('k') || p.get('anonKey') || p.get('anon');
      if (urlKey && urlKey.trim() && !urlKey.startsWith('your-') && urlKey !== 'anon-key-placeholder') {
        const clean = urlKey.trim();
        try {
          localStorage.setItem('pixel_pros_supabase_anon_key', clean);
        } catch {}
        return clean;
      }
    }
  } catch {}

  // 2. Check localStorage saved key
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('pixel_pros_supabase_anon_key');
      if (saved && saved.trim() && !saved.startsWith('your-') && saved !== 'anon-key-placeholder') {
        return saved.trim();
      }
    }
  } catch {}

  // 3. Check environment variables
  const envKey =
    procEnv?.VITE_SUPABASE_ANON_KEY ||
    metaEnv?.VITE_SUPABASE_ANON_KEY ||
    procEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    procEnv?.SUPABASE_ANON_KEY ||
    procEnv?.SUPABASE_SERVICE_ROLE_KEY ||
    '';

  if (envKey && envKey.trim() && !envKey.startsWith('your-') && envKey !== 'anon-key-placeholder') {
    return envKey.trim();
  }
  // Public anon key for Supabase project sqntjgjqtwbcqpxcqzbg (safe client-side key)
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbnRqZ2pxdHdiY3FweGNxemJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTk2NzYsImV4cCI6MjEwNDc5NTY3Nn0.2M_u9c6g2yWm2Ev0e_FeucFSnEFTCeerVvpNwNTdI4g';
}

export function checkSupabaseConfigured(): boolean {
  return Boolean(resolveSupabaseAnonKey());
}

export let isSupabaseConfigured: boolean = checkSupabaseConfigured();

let currentClientInstance: any = null;
let currentKeyCached: string = resolveSupabaseAnonKey();

export function getSupabaseClient() {
  const activeKey = resolveSupabaseAnonKey();
  if (!currentClientInstance || activeKey !== currentKeyCached) {
    currentKeyCached = activeKey;
    isSupabaseConfigured = Boolean(activeKey);
    currentClientInstance = createClient(
      SUPABASE_URL,
      activeKey || 'anon-key-placeholder',
      {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }
  return currentClientInstance;
}

export function setCustomSupabaseKey(newKey: string): boolean {
  const clean = (newKey || '').trim();
  if (!clean || clean.startsWith('your-') || clean === 'anon-key-placeholder') {
    try {
      localStorage.removeItem('pixel_pros_supabase_anon_key');
    } catch {}
    currentKeyCached = '';
    currentClientInstance = null;
    isSupabaseConfigured = false;
    window.dispatchEvent(new CustomEvent('pixel_pros_supabase_configured', { detail: { key: '' } }));
    return false;
  }

  try {
    localStorage.setItem('pixel_pros_supabase_anon_key', clean);
  } catch {}

  currentKeyCached = clean;
  isSupabaseConfigured = true;
  currentClientInstance = createClient(SUPABASE_URL, clean, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  window.dispatchEvent(new CustomEvent('pixel_pros_supabase_configured', { detail: { key: clean } }));
  window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: { reloaded: true } }));
  return true;
}

export const SUPABASE_ANON_KEY = resolveSupabaseAnonKey() || 'anon-key-placeholder';

// Proxy object so all calls to `supabase.from(...)` automatically use the fresh dynamic client
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseClient();
      const val = client[prop];
      if (typeof val === 'function') {
        return val.bind(client);
      }
      return val;
    },
  }
) as any;

const SKIN_TONES = ['#f7d7b5', '#d98c55', '#8c532b', '#e6ba8c', '#5c3509'];
function getSkinTone(name?: string): string {
  if (!name) return '#d98c55';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return SKIN_TONES[Math.abs(hash) % SKIN_TONES.length];
}

export function mapRowToCompetitor(row: any): Competitor {
  const rowSport = String(row.sport || row.sport_id || 'nfl').toLowerCase();
  const rawId = String(row.id || '');
  const rawName = String(row.name || row.display_name || (rowSport === 'nba' ? 'NBA Star' : 'NFL Pro')).trim();
  const rawTeam = String(row.team || row.team_code || (rowSport === 'nba' ? 'NBA' : 'NFL')).trim().toUpperCase();
  const rawPos = String(row.position || 'STAR').trim().toUpperCase();
  const rawScore = Math.max(0, Math.round(Number(row.score ?? row.fantasy_points ?? 0)));

  const statsObj = typeof row.stats === 'object' && row.stats !== null ? row.stats : {};
  const parts = rawName.split(/\s+/);
  const shortName = (row.short_name || parts[parts.length - 1] || 'PRO').toUpperCase();
  const uniformNum = Number(row.uniform_number || row.jersey_number || getUniformNumber(rawName, rawId));

  if (rowSport === 'nba') {
    const nbaColors = getNBATeamColors(rawTeam);
    const pts = Number(statsObj.pts ?? statsObj.points ?? 0);
    const threePm = Number(statsObj.three_pm ?? statsObj.threes ?? 0);
    const reb = Number(statsObj.reb ?? statsObj.rebounds ?? 0);
    const ast = Number(statsObj.ast ?? statsObj.assists ?? 0);
    const blk = Number(statsObj.blk ?? statsObj.blocks ?? 0);
    const stl = Number(statsObj.stl ?? statsObj.steals ?? 0);
    const bigStops = Number(statsObj.big_stops ?? (blk + stl));

    return {
      id: rawId,
      sportId: 'nba',
      displayName: rawName,
      shortName,
      uniformNumber: uniformNum,
      teamName: getNBATeamFullName(rawTeam),
      teamCode: rawTeam,
      positionGeneric:
        rawPos === 'PG' || rawPos === 'SG'
          ? 'PLAYMAKER'
          : rawPos === 'C' || rawPos === 'PF'
          ? 'OFFENSE'
          : 'SCORER',
      position: rawPos !== 'STAR' ? rawPos : 'PG',
      rating: rawScore > 42 ? 99 : rawScore > 35 ? 95 : 90,
      score: rawScore,
      stats: {
        ...statsObj,
        pts,
        points: pts,
        three_pm: threePm,
        threes: threePm,
        reb,
        rebounds: reb,
        ast,
        assists: ast,
        blocks: blk,
        steals: stl,
        big_stops: bigStops,
        primaryMetricLabel: '3-Pointers',
        primaryMetricValue: threePm,
      },
      badges: rawScore >= 42 ? ['diamond_crystal', 'gold_star'] : ['gold_star'],
      avatar: {
        helmetColor: nbaColors.jersey,
        jerseyColor: nbaColors.jersey,
        stripeColor: nbaColors.stripe,
        skinTone: getSkinTone(rawName),
        number: uniformNum,
      },
    };
  }

  // NFL Mapping
  const passYds = Number(statsObj.pass_yds ?? statsObj.passing_yards ?? statsObj.passingYards ?? 0);
  const rushYds = Number(statsObj.rush_yds ?? statsObj.rushing_yards ?? statsObj.rushingYards ?? 0);
  const recYds = Number(statsObj.rec_yds ?? statsObj.receiving_yards ?? statsObj.receivingYards ?? 0);
  const tds = Number(statsObj.tds ?? statsObj.touchdowns ?? 0);
  const fgs = Number(statsObj.fgs ?? statsObj.field_goals ?? 0);
  const stops = Number(statsObj.stops ?? statsObj.defensive_stops ?? 0);
  const totalScrimmageYards = passYds + rushYds + recYds;
  const teamColors = getTeamColors(rawTeam);
  const manifestDepth = getStarterManifestDepth(rawName, rawTeam, row.athlete_id || rawId);
  const rawDepthRank = Number(row.depth_rank || row.depthRank || 0);
  const rawDepthOrder = String(row.depth_order || row.depthOrder || '').trim();
  const depthRankVal = rawDepthRank > 0 ? rawDepthRank : manifestDepth?.depthRank || 1;
  const depthOrderVal = rawDepthOrder ? rawDepthOrder : manifestDepth?.depthOrder || `${rawPos}${depthRankVal}`;

  return {
    id: rawId,
    athleteId: String(row.athlete_id || row.athleteId || rawId).replace(/^nfl_/, ''),
    sportId: 'nfl',
    displayName: rawName,
    shortName,
    uniformNumber: uniformNum,
    teamName: getTeamFullName(rawTeam),
    teamCode: rawTeam,
    positionGeneric: rawPos === 'K' ? 'SCORER' : rawPos === 'QB' ? 'PLAYMAKER' : 'OFFENSE',
    position: rawPos,
    depthRank: depthRankVal,
    depthOrder: depthOrderVal,
    injuryStatus: (row.injury_status || row.injuryStatus || null) as any,
    injuryDetail: row.injury_detail || row.injuryDetail || '',
    rating: rawScore > 30 ? 99 : rawScore > 15 ? 93 : 88,
    score: rawScore,
    stats: {
      ...statsObj,
      pass_yds: passYds,
      rush_yds: rushYds,
      rec_yds: recYds,
      tds: tds,
      fgs: fgs,
      stops: stops,
      passingYards: passYds,
      rushingYards: rushYds,
      receivingYards: recYds,
      touchdowns: tds,
      total_yards: totalScrimmageYards,
      primaryMetricLabel: 'Touchdowns',
      primaryMetricValue: tds,
    },
    badges: rawScore >= 30 ? ['diamond_crystal', 'gold_star'] : rawScore >= 15 ? ['gold_star'] : ['shield_badge'],
    avatar: {
      helmetColor: teamColors.helmet,
      jerseyColor: teamColors.jersey,
      stripeColor: teamColors.stripe,
      skinTone: getSkinTone(rawName),
      number: uniformNum,
    },
  };
}

export function deduplicateCompetitors(competitors: Competitor[]): Competitor[] {
  if (!Array.isArray(competitors)) return [];
  const seenKeys = new Set<string>();
  const deduped: Competitor[] = [];

  for (const c of competitors) {
    if (!c) continue;
    if (isRetiredPlayer(c.displayName)) continue;

    // Roster Accuracy Enforcement: Daniel Jones is on the Indianapolis Colts (IND)
    if (
      (c.athleteId === '3917792' || (c.displayName || '').toLowerCase() === 'daniel jones') &&
      c.teamCode !== 'IND'
    ) {
      c.teamCode = 'IND';
      c.teamName = 'Indianapolis Colts';
      if (c.avatar) {
        const indColors = getTeamColors('IND');
        c.avatar.jerseyColor = indColors.jersey;
        c.avatar.helmetColor = indColors.helmet;
        c.avatar.pantsColor = indColors.pants;
      }
    }

    const normKey = `${(c.displayName || c.shortName || '').trim().toLowerCase()}__${(c.teamCode || '').trim().toUpperCase()}`;
    if (!normKey || normKey === '__') continue;

    if (seenKeys.has(normKey)) continue;
    seenKeys.add(normKey);
    deduped.push(c);
  }

  return deduped;
}

function getLocalSyncedCompetitors(sport: SportId): Competitor[] | null {
  try {
    const version = localStorage.getItem('pixel_pros_roster_cache_version');
    if (version !== ROSTER_CACHE_VERSION) {
      localStorage.removeItem('pixel_pros_synced_competitors_nfl');
      localStorage.removeItem('pixel_pros_synced_competitors_nba');
      localStorage.setItem('pixel_pros_roster_cache_version', ROSTER_CACHE_VERSION);
      return null;
    }
    const raw = localStorage.getItem(`pixel_pros_synced_competitors_${sport}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const base = sport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
        const map = new Map<string, Competitor>();
        for (const b of base) {
          const key = `${(b.displayName || '').trim().toLowerCase()}_${(b.teamCode || '').trim().toUpperCase()}`;
          map.set(key, b);
        }
        for (const p of parsed) {
          if (!p) continue;
          if (isRetiredPlayer(p.displayName)) continue;
          const pNameLower = (p.displayName || '').toLowerCase();
          // Purge stale player records from older seasons
          if (pNameLower === 'jacoby brissett' && p.teamCode !== 'ARI') continue;
          if (pNameLower === 'joe milton iii' && p.teamCode === 'NE') continue;
          if (pNameLower === 'mac jones' && p.teamCode !== 'SF') continue;
          if (pNameLower === 'c.j. beathard' && p.teamCode === 'JAX') continue;
          if (
            (p.athleteId === '3917792' || pNameLower === 'daniel jones') &&
            p.teamCode !== 'IND'
          ) {
            continue;
          }
          const key = `${(p.displayName || p.shortName || '').trim().toLowerCase()}_${(p.teamCode || '').trim().toUpperCase()}`;
          if (map.has(key)) {
            const existing = map.get(key)!;
            map.set(key, {
              ...existing,
              score: p.score ?? existing.score,
              rating: p.rating ?? existing.rating,
              badges: p.badges ?? existing.badges,
              stats: { ...existing.stats, ...p.stats },
              seasonStats: p.seasonStats || existing.seasonStats,
              season_stats: p.seasonStats || existing.seasonStats,
              lastGameScore: p.lastGameScore ?? existing.lastGameScore,
              lastGameStats: p.lastGameStats ?? existing.lastGameStats,
            });
          }
        }
        return deduplicateCompetitors(Array.from(map.values()));
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function getLocalSyncedMatches(sport: SportId): Match[] | null {
  try {
    const raw = localStorage.getItem(`pixel_pros_synced_matches_${sport}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (sport === 'nfl') {
          const curWeek = getCurrentNFLWeek();
          // Filter to only matches belonging to the active NFL week
          const currentWeekMatches = parsed.filter((m: any) => !m.week || m.week === curWeek);
          // If the cached matches belong to a previous week, invalidate cache
          if (currentWeekMatches.length === 0) {
            localStorage.removeItem(`pixel_pros_synced_matches_${sport}`);
            return null;
          }
          return sortMatchesByKickoffAndStatus(currentWeekMatches);
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function fetchLiveCompetitors(sport: SportId = 'nfl'): Promise<Competitor[]> {
  const fallback = deduplicateCompetitors(
    getLocalSyncedCompetitors(sport) ||
    (sport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS)
  );
  if (!isSupabaseConfigured) {
    return fallback;
  }
  try {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.warn(`Error fetching ${sport} competitors:`, error.message);
      return fallback;
    }

    if (!data || data.length === 0) {
      return fallback;
    }

    const filtered = data.filter((row: any) => {
      const rowSport = String(row.sport || row.sport_id || '').toLowerCase();
      if (sport === 'nba') {
        return rowSport === 'nba';
      }
      return rowSport !== 'nba';
    });

    if (filtered.length === 0) {
      return fallback;
    }

    const mapped = filtered.map(mapRowToCompetitor);
    
    // STRICT CANONICAL VALIDATION: Only canonical manifest players are accepted.
    // Live scores and stats update their profiles, preventing phantom/stale players from polluting the roster.
    const baseList = sport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
    const baseMap = new Map<string, Competitor>();
    for (const b of baseList) {
      const key = `${(b.displayName || '').trim().toLowerCase()}__${(b.teamCode || '').trim().toUpperCase()}`;
      baseMap.set(key, b);
    }

    const mergedMap = new Map<string, Competitor>();

    for (const s of mapped) {
      if (isRetiredPlayer(s.displayName)) continue;
      const key = `${(s.displayName || '').trim().toLowerCase()}__${(s.teamCode || '').trim().toUpperCase()}`;
      if (sport === 'nfl') {
        const canonical = baseMap.get(key);
        if (canonical) {
          const stats = { ...canonical.stats, ...s.stats };
          const hasRealStats =
            (stats.pass_yds || 0) > 0 ||
            (stats.rush_yds || 0) > 0 ||
            (stats.rec_yds || 0) > 0 ||
            (stats.tds || 0) > 0 ||
            (stats.fgs || 0) > 0 ||
            (stats.stops || 0) > 0;
          const verifiedScore = hasRealStats ? (s.score ?? canonical.score) : 0;

          mergedMap.set(key, {
            ...canonical,
            score: verifiedScore,
            rating: s.rating ?? canonical.rating,
            badges: s.badges ?? canonical.badges,
            stats,
            seasonStats: s.seasonStats || canonical.seasonStats,
            season_stats: s.seasonStats || canonical.seasonStats,
            lastGameScore: s.lastGameScore ?? canonical.lastGameScore,
            lastGameStats: s.lastGameStats ?? canonical.lastGameStats,
            injuryStatus: s.injuryStatus ?? canonical.injuryStatus,
            injuryDetail: s.injuryDetail ?? canonical.injuryDetail,
          });
        }
      } else {
        mergedMap.set(key, s);
      }
    }

    for (const [key, b] of baseMap.entries()) {
      if (!mergedMap.has(key)) {
        mergedMap.set(key, { ...b });
      }
    }

    const mergedList = Array.from(mergedMap.values());
    return deduplicateCompetitors(mergedList);
  } catch (err) {
    console.warn(`Exception during ${sport} competitors fetch:`, err);
    return fallback;
  }
}

export async function fetchLiveNFLCompetitors(): Promise<Competitor[]> {
  return fetchLiveCompetitors('nfl');
}

export async function reseedMasterNFLManifest(): Promise<{ success: boolean; count: number; error?: string }> {
  const allStarters = DEFAULT_NFL_COMPETITORS;
  const allMatches = DEFAULT_NFL_MATCHES;
  try {
    localStorage.setItem('pixel_pros_synced_competitors_nfl', JSON.stringify(allStarters));
    localStorage.setItem('pixel_pros_synced_matches_nfl', JSON.stringify(allMatches));

    if (isSupabaseConfigured) {
      const records = allStarters.map((comp) => ({
        id: comp.id,
        name: comp.displayName,
        team: comp.teamCode,
        sport: 'nfl',
        position: comp.position || 'STAR',
        score: comp.score,
        stats: comp.stats,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('competitors').upsert(records, { onConflict: 'id' });
      if (error) {
        console.warn('Error reseeding competitors to Supabase:', error);
      }

      const matchRecords = allMatches.map((m) => ({
        id: m.id,
        sport: 'nfl',
        home_team: m.homeTeamCode,
        away_team: m.awayTeamCode,
        home_score: m.homeScore || 0,
        away_score: m.awayScore || 0,
        status: m.status,
        quarter_time: m.quarter_time || 'SCHEDULED',
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('matches').upsert(matchRecords, { onConflict: 'id' });
    }
    return { success: true, count: allStarters.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message };
  }
}

export async function fetchLiveMatches(sport: SportId = 'nfl'): Promise<Match[]> {
  const currentNFLWeek = getCurrentNFLWeek();
  const localSynced = getLocalSyncedMatches(sport);
  const defaultMatches = sport === 'nba' ? DEFAULT_NBA_MATCHES : DEFAULT_NFL_MATCHES;
  const rawFallback = localSynced || defaultMatches;

  // Safe fallback ensuring only current week matches are returned
  const fallback = sport === 'nfl'
    ? rawFallback.filter((m) => !m.week || m.week === currentNFLWeek)
    : rawFallback;

  if (!isSupabaseConfigured) {
    return fallback;
  }
  try {
    const { data, error } = await supabase.from('matches').select('*');

    if (error) {
      console.warn(`Error fetching ${sport} matches:`, error.message);
      return fallback;
    }

    if (!data || data.length === 0) {
      return fallback;
    }

    const filtered = data.filter((row: any) => {
      const rowSport = String(row.sport || row.sport_id || '').toLowerCase();
      if (sport === 'nba') {
        return rowSport === 'nba';
      }
      return rowSport !== 'nba';
    });

    if (filtered.length === 0) {
      return fallback;
    }

    const mappedMatches = filtered.map((row: any): Match => {
      const homeCode = String(row.home_team || row.home_team_code || row.home_competitor_name || '').trim().toUpperCase();
      const awayCode = String(row.away_team || row.away_team_code || row.away_competitor_name || '').trim().toUpperCase();
      const rawStatus = String(row.status || '').toLowerCase();
      const qTime = String(row.quarter_time || row.period_label || '').trim();

      const isUpcoming = rawStatus === 'upcoming' || rawStatus === 'scheduled' || rawStatus === 'pre';
      const isFinal = !isUpcoming && (rawStatus === 'final' || rawStatus === 'post' || qTime.toLowerCase().includes('final'));
      const isLive =
        !isUpcoming &&
        !isFinal &&
        (rawStatus === 'live' ||
          rawStatus === 'in' ||
          /\b(q[1-4]|ot|half|halftime|overtime)\b/i.test(qTime) ||
          /\b(1st|2nd|3rd|4th)\s*(q|quarter|qtr)\b/i.test(qTime));
      const isScheduled = isUpcoming || (!isFinal && !isLive);

      const awayScore = Number(row.away_score || 0);
      const homeScore = Number(row.home_score || 0);

      const homeName = sport === 'nba' ? getNBATeamFullName(homeCode) : getTeamFullName(homeCode);
      const awayName = sport === 'nba' ? getNBATeamFullName(awayCode) : getTeamFullName(awayCode);

      const rowWeek = row.week ? Number(row.week) : (sport === 'nfl' ? currentNFLWeek : undefined);

      return {
        id: String(row.id),
        sportId: sport,
        homeTeam: homeName,
        awayTeam: awayName,
        homeTeamCode: homeCode,
        awayTeamCode: awayCode,
        home_team: homeCode,
        away_team: awayCode,
        home_score: homeScore,
        away_score: awayScore,
        quarter_time: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        quarterTime: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        status: isFinal ? 'final' : isLive ? 'live' : 'upcoming',
        periodLabel: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        homeScore,
        awayScore,
        week: rowWeek,
        weekLabel: rowWeek ? `Week ${rowWeek}` : undefined,
        gameDate: row.scheduled_at,
      };
    });

    const sortLiveFirst = (list: Match[]) =>
      [...list].sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return 1;
        if (a.status === 'upcoming' && b.status === 'final') return -1;
        if (b.status === 'upcoming' && a.status === 'final') return 1;
        const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
        const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
        return dateA - dateB;
      });

    if (sport === 'nfl') {
      const currentWeekOnly = mappedMatches.filter((m) => m.week === currentNFLWeek);
      const baseList = currentWeekOnly.length > 0 ? currentWeekOnly : DEFAULT_NFL_MATCHES;

      // Ensure all 16 NFL matchups covering all 32 teams are present
      const existingMatchPairs = new Set(
        baseList.map((m) => `${(m.awayTeamCode || m.away_team || '').trim().toUpperCase()}@${(m.homeTeamCode || m.home_team || '').trim().toUpperCase()}`)
      );
      const fullWeekList = [...baseList];
      for (const defMatch of DEFAULT_NFL_MATCHES) {
        if (defMatch.week && defMatch.week !== currentNFLWeek) continue;
        const pair = `${(defMatch.awayTeamCode || defMatch.away_team || '').trim().toUpperCase()}@${(defMatch.homeTeamCode || defMatch.home_team || '').trim().toUpperCase()}`;
        if (!existingMatchPairs.has(pair)) {
          fullWeekList.push({ ...defMatch, week: currentNFLWeek, weekLabel: `Week ${currentNFLWeek}` });
          existingMatchPairs.add(pair);
        }
      }
      return sortLiveFirst(fullWeekList);
    }

    return sortLiveFirst(mappedMatches);
  } catch (err) {
    console.warn(`Exception during ${sport} matches fetch:`, err);
    return fallback;
  }
}

export async function fetchLiveNFLMatches(): Promise<Match[]> {
  return fetchLiveMatches('nfl');
}

async function apiFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    let url = endpoint;
    if (typeof window === 'undefined' && endpoint.startsWith('/')) {
      url = `http://localhost:3000${endpoint}`;
    }
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function sanitizeCompetitorId(id?: string | null): string | null {
  if (!id || typeof id !== 'string') return null;
  const trimmed = id.trim();
  if (!trimmed || trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
}

export async function upsertUserRoster(
  roomCode: string,
  userName: string,
  star1Id?: string | null,
  star2Id?: string | null,
  star3Id?: string | null,
  isLocked?: boolean,
  sport: SportId = 'nfl',
  forceClear: boolean = false
): Promise<{ success: boolean; data?: UserRoster; error?: string }> {
  const cleanRoom = (roomCode || (sport === 'nba' ? 'HOOPS' : 'COUCH')).trim().toUpperCase();
  const cleanName = (userName || 'DAD').trim().toUpperCase();

  let sanitizedS1 = sanitizeCompetitorId(star1Id);
  let sanitizedS2 = sanitizeCompetitorId(star2Id);
  let sanitizedS3 = sanitizeCompetitorId(star3Id);

  // If caller sent empty picks without explicit forceClear, attempt to preserve existing saved picks
  if (!sanitizedS1 && !sanitizedS2 && !sanitizedS3 && !forceClear) {
    try {
      const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const rosters: UserRoster[] = JSON.parse(raw);
        const existing = rosters.find((r) => r.user_name.toUpperCase() === cleanName);
        if (existing && (existing.star_1_id || existing.star_2_id || existing.star_3_id)) {
          sanitizedS1 = existing.star_1_id || null;
          sanitizedS2 = existing.star_2_id || null;
          sanitizedS3 = existing.star_3_id || null;
          if (isLocked === undefined) isLocked = existing.is_locked;
        }
      }
    } catch {}
  }

  const starIds = [sanitizedS1, sanitizedS2, sanitizedS3].filter(Boolean) as string[];
  const distinctIds = new Set(starIds);
  const hasThreeDistinct = starIds.length === 3 && distinctIds.size === 3;
  const guardedLocked = hasThreeDistinct && Boolean(isLocked);

  const record: UserRoster = {
    room_code: cleanRoom,
    user_name: cleanName,
    sport,
    device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
    star_1_id: sanitizedS1 || '',
    star_2_id: sanitizedS2 || '',
    star_3_id: sanitizedS3 || '',
    is_locked: guardedLocked,
    updated_at: new Date().toISOString(),
  };

  // 1. Immediate local cache for zero UI lag
  try {
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    let rosters: UserRoster[] = raw ? JSON.parse(raw) : [];
    const idx = rosters.findIndex((r) => r.user_name.toUpperCase() === cleanName);
    if (idx >= 0) {
      rosters[idx] = { ...rosters[idx], ...record };
    } else {
      rosters.push(record);
    }
    localStorage.setItem(localKey, JSON.stringify(rosters));

    const lockKey = sport === 'nba'
      ? `pixel_pros_picks_locked_${cleanRoom}_${cleanName}_nba`
      : `pixel_pros_picks_locked_${cleanRoom}_${cleanName}`;
    localStorage.setItem(lockKey, guardedLocked ? 'true' : 'false');

    const rosterKey = sport === 'nba'
      ? `pixel_pros_roster_${cleanRoom}_${cleanName}_nba`
      : `pixel_pros_roster_${cleanRoom}_${cleanName}`;
    localStorage.setItem(rosterKey, JSON.stringify([record.star_1_id, record.star_2_id, record.star_3_id]));
    window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: record }));
  } catch {}

  // 2. Central persistent server database (cross-device multi-player)
  try {
    const apiRes = await apiFetch<{ success: boolean; data?: any }>('/api/rosters', {
      method: 'POST',
      body: JSON.stringify({
        room_code: cleanRoom,
        user_name: cleanName,
        sport,
        star_1_id: sanitizedS1 || '',
        star_2_id: sanitizedS2 || '',
        star_3_id: sanitizedS3 || '',
        is_locked: guardedLocked,
        device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
        force_clear: forceClear,
      }),
    });
    if (apiRes && apiRes.success && apiRes.data) {
      record.id = apiRes.data.id;
    }
  } catch (err) {
    console.warn('Network upsert error to server API:', err);
  }

  // 3. Supabase fallback/primary cloud database if configured
  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const payload: any = {
        room_code: cleanRoom,
        user_name: cleanName,
        sport,
        star_1_id: sanitizedS1 || '',
        star_2_id: sanitizedS2 || '',
        star_3_id: sanitizedS3 || '',
        is_locked: guardedLocked,
        device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
        updated_at: record.updated_at,
      };

      // 1. Try standard Supabase upsert with composite constraint
      const upsertRes = await client
        .from('user_rosters')
        .upsert(payload, { onConflict: 'room_code,user_name,sport' });

      if (upsertRes.error) {
        // Fallback: check existing by room_code & user_name
        const { data: existing } = await client
          .from('user_rosters')
          .select('id')
          .eq('room_code', cleanRoom)
          .eq('user_name', cleanName)
          .maybeSingle();

        if (existing && existing.id) {
          const updateRes = await client.from('user_rosters').update(payload).eq('id', existing.id);
          if (updateRes.error) {
            // In case table has minimal columns (e.g. without sport or is_locked)
            const minimalPayload = {
              room_code: cleanRoom,
              user_name: cleanName,
              star_1_id: sanitizedS1 || '',
              star_2_id: sanitizedS2 || '',
              star_3_id: sanitizedS3 || '',
            };
            await client.from('user_rosters').update(minimalPayload).eq('id', existing.id);
          }
        } else {
          const insertRes = await client.from('user_rosters').insert(payload);
          if (insertRes.error) {
            const minimalPayload = {
              room_code: cleanRoom,
              user_name: cleanName,
              star_1_id: sanitizedS1 || '',
              star_2_id: sanitizedS2 || '',
              star_3_id: sanitizedS3 || '',
            };
            await client.from('user_rosters').insert(minimalPayload);
          }
        }
      }
    } catch (sbErr) {
      console.warn('Supabase upsert exception:', sbErr);
    }
  }

  return { success: true, data: record };
}

export const GHOST_USER_NAMES: string[] = [];

export function isGhostUser(name?: string | null): boolean {
  if (!name || !name.trim()) return true;
  return false;
}

export interface ActiveRoomSummary {
  roomCode: string;
  sport: SportId;
  squadCount: number;
  squadNames: string[];
  isArchived?: boolean;
  archivedAt?: string;
}

export async function fetchAllActiveRooms(
  currentRoomHint?: string,
  currentSportHint: SportId = 'nfl',
  currentRostersHint?: UserRoster[]
): Promise<ActiveRoomSummary[]> {
  const roomMap = new Map<string, { roomCode: string; sport: SportId; squads: Set<string> }>();
  const archiveStatusMap = new Map<string, { isArchived: boolean; archivedAt?: string }>();

  // Ensure default rooms exist
  const defaultNfl = 'COUCH';
  const defaultNba = 'HOOPS';
  roomMap.set(`${defaultNfl}_nfl`, { roomCode: defaultNfl, sport: 'nfl', squads: new Set() });
  roomMap.set(`${defaultNba}_nba`, { roomCode: defaultNba, sport: 'nba', squads: new Set() });

  const registerSquad = (
    room?: string | null,
    user?: string | null,
    sport?: SportId | string | null
  ) => {
    const rawCode = (room || '').trim().toUpperCase();
    const uName = (user || '').trim().toUpperCase();
    const sSport: SportId = (sport || 'nfl').toString().toLowerCase() === 'nba' ? 'nba' : 'nfl';
    if (!rawCode) return;

    const rCode = rawCode.split('__')[0];
    const mapKey = `${rCode}_${sSport}`;
    if (!roomMap.has(mapKey)) {
      roomMap.set(mapKey, { roomCode: rCode, sport: sSport, squads: new Set() });
    }
    if (uName && !isGhostUser(uName)) {
      roomMap.get(mapKey)!.squads.add(uName);
    }
  };

  // 1. Supabase (if configured) - queries public.rooms and public.user_rosters directly
  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();

      // 1a. Fetch registered rooms from public.rooms
      const { data: roomsData, error: roomsError } = await client
        .from('rooms')
        .select('code, sport');

      if (!roomsError && roomsData && Array.isArray(roomsData)) {
        roomsData.forEach((r: any) => {
          const rawCode = (r.code || '').trim().toUpperCase();
          const code = rawCode.split('__')[0];
          if (!code) return;
          const sport = (r.sport || 'nfl').toLowerCase() as SportId;
          const key = `${code}_${sport}`;
          if (!roomMap.has(key)) {
            roomMap.set(key, { roomCode: code, sport, squads: new Set() });
          }
        });
      }

      // 1b. Fetch all rosters to populate squad names and discover rooms
      const { data: rosterData, error: rosterError } = await client
        .from('user_rosters')
        .select('room_code, user_name, sport')
        .not('room_code', 'is', null);

      if (!rosterError && rosterData && Array.isArray(rosterData)) {
        rosterData.forEach((row: any) => {
          registerSquad(row.room_code, row.user_name, row.sport || 'nfl');
        });
      }
    } catch (sbErr) {
      console.warn('Supabase fetch rooms error:', sbErr);
    }
  }

  // 2. Server API (/api/rooms)
  try {
    const apiRes = await apiFetch<{ success: boolean; rooms?: ActiveRoomSummary[] }>('/api/rooms');
    if (apiRes && apiRes.success && Array.isArray(apiRes.rooms)) {
      apiRes.rooms.forEach((r) => {
        const rCode = (r.roomCode || '').trim().toUpperCase();
        const rSport: SportId = r.sport === 'nba' ? 'nba' : 'nfl';
        if (rCode) {
          registerSquad(rCode, null, rSport);
          if (r.isArchived) {
            archiveStatusMap.set(`${rCode}_${rSport}`, { isArchived: true, archivedAt: r.archivedAt });
          }
          (r.squadNames || []).forEach((u) => {
            registerSquad(rCode, u, rSport);
          });
        }
      });
    }
  } catch (apiErr) {
    console.warn('Server fetch rooms error:', apiErr);
  }

  // 3. LocalStorage scan (discovers all local rooms, squads, and recent couches)
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Roster cache: pixel_pros_rosters_${cleanRoom} or pixel_pros_rosters_${cleanRoom}_nba
        if (key.startsWith('pixel_pros_rosters_')) {
          const isNba = key.endsWith('_nba');
          const cleanRoomCode = key
            .replace('pixel_pros_rosters_', '')
            .replace('_nba', '')
            .replace(/_nfl$/, '')
            .trim()
            .toUpperCase();

          if (cleanRoomCode) {
            registerSquad(cleanRoomCode, null, isNba ? 'nba' : 'nfl');
            try {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  parsed.forEach((item: any) => {
                    if (item && item.user_name) {
                      registerSquad(cleanRoomCode, item.user_name, isNba ? 'nba' : 'nfl');
                    }
                  });
                }
              }
            } catch {}
          }
        }

        // Recent rooms list: pixel_pros_recent_rooms_nfl / pixel_pros_recent_rooms_nba
        if (key.startsWith('pixel_pros_recent_rooms')) {
          const isNba = key.includes('nba');
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                list.forEach((c: string) => {
                  const cleanCode = (c || '').trim().toUpperCase();
                  if (cleanCode) {
                    registerSquad(cleanCode, null, isNba ? 'nba' : 'nfl');
                  }
                });
              }
            }
          } catch {}
        }

        // User preference room keys: pixel_pros_room_code_nfl / pixel_pros_room_code_nba
        if (key.startsWith('pixel_pros_room_code_')) {
          const isNba = key.endsWith('nba');
          const savedCode = (localStorage.getItem(key) || '').trim().toUpperCase();
          if (savedCode) {
            registerSquad(savedCode, null, isNba ? 'nba' : 'nfl');
          }
        }
      }
    }
  } catch {}

  // 4. Current Room Hint / Active Session Context
  if (currentRoomHint) {
    const curCode = currentRoomHint.trim().toUpperCase();
    const curSport = currentSportHint === 'nba' ? 'nba' : 'nfl';
    if (curCode) {
      registerSquad(curCode, null, curSport);
      if (Array.isArray(currentRostersHint)) {
        currentRostersHint.forEach((r) => {
          if (r.user_name) {
            registerSquad(curCode, r.user_name, curSport);
          }
        });
      }
    }
  }

  // 5. URL search params fallback (if page was loaded directly on a room URL)
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const p = new URLSearchParams(window.location.search);
      const urlR = (p.get('room') || p.get('r') || '').trim().toUpperCase();
      const urlS = (p.get('sport') || p.get('s') || '').trim().toLowerCase();
      if (urlR) {
        registerSquad(urlR, null, urlS === 'nba' ? 'nba' : 'nfl');
      }
    }
  } catch {}

  // Ensure default rooms always exist
  registerSquad('COUCH', null, 'nfl');
  registerSquad('HOOPS', null, 'nba');

  return Array.from(roomMap.values()).map((val) => {
    const key = `${val.roomCode}_${val.sport}`;
    const localArchived =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(`pixel_pros_room_archived_${val.roomCode}_${val.sport}`)
        : null;
    const isArchived = Boolean(archiveStatusMap.get(key)?.isArchived || localArchived === 'true');
    return {
      roomCode: val.roomCode,
      sport: val.sport,
      squadCount: val.squads.size,
      squadNames: Array.from(val.squads),
      isArchived,
      archivedAt: archiveStatusMap.get(key)?.archivedAt,
    };
  });
}

export interface MasterRoomSquadDetail {
  userName: string;
  isLocked: boolean;
  stars: string[];
  totalScore?: number;
  roster: UserRoster;
}

export interface MasterRoomMatchSlate {
  matchSlateId: string; // e.g. "ATL@GB"
  effectiveRoomCode: string; // e.g. "BIGBANG__ATL_GB"
  squads: MasterRoomSquadDetail[];
}

export interface MasterRoomData {
  roomCode: string;
  sport: SportId;
  superstarsSquads: MasterRoomSquadDetail[];
  matches: MasterRoomMatchSlate[];
  squads: MasterRoomSquadDetail[];
  isArchived?: boolean;
  archivedAt?: string;
}

export async function fetchAllRoomsWithDetails(
  currentRoomHint?: string,
  currentSportHint?: SportId,
  currentRostersHint?: UserRoster[]
): Promise<MasterRoomData[]> {
  interface RoomBuilder {
    roomCode: string;
    sport: SportId;
    superstarsSquadMap: Map<string, MasterRoomSquadDetail>;
    matchMap: Map<string, { matchSlateId: string; effectiveRoomCode: string; squadMap: Map<string, MasterRoomSquadDetail> }>;
    uniqueSquadsMap: Map<string, MasterRoomSquadDetail>;
    isArchived?: boolean;
    archivedAt?: string;
  }

  const roomMap = new Map<string, RoomBuilder>();

  // Fetch backend room metadata (including isArchived)
  const roomMetaMap = new Map<string, { isArchived?: boolean; archivedAt?: string }>();
  try {
    const res = await apiFetch<{ success: boolean; rooms?: any[] }>('/api/rooms');
    if (res && res.rooms && Array.isArray(res.rooms)) {
      res.rooms.forEach((r: any) => {
        const k = `${String(r.roomCode).toUpperCase()}_${String(r.sport).toLowerCase()}`;
        roomMetaMap.set(k, { isArchived: Boolean(r.isArchived), archivedAt: r.archivedAt });
      });
    }
  } catch {
    // fallback
  }

  function registerSquadDetail(
    room: string,
    squadName: string,
    sport: SportId,
    stars: string[] = ['', '', ''],
    isLocked?: boolean,
    totalScore?: number,
    rosterObj?: UserRoster
  ) {
    const rawRoom = (room || 'COUCH').trim().toUpperCase();
    const cleanSport: SportId = sport === 'nba' ? 'nba' : 'nfl';

    let baseRoom = rawRoom;
    let matchSlateId: string | null = null;
    if (rawRoom.includes('__')) {
      const parts = rawRoom.split('__');
      baseRoom = parts[0];
      matchSlateId = parts[1].replace('_', '@');
    }

    const key = `${baseRoom}_${cleanSport}`;
    const meta = roomMetaMap.get(key) || roomMetaMap.get(`${rawRoom}_${cleanSport}`);

    if (!roomMap.has(key)) {
      roomMap.set(key, {
        roomCode: baseRoom,
        sport: cleanSport,
        superstarsSquadMap: new Map(),
        matchMap: new Map(),
        uniqueSquadsMap: new Map(),
        isArchived: meta?.isArchived,
        archivedAt: meta?.archivedAt,
      });
    }

    const rm = roomMap.get(key)!;
    if (meta?.isArchived !== undefined) {
      rm.isArchived = meta.isArchived;
      rm.archivedAt = meta.archivedAt;
    }

    if (squadName) {
      const cleanUser = squadName.trim().toUpperCase();
      const locked = isLocked !== undefined ? isLocked : getSquadLockState(rawRoom, cleanUser, cleanSport);
      const effectiveRoster: UserRoster = rosterObj || {
        room_code: rawRoom,
        user_name: cleanUser,
        sport: cleanSport,
        star_1_id: stars[0] || '',
        star_2_id: stars[1] || '',
        star_3_id: stars[2] || '',
        is_locked: locked,
      };

      const squadDetail: MasterRoomSquadDetail = {
        userName: cleanUser,
        isLocked: locked,
        stars,
        totalScore,
        roster: effectiveRoster,
      };

      if (!matchSlateId) {
        // Weekly Superstars roster
        rm.superstarsSquadMap.set(cleanUser, squadDetail);
      } else {
        // Specific match slate roster
        if (!rm.matchMap.has(matchSlateId)) {
          rm.matchMap.set(matchSlateId, {
            matchSlateId,
            effectiveRoomCode: rawRoom,
            squadMap: new Map(),
          });
        }
        rm.matchMap.get(matchSlateId)!.squadMap.set(cleanUser, squadDetail);
      }

      // Maintain in room's unique squad list
      if (!rm.uniqueSquadsMap.has(cleanUser) || (!matchSlateId && stars.filter(Boolean).length > 0)) {
        rm.uniqueSquadsMap.set(cleanUser, squadDetail);
      }
    }
  }

  // 1. Fetch from Supabase
  if (isSupabaseConfigured) {
    try {
      const { data: dbRosters } = await supabase.from('user_rosters').select('*');
      if (Array.isArray(dbRosters)) {
        for (const row of dbRosters) {
          const rCode = String(row.room_code || 'COUCH').toUpperCase();
          const rSport: SportId = String(row.sport_id || row.sport || 'nfl').toLowerCase() === 'nba' ? 'nba' : 'nfl';
          const rUser = String(row.user_name || '').toUpperCase();
          if (rUser) {
            registerSquadDetail(
              rCode,
              rUser,
              rSport,
              [row.star_1_id || '', row.star_2_id || '', row.star_3_id || ''],
              row.is_locked,
              undefined,
              {
                id: row.id,
                room_code: rCode,
                user_name: rUser,
                sport: rSport,
                star_1_id: row.star_1_id || '',
                star_2_id: row.star_2_id || '',
                star_3_id: row.star_3_id || '',
                is_locked: row.is_locked,
                updated_at: row.updated_at,
              }
            );
          }
        }
      }
    } catch (e) {
      console.warn('fetchAllRoomsWithDetails Supabase error:', e);
    }
  }

  // 1b. Fetch from persistent Server API (/api/rosters?all=true)
  try {
    const apiRes = await apiFetch<{ success: boolean; rosters?: any[] }>('/api/rosters?all=true');
    if (apiRes && apiRes.success && Array.isArray(apiRes.rosters)) {
      for (const row of apiRes.rosters) {
        const rCode = String(row.room_code || 'COUCH').toUpperCase();
        const rSport: SportId = String(row.sport || 'nfl').toLowerCase() === 'nba' ? 'nba' : 'nfl';
        const rUser = String(row.user_name || '').toUpperCase();
        if (rUser) {
          registerSquadDetail(
            rCode,
            rUser,
            rSport,
            [row.star_1_id || '', row.star_2_id || '', row.star_3_id || ''],
            row.is_locked,
            undefined,
            row
          );
        }
      }
    }
  } catch (apiErr) {
    console.warn('fetchAllRoomsWithDetails /api/rosters error:', apiErr);
  }

  // 2. LocalStorage rosters
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (key.startsWith('pixel_pros_rosters_')) {
          const rest = key.replace('pixel_pros_rosters_', '');
          const isNba = rest.endsWith('_nba');
          const cleanCode = (isNba ? rest.replace('_nba', '') : rest).trim().toUpperCase();
          const sport: SportId = isNba ? 'nba' : 'nfl';

          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                parsed.forEach((r: any) => {
                  const u = (r.user_name || r.userName || '').trim().toUpperCase();
                  if (u) {
                    registerSquadDetail(
                      cleanCode,
                      u,
                      sport,
                      [r.star_1_id || '', r.star_2_id || '', r.star_3_id || ''],
                      r.is_locked,
                      undefined,
                      r
                    );
                  }
                });
              }
            }
          } catch {}
        }
      }
    }
  } catch {}

  // 3. Current Room Hint
  if (currentRoomHint) {
    const curCode = currentRoomHint.trim().toUpperCase();
    const curSport = currentSportHint === 'nba' ? 'nba' : 'nfl';
    if (Array.isArray(currentRostersHint)) {
      currentRostersHint.forEach((r) => {
        if (r.user_name) {
          registerSquadDetail(
            r.room_code || curCode,
            r.user_name,
            curSport,
            [r.star_1_id || '', r.star_2_id || '', r.star_3_id || ''],
            r.is_locked,
            undefined,
            r
          );
        }
      });
    } else {
      registerSquadDetail(curCode, '', curSport);
    }
  }

  // Ensure default rooms
  registerSquadDetail('COUCH', '', 'nfl');
  registerSquadDetail('HOOPS', '', 'nba');

  return Array.from(roomMap.values())
    .map((val) => {
      const superstarsSquads = Array.from(val.superstarsSquadMap.values());
      const matches = Array.from(val.matchMap.values()).map((m) => ({
        matchSlateId: m.matchSlateId,
        effectiveRoomCode: m.effectiveRoomCode,
        squads: Array.from(m.squadMap.values()),
      }));
      const squads = Array.from(val.uniqueSquadsMap.values());

      return {
        roomCode: val.roomCode,
        sport: val.sport,
        superstarsSquads,
        matches,
        squads,
        isArchived: Boolean(val.isArchived),
        archivedAt: val.archivedAt,
      };
    })
    .sort((a, b) => {
      if (currentRoomHint && a.roomCode === currentRoomHint.toUpperCase()) return -1;
      if (currentRoomHint && b.roomCode === currentRoomHint.toUpperCase()) return 1;
      return a.roomCode.localeCompare(b.roomCode);
    });
}

export function getSquadLockState(roomCode: string, userName: string, sport: SportId = 'nfl'): boolean {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || 'DAD').trim().toUpperCase();
  try {
    if (sport === 'nba') {
      return localStorage.getItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}_nba`) === 'true';
    }
    return (
      localStorage.getItem(`pixel_locked_${cleanRoom}_${cleanName}`) === 'true' ||
      localStorage.getItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`) === 'true'
    );
  } catch {
    return false;
  }
}

export function setSquadLockState(roomCode: string, userName: string, locked: boolean, sport: SportId = 'nfl'): void {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || 'DAD').trim().toUpperCase();
  try {
    if (sport === 'nba') {
      localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}_nba`, String(locked));
    } else {
      localStorage.setItem(`pixel_locked_${cleanRoom}_${cleanName}`, String(locked));
      localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`, String(locked));
    }
  } catch {
    // ignore
  }
}

export async function fetchRoomRosters(roomCode: string, sport: SportId = 'nfl'): Promise<UserRoster[]> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const rosterMap = new Map<string, UserRoster>();

  const ingestRosters = (rosters: any[]) => {
    if (!Array.isArray(rosters)) return;
    rosters.forEach((r: any) => {
      if (!r || isGhostUser(r.user_name)) return;
      const userName = (r.user_name || '').trim().toUpperCase();
      if (!userName) return;
      const rRoomCode = (r.room_code || cleanRoom).trim().toUpperCase();
      const mapKey = `${rRoomCode}___${userName}`;

      const starIds = [r.star_1_id, r.star_2_id, r.star_3_id].filter(
        (id) => id && typeof id === 'string' && id.trim() !== ''
      );
      const distinctStars = new Set(starIds);
      const hasThreeDistinct = starIds.length === 3 && distinctStars.size === 3;
      const isLocked = Boolean(
        r.is_locked === true ||
        r.is_locked === 'true' ||
        String(r.device_id).toUpperCase() === 'LOCKED' ||
        (hasThreeDistinct && getSquadLockState(rRoomCode, userName, sport))
      );

      const existing = rosterMap.get(mapKey);
      const entryTime = r.updated_at ? new Date(r.updated_at).getTime() : 0;
      const existingTime = existing?.updated_at ? new Date(existing.updated_at).getTime() : 0;

      const existingHasPicks = Boolean(existing?.star_1_id || existing?.star_2_id || existing?.star_3_id);
      const incomingHasPicks = Boolean(r.star_1_id || r.star_2_id || r.star_3_id);

      // Do not allow an incoming record with empty picks to overwrite an existing record that already has picks
      if (existing && existingHasPicks && !incomingHasPicks) {
        return;
      }

      if (!existing || entryTime >= existingTime || (incomingHasPicks && !existingHasPicks)) {
        setSquadLockState(rRoomCode, userName, isLocked, sport);
        rosterMap.set(mapKey, {
          id: r.id || existing?.id || `rost_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          room_code: rRoomCode,
          user_name: userName,
          sport: r.sport || sport,
          device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
          star_1_id: r.star_1_id || existing?.star_1_id || '',
          star_2_id: r.star_2_id || existing?.star_2_id || '',
          star_3_id: r.star_3_id || existing?.star_3_id || '',
          is_locked: isLocked || Boolean(existing?.is_locked),
          updated_at: r.updated_at || new Date().toISOString(),
        });
      }
    });
  };

  // 1. Ingest local storage cache first
  try {
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) ingestRosters(parsed);
    }
  } catch {}

  // 2. Supabase (if configured) - queries both base room and all game slates!
  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('user_rosters')
        .select('*')
        .or(`room_code.eq.${cleanRoom},room_code.like.${cleanRoom}__%`)
        .not('user_name', 'is', null);

      if (!error && data && Array.isArray(data)) {
        ingestRosters(data);
      }
    } catch (sbErr) {
      console.warn('Supabase fetch rosters error:', sbErr);
    }
  }

  // 3. Persistent Server API (/api/rosters)
  try {
    const apiRes = await apiFetch<{ success: boolean; rosters?: any[] }>(
      `/api/rosters?roomCode=${encodeURIComponent(cleanRoom)}&sport=${encodeURIComponent(sport)}`
    );
    if (apiRes && apiRes.success && Array.isArray(apiRes.rosters)) {
      ingestRosters(apiRes.rosters);
    }
  } catch (apiErr) {
    console.warn('Server fetch rosters error:', apiErr);
  }

  const mergedList = Array.from(rosterMap.values());

  // Update local storage cache with unified records
  try {
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    localStorage.setItem(localKey, JSON.stringify(mergedList));
  } catch {}

  return mergedList;
}

export async function deleteUserRoster(roomCode: string, userName: string, sport: SportId = 'nfl'): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || '').trim().toUpperCase();
  if (!cleanName) return false;

  // Local storage cleanup
  try {
    const localKeys = [
      sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`,
      `pixel_pros_rosters_${cleanRoom}`,
      `pixel_pros_rosters_${cleanRoom}_${sport}`,
    ];
    localKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const rosters: UserRoster[] = JSON.parse(raw);
          const filtered = rosters.filter((r) => r.user_name.toUpperCase() !== cleanName);
          localStorage.setItem(key, JSON.stringify(filtered));
        } catch {}
      }
    });
    localStorage.removeItem(`pixel_pros_roster_${cleanRoom}_${cleanName}`);
    localStorage.removeItem(`pixel_pros_roster_${cleanRoom}_${cleanName}_${sport}`);
    localStorage.removeItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`);
    localStorage.removeItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}_${sport}`);
    localStorage.removeItem(`pixel_locked_${cleanRoom}_${cleanName}`);
  } catch {}

  // Server API delete
  try {
    await apiFetch('/api/rosters', {
      method: 'DELETE',
      body: JSON.stringify({ room_code: cleanRoom, user_name: cleanName, sport }),
    });
  } catch {}

  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      await client.from('user_rosters').delete().eq('room_code', cleanRoom).eq('user_name', cleanName);
    } catch {}
  }

  window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: { room_code: cleanRoom, user_name: cleanName, deleted: true, sport } }));
  return true;
}

export async function resetRoomRosters(roomCode: string): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  if (!cleanRoom) return false;

  try {
    localStorage.removeItem(`pixel_pros_rosters_${cleanRoom}`);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes(`_${cleanRoom}_`) || k.endsWith(`_${cleanRoom}`))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}

  // Server API reset
  try {
    await apiFetch('/api/rosters/reset', {
      method: 'POST',
      body: JSON.stringify({ room_code: cleanRoom }),
    });
  } catch {}

  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      await client.from('user_rosters').delete().eq('room_code', cleanRoom);
    } catch {}
  }

  window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: { room_code: cleanRoom, reset: true } }));
  return true;
}

export async function renameUserRoster(
  roomCode: string,
  oldUserName: string,
  newUserName: string,
  sport: SportId = 'nfl'
): Promise<{ success: boolean; error?: string }> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanOld = (oldUserName || '').trim().toUpperCase();
  const cleanNew = (newUserName || '').trim().toUpperCase();

  if (!cleanOld || !cleanNew) return { success: false, error: 'Invalid squad name' };
  if (cleanOld === cleanNew) return { success: true };

  // Local storage update
  try {
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const rosters: UserRoster[] = JSON.parse(raw);
      const idx = rosters.findIndex((r) => r.user_name.toUpperCase() === cleanOld);
      if (idx >= 0) {
        rosters[idx].user_name = cleanNew;
        localStorage.setItem(localKey, JSON.stringify(rosters));
      }
    }
    const oldLock = getSquadLockState(cleanRoom, cleanOld, sport);
    setSquadLockState(cleanRoom, cleanNew, oldLock, sport);
  } catch {}

  // Server API rename
  try {
    await apiFetch('/api/rosters/rename', {
      method: 'POST',
      body: JSON.stringify({
        room_code: cleanRoom,
        old_user_name: cleanOld,
        new_user_name: cleanNew,
        sport,
      }),
    });
  } catch {}

  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      await client
        .from('user_rosters')
        .update({ user_name: cleanNew })
        .eq('room_code', cleanRoom)
        .eq('user_name', cleanOld);
    } catch {}
  }

  window.dispatchEvent(
    new CustomEvent('pixel_pros_roster_update', {
      detail: { room_code: cleanRoom, user_name: cleanNew, renamedFrom: cleanOld, sport },
    })
  );
  return { success: true };
}

export async function toggleSquadLock(
  roomCode: string,
  userName: string,
  isLocked: boolean,
  sport: SportId = 'nfl'
): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanUser = (userName || '').trim().toUpperCase();
  if (!cleanUser) return false;

  setSquadLockState(cleanRoom, cleanUser, isLocked, sport);

  // Server API lock
  try {
    await apiFetch('/api/rosters/lock', {
      method: 'POST',
      body: JSON.stringify({
        room_code: cleanRoom,
        user_name: cleanUser,
        is_locked: isLocked,
        sport,
      }),
    });
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('user_rosters')
        .update({
          is_locked: isLocked,
          device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
          updated_at: new Date().toISOString(),
        })
        .eq('room_code', cleanRoom)
        .eq('user_name', cleanUser);
    } catch {}
  }

  window.dispatchEvent(
    new CustomEvent('pixel_pros_roster_update', {
      detail: { room_code: cleanRoom, user_name: cleanUser, lockChanged: true, isLocked, sport },
    })
  );
  return true;
}

export async function setAllSquadsLock(
  roomCode: string,
  isLocked: boolean,
  sport: SportId = 'nfl'
): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();

  // Local storage update
  try {
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const rosters: UserRoster[] = JSON.parse(raw);
      rosters.forEach((r) => {
        r.is_locked = isLocked;
        r.device_id = isLocked ? 'LOCKED' : 'UNLOCKED';
        setSquadLockState(cleanRoom, r.user_name, isLocked, sport);
      });
      localStorage.setItem(localKey, JSON.stringify(rosters));
    }
  } catch {}

  // Server API lock all
  try {
    await apiFetch('/api/rosters/lock', {
      method: 'POST',
      body: JSON.stringify({
        room_code: cleanRoom,
        is_locked: isLocked,
        sport,
        all: true,
      }),
    });
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('user_rosters')
        .update({
          is_locked: isLocked,
          device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
          updated_at: new Date().toISOString(),
        })
        .eq('room_code', cleanRoom);
    } catch {}
  }

  window.dispatchEvent(
    new CustomEvent('pixel_pros_roster_update', {
      detail: { room_code: cleanRoom, allLockChanged: true, isLocked, sport },
    })
  );
  return true;
}

export async function clearSquadStars(
  roomCode: string,
  userName: string,
  sport: SportId = 'nfl'
): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanUser = (userName || '').trim().toUpperCase();
  if (!cleanUser) return false;

  setSquadLockState(cleanRoom, cleanUser, false, sport);

  try {
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const rosters: UserRoster[] = JSON.parse(raw);
      const target = rosters.find((r) => r.user_name.toUpperCase() === cleanUser);
      if (target) {
        target.star_1_id = '';
        target.star_2_id = '';
        target.star_3_id = '';
        target.is_locked = false;
        target.device_id = 'UNLOCKED';
        localStorage.setItem(localKey, JSON.stringify(rosters));
      }
    }
  } catch {}

  // Server API clear
  try {
    await apiFetch('/api/rosters/clear-stars', {
      method: 'POST',
      body: JSON.stringify({
        room_code: cleanRoom,
        user_name: cleanUser,
        sport,
      }),
    });
  } catch {}

  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      await client
        .from('user_rosters')
        .update({
          star_1_id: '',
          star_2_id: '',
          star_3_id: '',
        })
        .eq('room_code', cleanRoom)
        .eq('user_name', cleanUser);
    } catch {}
  }

  window.dispatchEvent(
    new CustomEvent('pixel_pros_roster_update', {
      detail: { room_code: cleanRoom, user_name: cleanUser, clearedStars: true, sport },
    })
  );
  return true;
}

export function subscribeToRoomRosters(
  roomCode: string,
  sportOrCb: SportId | (() => void) = 'nfl',
  maybeCb?: () => void
) {
  const sport: SportId = typeof sportOrCb === 'string' ? sportOrCb : 'nfl';
  const onUpdate: () => void = typeof sportOrCb === 'function' ? sportOrCb : (maybeCb || (() => {}));

  const clean = (roomCode || (sport === 'nba' ? 'HOOPS' : 'COUCH')).trim().toUpperCase();

  // 1. Listen for in-tab window events
  const handleLocalUpdate = (e: any) => {
    const detail = e?.detail;
    if (detail) {
      if (detail.room_code && detail.room_code.trim().toUpperCase() !== clean) return;
      if (detail.sport && detail.sport !== sport) return;
    }
    onUpdate();
  };
  window.addEventListener('pixel_pros_roster_update', handleLocalUpdate);

  // 2. Server-Sent Events (SSE) stream for instant real-time pushes across all devices
  let eventSource: EventSource | null = null;
  try {
    if (typeof EventSource !== 'undefined') {
      eventSource = new EventSource(`/api/realtime?roomCode=${encodeURIComponent(clean)}&sport=${encodeURIComponent(sport)}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.room_code && data.room_code.toUpperCase() === clean) {
            onUpdate();
          }
        } catch {}
      };
      eventSource.onerror = () => {
        // SSE auto-reconnects natively; polling below acts as fallback
      };
    }
  } catch (e) {
    console.warn('EventSource initialization warning:', e);
  }

  // 3. Smart polling fallback for Server API (every 2.5s)
  let lastRosterSnapshot = '';
  const pollInterval = setInterval(async () => {
    try {
      const res = await apiFetch<{ success: boolean; rosters?: any[] }>(
        `/api/rosters?roomCode=${encodeURIComponent(clean)}&sport=${encodeURIComponent(sport)}`
      );
      if (res && res.success && Array.isArray(res.rosters)) {
        const snapshot = JSON.stringify(
          res.rosters.map((r) => `${r.user_name}:${r.star_1_id}:${r.star_2_id}:${r.star_3_id}:${r.is_locked}`)
        );
        if (lastRosterSnapshot && snapshot !== lastRosterSnapshot) {
          lastRosterSnapshot = snapshot;
          onUpdate();
        } else if (!lastRosterSnapshot) {
          lastRosterSnapshot = snapshot;
        }
      }
    } catch {}
  }, 2500);

  // 4. Supabase Direct Cloud Polling (every 2.5s) - GUARANTEES Vercel multi-device sync
  let lastSbRosterSnapshot = '';
  const sbPollInterval = setInterval(async () => {
    if (!checkSupabaseConfigured()) return;
    try {
      const client = getSupabaseClient();
      const { data } = await client
        .from('user_rosters')
        .select('room_code, user_name, star_1_id, star_2_id, star_3_id, is_locked')
        .or(`room_code.eq.${clean},room_code.like.${clean}__%`);
      if (data && Array.isArray(data)) {
        const snapshot = JSON.stringify(
          data.map((r: any) => `${r.room_code}:${r.user_name}:${r.star_1_id}:${r.star_2_id}:${r.star_3_id}:${r.is_locked}`)
        );
        if (lastSbRosterSnapshot && snapshot !== lastSbRosterSnapshot) {
          lastSbRosterSnapshot = snapshot;
          onUpdate();
        } else if (!lastSbRosterSnapshot) {
          lastSbRosterSnapshot = snapshot;
        }
      }
    } catch {}
  }, 2500);

  // 5. Supabase realtime channel if configured
  let channel: any = null;
  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      channel = client
        .channel(`room_sync_${clean}_${sport}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_rosters',
            filter: `room_code=eq.${clean}`,
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn(`Error subscribing to channel room-${clean}:`, err);
    }
  }

  return () => {
    window.removeEventListener('pixel_pros_roster_update', handleLocalUpdate);
    if (eventSource) {
      eventSource.close();
    }
    clearInterval(pollInterval);
    clearInterval(sbPollInterval);
    if (channel && checkSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        client.removeChannel(channel);
      } catch (err) {
        console.warn(`Error removing channel:`, err);
      }
    }
  };
}

export function subscribeToRealtimeScores(
  onCompetitorUpdate: (payload: any) => void,
  onMatchUpdate?: (payload: any) => void,
  onRosterUpdate?: (payload: any) => void
) {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('pixel-pros-realtime-wire')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competitors',
        },
        (payload) => {
          onCompetitorUpdate(payload);
        }
      );

    if (onMatchUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          onMatchUpdate(payload);
        }
      );
    }

    if (onRosterUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rosters',
        },
        (payload) => {
          onRosterUpdate(payload);
        }
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Supabase Realtime Wire Connected: competitors, matches, user_rosters');
      }
    });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}

export async function registerActiveRoom(roomCode: string, sport: SportId = 'nfl'): Promise<void> {
  const cleanCode = (roomCode || '').trim().toUpperCase();
  if (!cleanCode) return;

  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      await client.from('rooms').upsert(
        { code: cleanCode, sport: sport.toLowerCase() },
        { onConflict: 'code,sport' }
      );
    } catch (err) {
      console.warn('Could not register room in Supabase rooms table:', err);
    }
  }

  try {
    await apiFetch('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ room_code: cleanCode, sport }),
    });
  } catch {}
}

export async function registerActiveUser(userName: string, sport: SportId = 'nfl'): Promise<void> {
  const cleanName = (userName || '').trim().toUpperCase();
  if (!cleanName) return;

  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      await client.from('users').upsert(
        { username: cleanName, favorite_sport: sport.toLowerCase(), last_active: new Date().toISOString() },
        { onConflict: 'username' }
      );
    } catch {
      // Table may not exist yet if user hasn't run the SQL script; silently ignore
    }
  }
}

export async function archiveRoom(
  roomCode: string,
  sport: SportId = 'nfl',
  isArchived: boolean = true
): Promise<{ success: boolean }> {
  const cleanCode = (roomCode || '').trim().toUpperCase();
  const cleanSport: SportId = sport === 'nba' ? 'nba' : 'nfl';
  if (!cleanCode) return { success: false };

  // Always update local cache immediately for zero-lag UI responsiveness
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `pixel_pros_room_archived_${cleanCode}_${cleanSport}`,
        isArchived ? 'true' : 'false'
      );
    }
  } catch {}

  try {
    const res = await apiFetch<{ success: boolean }>('/api/rooms/archive', {
      method: 'POST',
      body: JSON.stringify({ room_code: cleanCode, sport: cleanSport, is_archived: isArchived }),
    });
    if (res && res.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pixel_pros_room_archive_update', {
            detail: { roomCode: cleanCode, sport: cleanSport, isArchived },
          })
        );
      }
      return { success: true };
    }
  } catch (err) {
    console.warn('Could not archive room:', err);
  }

  // Fallback: local update succeeded
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pixel_pros_room_archive_update', {
        detail: { roomCode: cleanCode, sport: cleanSport, isArchived },
      })
    );
  }
  return { success: true };
}

export async function unarchiveRoom(
  roomCode: string,
  sport: SportId = 'nfl'
): Promise<{ success: boolean }> {
  return archiveRoom(roomCode, sport, false);
}

export async function autoArchiveCompletedRooms(): Promise<{ success: boolean; archivedCount: number }> {
  try {
    const res = await apiFetch<{ success: boolean; archivedCount: number }>('/api/rooms/auto-archive-completed', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (res && res.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pixel_pros_room_archive_update', {
            detail: { all: true, count: res.archivedCount },
          })
        );
      }
      return { success: true, archivedCount: res.archivedCount || 0 };
    }
  } catch (err) {
    console.warn('Could not auto-archive completed rooms:', err);
  }
  return { success: false, archivedCount: 0 };
}

export async function deleteRoomPermanently(
  roomCode: string,
  sport: SportId = 'nfl'
): Promise<{ success: boolean }> {
  const cleanCode = (roomCode || '').trim().toUpperCase();
  const cleanSport: SportId = sport === 'nba' ? 'nba' : 'nfl';
  if (!cleanCode) return { success: false };

  // 1. Clear local storage records
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`pixel_pros_room_archived_${cleanCode}_${cleanSport}`);
      localStorage.removeItem(`pixel_pros_room_archived_${cleanCode}_nfl`);
      localStorage.removeItem(`pixel_pros_room_archived_${cleanCode}_nba`);
      localStorage.removeItem(`pixel_pros_rosters_${cleanCode}`);
      localStorage.removeItem(`pixel_pros_rosters_${cleanCode}_nba`);

      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.includes(`_${cleanCode}_`) ||
            k.endsWith(`_${cleanCode}`) ||
            k.includes(`_${cleanCode}__`))
        ) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}

  // 2. Call backend /api/rooms/delete
  try {
    await apiFetch('/api/rooms/delete', {
      method: 'POST',
      body: JSON.stringify({ room_code: cleanCode, sport: cleanSport }),
    });
  } catch {}

  // 3. Supabase cleanup
  if (checkSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      await client.from('rooms').delete().eq('code', cleanCode);
      await client.from('user_rosters').delete().eq('room_code', cleanCode);
      await client.from('user_rosters').delete().like('room_code', `${cleanCode}__%`);
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pixel_pros_roster_update', {
        detail: { room_code: cleanCode, reset: true, deleted: true, sport: cleanSport },
      })
    );
    window.dispatchEvent(
      new CustomEvent('pixel_pros_room_archive_update', {
        detail: { roomCode: cleanCode, deleted: true },
      })
    );
  }

  return { success: true };
}

export async function purgeAllArchivedRooms(): Promise<{ success: boolean; purgedCount: number }> {
  try {
    const res = await apiFetch<{ success: boolean; purgedCount: number }>('/api/rooms/purge-archived', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    // Clean local storage archive keys
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('pixel_pros_room_archived_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pixel_pros_room_archive_update', {
          detail: { all: true, purged: true },
        })
      );
      window.dispatchEvent(
        new CustomEvent('pixel_pros_roster_update', {
          detail: { reset: true },
        })
      );
    }

    return { success: true, purgedCount: res?.purgedCount || 0 };
  } catch (err) {
    console.warn('Could not purge archived rooms:', err);
    return { success: false, purgedCount: 0 };
  }
}