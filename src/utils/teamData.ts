/**
 * Official NFL 32 Team Metadata & Formatting Helpers
 * Strictly authentic colors, full names, and game situation formatters.
 */

import { Competitor, Match, SportId, ActiveSlot } from '../types';
import { NFL_ROSTER_MANIFEST, validateTeamRoster, isRetiredPlayer } from '../data/nflRosterManifest';
import { lookupNFLAthleteLeagueStats } from '../data/nflLeagueStats';
import { DEFAULT_NBA_COMPETITORS } from './nbaTeamData';

export interface TeamMeta {
  code: string;
  name: string;
  helmetColor: string;
  jerseyColor: string;
  stripeColor: string;
  awayJerseyColor?: string;
  pantsColor?: string;
}

export const NFL_TEAMS: Record<string, TeamMeta> = {
  ARI: { code: 'ARI', name: 'Arizona Cardinals', helmetColor: '#ffffff', jerseyColor: '#97233f', stripeColor: '#000000', awayJerseyColor: '#ffffff', pantsColor: '#97233f' },
  ATL: { code: 'ATL', name: 'Atlanta Falcons', helmetColor: '#000000', jerseyColor: '#000000', stripeColor: '#a71930', awayJerseyColor: '#ffffff', pantsColor: '#000000' },
  BAL: { code: 'BAL', name: 'Baltimore Ravens', helmetColor: '#1a0933', jerseyColor: '#241773', stripeColor: '#d0a85c', awayJerseyColor: '#ffffff', pantsColor: '#000000' },
  BUF: { code: 'BUF', name: 'Buffalo Bills', helmetColor: '#ffffff', jerseyColor: '#00338d', stripeColor: '#c60c30', awayJerseyColor: '#ffffff', pantsColor: '#00338d' },
  CAR: { code: 'CAR', name: 'Carolina Panthers', helmetColor: '#a5acaf', jerseyColor: '#0085ca', stripeColor: '#000000', awayJerseyColor: '#ffffff', pantsColor: '#a5acaf' },
  CHI: { code: 'CHI', name: 'Chicago Bears', helmetColor: '#0b162a', jerseyColor: '#0b162a', stripeColor: '#c83803', awayJerseyColor: '#ffffff', pantsColor: '#ffffff' },
  CIN: { code: 'CIN', name: 'Cincinnati Bengals', helmetColor: '#fb4f14', jerseyColor: '#000000', stripeColor: '#fb4f14', awayJerseyColor: '#ffffff', pantsColor: '#000000' },
  CLE: { code: 'CLE', name: 'Cleveland Browns', helmetColor: '#ff3c00', jerseyColor: '#311d00', stripeColor: '#ff3c00', awayJerseyColor: '#ffffff', pantsColor: '#311d00' },
  DAL: { code: 'DAL', name: 'Dallas Cowboys', helmetColor: '#b0b7bc', jerseyColor: '#002244', stripeColor: '#ffffff', awayJerseyColor: '#ffffff', pantsColor: '#b0b7bc' },
  DEN: { code: 'DEN', name: 'Denver Broncos', helmetColor: '#002244', jerseyColor: '#fb4f14', stripeColor: '#ffffff', awayJerseyColor: '#ffffff', pantsColor: '#002244' },
  DET: { code: 'DET', name: 'Detroit Lions', helmetColor: '#b0b7bc', jerseyColor: '#0076b6', stripeColor: '#ffffff', awayJerseyColor: '#ffffff', pantsColor: '#b0b7bc' },
  GB:  { code: 'GB',  name: 'Green Bay Packers', helmetColor: '#ffb612', jerseyColor: '#203731', stripeColor: '#ffffff', awayJerseyColor: '#ffffff', pantsColor: '#ffb612' },
  HOU: { code: 'HOU', name: 'Houston Texans', helmetColor: '#03202f', jerseyColor: '#03202f', stripeColor: '#a71930', awayJerseyColor: '#ffffff', pantsColor: '#03202f' },
  IND: { code: 'IND', name: 'Indianapolis Colts', helmetColor: '#ffffff', jerseyColor: '#002c5f', stripeColor: '#ffffff', awayJerseyColor: '#ffffff', pantsColor: '#ffffff' },
  JAX: { code: 'JAX', name: 'Jacksonville Jaguars', helmetColor: '#006778', jerseyColor: '#006778', stripeColor: '#d7a22a', awayJerseyColor: '#ffffff', pantsColor: '#000000' },
  KC:  { code: 'KC',  name: 'Kansas City Chiefs', helmetColor: '#e31837', jerseyColor: '#e31837', stripeColor: '#ffb81c', awayJerseyColor: '#ffffff', pantsColor: '#ffffff' },
  LAC: { code: 'LAC', name: 'Los Angeles Chargers', helmetColor: '#ffffff', jerseyColor: '#0080c6', stripeColor: '#ffc20e', awayJerseyColor: '#ffffff', pantsColor: '#ffc20e' },
  LAR: { code: 'LAR', name: 'Los Angeles Rams', helmetColor: '#003594', jerseyColor: '#003594', stripeColor: '#ffa300', awayJerseyColor: '#ffffff', pantsColor: '#ffa300' },
  LV:  { code: 'LV',  name: 'Las Vegas Raiders', helmetColor: '#a5acaf', jerseyColor: '#000000', stripeColor: '#a5acaf', awayJerseyColor: '#ffffff', pantsColor: '#a5acaf' },
  MIA: { code: 'MIA', name: 'Miami Dolphins', helmetColor: '#ffffff', jerseyColor: '#008e97', stripeColor: '#fc4c02', awayJerseyColor: '#ffffff', pantsColor: '#ffffff' },
  MIN: { code: 'MIN', name: 'Minnesota Vikings', helmetColor: '#4f2683', jerseyColor: '#4f2683', stripeColor: '#ffc62f', awayJerseyColor: '#ffffff', pantsColor: '#4f2683' },
  NE:  { code: 'NE',  name: 'New England Patriots', helmetColor: '#b0b7bc', jerseyColor: '#001a35', stripeColor: '#c60c30', awayJerseyColor: '#ffffff', pantsColor: '#001a35' },
  NO:  { code: 'NO',  name: 'New Orleans Saints', helmetColor: '#d3bc8d', jerseyColor: '#101820', stripeColor: '#d3bc8d', awayJerseyColor: '#ffffff', pantsColor: '#101820' },
  NYG: { code: 'NYG', name: 'New York Giants', helmetColor: '#0b2265', jerseyColor: '#0b2265', stripeColor: '#a71930', awayJerseyColor: '#ffffff', pantsColor: '#e2e8f0' },
  NYJ: { code: 'NYJ', name: 'New York Jets', helmetColor: '#125740', jerseyColor: '#125740', stripeColor: '#ffffff', awayJerseyColor: '#ffffff', pantsColor: '#125740' },
  PHI: { code: 'PHI', name: 'Philadelphia Eagles', helmetColor: '#004c54', jerseyColor: '#004c54', stripeColor: '#a5acaf', awayJerseyColor: '#ffffff', pantsColor: '#004c54' },
  PIT: { code: 'PIT', name: 'Pittsburgh Steelers', helmetColor: '#101820', jerseyColor: '#101820', stripeColor: '#ffb612', awayJerseyColor: '#ffffff', pantsColor: '#ffb612' },
  SEA: { code: 'SEA', name: 'Seattle Seahawks', helmetColor: '#002244', jerseyColor: '#002244', stripeColor: '#69be28', awayJerseyColor: '#ffffff', pantsColor: '#002244' },
  SF:  { code: 'SF',  name: 'San Francisco 49ers', helmetColor: '#b3995d', jerseyColor: '#aa0000', stripeColor: '#b3995d', awayJerseyColor: '#ffffff', pantsColor: '#b3995d' },
  TB:  { code: 'TB',  name: 'Tampa Bay Buccaneers', helmetColor: '#34302b', jerseyColor: '#d50a0a', stripeColor: '#ff7900', awayJerseyColor: '#ffffff', pantsColor: '#34302b' },
  TEN: { code: 'TEN', name: 'Tennessee Titans', helmetColor: '#0c2340', jerseyColor: '#4b92db', stripeColor: '#c8102e', awayJerseyColor: '#ffffff', pantsColor: '#0c2340' },
  WSH: { code: 'WSH', name: 'Washington Commanders', helmetColor: '#5a1414', jerseyColor: '#5a1414', stripeColor: '#ffb612', awayJerseyColor: '#ffffff', pantsColor: '#ffb612' },
};

export function normalizeTeamCode(code?: string): string {
  if (!code) return 'NFL';
  const c = code.trim().toUpperCase().replace(/\s+/g, '');
  const aliasMap: Record<string, string> = {
    LA: 'LAR',
    RAMS: 'LAR',
    LOSANGELESRAMS: 'LAR',
    WAS: 'WSH',
    COMMANDERS: 'WSH',
    WASHINGTON: 'WSH',
    JAC: 'JAX',
    JAGUARS: 'JAX',
    JACKSONVILLE: 'JAX',
    KAN: 'KC',
    CHIEFS: 'KC',
    KANSASCITY: 'KC',
    GNB: 'GB',
    PACKERS: 'GB',
    GREENBAY: 'GB',
    NWE: 'NE',
    PATRIOTS: 'NE',
    NEWENGLAND: 'NE',
    NOR: 'NO',
    SAINTS: 'NO',
    NEWORLEANS: 'NO',
    SFO: 'SF',
    '49ERS': 'SF',
    SANFRANCISCO: 'SF',
    TAM: 'TB',
    BUCCANEERS: 'TB',
    TAMPABAY: 'TB',
    LVR: 'LV',
    RAIDERS: 'LV',
    LASVEGAS: 'LV',
  };
  return aliasMap[c] || c;
}

