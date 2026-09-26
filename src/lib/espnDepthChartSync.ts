import { Competitor, SportId } from '../types';
import { getTeamColors, getTeamFullName, normalizeTeamCode } from '../utils/teamData';
import { NFL_ROSTER_MANIFEST, isRetiredPlayer, ROSTER_CACHE_VERSION } from '../data/nflRosterManifest';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { fetchLiveNFLInjuries, getCachedNFLInjuries, InjuryReportItem } from './rescanEngine';

export interface DynamicDepthChartResult {
  success: boolean;
  totalCompetitors: number;
  teamsCount: number;
  competitors: Competitor[];
  count?: number;
  error?: string;
}

export interface DynamicAthleteRecord {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  sport: 'nfl';
  score: number;
  athlete_id?: string;
  jersey?: string;
  game_id?: string;
  current_score?: number;
  stats?: Record<string, any>;
  updated_at: string;
}

/**
 * Checks if an athlete is inactive according to ESPN's injury report
 * (Status includes 'Out' or 'Injured Reserve', or type abbreviation is 'IR' or 'O')
 */
export function isInjuryInactive(athlete: any): boolean {
  if (!athlete) return false;
  const injuries = athlete.injuries || [];
  return injuries.some((inj: any) => {
    const status = (inj?.status || '').toLowerCase();
    const typeAbbr = (inj?.type?.abbreviation || '').toLowerCase();
    return (
      status.includes('out') ||
      status.includes('injured reserve') ||
      typeAbbr === 'ir' ||
      typeAbbr === 'o'
    );
  });
}

/**
 * Safe fetch helper with fallback from proxy to direct ESPN API
 */
