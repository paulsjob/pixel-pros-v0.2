/**
 * Official NBA 30 Team Metadata & Formatting Helpers
 * Authentic colors, positions (PG, SG, SF, PF, C), and NBA whole-number scoring.
 */

import { Competitor, Match } from '../types';

export interface NBATeamMeta {
  code: string;
  name: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export const NBA_TEAMS: Record<string, NBATeamMeta> = {
  ATL: { code: 'ATL', name: 'Hawks', city: 'Atlanta', primaryColor: '#e03a3e', secondaryColor: '#c1d32f', accentColor: '#26282a' },
  BOS: { code: 'BOS', name: 'Celtics', city: 'Boston', primaryColor: '#007a33', secondaryColor: '#ba9653', accentColor: '#000000' },
  BKN: { code: 'BKN', name: 'Nets', city: 'Brooklyn', primaryColor: '#000000', secondaryColor: '#ffffff', accentColor: '#707271' },
  CHA: { code: 'CHA', name: 'Hornets', city: 'Charlotte', primaryColor: '#1d1160', secondaryColor: '#00788c', accentColor: '#a1a1a4' },
  CHI: { code: 'CHI', name: 'Bulls', city: 'Chicago', primaryColor: '#ce1141', secondaryColor: '#000000', accentColor: '#ffffff' },
  CLE: { code: 'CLE', name: 'Cavaliers', city: 'Cleveland', primaryColor: '#860038', secondaryColor: '#041e42', accentColor: '#fdbb30' },
  DAL: { code: 'DAL', name: 'Mavericks', city: 'Dallas', primaryColor: '#00538c', secondaryColor: '#002b5e', accentColor: '#b8c4ca' },
  DEN: { code: 'DEN', name: 'Nuggets', city: 'Denver', primaryColor: '#0e2240', secondaryColor: '#fec524', accentColor: '#8b2131' },
  DET: { code: 'DET', name: 'Pistons', city: 'Detroit', primaryColor: '#c8102e', secondaryColor: '#1d42ba', accentColor: '#bec0c2' },
  GSW: { code: 'GSW', name: 'Warriors', city: 'Golden State', primaryColor: '#1d428a', secondaryColor: '#ffc72c', accentColor: '#ffffff' },
  HOU: { code: 'HOU', name: 'Rockets', city: 'Houston', primaryColor: '#ce1141', secondaryColor: '#000000', accentColor: '#9ea2a2' },
  IND: { code: 'IND', name: 'Pacers', city: 'Indiana', primaryColor: '#002d62', secondaryColor: '#fdbb30', accentColor: '#bec0c2' },
  LAC: { code: 'LAC', name: 'Clippers', city: 'LA', primaryColor: '#c8102e', secondaryColor: '#1d428a', accentColor: '#d6ced4' },
  LAL: { code: 'LAL', name: 'Lakers', city: 'Los Angeles', primaryColor: '#552583', secondaryColor: '#fdb927', accentColor: '#000000' },
  MEM: { code: 'MEM', name: 'Grizzlies', city: 'Memphis', primaryColor: '#5d76a9', secondaryColor: '#12173f', accentColor: '#f5b112' },
  MIA: { code: 'MIA', name: 'Heat', city: 'Miami', primaryColor: '#98002e', secondaryColor: '#f9a01b', accentColor: '#000000' },
  MIL: { code: 'MIL', name: 'Bucks', city: 'Milwaukee', primaryColor: '#00471b', secondaryColor: '#eee1c6', accentColor: '#0077c0' },
  MIN: { code: 'MIN', name: 'Timberwolves', city: 'Minnesota', primaryColor: '#0c2340', secondaryColor: '#236192', accentColor: '#9ea2a2' },
  NOP: { code: 'NOP', name: 'Pelicans', city: 'New Orleans', primaryColor: '#0c2340', secondaryColor: '#c8102e', accentColor: '#85714d' },
  NYK: { code: 'NYK', name: 'Knicks', city: 'New York', primaryColor: '#006bb6', secondaryColor: '#f58426', accentColor: '#bec0c2' },
  OKC: { code: 'OKC', name: 'Thunder', city: 'Oklahoma City', primaryColor: '#007ac1', secondaryColor: '#ef3b24', accentColor: '#002d62' },
  ORL: { code: 'ORL', name: 'Magic', city: 'Orlando', primaryColor: '#0077c0', secondaryColor: '#c4ced4', accentColor: '#000000' },
  PHI: { code: 'PHI', name: '76ers', city: 'Philadelphia', primaryColor: '#006bb6', secondaryColor: '#ed174c', accentColor: '#002b5c' },
  PHX: { code: 'PHX', name: 'Suns', city: 'Phoenix', primaryColor: '#1d1160', secondaryColor: '#e56020', accentColor: '#000000' },
  POR: { code: 'POR', name: 'Trail Blazers', city: 'Portland', primaryColor: '#e03a3e', secondaryColor: '#000000', accentColor: '#ffffff' },
  SAC: { code: 'SAC', name: 'Kings', city: 'Sacramento', primaryColor: '#5a2d81', secondaryColor: '#63727a', accentColor: '#000000' },
  SAS: { code: 'SAS', name: 'Spurs', city: 'San Antonio', primaryColor: '#c4ced4', secondaryColor: '#000000', accentColor: '#8a8d8f' },
  TOR: { code: 'TOR', name: 'Raptors', city: 'Toronto', primaryColor: '#ce1141', secondaryColor: '#000000', accentColor: '#a1a1a4' },
  UTA: { code: 'UTA', name: 'Jazz', city: 'Utah', primaryColor: '#002b5c', secondaryColor: '#00471b', accentColor: '#f9a01b' },
  WAS: { code: 'WAS', name: 'Wizards', city: 'Washington', primaryColor: '#002b5c', secondaryColor: '#e31837', accentColor: '#c4ced4' },
};

export function getNBATeamFullName(teamCode?: string): string {
  if (!teamCode) return 'NBA';
  const clean = teamCode.trim().toUpperCase();
  const team = NBA_TEAMS[clean];
  return team ? `${team.city} ${team.name}` : clean;
}

export function getNBATeamColors(teamCode?: string): { jersey: string; stripe: string; trim: string } {
  if (!teamCode) return { jersey: '#552583', stripe: '#fdb927', trim: '#ffffff' };
  const clean = teamCode.trim().toUpperCase();
  const found = NBA_TEAMS[clean];
  if (found) {
    return {
      jersey: found.primaryColor,
      stripe: found.secondaryColor,
      trim: found.accentColor,
    };
  }
  return { jersey: '#552583', stripe: '#fdb927', trim: '#ffffff' };
}

/**
 * NBA Whole-Number Finger Math Scoring Formula:
 * - 3PTM: +2 PTS
 * - AST:  +1 PT
 * - REB:  +1 PT
 * - Big Stop (BLK or STL): +3 PTS
 * - Actual PTS: +1 PT per 3 points (pts // 3)
 * Total in 20-50 PTS range.
 */
export function calculateNBAPoints(stats: {
  pts?: number;
  points?: number;
  threes?: number;
  three_pm?: number;
  rebounds?: number;
  reb?: number;
  assists?: number;
  ast?: number;
  blocks?: number;
  blk?: number;
  steals?: number;
  stl?: number;
  big_stops?: number;
}): {
  total: number;
  breakdown: {
    pointsPts: number;
    threesPts: number;
    rebPts: number;
    astPts: number;
    stopPts: number;
  };
} {
  const actualPts = stats.pts ?? stats.points ?? 0;
  const threes = stats.threes ?? stats.three_pm ?? 0;
  const rebounds = stats.rebounds ?? stats.reb ?? 0;
  const assists = stats.assists ?? stats.ast ?? 0;
  const blocks = stats.blocks ?? stats.blk ?? 0;
  const steals = stats.steals ?? stats.stl ?? 0;
  const bigStops = stats.big_stops ?? (blocks + steals);

  const pointsPts = Math.floor(actualPts / 3);
  const threesPts = threes * 2;
  const rebPts = rebounds * 1;
  const astPts = assists * 1;
  const stopPts = bigStops * 3;

  const total = pointsPts + threesPts + rebPts + astPts + stopPts;

  return {
    total,
    breakdown: {
      pointsPts,
      threesPts,
      rebPts,
      astPts,
      stopPts,
    },
  };
}

/**
 * Baseline Superstars for NBA:
 * High availability fallback roster so NBA game works instantly even offline.
 */
export const DEFAULT_NBA_COMPETITORS: Competitor[] = [
  {
    id: 'nba-lebron-james',
    sportId: 'nba',
    displayName: 'LeBron James',
    shortName: 'JAMES',
    uniformNumber: 23,
    teamName: 'Los Angeles Lakers',
    teamCode: 'LAL',
    positionGeneric: 'PLAYMAKER',
    position: 'SF',
    rating: 98,
    score: 38,
    badges: ['gold_star', 'diamond_crystal'],
    stats: {
      points: 26,
      pts: 26,
      three_pm: 3,
      threes: 3,
      reb: 8,
      rebounds: 8,
      ast: 9,
      assists: 9,
      stl: 1,
      blk: 1,
      big_stops: 2,
    },
    avatar: {
      helmetColor: '#552583',
      jerseyColor: '#552583',
      stripeColor: '#fdb927',
      skinTone: '#5c3509',
      number: 23,
    },
  },
  {
    id: 'nba-stephen-curry',
    sportId: 'nba',
    displayName: 'Stephen Curry',
    shortName: 'CURRY',
    uniformNumber: 30,
    teamName: 'Golden State Warriors',
    teamCode: 'GSW',
    positionGeneric: 'SCORER',
    position: 'PG',
    rating: 97,
    score: 41,
    badges: ['gold_star', 'diamond_crystal'],
    stats: {
      points: 32,
      pts: 32,
      three_pm: 7,
      threes: 7,
      reb: 5,
      rebounds: 5,
      ast: 6,
      assists: 6,
      stl: 2,
      blk: 0,
      big_stops: 2,
    },
    avatar: {
      helmetColor: '#1d428a',
      jerseyColor: '#1d428a',
      stripeColor: '#ffc72c',
      skinTone: '#d98c55',
      number: 30,
    },
  },
  {
    id: 'nba-luka-doncic',
    sportId: 'nba',
    displayName: 'Luka Dončić',
    shortName: 'DONČIĆ',
    uniformNumber: 77,
    teamName: 'Dallas Mavericks',
    teamCode: 'DAL',
    positionGeneric: 'PLAYMAKER',
    position: 'PG',
    rating: 99,
    score: 46,
    badges: ['gold_star', 'diamond_crystal'],
    stats: {
      points: 34,
      pts: 34,
      three_pm: 4,
      threes: 4,
      reb: 9,
      rebounds: 9,
      ast: 12,
      assists: 12,
      stl: 2,
      blk: 0,
      big_stops: 2,
    },
    avatar: {
      helmetColor: '#00538c',
      jerseyColor: '#00538c',
      stripeColor: '#002b5e',
      skinTone: '#f7d7b5',
      number: 77,
    },
  },
  {
    id: 'nba-nikola-jokic',
    sportId: 'nba',
    displayName: 'Nikola Jokić',
    shortName: 'JOKIĆ',
    uniformNumber: 15,
    teamName: 'Denver Nuggets',
    teamCode: 'DEN',
    positionGeneric: 'PLAYMAKER',
    position: 'C',
    rating: 99,
    score: 47,
    badges: ['gold_star', 'diamond_crystal'],
    stats: {
      points: 27,
      pts: 27,
      three_pm: 2,
      threes: 2,
      reb: 13,
      rebounds: 13,
      ast: 11,
      assists: 11,
      stl: 2,
      blk: 1,
      big_stops: 3,
    },
    avatar: {
      helmetColor: '#0e2240',
      jerseyColor: '#0e2240',
      stripeColor: '#fec524',
      skinTone: '#f7d7b5',
      number: 15,
    },
  },
  {
    id: 'nba-giannis-antetokounmpo',
    sportId: 'nba',
    displayName: 'Giannis Antetokounmpo',
    shortName: 'GIANNIS',
    uniformNumber: 34,
    teamName: 'Milwaukee Bucks',
    teamCode: 'MIL',
    positionGeneric: 'OFFENSE',
    position: 'PF',
    rating: 98,
    score: 43,
    badges: ['gold_star', 'diamond_crystal'],
    stats: {
      points: 31,
      pts: 31,
      three_pm: 0,
      threes: 0,
      reb: 12,
      rebounds: 12,
      ast: 6,
      assists: 6,
      stl: 1,
      blk: 2,
      big_stops: 3,
    },
    avatar: {
      helmetColor: '#00471b',
      jerseyColor: '#00471b',
      stripeColor: '#eee1c6',
      skinTone: '#5c3509',
      number: 34,
    },
  },
  {
    id: 'nba-jayson-tatum',
    sportId: 'nba',
    displayName: 'Jayson Tatum',
    shortName: 'TATUM',
    uniformNumber: 0,
    teamName: 'Boston Celtics',
    teamCode: 'BOS',
    positionGeneric: 'SCORER',
    position: 'SF',
    rating: 96,
    score: 39,
    badges: ['gold_star'],
    stats: {
      points: 29,
      pts: 29,
      three_pm: 4,
      threes: 4,
      reb: 8,
      rebounds: 8,
      ast: 5,
      assists: 5,
      stl: 1,
      blk: 1,
      big_stops: 2,
    },
    avatar: {
      helmetColor: '#007a33',
      jerseyColor: '#007a33',
      stripeColor: '#ba9653',
      skinTone: '#8c532b',
      number: 0,
    },
  },
  {
    id: 'nba-anthony-edwards',
    sportId: 'nba',
    displayName: 'Anthony Edwards',
    shortName: 'EDWARDS',
    uniformNumber: 5,
    teamName: 'Minnesota Timberwolves',
    teamCode: 'MIN',
    positionGeneric: 'SCORER',
    position: 'SG',
    rating: 96,
    score: 36,
    badges: ['gold_star'],
    stats: {
      points: 28,
      pts: 28,
      three_pm: 4,
      threes: 4,
      reb: 5,
      rebounds: 5,
      ast: 5,
      assists: 5,
      stl: 2,
      blk: 1,
      big_stops: 3,
    },
    avatar: {
      helmetColor: '#0c2340',
      jerseyColor: '#0c2340',
      stripeColor: '#236192',
      skinTone: '#5c3509',
      number: 5,
    },
  },
  {
    id: 'nba-victor-wembanyama',
    sportId: 'nba',
    displayName: 'Victor Wembanyama',
    shortName: 'WEMBY',
    uniformNumber: 1,
    teamName: 'San Antonio Spurs',
    teamCode: 'SAS',
    positionGeneric: 'DEFENSE',
    position: 'C',
    rating: 97,
    score: 44,
    badges: ['gold_star', 'shield_badge'],
    stats: {
      points: 24,
      pts: 24,
      three_pm: 3,
      threes: 3,
      reb: 11,
      rebounds: 11,
      ast: 4,
      assists: 4,
      stl: 1,
      blk: 4,
      big_stops: 5,
    },
    avatar: {
      helmetColor: '#c4ced4',
      jerseyColor: '#000000',
      stripeColor: '#c4ced4',
      skinTone: '#8c532b',
      number: 1,
    },
  },
  {
    id: 'nba-shai-gilgeous-alexander',
    sportId: 'nba',
    displayName: 'Shai Gilgeous-Alexander',
    shortName: 'SHAI',
    uniformNumber: 2,
    teamName: 'Oklahoma City Thunder',
    teamCode: 'OKC',
    positionGeneric: 'SCORER',
    position: 'PG',
    rating: 98,
    score: 42,
    badges: ['gold_star', 'diamond_crystal'],
    stats: {
      points: 31,
      pts: 31,
      three_pm: 2,
      threes: 2,
      reb: 6,
      rebounds: 6,
      ast: 7,
      assists: 7,
      stl: 2,
      blk: 1,
      big_stops: 3,
    },
    avatar: {
      helmetColor: '#007ac1',
      jerseyColor: '#007ac1',
      stripeColor: '#ef3b24',
      skinTone: '#5c3509',
      number: 2,
    },
  },
  {
    id: 'nba-anthony-davis',
    sportId: 'nba',
    displayName: 'Anthony Davis',
    shortName: 'DAVIS',
    uniformNumber: 3,
    teamName: 'Los Angeles Lakers',
    teamCode: 'LAL',
    positionGeneric: 'DEFENSE',
    position: 'C',
    rating: 96,
    score: 41,
    badges: ['gold_star'],
    stats: {
      points: 25,
      pts: 25,
      three_pm: 1,
      threes: 1,
      reb: 12,
      rebounds: 12,
      ast: 3,
      assists: 3,
      stl: 1,
      blk: 3,
      big_stops: 4,
    },
    avatar: {
      helmetColor: '#552583',
      jerseyColor: '#552583',
      stripeColor: '#fdb927',
      skinTone: '#8c532b',
      number: 3,
    },
  },
  {
    id: 'nba-kevin-durant',
    sportId: 'nba',
    displayName: 'Kevin Durant',
    shortName: 'DURANT',
    uniformNumber: 35,
    teamName: 'Phoenix Suns',
    teamCode: 'PHX',
    positionGeneric: 'SCORER',
    position: 'PF',
    rating: 97,
    score: 37,
    badges: ['gold_star'],
    stats: {
      points: 28,
      pts: 28,
      three_pm: 3,
      threes: 3,
      reb: 7,
      rebounds: 7,
      ast: 5,
      assists: 5,
      stl: 1,
      blk: 1,
      big_stops: 2,
    },
    avatar: {
      helmetColor: '#1d1160',
      jerseyColor: '#1d1160',
      stripeColor: '#e56020',
      skinTone: '#5c3509',
      number: 35,
    },
  },
  {
    id: 'nba-jalen-brunson',
    sportId: 'nba',
    displayName: 'Jalen Brunson',
    shortName: 'BRUNSON',
    uniformNumber: 11,
    teamName: 'New York Knicks',
    teamCode: 'NYK',
    positionGeneric: 'SCORER',
    position: 'PG',
    rating: 95,
    score: 35,
    badges: ['gold_star'],
    stats: {
      points: 29,
      pts: 29,
      three_pm: 3,
      threes: 3,
      reb: 3,
      rebounds: 3,
      ast: 7,
      assists: 7,
      stl: 1,
      blk: 0,
      big_stops: 1,
    },
    avatar: {
      helmetColor: '#006bb6',
      jerseyColor: '#006bb6',
      stripeColor: '#f58426',
      skinTone: '#d98c55',
      number: 11,
    },
  },
];

/**
 * Baseline NBA Slate for Tonights Matches:
 */
export const DEFAULT_NBA_MATCHES: Match[] = [
  {
    id: 'nba-match-1',
    sportId: 'nba',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Golden State Warriors',
    homeTeamCode: 'LAL',
    awayTeamCode: 'GSW',
    home_team: 'LAL',
    away_team: 'GSW',
    homeScore: 104,
    awayScore: 101,
    home_score: 104,
    away_score: 101,
    periodLabel: '🔴 Q4 02:45',
    quarter_time: 'Q4 02:45',
    quarterTime: 'Q4 02:45',
    status: 'live',
  },
  {
    id: 'nba-match-2',
    sportId: 'nba',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Philadelphia 76ers',
    homeTeamCode: 'BOS',
    awayTeamCode: 'PHI',
    home_team: 'BOS',
    away_team: 'PHI',
    homeScore: 118,
    awayScore: 112,
    home_score: 118,
    away_score: 112,
    periodLabel: 'Final',
    quarter_time: 'Final',
    quarterTime: 'Final',
    status: 'final',
  },
  {
    id: 'nba-match-3',
    sportId: 'nba',
    homeTeam: 'Dallas Mavericks',
    awayTeam: 'Denver Nuggets',
    homeTeamCode: 'DAL',
    awayTeamCode: 'DEN',
    home_team: 'DAL',
    away_team: 'DEN',
    homeScore: 89,
    awayScore: 92,
    home_score: 89,
    away_score: 92,
    periodLabel: '🔴 Q3 06:18',
    quarter_time: 'Q3 06:18',
    quarterTime: 'Q3 06:18',
    status: 'live',
  },
  {
    id: 'nba-match-4',
    sportId: 'nba',
    homeTeam: 'San Antonio Spurs',
    awayTeam: 'Phoenix Suns',
    homeTeamCode: 'SAS',
    awayTeamCode: 'PHX',
    home_team: 'SAS',
    away_team: 'PHX',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    periodLabel: 'TONIGHT 8:30P',
    quarter_time: 'TONIGHT 8:30P',
    quarterTime: 'TONIGHT 8:30P',
    status: 'upcoming',
  },
  {
    id: 'nba-match-5',
    sportId: 'nba',
    homeTeam: 'Oklahoma City Thunder',
    awayTeam: 'Minnesota Timberwolves',
    homeTeamCode: 'OKC',
    awayTeamCode: 'MIN',
    home_team: 'OKC',
    away_team: 'MIN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    periodLabel: 'TONIGHT 9:00P',
    quarter_time: 'TONIGHT 9:00P',
    quarterTime: 'TONIGHT 9:00P',
    status: 'upcoming',
  },
];