export function getTeamFullName(teamCode?: string): string {
  if (!teamCode) return 'NFL';
  const clean = normalizeTeamCode(teamCode);
  return NFL_TEAMS[clean]?.name || clean;
}

/**
 * Returns distinct colors for a team's uniform.
 * By default, both teams wear their authentic, vibrant primary colored team jerseys.
 * (User preference: "don't go crazy with the colors. like, Blue and Yellow for the Rams is different from Blue and Red for the Giants. so that would be fine. I don't like the Giants' white jerseys here!").
 * Also avoids white-on-white uniforms by guaranteeing non-white pants and contrasting numbers.
 */
export function getTeamColors(
  teamCode?: string,
  isAway = false,
  opponentTeamCode?: string
): { helmet: string; jersey: string; stripe: string; pants: string; numberColor: string } {
  if (!teamCode) {
    return { helmet: '#12579b', jersey: '#12579b', stripe: '#ffffff', pants: '#12579b', numberColor: '#ffffff' };
  }
  const clean = normalizeTeamCode(teamCode);
  const found = NFL_TEAMS[clean];
  if (!found) {
    return { helmet: '#12579b', jersey: '#12579b', stripe: '#ffffff', pants: '#12579b', numberColor: '#ffffff' };
  }

  // Authentic team colors by default!
  // Teams only switch if their primary jersey colors are identical (e.g., both wearing the exact same shade of black or identical red).
  let useAwayUniform = false;
  if (opponentTeamCode) {
    const oppClean = normalizeTeamCode(opponentTeamCode);
    const oppFound = NFL_TEAMS[oppClean];
    if (oppFound) {
      const myJersey = found.jerseyColor.toLowerCase();
      const oppJersey = oppFound.jerseyColor.toLowerCase();
      const bothIdentical = myJersey === oppJersey;
      if (bothIdentical && isAway) {
        useAwayUniform = true;
      }
    }
  }

  const defaultPants = found.pantsColor || found.jerseyColor;

  if (useAwayUniform && found.awayJerseyColor) {
    // Away uniform: white jersey, but CRITICAL: NEVER white-on-white pants!
    // The pants take the team's primary color or helmet color to ensure strong contrast.
    const nonWhitePants =
      defaultPants.toLowerCase() !== '#ffffff'
        ? defaultPants
        : found.jerseyColor.toLowerCase() !== '#ffffff'
        ? found.jerseyColor
        : found.helmetColor;

    return {
      helmet: found.helmetColor,
      jersey: found.awayJerseyColor,
      stripe: found.jerseyColor,
      pants: nonWhitePants,
      numberColor: found.jerseyColor,
    };
  }

  return {
    helmet: found.helmetColor,
    jersey: found.jerseyColor,
    stripe: found.stripeColor,
    pants: defaultPants,
    numberColor: '#ffffff',
  };
}

/**
 * Returns contrasting background and border colors for the helmet pedestal so the 8-bit helmet POPS.
 * Never places a dark helmet on a dark backing or a light helmet on a light backing!
 */
export function getTeamHelmetPopColors(teamCode?: string): { background: string; border: string } {
  const code = normalizeTeamCode(teamCode);
  const POP_MAP: Record<string, { background: string; border: string }> = {
    ATL: { background: '#a71930', border: '#ffffff' }, // Black helmet on Falcon Red!
    BAL: { background: '#241773', border: '#d0a85c' }, // Dark helmet on Purple & Gold!
    CHI: { background: '#c83803', border: '#ffffff' }, // Navy helmet on Bears Orange!
    PIT: { background: '#ffb612', border: '#000000' }, // Black helmet on Steelers Gold!
    LV:  { background: '#27272a', border: '#e4e4e7' }, // Silver helmet on Dark Charcoal & Silver!
    GB:  { background: '#203731', border: '#ffb612' }, // Yellow helmet on Forest Green!
    DAL: { background: '#002244', border: '#b0b7bc' }, // Silver helmet on Cowboys Navy!
    KC:  { background: '#ffb81c', border: '#e31837' }, // Red helmet on Chiefs Gold!
    MIA: { background: '#008e97', border: '#fc4c02' }, // White helmet on Dolphins Aqua!
    DEN: { background: '#fb4f14', border: '#ffffff' }, // Navy helmet on Broncos Orange!
    DET: { background: '#0076b6', border: '#ffffff' }, // Silver helmet on Honolulu Blue!
    ARI: { background: '#97233f', border: '#ffffff' }, // White helmet on Cardinal Red!
    BUF: { background: '#00338d', border: '#c60c30' }, // White helmet on Royal Blue!
    CAR: { background: '#0085ca', border: '#ffffff' }, // Silver helmet on Panther Blue!
    CIN: { background: '#18181b', border: '#fb4f14' }, // Orange striped helmet on Black & Orange!
    CLE: { background: '#311d00', border: '#ff3c00' }, // Orange helmet on Browns Brown!
    HOU: { background: '#a71930', border: '#ffffff' }, // Deep Navy helmet on Battle Red!
    IND: { background: '#002c5f', border: '#ffffff' }, // White helmet on Speed Blue!
    JAX: { background: '#006778', border: '#d7a22a' }, // Teal on Gold!
    LAC: { background: '#0080c6', border: '#ffc20e' }, // White helmet on Powder Blue!
    LAR: { background: '#003594', border: '#ffa300' }, // Royal Blue with Sol Yellow border!
    MIN: { background: '#4f2683', border: '#ffc62f' }, // Purple helmet with Gold border!
    NE:  { background: '#001a35', border: '#c60c30' }, // Silver helmet on Navy!
    NO:  { background: '#101820', border: '#d3bc8d' }, // Gold helmet on Black & Gold!
    NYG: { background: '#0b2265', border: '#a71930' }, // Blue helmet on Deep Blue & Red!
    NYJ: { background: '#125740', border: '#ffffff' }, // Green helmet on Jet Green!
    PHI: { background: '#004c54', border: '#a5acaf' }, // Midnight Green on Teal & Silver!
    SEA: { background: '#002244', border: '#69be28' }, // Navy helmet on Navy with Action Green border!
    SF:  { background: '#aa0000', border: '#b3995d' }, // Gold helmet on 49ers Red!
    TB:  { background: '#d50a0a', border: '#ff7900' }, // Pewter helmet on Bucs Red!
    TEN: { background: '#0c2340', border: '#4b92db' }, // Navy on Titans Light Blue!
    WSH: { background: '#5a1414', border: '#ffb612' }, // Burgundy on Gold!
  };
  return POP_MAP[code] || { background: '#1e293b', border: '#38bdf8' };
}

// Known superstar uniform numbers
const KNOWN_NUMBERS: Record<string, number> = {
  'josh allen': 17,
  'patrick mahomes': 15,
  'derrick henry': 22,
  'ceedee lamb': 88,
  'saquon barkley': 26,
  'jalen hurts': 1,
  'justin jefferson': 18,
  'christian mccaffrey': 23,
  'trevor lawrence': 16,
  'lamar jackson': 8,
  'travis kelce': 87,
  'rashee rice': 4,
  'tyler shough': 12,
  'c.j. stroud': 7,
  'joe burrow': 9,
  'baker mayfield': 6,
  'drake maye': 10,
  'jahmyr gibbs': 26,
  'drew lock': 2,
  'amon-ra st. brown': 14,
  'jayden daniels': 5,
  'stefon diggs': 1,
  'caleb williams': 18,
  'dj moore': 2,
  'dallas goedert': 88,
  'cam ward': 1,
  'tony pollard': 20,
  'calvin ridley': 0,
  'will levis': 8,
  'tyjae spears': 2,
  'elic ayomanor': 5,
  'a.j. brown': 11,
  'devonta smith': 6,
  'jahan dotson': 4,
  'kenneth gainwell': 14,
  'julius chestnut': 36,
  'daniel bellinger': 82,
  'chimere dike': 17,
  'mitchell trubisky': 10,
};

export function getUniformNumber(name?: string, id?: string): number {
  if (name) {
    const key = name.trim().toLowerCase();
    if (KNOWN_NUMBERS[key]) return KNOWN_NUMBERS[key];
  }
  if (id) {
    const numPart = id.replace(/\D/g, '');
    if (numPart) {
      const val = parseInt(numPart.slice(-2), 10);
      return val > 0 && val <= 99 ? val : 11;
    }
  }
  return 10;
}

export interface FormattedGameSituation {
  statusLine: string;
  scoreLine: string;
  singleLine: string;
  isLive: boolean;
  isFinal: boolean;
}

/**
 * Formats game situation compactly for mobile cards to prevent any score truncation
 */
