/**
 * NFL League Statistics (Passing, Rushing, Receiving Yardage Leaders)
 * Synchronized with ESPN official season statistics.
 * Provides instant, zero-latency accurate rankings for Weekly Superstars.
 */

import { nflStatsDatabase } from './nflSeasonStatsDatabase';

export interface AthleteLeagueStat {
  athleteId?: string;
  displayName: string;
  teamCode: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | string;
  pass_yds: number;
  rush_yds: number;
  rec_yds: number;
  tds?: number;
  last_game_recap?: string;
  last_game_pts?: number;
}

export const MANUAL_NFL_LEAGUE_STATS: AthleteLeagueStat[] = [
  {
    athleteId: '4431452',
    displayName: 'Drake Maye',
    teamCode: 'NE',
    position: 'QB',
    pass_yds: 854,
    rush_yds: 136,
    rec_yds: 0,
    tds: 4,
    last_game_recap: '@ BUF: 269 PASS • 54 RUSH • 3 TD • 33 PTS',
    last_game_pts: 33,
  },
];

const LEAGUE_STATS_BY_NAME = new Map<string, AthleteLeagueStat>();
const LEAGUE_STATS_BY_ID = new Map<string, AthleteLeagueStat>();

function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Populate from official ESPN synced database (378 verified athletes)
const syncedList = (nflStatsDatabase || []) as AthleteLeagueStat[];
for (const stat of syncedList) {
  if (stat.athleteId) {
    LEAGUE_STATS_BY_ID.set(stat.athleteId, stat);
  }
  if (stat.displayName) {
    LEAGUE_STATS_BY_NAME.set(stat.displayName.trim().toLowerCase(), stat);
    LEAGUE_STATS_BY_NAME.set(normalizeNameKey(stat.displayName), stat);
  }
}

// Ensure manual verified updates take precedence
for (const stat of MANUAL_NFL_LEAGUE_STATS) {
  if (stat.athleteId) {
    LEAGUE_STATS_BY_ID.set(stat.athleteId, stat);
  }
  if (stat.displayName) {
    LEAGUE_STATS_BY_NAME.set(stat.displayName.trim().toLowerCase(), stat);
    LEAGUE_STATS_BY_NAME.set(normalizeNameKey(stat.displayName), stat);
  }
}

export const NFL_LEAGUE_STATS_DATABASE: AthleteLeagueStat[] = Array.from(LEAGUE_STATS_BY_ID.values());

export function registerAthleteLeagueStat(stat: AthleteLeagueStat): void {
  if (!stat) return;
  if (stat.athleteId) {
    LEAGUE_STATS_BY_ID.set(stat.athleteId, stat);
  }
  if (stat.displayName) {
    LEAGUE_STATS_BY_NAME.set(stat.displayName.trim().toLowerCase(), stat);
    LEAGUE_STATS_BY_NAME.set(normalizeNameKey(stat.displayName), stat);
  }
}

export function lookupNFLAthleteLeagueStats(displayName?: string, athleteId?: string): AthleteLeagueStat | undefined {
  if (athleteId && LEAGUE_STATS_BY_ID.has(athleteId)) {
    return LEAGUE_STATS_BY_ID.get(athleteId);
  }
  if (displayName) {
    const clean = displayName.trim().toLowerCase();
    if (LEAGUE_STATS_BY_NAME.has(clean)) {
      return LEAGUE_STATS_BY_NAME.get(clean);
    }
    const norm = normalizeNameKey(displayName);
    if (LEAGUE_STATS_BY_NAME.has(norm)) {
      return LEAGUE_STATS_BY_NAME.get(norm);
    }
  }
  return undefined;
}