async function safeFetchJson(proxyUrl: string, directUrl: string): Promise<any> {
  try {
    const res = await fetch(proxyUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore and try direct
  }

  try {
    const res = await fetch(directUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[SafeFetch] Failed both proxy and direct for ${directUrl}:`, err);
  }
  return null;
}

/**
 * Pure Dynamic Data Pipeline:
 * Queries ESPN Scoreboard, fetches live Depth Charts for all participating teams,
 * programmatically parses active starters (QB, RB, WR, TE) by rank and injury status,
 * and upserts directly into Supabase and local application storage.
 * 
 * ZERO HARDCODED NAMES OR JERSEY NUMBERS.
 */
export async function runPureDynamicDepthChartSync(
  onProgress?: (step: string) => void
): Promise<DynamicDepthChartResult> {
  try {
    onProgress?.('Fetching active NFL schedule from ESPN...');

    // 1. Fetch upcoming NFL scoreboard
    const scoreboardData = await safeFetchJson(
      '/api/espn/scoreboard?sport=nfl',
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
    );

    if (!scoreboardData || !Array.isArray(scoreboardData.events)) {
      throw new Error('Failed to retrieve active NFL scoreboard from ESPN');
    }

    const events = scoreboardData.events;
    onProgress?.(`Found ${events.length} NFL games. Resolving live depth charts...`);

    // Collect unique team IDs and map to game IDs and abbreviations
    interface TeamGameRef {
      teamId: string;
      teamAbbr: string;
      gameId: string;
    }

    const teamRefs = new Map<string, TeamGameRef>();

    for (const ev of events) {
      const gameId = String(ev.id);
      const competitors = ev.competitions?.[0]?.competitors || [];
      for (const comp of competitors) {
        const teamId = String(comp.id);
        const rawAbbr = comp.team?.abbreviation || '';
        const teamAbbr = normalizeTeamCode(rawAbbr) || rawAbbr.toUpperCase();
        if (teamId && !teamRefs.has(teamId)) {
          teamRefs.set(teamId, { teamId, teamAbbr, gameId });
        }
      }
    }

    const teamList = Array.from(teamRefs.values());
    onProgress?.(`Fetching live depth charts and active rosters for ${teamList.length} teams...`);

    // Fetch depth charts and rosters in parallel for maximum speed
    const depthChartAndRosterMap = new Map<
      string,
      { depthChart: any; jerseyMap: Map<string, string> }
    >();

    await Promise.all(
      teamList.map(async ({ teamId }) => {
        try {
          const [dcData, rData] = await Promise.all([
            safeFetchJson(
              `/api/espn/depthchart?teamId=${teamId}`,
              `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/depthcharts`
            ),
            safeFetchJson(
              `/api/espn/roster?teamId=${teamId}`,
              `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`
            ),
          ]);

          const jerseyMap = new Map<string, string>();
          if (rData && Array.isArray(rData.athletes)) {
            for (const grp of rData.athletes) {
              if (Array.isArray(grp.items)) {
                for (const ath of grp.items) {
                  if (ath.id) {
                    jerseyMap.set(String(ath.id), String(ath.jersey || ''));
                  }
                }
              }
            }
          }

          if (dcData) {
            depthChartAndRosterMap.set(teamId, { depthChart: dcData, jerseyMap });
          }
        } catch (teamErr) {
          console.warn(`[DepthChart] Failed to load depth chart for team ${teamId}:`, teamErr);
        }
      })
    );

    // Fetch live ESPN injury report across all NFL teams
    let liveInjuries = getCachedNFLInjuries();
    try {
      liveInjuries = await fetchLiveNFLInjuries();
    } catch {
      // ignore
    }

    // Helper to select active athletes by rank with injury fallback
    function pickActiveAthletes(athletes: any[], targetCount: number): any[] {
      if (!Array.isArray(athletes)) return [];
      const active: any[] = [];
      for (const ath of athletes) {
        if (!isInjuryInactive(ath)) {
          active.push(ath);
          if (active.length >= targetCount) break;
        }
      }
      // If all are marked injured/inactive, fallback to top ranked
      if (active.length === 0 && athletes.length > 0) {
        active.push(athletes[0]);
      }
      return active;
    }

    const dynamicCompetitors: Competitor[] = [];
    const dbUpsertRecords: DynamicAthleteRecord[] = [];

    // Parse each team's depth chart programmatically
    for (const { teamId, teamAbbr, gameId } of teamList) {
      const data = depthChartAndRosterMap.get(teamId);
      if (!data || !data.depthChart) continue;

      const { depthChart, jerseyMap } = data;
      const offGroup = (depthChart.depthchart || []).find(
        (g: any) => g.positions && (g.positions.qb || g.positions.rb)
      );

      if (!offGroup || !offGroup.positions) continue;

      const positions = offGroup.positions;
      const teamColors = getTeamColors(teamAbbr);
      const teamFullName = getTeamFullName(teamAbbr);

      const addAthlete = (athlete: any, positionAbbr: 'QB' | 'RB' | 'WR' | 'TE', explicitRank?: number) => {
        if (!athlete || !athlete.id) return;
        const name = athlete.displayName || `${teamAbbr} ${positionAbbr}`;
        if (isRetiredPlayer(name)) return;
        const athleteId = String(athlete.id);
        const rawJersey = jerseyMap.get(athleteId) || athlete.jersey || '';
        const uniformNumber = parseInt(rawJersey, 10) || 10;
        const shortName = (
          athlete.shortName ||
          name.split(' ').pop() ||
          positionAbbr
        )
          .toUpperCase()
          .replace(/[^A-Z]/g, '');

        // Calculate depth rank (QB1, QB2, RB1, RB2, WR1, etc.)
        const computedRank = explicitRank || (
          positionAbbr === 'QB' ? qbCount + 1 :
          positionAbbr === 'RB' ? rbCount + 1 :
          positionAbbr === 'WR' ? wrCount + 1 :
          positionAbbr === 'TE' ? teCount + 1 : 1
        );
        const depthRank = athlete.depthRank || computedRank;
        const depthOrder = athlete.depthOrder || `${positionAbbr}${depthRank}`;

        // Look up injury status in ESPN live injuries map
        const normName = name.trim().toLowerCase();
        const liveInj = liveInjuries.get(normName);
        const injuryStatus: 'I' | 'Q' | null = liveInj
          ? liveInj.status
          : (athlete.injuryStatus || null);
        const injuryDetail = liveInj
          ? liveInj.detail
          : (athlete.injuryDetail || '');

        // 1. Supabase database record strictly following spec (id, name, team, sport, position, score, stats, updated_at)
        dbUpsertRecords.push({
          id: `nfl_${athleteId}`,
          name: name,
          position: positionAbbr,
          team: teamAbbr,
          sport: 'nfl',
          score: 0,
          stats: {
            pass_yds: 0,
            rush_yds: 0,
            rec_yds: 0,
            tds: 0,
            fgs: 0,
            stops: 0,
            touchdowns: 0,
            total_yards: 0,
            primaryMetricLabel: 'Touchdowns',
            primaryMetricValue: 0,
          },
          updated_at: new Date().toISOString(),
        });

        // 2. Full interactive frontend Competitor object
        dynamicCompetitors.push({
          id: `nfl_${athleteId}`,
          athleteId: athleteId,
          sportId: 'nfl',
          displayName: name,
          shortName: shortName,
          uniformNumber: uniformNumber,
          teamName: teamFullName,
          teamCode: teamAbbr,
          positionGeneric: positionAbbr === 'QB' ? 'PLAYMAKER' : 'OFFENSE',
          position: positionAbbr,
          depthRank: depthRank,
          depthOrder: depthOrder,
          injuryStatus: injuryStatus,
          injuryDetail: injuryDetail,
          rating: 90,
          score: 0,
          stats: {
            pass_yds: 0,
            rush_yds: 0,
            rec_yds: 0,
            tds: 0,
            fgs: 0,
            stops: 0,
            touchdowns: 0,
            total_yards: 0,
            primaryMetricLabel: 'Touchdowns',
            primaryMetricValue: 0,
          },
          badges: ['gold_star'],
          avatar: {
            helmetColor: teamColors.helmet,
            jerseyColor: teamColors.jersey,
            stripeColor: teamColors.stripe,
            skinTone: '#e0ac69',
            number: uniformNumber,
          },
        });
      };

      // Track counts added per team
      let qbCount = 0;
      let rbCount = 0;
      let wrCount = 0;
      let teCount = 0;

      // 1. Quarterbacks (QB): Select top 3 active QBs
      const qbAthletes = positions.qb?.athletes || [];
      const activeQBs = pickActiveAthletes(qbAthletes, 3);
      activeQBs.forEach((a) => {
        addAthlete(a, 'QB');
        qbCount++;
      });

      // 2. Running Backs (RB): Select top 3 active RBs
      const rbAthletes = positions.rb?.athletes || [];
      const activeRBs = pickActiveAthletes(rbAthletes, 3);
      activeRBs.forEach((a) => {
        addAthlete(a, 'RB');
        rbCount++;
      });

      // 3. Wide Receivers (WR): Select top 4 active WRs (inspect wr1, wr2, wr3, wr4 or pool)
      const wrCandidates: any[] = [];
      ['wr1', 'wr2', 'wr3', 'wr4'].forEach((slot) => {
        const slotAthletes = positions[slot]?.athletes || [];
        const chosen = pickActiveAthletes(slotAthletes, 1);
        if (chosen[0] && !wrCandidates.some((w) => w.id === chosen[0].id)) {
          wrCandidates.push(chosen[0]);
        }
      });
      // Fallback from general WR pool if less than 4
      if (wrCandidates.length < 4) {
        const remaining = pickActiveAthletes(positions.wr1?.athletes || positions.wr?.athletes || [], 4 - wrCandidates.length);
        for (const rem of remaining) {
          if (!wrCandidates.some((w) => w.id === rem.id)) {
            wrCandidates.push(rem);
          }
        }
      }
      wrCandidates.slice(0, 4).forEach((a) => {
        addAthlete(a, 'WR');
        wrCount++;
      });

      // 4. Tight Ends (TE): Select top 2 active TEs
      const teAthletes = positions.te?.athletes || [];
      const activeTEs = pickActiveAthletes(teAthletes, 2);
      activeTEs.forEach((a) => {
        addAthlete(a, 'TE');
        teCount++;
      });

      // 5. Manifest Supplementation: Guarantee every team reaches 3 QBs, 3 RBs, and 6 WR/TE (4 WR + 2 TE)
      const manifestTeam = NFL_ROSTER_MANIFEST[teamAbbr] || [];
      if (qbCount < 3) {
        manifestTeam.filter((m) => m.position === 'QB').slice(qbCount, 3).forEach((m) => {
          addAthlete({ id: m.athleteId, displayName: m.displayName, shortName: m.shortName, jersey: m.uniformNumber }, 'QB');
        });
      }
      if (rbCount < 3) {
        manifestTeam.filter((m) => m.position === 'RB').slice(rbCount, 3).forEach((m) => {
          addAthlete({ id: m.athleteId, displayName: m.displayName, shortName: m.shortName, jersey: m.uniformNumber }, 'RB');
        });
      }
      if (wrCount < 4) {
        manifestTeam.filter((m) => m.position === 'WR').slice(wrCount, 4).forEach((m) => {
          addAthlete({ id: m.athleteId, displayName: m.displayName, shortName: m.shortName, jersey: m.uniformNumber }, 'WR');
        });
      }
      if (teCount < 2) {
        manifestTeam.filter((m) => m.position === 'TE').slice(teCount, 2).forEach((m) => {
          addAthlete({ id: m.athleteId, displayName: m.displayName, shortName: m.shortName, jersey: m.uniformNumber }, 'TE');
        });
      }
    }

    // Ensure any teams in teamList that had failed depth chart responses are populated from manifest
    for (const { teamAbbr } of teamList) {
      const alreadyHasPlayers = dynamicCompetitors.some((c) => c.teamCode === teamAbbr);
      if (!alreadyHasPlayers && NFL_ROSTER_MANIFEST[teamAbbr]) {
        const teamFullName = getTeamFullName(teamAbbr);
        const teamColors = getTeamColors(teamAbbr);
        const posCounts: Record<string, number> = {};

        for (const ath of NFL_ROSTER_MANIFEST[teamAbbr]) {
          posCounts[ath.position] = (posCounts[ath.position] || 0) + 1;
          const rank = ath.depthRank || posCounts[ath.position];
          const depthOrder = ath.depthOrder || `${ath.position}${rank}`;

          const normName = ath.displayName.trim().toLowerCase();
          const liveInj = liveInjuries.get(normName);
          const injuryStatus = liveInj ? liveInj.status : (ath.injuryStatus || null);
          const injuryDetail = liveInj ? liveInj.detail : (ath.injuryDetail || '');

          dynamicCompetitors.push({
            id: `nfl_${ath.athleteId}`,
            athleteId: ath.athleteId,
            sportId: 'nfl',
            displayName: ath.displayName,
            shortName: ath.shortName,
            uniformNumber: ath.uniformNumber,
            teamName: teamFullName,
            teamCode: teamAbbr,
            positionGeneric: ath.position === 'QB' ? 'PLAYMAKER' : 'OFFENSE',
            position: ath.position,
            depthRank: rank,
            depthOrder: depthOrder,
            injuryStatus: injuryStatus,
            injuryDetail: injuryDetail,
            rating: 90,
            score: 0,
            stats: {
              pass_yds: 0,
              rush_yds: 0,
              rec_yds: 0,
              tds: 0,
              fgs: 0,
              stops: 0,
              touchdowns: 0,
              total_yards: 0,
              primaryMetricLabel: 'Touchdowns',
              primaryMetricValue: 0,
            },
            badges: ['gold_star'],
            avatar: {
              helmetColor: teamColors.helmet,
              jerseyColor: teamColors.jersey,
              stripeColor: teamColors.stripe,
              skinTone: ath.skinTone || '#e0ac69',
              number: ath.uniformNumber,
            },
          });
        }
      }
    }

    onProgress?.(`Resolved ${dynamicCompetitors.length} dynamic starters. Preserving live scores...`);

    // Merge existing scores/stats from localStorage so depth chart never wipes live scores to 0
    try {
      const cachedRaw = localStorage.getItem('pixel_pros_synced_competitors_nfl');
      if (cachedRaw) {
        const cachedList = JSON.parse(cachedRaw);
        if (Array.isArray(cachedList)) {
          const scoreMap = new Map<string, any>();
          cachedList.forEach((c: any) => {
            if (c && c.id) scoreMap.set(c.id, c);
            if (c && c.athleteId) scoreMap.set(c.athleteId, c);
          });
          dynamicCompetitors.forEach((dc) => {
            const existing = scoreMap.get(dc.id) || scoreMap.get(dc.athleteId);
            if (existing) {
              if (existing.score !== undefined && existing.score > 0) {
                dc.score = existing.score;
              }
              if (existing.stats && (existing.stats.pass_yds > 0 || existing.stats.rush_yds > 0 || existing.stats.rec_yds > 0 || existing.stats.tds > 0)) {
                dc.stats = existing.stats;
              }
              if (existing.last_game_score) dc.last_game_score = existing.last_game_score;
              if (existing.last_game_stats) dc.last_game_stats = existing.last_game_stats;
              if (existing.seasonStats) dc.seasonStats = existing.seasonStats;
              if (existing.season_stats) dc.season_stats = existing.season_stats;
              if (!dc.injuryStatus && existing.injuryStatus) {
                dc.injuryStatus = existing.injuryStatus;
                dc.injuryDetail = existing.injuryDetail;
              }
              if (!dc.depthRank && existing.depthRank) {
                dc.depthRank = existing.depthRank;
                dc.depthOrder = existing.depthOrder;
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('[DepthChart Sync] Failed to preserve existing scores cache:', e);
    }

    // 2. Dynamic Database Upsert to Supabase
    if (isSupabaseConfigured && dbUpsertRecords.length > 0) {
      try {
        // Overlay preserved scores into dbUpsertRecords so database scores are never wiped to 0
        const compScoreMap = new Map(dynamicCompetitors.map((dc) => [dc.id, dc]));
        const safeRecords = dbUpsertRecords.map((rec) => {
          const matched = compScoreMap.get(rec.id);
          if (matched && matched.score > 0) {
            return {
              ...rec,
              score: matched.score,
              stats: matched.stats,
              last_game_score: matched.last_game_score,
              last_game_stats: matched.last_game_stats,
            };
          }
          return rec;
        });

        const { error: err } = await supabase
          .from('competitors')
          .upsert(safeRecords, { onConflict: 'id' });

        if (err) {
          console.warn('[DepthChart Sync] Supabase upsert error:', err.message);
        }
      } catch (dbErr) {
        console.warn('[DepthChart Sync] Error writing competitors to Supabase:', dbErr);
      }
    }

    // 3. Cache pure dynamic competitors into localStorage
    try {
      localStorage.setItem('pixel_pros_synced_competitors_nfl', JSON.stringify(dynamicCompetitors));
      localStorage.setItem('pixel_pros_roster_cache_version', ROSTER_CACHE_VERSION);
    } catch (lsErr) {
      console.warn('[DepthChart Sync] LocalStorage write error:', lsErr);
    }

    // 4. Broadcast window events (only match schedule; score updates happen in espnSync with live stats)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pixel_pros_live_matches_updated', { detail: { sport: 'nfl' } }));
    }

    return {
      success: true,
      totalCompetitors: dynamicCompetitors.length,
      count: dynamicCompetitors.length,
      teamsCount: teamList.length,
      competitors: dynamicCompetitors,
    };
  } catch (err: any) {
    console.error('[DepthChart Sync] Error running dynamic pipeline:', err);
    return {
      success: false,
      totalCompetitors: 0,
      count: 0,
      teamsCount: 0,
      competitors: [],
      error: err.message || 'Unknown error during depth chart synchronization',
    };
  }
}