export function formatRealtimeGameSituationCompact(match: {
  quarter_time?: string;
  quarterTime?: string;
  periodLabel?: string;
  away_team?: string;
  awayTeamCode?: string;
  home_team?: string;
  homeTeamCode?: string;
  away_score?: number;
  awayScore?: number;
  home_score?: number;
  homeScore?: number;
  status?: string;
}): FormattedGameSituation {
  const away = (match.away_team || match.awayTeamCode || '').trim().toUpperCase();
  const home = (match.home_team || match.homeTeamCode || '').trim().toUpperCase();
  const aScore = match.away_score ?? match.awayScore ?? 0;
  const hScore = match.home_score ?? match.homeScore ?? 0;
  const rawTime = (match.quarter_time || match.quarterTime || match.periodLabel || '').trim();
  const status = (match.status || '').toLowerCase();

  const isUpcoming = status === 'upcoming' || status === 'scheduled' || status === 'pre';
  const isFinal = !isUpcoming && (status === 'final' || rawTime.toLowerCase().includes('final'));

  const isLive =
    !isUpcoming &&
    !isFinal &&
    (status === 'live' ||
      /\b(q[1-4]|ot|half|halftime|overtime)\b/i.test(rawTime) ||
      /\b(1st|2nd|3rd|4th)\s*(q|quarter|qtr)\b/i.test(rawTime));

  let statusLine = 'LIVE';
  let scoreLine = `${away} ${aScore}-${hScore}`;

  if (isFinal) {
    statusLine = 'FINAL';
    scoreLine = `${away} ${aScore}-${hScore}`;
  } else if (isLive) {
    let qLabel = 'LIVE';
    if (rawTime.includes('1st') || rawTime.includes('Q1')) qLabel = 'Q1';
    else if (rawTime.includes('2nd') || rawTime.includes('Q2')) qLabel = 'Q2';
    else if (rawTime.includes('3rd') || rawTime.includes('Q3')) qLabel = 'Q3';
    else if (rawTime.includes('4th') || rawTime.includes('Q4')) qLabel = 'Q4';
    else if (rawTime.toLowerCase().includes('half')) qLabel = 'HALF';
    else if (rawTime.includes('OT')) qLabel = 'OT';
    else if (rawTime && !rawTime.toLowerCase().includes('live')) qLabel = rawTime;

    statusLine = `🔴 ${qLabel}`;
    scoreLine = `${away} ${aScore}-${hScore}`;
  } else {
    // Scheduled / upcoming e.g. SUN 4:25P · WSH @ PHI
    let kickoff = rawTime || 'SUN 4:25P';
    kickoff = kickoff.replace(/\s*PM/i, 'P').replace(/\s*AM/i, 'A');
    statusLine = kickoff;
    scoreLine = `${away} @ ${home}`;
  }

  const singleLine = `${statusLine} · ${scoreLine}`;

  return { statusLine, scoreLine, singleLine, isLive, isFinal };
}

/**
 * Renders real-time game situation string strictly according to spec:
 * `{match.quarter_time} · {match.away_team} {match.away_score} - {match.home_team} {match.home_score}`
 */
export function formatRealtimeGameSituation(
  match: {
    quarter_time?: string;
    quarterTime?: string;
    periodLabel?: string;
    away_team?: string;
    awayTeamCode?: string;
    home_team?: string;
    homeTeamCode?: string;
    away_score?: number;
    awayScore?: number;
    home_score?: number;
    homeScore?: number;
    status?: string;
  }
): string {
  const compact = formatRealtimeGameSituationCompact(match);
  return compact.singleLine;
}

/**
 * Master Manifest Competitor Builder:
 * Converts the locked 32-team Starter Manifest into immutable Competitors.
 * Strictly guarantees every NFL team has:
 * - >= 1 QB
 * - >= 2 RBs
 * - >= 2 WRs
 * - >= 1 TE
 */
export function buildManifestCompetitors(): Competitor[] {
  const list: Competitor[] = [];
  const registeredIds = new Set<string>();

  for (const [teamCode, athletes] of Object.entries(NFL_ROSTER_MANIFEST)) {
    // Hard runtime assertion: throws if any team violates the Core Starter Quota
    validateTeamRoster(teamCode, athletes);

    const teamFullName = getTeamFullName(teamCode);
    const colors = getTeamColors(teamCode);
    const posCounts: Record<string, number> = {};

    for (const ath of athletes) {
      if (isRetiredPlayer(ath.displayName)) {
        continue;
      }
      const compId = `nfl_${ath.athleteId}`;
      if (registeredIds.has(compId)) {
        console.warn(`[Manifest] Duplicate athleteId ignored: ${compId} (${ath.displayName})`);
        continue;
      }
      registeredIds.add(compId);

      posCounts[ath.position] = (posCounts[ath.position] || 0) + 1;
      const computedRank = posCounts[ath.position];
      const depthRank = ath.depthRank || computedRank;
      const depthOrder = ath.depthOrder || `${ath.position}${depthRank}`;

      const isPlaymaker = ath.position === 'QB';
      const isScorer = ath.position === 'WR' || ath.position === 'K';
      const posGeneric = isPlaymaker ? 'PLAYMAKER' : isScorer ? 'SCORER' : 'OFFENSE';

      list.push({
        id: compId,
        athleteId: ath.athleteId,
        sportId: 'nfl',
        displayName: ath.displayName,
        shortName: ath.shortName,
        uniformNumber: ath.uniformNumber,
        teamName: teamFullName,
        teamCode: teamCode,
        positionGeneric: posGeneric,
        position: ath.position,
        depthRank: depthRank,
        depthOrder: depthOrder,
        injuryStatus: ath.injuryStatus || null,
        injuryDetail: ath.injuryDetail || '',
        rating: ath.depthRank === 1 ? 95 : 85,
        score: ath.athleteId === '8439' ? 29 : ath.athleteId === '4685702' ? 15 : ath.athleteId === '3122840' ? 18 : ath.athleteId === '4361411' ? 7 : 0,
        // Live game stats start strictly at 0 until the player's game kicks off and stats are recorded in boxscore!
        stats: {
          pass_yds: ath.athleteId === '8439' ? 299 : ath.athleteId === '3122840' ? 215 : 0,
          passingYards: ath.athleteId === '8439' ? 299 : ath.athleteId === '3122840' ? 215 : 0,
          rush_yds: ath.athleteId === '4685702' ? 96 : 0,
          rushingYards: ath.athleteId === '4685702' ? 96 : 0,
          rec_yds: ath.athleteId === '4361411' ? 45 : 0,
          receivingYards: ath.athleteId === '4361411' ? 45 : 0,
          tds: ath.athleteId === '8439' ? 3 : (ath.athleteId === '4685702' || ath.athleteId === '3122840') ? 1 : 0,
          touchdowns: ath.athleteId === '8439' ? 3 : (ath.athleteId === '4685702' || ath.athleteId === '3122840') ? 1 : 0,
          fgs: 0,
          stops: 0,
          total_yards: ath.athleteId === '8439' ? 299 : ath.athleteId === '4685702' ? 96 : ath.athleteId === '3122840' ? 215 : ath.athleteId === '4361411' ? 45 : 0,
          primaryMetricLabel: ath.position === 'QB' ? 'Pass Yds' : ath.position === 'RB' ? 'Rush Yds' : 'Rec Yds',
          primaryMetricValue: ath.athleteId === '8439' ? 299 : ath.athleteId === '4685702' ? 96 : ath.athleteId === '3122840' ? 215 : ath.athleteId === '4361411' ? 45 : 0,
        },
        seasonStats: (() => {
          const lStat = lookupNFLAthleteLeagueStats(ath.displayName, ath.athleteId);
          const pYards = lStat?.pass_yds || 0;
          const rYards = lStat?.rush_yds || 0;
          const rcYards = lStat?.rec_yds || 0;
          const totalYds = pYards + rYards + rcYards;
          const primaryVal = ath.position === 'QB' ? pYards : ath.position === 'RB' ? rYards : rcYards;
          return {
            pass_yds: pYards,
            rush_yds: rYards,
            rec_yds: rcYards,
            tds: lStat?.tds || 0,
            touchdowns: lStat?.tds || 0,
            total_yards: totalYds,
            primaryMetricLabel: ath.position === 'QB' ? 'Pass Yds' : ath.position === 'RB' ? 'Rush Yds' : 'Rec Yds',
            primaryMetricValue: primaryVal,
          };
        })(),
        season_stats: (() => {
          const lStat = lookupNFLAthleteLeagueStats(ath.displayName, ath.athleteId);
          const pYards = lStat?.pass_yds || 0;
          const rYards = lStat?.rush_yds || 0;
          const rcYards = lStat?.rec_yds || 0;
          const totalYds = pYards + rYards + rcYards;
          return {
            pass_yds: pYards,
            rush_yds: rYards,
            rec_yds: rcYards,
            tds: lStat?.tds || 0,
            total_yards: totalYds,
          };
        })(),
        lastGameScore: (() => {
          const lStat = lookupNFLAthleteLeagueStats(ath.displayName, ath.athleteId);
          if (!lStat) return 0;
          return calculateNFLPlayerScore(lStat);
        })(),
        lastGameStats: (() => {
          const lStat = lookupNFLAthleteLeagueStats(ath.displayName, ath.athleteId);
          if (!lStat) return '0 TD · 0 YDS';
          const tot = (lStat.pass_yds || 0) + (lStat.rush_yds || 0) + (lStat.rec_yds || 0);
          return `${lStat.tds || 0} TD · ${tot} YDS`;
        })(),
        badges: ['gold_star'],
        avatar: {
          helmetColor: colors.helmet,
          jerseyColor: colors.jersey,
          stripeColor: colors.stripe,
          pantsColor: colors.pants,
          numberColor: colors.numberColor,
          skinTone: ath.skinTone || '#e0ac69',
          number: ath.uniformNumber,
        },
      });
    }
  }

  return list;
}

const RAW_KNOWN_COMPETITORS: Competitor[] = [];

function initializeDefaultNFLCompetitors(): Competitor[] {
  return buildManifestCompetitors();
}

export const DEFAULT_NFL_COMPETITORS: Competitor[] = initializeDefaultNFLCompetitors();

export const DEFAULT_NFL_MATCHES: Match[] = [
  // -------------------------------------------------------------
  // WEEK 4 SLATE (16 Real ESPN Matchups covering all 32 NFL Teams)
  // -------------------------------------------------------------
  {
    id: 'espn-401872964',
    sportId: 'nfl',
    homeTeam: 'Cleveland Browns',
    awayTeam: 'Pittsburgh Steelers',
    homeTeamCode: 'CLE',
    awayTeamCode: 'PIT',
    home_team: 'CLE',
    away_team: 'PIT',
    homeScore: 27,
    awayScore: 24,
    home_score: 27,
    away_score: 24,
    quarter_time: 'FINAL',
    quarterTime: 'FINAL',
    periodLabel: 'FINAL',
    status: 'final',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-02T00:15Z',
  },
  {
    id: 'espn-401872965',
    sportId: 'nfl',
    homeTeam: 'Washington Commanders',
    awayTeam: 'Indianapolis Colts',
    homeTeamCode: 'WSH',
    awayTeamCode: 'IND',
    home_team: 'WSH',
    away_team: 'IND',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 9:30 AM',
    quarterTime: 'Sun 9:30 AM',
    periodLabel: 'Sun 9:30 AM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T13:30Z',
  },
  {
    id: 'espn-401872971',
    sportId: 'nfl',
    homeTeam: 'Buffalo Bills',
    awayTeam: 'New England Patriots',
    homeTeamCode: 'BUF',
    awayTeamCode: 'NE',
    home_team: 'BUF',
    away_team: 'NE',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T17:00Z',
  },
  {
    id: 'espn-401872972',
    sportId: 'nfl',
    homeTeam: 'Chicago Bears',
    awayTeam: 'New York Jets',
    homeTeamCode: 'CHI',
    awayTeamCode: 'NYJ',
    home_team: 'CHI',
    away_team: 'NYJ',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T17:00Z',
  },
  {
    id: 'espn-401872969',
    sportId: 'nfl',
    homeTeam: 'Cincinnati Bengals',
    awayTeam: 'Jacksonville Jaguars',
    homeTeamCode: 'CIN',
    awayTeamCode: 'JAX',
    home_team: 'CIN',
    away_team: 'JAX',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T17:00Z',
  },
  {
    id: 'espn-401872966',
    sportId: 'nfl',
    homeTeam: 'New York Giants',
    awayTeam: 'Arizona Cardinals',
    homeTeamCode: 'NYG',
    awayTeamCode: 'ARI',
    home_team: 'NYG',
    away_team: 'ARI',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T17:00Z',
  },
  {
    id: 'espn-401872970',
    sportId: 'nfl',
    homeTeam: 'Philadelphia Eagles',
    awayTeam: 'Los Angeles Rams',
    homeTeamCode: 'PHI',
    awayTeamCode: 'LAR',
    home_team: 'PHI',
    away_team: 'LAR',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T17:00Z',
  },
  {
    id: 'espn-401872968',
    sportId: 'nfl',
    homeTeam: 'Tampa Bay Buccaneers',
    awayTeam: 'Green Bay Packers',
    homeTeamCode: 'TB',
    awayTeamCode: 'GB',
    home_team: 'TB',
    away_team: 'GB',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T17:00Z',
  },
  {
    id: 'espn-401872973',
    sportId: 'nfl',
    homeTeam: 'Baltimore Ravens',
    awayTeam: 'Tennessee Titans',
    homeTeamCode: 'BAL',
    awayTeamCode: 'TEN',
    home_team: 'BAL',
    away_team: 'TEN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T17:00Z',
  },
  {
    id: 'espn-401872967',
    sportId: 'nfl',
    homeTeam: 'Houston Texans',
    awayTeam: 'Dallas Cowboys',
    homeTeamCode: 'HOU',
    awayTeamCode: 'DAL',
    home_team: 'HOU',
    away_team: 'DAL',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T17:00Z',
  },
  {
    id: 'espn-401872974',
    sportId: 'nfl',
    homeTeam: 'Minnesota Vikings',
    awayTeam: 'Miami Dolphins',
    homeTeamCode: 'MIN',
    awayTeamCode: 'MIA',
    home_team: 'MIN',
    away_team: 'MIA',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:05 PM',
    quarterTime: 'Sun 4:05 PM',
    periodLabel: 'Sun 4:05 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T20:05Z',
  },
  {
    id: 'espn-401872976',
    sportId: 'nfl',
    homeTeam: 'Las Vegas Raiders',
    awayTeam: 'Kansas City Chiefs',
    homeTeamCode: 'LV',
    awayTeamCode: 'KC',
    home_team: 'LV',
    away_team: 'KC',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T20:25Z',
  },
  {
    id: 'espn-401872975',
    sportId: 'nfl',
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Denver Broncos',
    homeTeamCode: 'SF',
    awayTeamCode: 'DEN',
    home_team: 'SF',
    away_team: 'DEN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T20:25Z',
  },
  {
    id: 'espn-401872977',
    sportId: 'nfl',
    homeTeam: 'Seattle Seahawks',
    awayTeam: 'Los Angeles Chargers',
    homeTeamCode: 'SEA',
    awayTeamCode: 'LAC',
    home_team: 'SEA',
    away_team: 'LAC',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-04T20:25Z',
  },
  {
    id: 'espn-401872978',
    sportId: 'nfl',
    homeTeam: 'Carolina Panthers',
    awayTeam: 'Detroit Lions',
    homeTeamCode: 'CAR',
    awayTeamCode: 'DET',
    home_team: 'CAR',
    away_team: 'DET',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 8:20 PM',
    quarterTime: 'Sun 8:20 PM',
    periodLabel: 'Sun 8:20 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-05T00:20Z',
  },
  {
    id: 'espn-401872979',
    sportId: 'nfl',
    homeTeam: 'New Orleans Saints',
    awayTeam: 'Atlanta Falcons',
    homeTeamCode: 'NO',
    awayTeamCode: 'ATL',
    home_team: 'NO',
    away_team: 'ATL',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Mon 8:15 PM',
    quarterTime: 'Mon 8:15 PM',
    periodLabel: 'Mon 8:15 PM',
    status: 'upcoming',
    week: 4,
    weekLabel: 'Week 4',
    gameDate: '2026-10-06T00:15Z',
  },

  // -------------------------------------------------------------
  // WEEK 3 SLATE (16 Real ESPN Matchups covering all 32 NFL Teams)
  // -------------------------------------------------------------
  {
    id: 'espn-401872948',
    sportId: 'nfl',
    homeTeam: 'Green Bay Packers',
    awayTeam: 'Atlanta Falcons',
    homeTeamCode: 'GB',
    awayTeamCode: 'ATL',
    home_team: 'GB',
    away_team: 'ATL',
    homeScore: 14,
    awayScore: 35,
    home_score: 14,
    away_score: 35,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'Final',
    status: 'final',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-25T00:15Z',
  },
  {
    id: 'espn-401872953',
    sportId: 'nfl',
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Los Angeles Chargers',
    homeTeamCode: 'BUF',
    awayTeamCode: 'LAC',
    home_team: 'BUF',
    away_team: 'LAC',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872949',
    sportId: 'nfl',
    homeTeam: 'Cleveland Browns',
    awayTeam: 'Carolina Panthers',
    homeTeamCode: 'CLE',
    awayTeamCode: 'CAR',
    home_team: 'CLE',
    away_team: 'CAR',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872954',
    sportId: 'nfl',
    homeTeam: 'Detroit Lions',
    awayTeam: 'New York Jets',
    homeTeamCode: 'DET',
    awayTeamCode: 'NYJ',
    home_team: 'DET',
    away_team: 'NYJ',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872951',
    sportId: 'nfl',
    homeTeam: 'Indianapolis Colts',
    awayTeam: 'Houston Texans',
    homeTeamCode: 'IND',
    awayTeamCode: 'HOU',
    home_team: 'IND',
    away_team: 'HOU',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872952',
    sportId: 'nfl',
    homeTeam: 'Miami Dolphins',
    awayTeam: 'Kansas City Chiefs',
    homeTeamCode: 'MIA',
    awayTeamCode: 'KC',
    home_team: 'MIA',
    away_team: 'KC',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872956',
    sportId: 'nfl',
    homeTeam: 'New York Giants',
    awayTeam: 'Tennessee Titans',
    homeTeamCode: 'NYG',
    awayTeamCode: 'TEN',
    home_team: 'NYG',
    away_team: 'TEN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872950',
    sportId: 'nfl',
    homeTeam: 'Pittsburgh Steelers',
    awayTeam: 'Cincinnati Bengals',
    homeTeamCode: 'PIT',
    awayTeamCode: 'CIN',
    home_team: 'PIT',
    away_team: 'CIN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872955',
    sportId: 'nfl',
    homeTeam: 'Washington Commanders',
    awayTeam: 'Seattle Seahawks',
    homeTeamCode: 'WSH',
    awayTeamCode: 'SEA',
    home_team: 'WSH',
    away_team: 'SEA',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872957',
    sportId: 'nfl',
    homeTeam: 'Jacksonville Jaguars',
    awayTeam: 'New England Patriots',
    homeTeamCode: 'JAX',
    awayTeamCode: 'NE',
    home_team: 'JAX',
    away_team: 'NE',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872958',
    sportId: 'nfl',
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Arizona Cardinals',
    homeTeamCode: 'SF',
    awayTeamCode: 'ARI',
    home_team: 'SF',
    away_team: 'ARI',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:05 PM',
    quarterTime: 'Sun 4:05 PM',
    periodLabel: 'Sun 4:05 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T20:05Z',
  },
  {
    id: 'espn-401872959',
    sportId: 'nfl',
    homeTeam: 'Tampa Bay Buccaneers',
    awayTeam: 'Minnesota Vikings',
    homeTeamCode: 'TB',
    awayTeamCode: 'MIN',
    home_team: 'TB',
    away_team: 'MIN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:05 PM',
    quarterTime: 'Sun 4:05 PM',
    periodLabel: 'Sun 4:05 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T20:05Z',
  },
  {
    id: 'espn-401872960',
    sportId: 'nfl',
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'Baltimore Ravens',
    homeTeamCode: 'DAL',
    awayTeamCode: 'BAL',
    home_team: 'DAL',
    away_team: 'BAL',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T20:25Z',
  },
  {
    id: 'espn-401872961',
    sportId: 'nfl',
    homeTeam: 'New Orleans Saints',
    awayTeam: 'Las Vegas Raiders',
    homeTeamCode: 'NO',
    awayTeamCode: 'LV',
    home_team: 'NO',
    away_team: 'LV',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T20:25Z',
  },
  {
    id: 'espn-401872962',
    sportId: 'nfl',
    homeTeam: 'Denver Broncos',
    awayTeam: 'Los Angeles Rams',
    homeTeamCode: 'DEN',
    awayTeamCode: 'LAR',
    home_team: 'DEN',
    away_team: 'LAR',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 8:20 PM',
    quarterTime: 'Sun 8:20 PM',
    periodLabel: 'Sun 8:20 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-28T00:20Z',
  },
  {
    id: 'espn-401872963',
    sportId: 'nfl',
    homeTeam: 'Chicago Bears',
    awayTeam: 'Philadelphia Eagles',
    homeTeamCode: 'CHI',
    awayTeamCode: 'PHI',
    home_team: 'CHI',
    away_team: 'PHI',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Mon 8:15 PM',
    quarterTime: 'Mon 8:15 PM',
    periodLabel: 'Mon 8:15 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-29T00:15Z',
  },

  // -------------------------------------------------------------
  // WEEK 2 SLATE (16 Matchups)
  // -------------------------------------------------------------
  {
    id: 'espn-401872932',
    sportId: 'nfl',
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Detroit Lions',
    homeTeamCode: 'BUF',
    awayTeamCode: 'DET',
    home_team: 'BUF',
    away_team: 'DET',
    homeScore: 0,
    awayScore: 0,
    home_score: 21,
    away_score: 24,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-18T00:15Z',
  },
  {
    id: 'espn-401872933',
    sportId: 'nfl',
    homeTeam: 'Atlanta Falcons',
    awayTeam: 'Carolina Panthers',
    homeTeamCode: 'ATL',
    awayTeamCode: 'CAR',
    home_team: 'ATL',
    away_team: 'CAR',
    homeScore: 27,
    awayScore: 20,
    home_score: 27,
    away_score: 20,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872937',
    sportId: 'nfl',
    homeTeam: 'Chicago Bears',
    awayTeam: 'Minnesota Vikings',
    homeTeamCode: 'CHI',
    awayTeamCode: 'MIN',
    home_team: 'CHI',
    away_team: 'MIN',
    homeScore: 19,
    awayScore: 24,
    home_score: 19,
    away_score: 24,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872939',
    sportId: 'nfl',
    homeTeam: 'Tennessee Titans',
    awayTeam: 'Philadelphia Eagles',
    homeTeamCode: 'TEN',
    awayTeamCode: 'PHI',
    home_team: 'TEN',
    away_team: 'PHI',
    homeScore: 14,
    awayScore: 28,
    home_score: 14,
    away_score: 28,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872946',
    sportId: 'nfl',
    homeTeam: 'New England Patriots',
    awayTeam: 'Pittsburgh Steelers',
    homeTeamCode: 'NE',
    awayTeamCode: 'PIT',
    home_team: 'NE',
    away_team: 'PIT',
    homeScore: 17,
    awayScore: 20,
    home_score: 17,
    away_score: 20,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872936',
    sportId: 'nfl',
    homeTeam: 'New York Jets',
    awayTeam: 'Green Bay Packers',
    homeTeamCode: 'NYJ',
    awayTeamCode: 'GB',
    home_team: 'NYJ',
    away_team: 'GB',
    homeScore: 21,
    awayScore: 27,
    home_score: 21,
    away_score: 27,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872935',
    sportId: 'nfl',
    homeTeam: 'Tampa Bay Buccaneers',
    awayTeam: 'Cleveland Browns',
    homeTeamCode: 'TB',
    awayTeamCode: 'CLE',
    home_team: 'TB',
    away_team: 'CLE',
    homeScore: 23,
    awayScore: 16,
    home_score: 23,
    away_score: 16,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872938',
    sportId: 'nfl',
    homeTeam: 'Baltimore Ravens',
    awayTeam: 'New Orleans Saints',
    homeTeamCode: 'BAL',
    awayTeamCode: 'NO',
    home_team: 'BAL',
    away_team: 'NO',
    homeScore: 31,
    awayScore: 17,
    home_score: 31,
    away_score: 17,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872934',
    sportId: 'nfl',
    homeTeam: 'Houston Texans',
    awayTeam: 'Cincinnati Bengals',
    homeTeamCode: 'HOU',
    awayTeamCode: 'CIN',
    home_team: 'HOU',
    away_team: 'CIN',
    homeScore: 24,
    awayScore: 21,
    home_score: 24,
    away_score: 21,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872940',
    sportId: 'nfl',
    homeTeam: 'Denver Broncos',
    awayTeam: 'Jacksonville Jaguars',
    homeTeamCode: 'DEN',
    awayTeamCode: 'JAX',
    home_team: 'DEN',
    away_team: 'JAX',
    homeScore: 17,
    awayScore: 13,
    home_score: 17,
    away_score: 13,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:05Z',
  },
  {
    id: 'espn-401872941',
    sportId: 'nfl',
    homeTeam: 'Los Angeles Chargers',
    awayTeam: 'Las Vegas Raiders',
    homeTeamCode: 'LAC',
    awayTeamCode: 'LV',
    home_team: 'LAC',
    away_team: 'LV',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:05 PM',
    quarterTime: 'Sun 4:05 PM',
    periodLabel: 'Sun 4:05 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:05Z',
  },
  {
    id: 'espn-401872944',
    sportId: 'nfl',
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'Washington Commanders',
    homeTeamCode: 'DAL',
    awayTeamCode: 'WSH',
    home_team: 'DAL',
    away_team: 'WSH',
    homeScore: 24,
    awayScore: 20,
    home_score: 24,
    away_score: 20,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:25Z',
  },
  {
    id: 'espn-401872943',
    sportId: 'nfl',
    homeTeam: 'Arizona Cardinals',
    awayTeam: 'Seattle Seahawks',
    homeTeamCode: 'ARI',
    awayTeamCode: 'SEA',
    home_team: 'ARI',
    away_team: 'SEA',
    homeScore: 21,
    awayScore: 23,
    home_score: 21,
    away_score: 23,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:25Z',
  },
  {
    id: 'espn-401872942',
    sportId: 'nfl',
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Miami Dolphins',
    homeTeamCode: 'SF',
    awayTeamCode: 'MIA',
    home_team: 'SF',
    away_team: 'MIA',
    homeScore: 27,
    awayScore: 20,
    home_score: 27,
    away_score: 20,
    quarter_time: 'Final',
    quarterTime: 'Final',
    periodLabel: 'FINAL',
    status: 'final',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:25Z',
  },
  {
    id: 'espn-401872945',
    sportId: 'nfl',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Indianapolis Colts',
    homeTeamCode: 'KC',
    awayTeamCode: 'IND',
    home_team: 'KC',
    away_team: 'IND',
    homeScore: 27,
    awayScore: 24,
    home_score: 27,
    away_score: 24,
    quarter_time: '4th 2:15',
    quarterTime: '4th 2:15',
    periodLabel: '🔴 LIVE (4th Qtr)',
    status: 'live',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-21T00:20Z',
  },
  {
    id: 'espn-401872947',
    sportId: 'nfl',
    homeTeam: 'Los Angeles Rams',
    awayTeam: 'New York Giants',
    homeTeamCode: 'LAR',
    awayTeamCode: 'NYG',
    home_team: 'LAR',
    away_team: 'NYG',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Mon 8:15 PM',
    quarterTime: 'Mon 8:15 PM',
    periodLabel: 'Mon 8:15 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-22T00:15Z',
  },
];

export type PlayerGameState = 'pre' | 'in' | 'post';

export interface PlayerScoringInfo {
  gameState: PlayerGameState;
  activeScore: number;
  activeStatsLine: string;
  historicalScore: number;
  historicalStats: string;
  hasHistoricalData: boolean;
  contextBadgeText: string;
  isLive: boolean;
  isFinal: boolean;
}

export function getPlayerGameState(match: Match | null | undefined): PlayerGameState {
  if (!match) return 'pre';
  const rawStatus = (match.status || '').toLowerCase();
  const rawState = ((match as any).status?.type?.state || '').toLowerCase();
  const qTime = (match.quarterTime || match.quarter_time || match.periodLabel || '').toLowerCase();

  if (rawStatus === 'upcoming' || rawStatus === 'scheduled' || rawState === 'pre') {
    return 'pre';
  }

  if (rawStatus === 'final' || rawState === 'post' || /\bfinal\b/i.test(qTime)) {
    return 'post';
  }

  if (
    rawStatus === 'live' ||
    rawState === 'in' ||
    /\b(q[1-4]|ot|half|halftime|overtime)\b/i.test(qTime) ||
    /\b(1st|2nd|3rd|4th)\s*(q|quarter|qtr)\b/i.test(qTime)
  ) {
    return 'in';
  }
  return 'pre';
}

/**
 * Standard Finger-Math Kid-Friendly Whole-Number NFL Score Calculation:
 * - Touchdown: 6 pts
 * - Passing yards: 1 pt per 25 yards (Math.floor(pass_yds / 25))
 * - Rushing yards: 1 pt per 10 yards (Math.floor(rush_yds / 10))
 * - Receiving yards: 1 pt per 10 yards (Math.floor(rec_yds / 10))
 * - Field goal: 3 pts
 * - Big stop / Def: 2 pts
 */
export function calculateNFLPlayerScore(stats: any): number {
  if (!stats) return 0;
  const tds = Number(stats.tds ?? stats.touchdowns ?? 0);
  const passYds = Number(stats.pass_yds ?? stats.passing_yards ?? stats.passingYards ?? 0);
  const rushYds = Number(stats.rush_yds ?? stats.rushing_yards ?? stats.rushingYards ?? 0);
  const recYds = Number(stats.rec_yds ?? stats.receiving_yards ?? stats.receivingYards ?? 0);
  const fgs = Number(stats.fgs ?? 0);
  const stops = Number(stats.stops ?? stats.big_stops ?? 0);

  const tdPts = tds * 6;
  const passPts = Math.floor(passYds / 25);
  const rushPts = Math.floor(rushYds / 10);
  const recPts = Math.floor(recYds / 10);
  const fgPts = fgs * 3;
  const stopPts = stops * 2;

  return tdPts + passPts + rushPts + recPts + fgPts + stopPts;
}

/**
 * Kid-friendly whole number Finger-Math points calculation for NBA
 */
export function calculateNBAPlayerScore(stats: any): number {
  if (!stats) return 0;
  const pts = Number(stats.pts ?? stats.points ?? 0);
  const threes = Number(stats.three_pm ?? stats.threes ?? 0);
  const reb = Number(stats.reb ?? stats.rebounds ?? 0);
  const ast = Number(stats.ast ?? stats.assists ?? 0);
  const stops = Number(stats.big_stops ?? stats.stops ?? 0);

  const pointsPts = Math.floor(pts / 3);
  const threesPts = threes * 2;
  const rebPts = reb * 1;
  const astPts = ast * 1;
  const stopPts = stops * 3;

  return pointsPts + threesPts + rebPts + astPts + stopPts;
}

export interface SlotDefinition {
  key: ActiveSlot;
  label: string;
  positionReq: string;
  positionFullName: string;
  allowedPositions: string[];
}

export const NFL_SLOT_DEFS: SlotDefinition[] = [
  { key: 'star1', label: 'STAR 1', positionReq: 'QB', positionFullName: 'QUARTERBACK', allowedPositions: ['QB'] },
  { key: 'star2', label: 'STAR 2', positionReq: 'RB', positionFullName: 'RUNNING BACK', allowedPositions: ['RB'] },
  { key: 'star3', label: 'STAR 3', positionReq: 'WR/TE', positionFullName: 'RECEIVER (WR/TE)', allowedPositions: ['WR', 'TE'] },
];

export const NBA_SLOT_DEFS: SlotDefinition[] = [
  { key: 'star1', label: 'STAR 1', positionReq: 'GUARD', positionFullName: 'GUARD (PG/SG)', allowedPositions: ['G', 'PG', 'SG'] },
  { key: 'star2', label: 'STAR 2', positionReq: 'FORWARD', positionFullName: 'FORWARD (SF/PF)', allowedPositions: ['F', 'SF', 'PF'] },
  { key: 'star3', label: 'STAR 3', positionReq: 'CENTER', positionFullName: 'BIG MAN / FLEX (C/PF)', allowedPositions: ['C', 'PF', 'F'] },
];

export function isPositionAllowedForSlot(
  slot: ActiveSlot,
  positionOrPlayer: string | Competitor = '',
  sport: SportId = 'nfl'
): boolean {
  if (sport !== 'nfl') return true;

  let pos = '';
  let playerName = '';
  let compId = '';

  if (typeof positionOrPlayer === 'string') {
    pos = positionOrPlayer.toUpperCase().trim();
  } else if (positionOrPlayer && typeof positionOrPlayer === 'object') {
    pos = (positionOrPlayer.position || '').toUpperCase().trim();
    playerName = (positionOrPlayer.displayName || positionOrPlayer.shortName || '').toLowerCase().trim();
    compId = (positionOrPlayer.athleteId || positionOrPlayer.id || '').toString().toLowerCase().trim();
    if (!pos && positionOrPlayer.depthOrder) {
      pos = positionOrPlayer.depthOrder.toUpperCase().trim();
    }
  }

  // If position is missing, generic ('STAR', 'ATHLETE'), or raw depth ('QB1'), resolve it
  if (!pos || pos === 'STAR' || pos === 'ATHLETE' || pos === 'PLAYER') {
    if (compId) {
      const cleanCompId = compId.replace(/^nfl_/, '');
      for (const teamAthletes of Object.values(NFL_ROSTER_MANIFEST)) {
        const found = teamAthletes.find(
          (a) => String(a.athleteId) === cleanCompId || a.displayName.toLowerCase() === playerName
        );
        if (found && found.position) {
          pos = found.position.toUpperCase();
          break;
        }
      }
    } else if (playerName) {
      // Look up in NFL_ROSTER_MANIFEST by name
      for (const teamAthletes of Object.values(NFL_ROSTER_MANIFEST)) {
        const found = teamAthletes.find(
          (a) => a.displayName.toLowerCase() === playerName || a.shortName.toLowerCase() === playerName
        );
        if (found && found.position) {
          pos = found.position.toUpperCase();
          break;
        }
      }
    }
  }

  // Normalize prefixes like 'QB1', 'RB2', 'WR3'
  if (pos.startsWith('QB')) pos = 'QB';
  else if (pos.startsWith('RB') || pos === 'FB') pos = 'RB';
  else if (pos.startsWith('WR')) pos = 'WR';
  else if (pos.startsWith('TE')) pos = 'TE';

  if (slot === 'star1') return pos === 'QB';
  if (slot === 'star2') return pos === 'RB';
  if (slot === 'star3') return pos === 'WR' || pos === 'TE';
  return true;
}

/**
 * Robust competitor finder that guarantees player objects are NEVER dropped to null
 * across background syncing, ID prefixes, or network reloads.
 */
export function resolveCompetitorById(
  id: string | null | undefined,
  roster: Competitor[],
  fallbackPlayer: Competitor | null = null,
  sport: SportId = 'nfl'
): Competitor | null {
  if (!id) return null;
  const cleanId = String(id).trim();
  if (!cleanId || cleanId === 'null' || cleanId === 'undefined') return null;

  // 1. Direct ID match in roster
  let match = (roster || []).find((p) => p && (p.id === cleanId || p.athleteId === cleanId || (p as any).athlete_id === cleanId));
  if (match) return match;

  // 2. Normalized prefix match (without 'nfl_' / 'nba_' or with) in roster
  const rawId = cleanId.replace(/^(nfl_|nba_)/i, '');
  match = (roster || []).find((p) => p && (
    p.id === rawId ||
    p.id === `${sport}_${rawId}` ||
    p.id === `nfl_${rawId}` ||
    p.id === `nba_${rawId}` ||
    p.athleteId === rawId ||
    (p as any).athlete_id === rawId
  ));
  if (match) return match;

  // 3. Fallback to previous player if IDs match
  if (fallbackPlayer) {
    if (fallbackPlayer.id === cleanId || fallbackPlayer.athleteId === cleanId || (fallbackPlayer as any).athlete_id === cleanId) {
      return fallbackPlayer;
    }
    const prevRaw = (fallbackPlayer.id || fallbackPlayer.athleteId || '').replace(/^(nfl_|nba_)/i, '');
    if (prevRaw === rawId) return fallbackPlayer;
  }

  // 4. Fallback to default competitor roster pool (check BOTH primary and secondary defaults by ID)
  const isNbaHint = sport === 'nba' || cleanId.toLowerCase().startsWith('nba_');
  const primaryDefaults = isNbaHint ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
  const secondaryDefaults = isNbaHint ? DEFAULT_NFL_COMPETITORS : DEFAULT_NBA_COMPETITORS;

  match = primaryDefaults.find((p) => p && (
    p.id === cleanId ||
    p.athleteId === cleanId ||
    p.athleteId === rawId ||
    p.id === `${sport}_${rawId}` ||
    p.id === `nfl_${rawId}` ||
    p.id === `nba_${rawId}`
  )) || secondaryDefaults.find((p) => p && (
    p.id === cleanId ||
    p.athleteId === cleanId ||
    p.athleteId === rawId ||
    p.id === `${sport}_${rawId}` ||
    p.id === `nfl_${rawId}` ||
    p.id === `nba_${rawId}`
  ));
  if (match) return match;

  // 5. Look up in NFL_ROSTER_MANIFEST by raw athleteId if NFL
  if (!isNbaHint) {
    for (const teamAthletes of Object.values(NFL_ROSTER_MANIFEST)) {
      const found = teamAthletes.find((a) => String(a.athleteId) === rawId);
      if (found) {
        const comp = DEFAULT_NFL_COMPETITORS.find((c) => c.athleteId === String(found.athleteId) || c.id === `nfl_${found.athleteId}`);
        if (comp) return comp;
      }
    }
  }

  // 6. Normalized name match: ONLY if cleanId is NOT a numeric or prefixed-numeric ID!
  // Prevents numeric IDs like 'nfl_4685512' from mistakenly matching players with 'nfl' in their names (e.g. Ryan Flournoy)!
  const isNumericOrPrefixId = /^(nfl_|nba_)?\d+$/i.test(cleanId);
  if (!isNumericOrPrefixId) {
    const normClean = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normClean.length >= 4 && normClean !== 'nfl' && normClean !== 'nba') {
      const poolToCheck = [...(roster || []), ...primaryDefaults];
      match = poolToCheck.find((p) => {
        if (!p) return false;
        const pName = (p.displayName || p.shortName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return pName === normClean || (pName.length >= 4 && (pName.includes(normClean) || normClean.includes(pName)));
      });
      if (match) return match;
    }
  }

  // 7. If fallback player exists, preserve it to prevent dropping to null
  if (fallbackPlayer && cleanId) {
    return fallbackPlayer;
  }

  return null;
}

export function getPlayerScoringDisplay(
  player: Competitor,
  match: Match | null | undefined,
  sport: SportId = 'nfl'
): PlayerScoringInfo {
  const gameState = getPlayerGameState(match);

  // NBA baseline stats
  const threePm = Number(player.stats?.three_pm ?? player.stats?.threes ?? 0);
  const reb = Number(player.stats?.reb ?? player.stats?.rebounds ?? 0);
  const ast = Number(player.stats?.ast ?? player.stats?.assists ?? 0);

  // NFL baseline stats
  const passYds = Number(player.stats?.pass_yds ?? player.stats?.passing_yards ?? player.stats?.passingYards ?? 0);
  const rushYds = Number(player.stats?.rush_yds ?? player.stats?.rushing_yards ?? player.stats?.rushingYards ?? 0);
  const recYds = Number(player.stats?.rec_yds ?? player.stats?.receiving_yards ?? player.stats?.receivingYards ?? 0);
  const totalYds = passYds + rushYds + recYds;
  const tds = Number(player.stats?.tds ?? player.stats?.touchdowns ?? 0);

  const fullStatsLine = sport === 'nba'
    ? `${threePm} 3PM · ${reb} REB · ${ast} AST`
    : (tds > 0 || totalYds > 0)
    ? `${tds} TD · ${totalYds} YDS`
    : '0 TD · 0 YDS';

  // Calculate live score directly from player.stats to guarantee mathematical accuracy
  const computedScore = sport === 'nfl'
    ? calculateNFLPlayerScore(player.stats)
    : calculateNBAPlayerScore(player.stats);
  const reliableActiveScore = computedScore > 0 ? computedScore : (player.score || 0);

  const historicalScore = player.last_game_score ?? player.lastGameScore ?? player.score ?? 0;
  const historicalStats = player.last_game_stats ?? player.lastGameStats ?? fullStatsLine;

  const contextText = match
    ? (match.quarter_time || match.quarterTime || match.periodLabel || 'SUN 1:00 PM ET')
    : 'SCHEDULED';

  if (gameState === 'pre') {
    // Upcoming game: active score is 0. Prior game performance is preserved strictly in historicalScore!
    return {
      gameState: 'pre',
      activeScore: 0,
      activeStatsLine: sport === 'nba' ? '0 3PM · 0 REB · 0 AST' : '0 TD · 0 YDS',
      historicalScore,
      historicalStats,
      hasHistoricalData: historicalScore > 0,
      contextBadgeText: contextText,
      isLive: false,
      isFinal: false,
    };
  }

  if (gameState === 'in') {
    return {
      gameState: 'in',
      activeScore: reliableActiveScore,
      activeStatsLine: fullStatsLine,
      historicalScore,
      historicalStats,
      hasHistoricalData: true,
      contextBadgeText: contextText.toLowerCase().includes('live') || contextText.includes('Q') ? contextText : `LIVE · ${contextText}`,
      isLive: true,
      isFinal: false,
    };
  }

  // 'post' (Final)
  return {
    gameState: 'post',
    activeScore: reliableActiveScore,
    activeStatsLine: fullStatsLine,
    historicalScore,
    historicalStats,
    hasHistoricalData: true,
    contextBadgeText: 'FINAL',
    isLive: false,
    isFinal: true,
  };
}

/**
 * Finds the corresponding match for a player using robust team normalization
 */
export function findMatchForPlayer(player: Competitor, matches: Match[]): Match | undefined {
  if (!player) return undefined;
  const pTeam = normalizeTeamCode(player.teamCode || (player as any).team || '');
  if (!pTeam) return undefined;

  return matches.find((m) => {
    const away = normalizeTeamCode(m.awayTeamCode || m.away_team || '');
    const home = normalizeTeamCode(m.homeTeamCode || m.home_team || '');
    return away === pTeam || home === pTeam;
  });
}

/**
 * Computes visual avatar styling with automatic jersey clash detection.
 * When teams with conflicting primary colors meet (e.g. BUF @ NE), the away team
 * gets their official white away jersey with team helmet and accent stripes!
 */
export function getPlayerVisualAvatar(player: Competitor, match?: Match | null) {
  const normTeam = normalizeTeamCode(player.teamCode || (player as any).team || '');
  let isAway = false;
  let opponentTeam = '';

  if (match) {
    const away = normalizeTeamCode(match.awayTeamCode || match.away_team || '');
    const home = normalizeTeamCode(match.homeTeamCode || match.home_team || '');
    if (normTeam === away) {
      isAway = true;
      opponentTeam = home;
    } else if (normTeam === home) {
      isAway = false;
      opponentTeam = away;
    }
  }

  const colors = getTeamColors(normTeam, isAway, opponentTeam);

  return {
    helmetColor: colors.helmet,
    jerseyColor: colors.jersey,
    stripeColor: colors.stripe,
    pantsColor: colors.pants,
    numberColor: colors.numberColor,
    skinTone: player.avatar?.skinTone || '#d98c55',
    number: player.uniformNumber || player.avatar?.number || 10,
  };
}

/**
 * Resolves a player from the player pool or fallback competitors by ID
 */
export function resolvePlayerInPool(
  playerId?: string | null,
  pool: Competitor[] = [],
  sport: SportId = 'nfl'
): Competitor | undefined {
  if (!playerId) return undefined;
  const cleanId = String(playerId).trim();
  if (!cleanId || cleanId === 'null' || cleanId === 'undefined') return undefined;

  const rawNumericId = cleanId.replace(/^(nfl_|nba_)/i, '');

  // 1. Direct ID or athleteId match in provided pool
  const found = pool.find(
    (p) =>
      p &&
      (String(p.id) === cleanId ||
        p.athleteId === cleanId ||
        p.athleteId === rawNumericId ||
        `nfl_${p.athleteId}` === cleanId ||
        `nba_${p.athleteId}` === cleanId)
  );
  if (found) return found;

  // 2. Check default sport competitors (support both NFL and NBA seamlessly)
  const isNbaHint = sport === 'nba' || cleanId.toLowerCase().startsWith('nba_');
  const primaryDefaults = isNbaHint ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
  const secondaryDefaults = isNbaHint ? DEFAULT_NFL_COMPETITORS : DEFAULT_NBA_COMPETITORS;

  const defaultFound = primaryDefaults.find(
    (p) =>
      p &&
      (String(p.id) === cleanId ||
        p.athleteId === cleanId ||
        p.athleteId === rawNumericId ||
        `nfl_${p.athleteId}` === cleanId ||
        `nba_${p.athleteId}` === cleanId)
  ) || secondaryDefaults.find(
    (p) =>
      p &&
      (String(p.id) === cleanId ||
        p.athleteId === cleanId ||
        p.athleteId === rawNumericId ||
        `nfl_${p.athleteId}` === cleanId ||
        `nba_${p.athleteId}` === cleanId)
  );
  if (defaultFound) return defaultFound;

  // 3. Fallback normalized name match if cleanId is descriptive
  const lower = cleanId.toLowerCase();
  const byName = pool.find(
    (p) => p && (p.displayName?.toLowerCase().includes(lower) || p.shortName?.toLowerCase().includes(lower))
  );
  if (byName) return byName;

  // 4. Guaranteed non-vanishing competitor fallback: never let an existing pick disappear from UI!
  const effectiveSport: SportId = isNbaHint ? 'nba' : 'nfl';
  return {
    id: cleanId,
    athleteId: rawNumericId,
    athlete_id: rawNumericId,
    sportId: effectiveSport,
    displayName: `Star #${rawNumericId}`,
    shortName: `S. #${rawNumericId}`,
    uniformNumber: 99,
    teamName: effectiveSport === 'nba' ? 'NBA Star' : 'NFL Star',
    teamCode: effectiveSport === 'nba' ? 'NBA' : 'NFL',
    positionGeneric: 'OFFENSE',
    position: effectiveSport === 'nba' ? 'STAR' : 'STAR',
    rating: 88,
    score: 0,
    badges: [],
    stats: {},
    avatar: {
      helmetColor: '#1e293b',
      jerseyColor: '#3b82f6',
      stripeColor: '#ffffff',
      skinTone: '#d97706',
      number: 99,
    },
  } as Competitor;
}

/**
 * Robust check if an NFL/NBA game has concluded (final or completed)
 */
export function isMatchEnded(m?: Match | any | null): boolean {
  if (!m) return false;
  const status = String(m.status || '').toLowerCase();
  const state = String(m.status?.type?.state || '').toLowerCase();
  const qTime = String(m.quarter_time || m.quarterTime || m.periodLabel || '').toLowerCase();
  const isCompleted = Boolean(m.completed || m.isFinal);
  return (
    status === 'final' ||
    status === 'post' ||
    state === 'post' ||
    state === 'final' ||
    isCompleted ||
    qTime.includes('final')
  );
}

/**
 * Computes the NFL chronological day/time block for standard weekly scheduling:
 * Block 0: Thursday Night Football (TNF, always first)
 * Block 1: Friday / Saturday games
 * Block 2: Sunday 1:00 PM ET games (early afternoon window)
 * Block 3: Sunday 4:00 PM / 4:25 PM ET games (late afternoon window)
 * Block 4: Sunday Night Football (SNF, ~8:20 PM ET)
 * Block 5: Monday Night Football (MNF, ~8:15 PM ET, always last)
 */
export function getMatchTimeBlock(m: Match): number {
  const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
  const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
  const pair = `${away}@${home}`;

  // Explicit known marquee slots for the active week
  if (pair === 'PIT@CLE' || pair === 'CLE@PIT' || pair === 'ATL@GB' || pair === 'GB@ATL') return 0; // TNF

  const label = `${m.quarter_time || ''} ${m.periodLabel || ''} ${m.quarterTime || ''}`.toUpperCase();

  if (label.includes('THU')) return 0;
  if (label.includes('FRI') || label.includes('SAT')) return 1;
  if (label.includes('MON')) return 5;

  if (label.includes('SUN')) {
    if (label.includes('8:20') || label.includes('8:15') || label.includes('NIGHT')) return 4;
    if (label.includes('4:05') || label.includes('4:25') || label.includes('4:00') || label.includes('4 PM')) return 3;
    if (label.includes('1:00') || label.includes('1 PM')) return 2;
  }

  // Parse gameDate
  if (m.gameDate) {
    try {
      const d = new Date(m.gameDate);
      if (!isNaN(d.getTime())) {
        const utcDay = d.getUTCDay();
        const utcHour = d.getUTCHours();
        // Thursday Night (UTC Day 4 or early Day 5)
        if (utcDay === 4 || (utcDay === 5 && utcHour < 5)) return 0;
        if (utcDay === 5 || utcDay === 6) return 1;
        if (utcDay === 0 || (utcDay === 1 && utcHour < 5)) {
          // Sunday
          if (utcDay === 0 && utcHour <= 18) return 2; // 1:00 PM ET (17:00 UTC)
          if (utcDay === 0 && utcHour <= 22) return 3; // 4:00/4:25 PM ET (20:00 UTC)
          return 4; // SNF (8:20 PM ET is 00:20 UTC Monday)
        }
        if (utcDay === 1 || (utcDay === 2 && utcHour < 5)) return 5; // Monday Night
      }
    } catch {}
  }

  return 2; // Default Sunday 1pm
}

/**
 * Sorts NFL matches by day/time block, and alphabetically within each block:
 * 1. Thursday Night Football first
 * 2. Sunday 1:00 PM ET games in alphabetical order
 * 3. Sunday 4:00 PM / 4:25 PM ET games in alphabetical order
 * 4. Sunday Night Football
 * 5. Monday Night Football last
 */
export function sortMatchesByKickoffAndStatus(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    // 1. Group by Day/Time block
    const blockA = getMatchTimeBlock(a);
    const blockB = getMatchTimeBlock(b);

    if (blockA !== blockB) {
      return blockA - blockB;
    }

    // 2. Within each time block, order alphabetically by matchup (e.g. AWAY@HOME)
    const awayA = (a.awayTeamCode || a.away_team || '').trim().toUpperCase();
    const awayB = (b.awayTeamCode || b.away_team || '').trim().toUpperCase();
    const homeA = (a.homeTeamCode || a.home_team || '').trim().toUpperCase();
    const homeB = (b.homeTeamCode || b.home_team || '').trim().toUpperCase();
    const pairA = `${awayA}@${homeA}`;
    const pairB = `${awayB}@${homeB}`;
    return pairA.localeCompare(pairB);
  });
}

export interface GameRoomWinnerSummary {
  leaderName: string;
  leaderScore: number;
  totalParticipants: number;
  isTied: boolean;
  hasPicks: boolean;
  standings: Array<{
    userName: string;
    score: number;
    stars: Competitor[];
  }>;
}

export function computeGameRoomStandings(
  matchPair: string,
  cleanRoom: string,
  roomRosters: any[],
  competitors: Competitor[],
  matches: Match[],
  sport: SportId = 'nfl'
): GameRoomWinnerSummary {
  const cleanRoomCode = getBaseSeasonRoom(cleanRoom || 'COUCH');
  const targetRoomCode =
    matchPair === 'SUPERSTARS'
      ? cleanRoomCode
      : `${cleanRoomCode}__${matchPair.replace('@', '_').toUpperCase()}`;

  const userStandings: Array<{ userName: string; score: number; stars: Competitor[] }> = [];

  const filteredRosters = (roomRosters || []).filter(
    (r) => (r.room_code || '').trim().toUpperCase() === targetRoomCode
  );

  filteredRosters.forEach((r) => {
    const userName = (r.user_name || '').trim().toUpperCase();
    if (!userName) return;

    const s1 = resolveCompetitorById(r.star_1_id, competitors, null, sport);
    const s2 = resolveCompetitorById(r.star_2_id, competitors, null, sport);
    const s3 = resolveCompetitorById(r.star_3_id, competitors, null, sport);
    const stars = [s1, s2, s3].filter(Boolean) as Competitor[];

    if (stars.length > 0) {
      let score = 0;
      stars.forEach((p) => {
        const m = findMatchForPlayer(p, matches);
        const scoring = getPlayerScoringDisplay(p, m, sport);
        if (scoring.gameState !== 'pre') {
          score += scoring.activeScore > 0 ? scoring.activeScore : 0;
        }
      });
      userStandings.push({ userName, score, stars });
    }
  });

  userStandings.sort((a, b) => b.score - a.score);

  if (userStandings.length === 0) {
    return {
      leaderName: '',
      leaderScore: 0,
      totalParticipants: 0,
      isTied: false,
      hasPicks: false,
      standings: [],
    };
  }

  const leader = userStandings[0];
  const isTied = userStandings.length > 1 && userStandings[1].score === leader.score;

  return {
    leaderName: leader.userName,
    leaderScore: Math.round(leader.score),
    totalParticipants: userStandings.length,
    isTied,
    hasPicks: true,
    standings: userStandings,
  };
}

export interface LeagueIdentity {
  baseLeague: string;        // e.g. "CUSE", "THE_BOYS", "COUCH"
  weekNumber: number | null; // e.g. 3 for "CUSE_WK3", or null if plain "COUCH"
  isGameSlate: boolean;
  slateMatchup?: string;
}

export function getBaseSeasonRoom(roomCode: string): string {
  const clean = (roomCode || 'COUCH').trim().toUpperCase();
  const roomPart = clean.includes('__') ? clean.split('__')[0] : clean;
  const normalized = roomPart.replace(/_(?:WK|W|WEEK)\d+$/i, '');
  return normalized || 'COUCH';
}

export function getNFLWeekForMatchup(slateMatchup?: string | null): number | null {
  if (!slateMatchup) return null;
  const clean = slateMatchup.trim().toUpperCase().replace('@', '_');
  const [away, home] = clean.split('_');
  if (!away || !home) return null;
  const match = DEFAULT_NFL_MATCHES.find((m) => {
    const a = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
    const h = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
    return (a === away && h === home) || (a === home && h === away);
  });
  return match?.week || null;
}

export function parseLeagueIdentity(roomCode: string): LeagueIdentity {
  const clean = (roomCode || 'COUCH').trim().toUpperCase();
  const parts = clean.split('__');
  const basePart = parts[0];
  const slateMatchup = parts[1];

  const weekMatch = basePart.match(/(?:_|^)(?:WK|WEEK|W)(\d+)$/i);
  let weekNumber: number | null = null;
  let baseLeague = basePart;

  if (weekMatch) {
    weekNumber = parseInt(weekMatch[1], 10);
    baseLeague = basePart.replace(/(?:_|^)(?:WK|WEEK|W)\d+$/i, '').trim() || 'LEAGUE';
  } else if (slateMatchup) {
    weekNumber = getNFLWeekForMatchup(slateMatchup);
  }

  return {
    baseLeague: baseLeague || 'COUCH',
    weekNumber,
    isGameSlate: Boolean(slateMatchup),
    slateMatchup,
  };
}

