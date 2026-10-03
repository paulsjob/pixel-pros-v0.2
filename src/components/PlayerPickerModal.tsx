import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Competitor, Match, ActiveSlot, SportId } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelHelmet } from './PixelHelmet';
import { Search } from 'lucide-react';
import { splitPlayerFirstLastName } from '../utils/formatters';
import { getCurrentNFLWeek } from '../lib/espnSync';
import {
  getPlayerScoringDisplay,
  DEFAULT_NFL_MATCHES,
  DEFAULT_NFL_COMPETITORS,
  isPositionAllowedForSlot,
  NFL_SLOT_DEFS,
  NBA_SLOT_DEFS,
  normalizeTeamCode,
  getPlayerVisualAvatar,
  getTeamColors,
  sortMatchesByKickoffAndStatus,
  isMatchEnded,
} from '../utils/teamData';
import { isRetiredPlayer, getStarterManifestDepth } from '../data/nflRosterManifest';
import { DEFAULT_NBA_MATCHES } from '../utils/nbaTeamData';
import { lookupNFLAthleteLeagueStats } from '../data/nflLeagueStats';

export function getPlayerPrimaryYardage(p: Competitor, sport: SportId = 'nfl'): number {
  if (!p) return 0;
  if (sport !== 'nfl') {
    return Number((p as any).pts ?? (p as any).points ?? p.score ?? 0);
  }
  const pos = (p.position || '').toUpperCase();
  const st = p.stats as any;
  const season = p.seasonStats || p.season_stats;
  const leagueStat = lookupNFLAthleteLeagueStats(p.displayName, p.athleteId);

  if (pos === 'QB') {
    const seasonVal = Math.max(Number(season?.pass_yds || 0), Number(leagueStat?.pass_yds || 0));
    const liveVal = Number(st?.pass_yds ?? st?.passing_yards ?? 0);
    return Math.max(seasonVal, liveVal);
  }
  if (pos === 'RB') {
    const seasonVal = Math.max(Number(season?.rush_yds || 0), Number(leagueStat?.rush_yds || 0));
    const liveVal = Number(st?.rush_yds ?? st?.rushing_yards ?? 0);
    return Math.max(seasonVal, liveVal);
  }
  // WR, TE or other
  const seasonVal = Math.max(Number(season?.rec_yds || 0), Number(leagueStat?.rec_yds || 0));
  const liveVal = Number(st?.rec_yds ?? st?.receiving_yards ?? 0);
  return Math.max(seasonVal, liveVal);
}

export function getPlayerYardageLabel(p: Competitor, sport: SportId = 'nfl'): string {
  if (sport !== 'nfl') return 'PTS';
  const pos = (p.position || '').toUpperCase();
  if (pos === 'QB') return 'PASS YDS';
  if (pos === 'RB') return 'RUSH YDS';
  return 'REC YDS';
}

export function getPlayerDepthRank(p: Competitor): number {
  if (typeof p.depthRank === 'number' && p.depthRank > 0) return p.depthRank;
  if (p.depthOrder) {
    const m = p.depthOrder.match(/\d+/);
    if (m) return parseInt(m[0], 10);
  }
  const manifest = getStarterManifestDepth(p.displayName, p.teamCode, p.athleteId || p.id);
  if (manifest?.depthRank) return manifest.depthRank;
  return 1;
}

export function getPlayerDisplayDepth(p: Competitor): string {
  if (p.depthOrder && /\d/.test(p.depthOrder)) return p.depthOrder;
  const rank = getPlayerDepthRank(p);
  const pos = p.position || 'STAR';
  return `${pos}${rank}`;
}

interface PlayerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlot: ActiveSlot;
  allPlayers: Competitor[];
  currentSlotPlayerId?: string | null;
  selectedPlayerIds?: string[];
  matches?: Match[];
  sport?: SportId;
  restrictToMatchPair?: string;
  onSelectPlayer: (player: Competitor, targetSlot: ActiveSlot) => void;
  onInspectPlayer?: (player: Competitor) => void;
}

const SLOT_TITLES: Record<ActiveSlot, string> = {
  star1: 'STAR 1',
  star2: 'STAR 2',
  star3: 'STAR 3',
};

const POSITION_ORDER: Record<string, number> = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  K: 5,
  PG: 1,
  SG: 2,
  SF: 3,
  PF: 4,
  C: 5,
  G: 1,
  F: 3,
};

function normalizeCode(code?: string): string {
  return normalizeTeamCode(code);
}

export const PlayerPickerModal: React.FC<PlayerPickerModalProps> = ({
  isOpen,
  onClose,
  activeSlot,
  allPlayers = [],
  currentSlotPlayerId,
  selectedPlayerIds = [],
  matches = [],
  sport = 'nfl',
  restrictToMatchPair,
  onSelectPlayer,
  onInspectPlayer,
}) => {
  const isRestrictedToGame = Boolean(
    restrictToMatchPair &&
    restrictToMatchPair !== 'ALL' &&
    restrictToMatchPair !== 'SUPERSTARS'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>(
    isRestrictedToGame ? restrictToMatchPair! : 'ALL'
  );
  const [positionFilter, setPositionFilter] = useState<'ELIGIBLE' | 'ALL'>('ELIGIBLE');
  const [hideEndedGames, setHideEndedGames] = useState(false);
  const [matchPage, setMatchPage] = useState(0);
  const [pendingInjuredPlayer, setPendingInjuredPlayer] = useState<Competitor | null>(null);
  const currentNFLWeek = getCurrentNFLWeek();

  const isSuperstarsMode = restrictToMatchPair === 'SUPERSTARS' || (!isRestrictedToGame && selectedGameFilter === 'ALL');

  const slotDefs = sport === 'nba' ? NBA_SLOT_DEFS : NFL_SLOT_DEFS;
  const currentSlotDef = slotDefs.find((s) => s.key === activeSlot) || slotDefs[0];

  useEffect(() => {
    setPositionFilter('ELIGIBLE');
    if (isRestrictedToGame && restrictToMatchPair) {
      setSelectedGameFilter(restrictToMatchPair);
    } else {
      setSelectedGameFilter('ALL');
    }
  }, [activeSlot, isOpen, isRestrictedToGame, restrictToMatchPair]);

  const activeMatches = useMemo(() => {
    const defaultList = sport === 'nba' ? DEFAULT_NBA_MATCHES : DEFAULT_NFL_MATCHES;
    const baseMatches = Array.isArray(matches) && matches.length > 0 ? matches : defaultList;

    // Filter to current sport and current NFL week
    const sportMatches = baseMatches.filter((m) => {
      const matchSport = (m.sportId || (m as any).sport || '').toLowerCase();
      if (matchSport && matchSport !== sport.toLowerCase()) return false;
      if (sport === 'nfl') {
        if (m.week && m.week !== currentNFLWeek) return false;
      }
      return true;
    });

    // Ensure all 16 games on the NFL slate (all 32 teams) are represented
    const combined = [...sportMatches];
    if (sport === 'nfl') {
      const existingPairs = new Set(
        combined.map((m) => {
          const away = normalizeCode(m.awayTeamCode || m.away_team || '');
          const home = normalizeCode(m.homeTeamCode || m.home_team || '');
          return `${away}@${home}`;
        })
      );

      for (const defMatch of DEFAULT_NFL_MATCHES) {
        if (defMatch.week && defMatch.week !== currentNFLWeek) continue;
        const away = normalizeCode(defMatch.awayTeamCode || defMatch.away_team || '');
        const home = normalizeCode(defMatch.homeTeamCode || defMatch.home_team || '');
        const pair = `${away}@${home}`;
        if (!existingPairs.has(pair)) {
          combined.push({ ...defMatch, week: currentNFLWeek, weekLabel: `Week ${currentNFLWeek}` });
          existingPairs.add(pair);
        }
      }
    }

    return sortMatchesByKickoffAndStatus(combined);
  }, [matches, sport, currentNFLWeek]);

  const checkMatchEnded = (m?: Match | null): boolean => {
    return isMatchEnded(m);
  };

  const isPlayerGameEnded = (player: Competitor): boolean => {
    const pTeam = normalizeCode(player.teamCode || (player as any).team || '');
    const m = activeMatches.find((match) => {
      const a = normalizeCode(match.awayTeamCode || match.away_team || '');
      const h = normalizeCode(match.homeTeamCode || match.home_team || '');
      return a === pTeam || h === pTeam;
    });
    return checkMatchEnded(m);
  };

  const displayMatches = useMemo(() => {
    if (!hideEndedGames) return activeMatches;
    return activeMatches.filter((m) => !checkMatchEnded(m));
  }, [activeMatches, hideEndedGames]);

  const MATCHES_PER_PAGE = 6;
  const totalMatchPages = Math.max(1, Math.ceil(displayMatches.length / MATCHES_PER_PAGE));

  // Keep the match page aligned with the selected match filter so buttons do not jump
  useEffect(() => {
    if (selectedGameFilter && selectedGameFilter !== 'ALL') {
      const idx = displayMatches.findIndex((m) => {
        const away = normalizeCode(m.awayTeamCode || m.away_team || '');
        const home = normalizeCode(m.homeTeamCode || m.home_team || '');
        return `${away}@${home}` === selectedGameFilter;
      });
      if (idx >= 0) {
        const page = Math.floor(idx / MATCHES_PER_PAGE);
        setMatchPage((curPage) => (curPage !== page ? page : curPage));
      }
    }
  }, [selectedGameFilter, displayMatches]);

  const currentMatchesSubset = useMemo(() => {
    return displayMatches.slice(
      matchPage * MATCHES_PER_PAGE,
      (matchPage + 1) * MATCHES_PER_PAGE
    );
  }, [displayMatches, matchPage]);

  const matchGroups = useMemo(() => {
    const live: Array<{ match: Match; pairKey: string; label: string }> = [];
    const upcoming: Array<{ match: Match; pairKey: string; label: string }> = [];
    const final: Array<{ match: Match; pairKey: string; label: string }> = [];

    const source = hideEndedGames ? displayMatches : activeMatches;

    for (const m of source) {
      const away = normalizeCode(m.awayTeamCode || m.away_team || '');
      const home = normalizeCode(m.homeTeamCode || m.home_team || '');
      const pairKey = `${away}@${home}`;
      const isLive = m.status === 'live';
      const isFinal = checkMatchEnded(m);
      const timeInfo = m.quarter_time || m.quarterTime || m.periodLabel || 'Scheduled';

      const label = `${away} @ ${home} — ${isLive ? '🔴 LIVE' : isFinal ? '🔒 FINAL' : timeInfo}`;
      const item = { match: m, pairKey, label };
      if (isLive) live.push(item);
      else if (isFinal) {
        if (!hideEndedGames) final.push(item);
      } else {
        upcoming.push(item);
      }
    }
    return { live, upcoming, final };
  }, [activeMatches, displayMatches, hideEndedGames]);

  const activeMatchObj = useMemo(() => {
    if (!selectedGameFilter || selectedGameFilter === 'ALL') return null;
    return (
      activeMatches.find((m) => {
        const away = normalizeCode(m.awayTeamCode || m.away_team || '');
        const home = normalizeCode(m.homeTeamCode || m.home_team || '');
        return `${away}@${home}` === selectedGameFilter || m.id === selectedGameFilter;
      }) || null
    );
  }, [selectedGameFilter, activeMatches]);

  // If user turns on "Hide Ended Games" while looking at an ended game filter, reset filter to 'ALL'
  useEffect(() => {
    if (hideEndedGames && selectedGameFilter !== 'ALL' && activeMatchObj) {
      if (checkMatchEnded(activeMatchObj)) {
        setSelectedGameFilter('ALL');
      }
    }
  }, [hideEndedGames, selectedGameFilter, activeMatchObj]);

  const currentMatchIndex = useMemo(() => {
    if (!selectedGameFilter || selectedGameFilter === 'ALL') return -1;
    const list = displayMatches.length > 0 ? displayMatches : activeMatches;
    return list.findIndex((m) => {
      const away = normalizeCode(m.awayTeamCode || m.away_team || '');
      const home = normalizeCode(m.homeTeamCode || m.home_team || '');
      return `${away}@${home}` === selectedGameFilter || m.id === selectedGameFilter;
    });
  }, [selectedGameFilter, activeMatches, displayMatches]);

  const handlePrevGameMobile = () => {
    const list = displayMatches.length > 0 ? displayMatches : activeMatches;
    if (list.length === 0) return;
    if (currentMatchIndex === -1) {
      const last = list[list.length - 1];
      const away = normalizeCode(last.awayTeamCode || last.away_team || '');
      const home = normalizeCode(last.homeTeamCode || last.home_team || '');
      setSelectedGameFilter(`${away}@${home}`);
    } else if (currentMatchIndex === 0) {
      setSelectedGameFilter('ALL');
    } else {
      const prev = list[currentMatchIndex - 1];
      const away = normalizeCode(prev.awayTeamCode || prev.away_team || '');
      const home = normalizeCode(prev.homeTeamCode || prev.home_team || '');
      setSelectedGameFilter(`${away}@${home}`);
    }
  };

  const handleNextGameMobile = () => {
    const list = displayMatches.length > 0 ? displayMatches : activeMatches;
    if (list.length === 0) return;
    if (currentMatchIndex === -1) {
      const first = list[0];
      const away = normalizeCode(first.awayTeamCode || first.away_team || '');
      const home = normalizeCode(first.homeTeamCode || first.home_team || '');
      setSelectedGameFilter(`${away}@${home}`);
    } else if (currentMatchIndex === list.length - 1) {
      setSelectedGameFilter('ALL');
    } else {
      const next = list[currentMatchIndex + 1];
      const away = normalizeCode(next.awayTeamCode || next.away_team || '');
      const home = normalizeCode(next.homeTeamCode || next.home_team || '');
      setSelectedGameFilter(`${away}@${home}`);
    }
  };

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = Array.isArray(allPlayers) ? [...allPlayers] : [];

    // Ensure roster accuracy for high-profile moves (Daniel Jones is strictly on the Colts - IND)
    list = list.map((p) => {
      if (
        (p.athleteId === '3917792' || (p.displayName || '').toLowerCase() === 'daniel jones') &&
        normalizeCode(p.teamCode || (p as any).team || '') !== 'IND'
      ) {
        const indColors = getTeamColors('IND');
        return {
          ...p,
          teamCode: 'IND',
          teamName: 'Indianapolis Colts',
          avatar: p.avatar
            ? {
                ...p.avatar,
                jerseyColor: indColors.jersey,
                helmetColor: indColors.helmet,
                pantsColor: indColors.pants,
              }
            : p.avatar,
        };
      }
      return p;
    });

    // Ensure all starter manifest athletes for NFL (3 QBs, 3 RBs, 6 WR/TE per team) are fully available in the pool
    if (sport === 'nfl') {
      const existingKeys = new Set(
        list.map((p) => `${(p.displayName || p.shortName || '').trim().toLowerCase()}__${normalizeCode(p.teamCode || (p as any).team || '')}`)
      );
      for (const defP of DEFAULT_NFL_COMPETITORS) {
        const normKey = `${(defP.displayName || defP.shortName || '').trim().toLowerCase()}__${normalizeCode(defP.teamCode || (defP as any).team || '')}`;
        if (!existingKeys.has(normKey)) {
          list.push(defP);
          existingKeys.add(normKey);
        }
      }
    }

    // Filter by selected game matchup: strictly include BOTH Away AND Home teams, NEVER other teams
    if (selectedGameFilter && selectedGameFilter !== 'ALL') {
      let filterAway = '';
      let filterHome = '';

      if (selectedGameFilter.includes('@')) {
        const parts = selectedGameFilter.split('@');
        filterAway = normalizeCode(parts[0]);
        filterHome = normalizeCode(parts[1]);
      } else if (activeMatchObj) {
        filterAway = normalizeCode(activeMatchObj.awayTeamCode || activeMatchObj.away_team || '');
        filterHome = normalizeCode(activeMatchObj.homeTeamCode || activeMatchObj.home_team || '');
      }

      if (filterAway || filterHome) {
        list = list.filter((p) => {
          const playerTeam = normalizeCode(p.teamCode || (p as any).team || '');
          return (filterAway && playerTeam === filterAway) || (filterHome && playerTeam === filterHome);
        });
      }
    }

    // 1. Enforce Position Requirement (1 QB, 1 RB, 1 WR/TE)
    if (positionFilter === 'ELIGIBLE') {
      list = list.filter((p) => isPositionAllowedForSlot(activeSlot, p, sport));
    }

    // 2. Hide Ended Games if toggle enabled
    if (hideEndedGames) {
      list = list.filter((p) => !isPlayerGameEnded(p));
    }

    if (q) {
      list = list.filter(
        (p) =>
          (p.displayName && p.displayName.toLowerCase().includes(q)) ||
          (p.shortName && p.shortName.toLowerCase().includes(q)) ||
          (p.teamName && p.teamName.toLowerCase().includes(q)) ||
          (p.teamCode && p.teamCode.toLowerCase().includes(q)) ||
          (p.position && p.position.toLowerCase().includes(q))
      );
    }

    // STRICT DEDUPLICATION: Ensure no player or ID ever appears more than once under any circumstance
    const seenKeys = new Set<string>();
    const seenIds = new Set<string>();
    const deduped: Competitor[] = [];

    for (const player of list) {
      if (!player) continue;
      if (isRetiredPlayer(player.displayName)) continue;
      const idKey = player.id ? String(player.id) : '';
      const nameKey = `${(player.displayName || player.shortName || '').trim().toLowerCase()}__${(player.teamCode || (player as any).team || '').trim().toUpperCase()}`;

      if (idKey && seenIds.has(idKey)) continue;
      if (nameKey && nameKey !== '__' && seenKeys.has(nameKey)) continue;

      if (idKey) seenIds.add(idKey);
      if (nameKey && nameKey !== '__') seenKeys.add(nameKey);
      deduped.push(player);
    }

    // Create lookup for match kickoff order to ensure stable sorting across sync updates
    const matchOrderMap = new Map<string, number>();
    activeMatches.forEach((m, idx) => {
      const away = normalizeCode(m.awayTeamCode || m.away_team || '');
      const home = normalizeCode(m.homeTeamCode || m.home_team || '');
      if (away && !matchOrderMap.has(away)) matchOrderMap.set(away, idx);
      if (home && !matchOrderMap.has(home)) matchOrderMap.set(home, idx);
    });

    return deduped.sort((a, b) => {
      // 1. If user explicitly selected a specific matchup room (e.g. ATL@GB), group by that matchup's teams
      const isMatchupSpecific = isRestrictedToGame || (selectedGameFilter && selectedGameFilter !== 'ALL');
      if (isMatchupSpecific) {
        const awayTeam = (isRestrictedToGame && activeMatchObj)
          ? normalizeCode(activeMatchObj.awayTeamCode || activeMatchObj.away_team || '')
          : (selectedGameFilter && selectedGameFilter.includes('@'))
          ? normalizeCode(selectedGameFilter.split('@')[0])
          : '';

        const aTeam = normalizeCode(a.teamCode || (a as any).team || '');
        const bTeam = normalizeCode(b.teamCode || (b as any).team || '');

        if (awayTeam && aTeam !== bTeam) {
          if (aTeam === awayTeam) return -1;
          if (bTeam === awayTeam) return 1;
          return aTeam.localeCompare(bTeam);
        }
      }

      // 2. Group by Position (QB -> RB -> WR -> TE)
      const posA = POSITION_ORDER[a.position] || 99;
      const posB = POSITION_ORDER[b.position] || 99;
      if (posA !== posB) {
        return posA - posB;
      }

      // 3. STAT-BASED RANK ORDER (PRIMARY REQUIREMENT):
      // QB: Ranked strictly by Passing Yards descending for the season
      // RB: Ranked strictly by Rushing Yards descending for the season
      // WR/TE: Ranked strictly by Receiving Yards descending for the season
      const yardsA = getPlayerPrimaryYardage(a, sport);
      const yardsB = getPlayerPrimaryYardage(b, sport);
      if (yardsA !== yardsB) {
        return yardsB - yardsA; // Highest league yardage leads!
      }

      // 4. Secondary Season TD tiebreaker
      const tdA = Number(a.seasonStats?.tds ?? (a as any).tds ?? 0);
      const tdB = Number(b.seasonStats?.tds ?? (b as any).tds ?? 0);
      if (tdA !== tdB) {
        return tdB - tdA;
      }

      // 5. If not superstars mode, prioritize active and upcoming games over ended games
      if (!isSuperstarsMode) {
        const aEnded = isPlayerGameEnded(a);
        const bEnded = isPlayerGameEnded(b);
        if (aEnded !== bEnded) {
          return aEnded ? 1 : -1;
        }
      }

      // 6. In-game live or final fantasy points descending
      const scoreA = (a as any).current_score ?? a.score ?? 0;
      const scoreB = (b as any).current_score ?? b.score ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // 7. Depth Rank: starters (QB1, RB1, WR1) before backups (QB2, QB3)
      const rankA = getPlayerDepthRank(a);
      const rankB = getPlayerDepthRank(b);
      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // 8. Overall player superstar rating tiebreaker (99 before 90)
      const ratingA = a.rating || 90;
      const ratingB = b.rating || 90;
      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }

      // 9. Deterministic Alphabetical Name tiebreaker (guarantees zero jitter / blipping)
      return (a.displayName || a.shortName || '').localeCompare(b.displayName || b.shortName || '');
    });
  }, [allPlayers, selectedGameFilter, activeMatchObj, searchQuery, positionFilter, hideEndedGames, activeSlot, sport, activeMatches, isRestrictedToGame]);

  const selectedPlayerNormKeys = useMemo(() => {
    const keys = new Set<string>();
    const list = Array.isArray(allPlayers) ? allPlayers : [];
    for (const p of list) {
      if (selectedPlayerIds.includes(p.id)) {
        const normKey = `${(p.displayName || p.shortName || '').trim().toLowerCase()}_${(p.teamCode || '').trim().toUpperCase()}`;
        keys.add(normKey);
      }
    }
    return keys;
  }, [allPlayers, selectedPlayerIds]);

  if (!isOpen) return null;

  const targetTitle = SLOT_TITLES[activeSlot] || 'STAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-[96vw] max-w-5xl bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-3 sm:p-5 rounded-xs my-auto max-h-[92vh] flex flex-col box-border gap-2.5 sm:gap-3">
        {/* Header: Star icon + PICK {position} + CLOSE in ONE clean horizontal row */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#d4a86a] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base sm:text-xl select-none">{sport === 'nba' ? '🏀' : '⭐'}</span>
            <h2 className="font-pixel text-xs sm:text-sm md:text-base text-[#5c3509] tracking-wider uppercase font-bold truncate">
              PICK {currentSlotDef.positionReq}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation px-2.5 py-1 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center gap-1 cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5 transition-all font-pixel text-xs rounded-2xs shrink-0 font-bold"
            title="Close Picker"
          >
            <span>✕</span>
            <span>CLOSE</span>
          </button>
        </div>

        {/* Dedicated Game Slate Banner OR Weekly Superstars Banner OR 2-Row Matchup Carousel */}
        {isRestrictedToGame ? (
          <div className="flex items-center justify-between p-2.5 bg-[#12579b] text-[#fae5b8] rounded-xs border-2 border-[#0a2d52] shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏈</span>
              <div>
                <div className="font-pixel text-[11px] sm:text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                  <span>GAME SLATE: {restrictToMatchPair}</span>
                  <span className="px-1.5 py-0.2 bg-[#38bdf8] text-[#0a2d52] text-[8px] rounded-2xs font-black">STRICT</span>
                </div>
                <div className="font-retro text-[9px] sm:text-[10px] text-[#fae5b8]/90">
                  Only athletes playing in {restrictToMatchPair?.replace('@', ' @ ')} can be drafted for this game battle.
                </div>
              </div>
            </div>
            <span className="font-pixel text-[8px] bg-[#0a2d52] text-[#38bdf8] px-2 py-1 rounded-2xs border border-[#38bdf8]/40 font-bold whitespace-nowrap">
              GAME PICKS
            </span>
          </div>
        ) : isSuperstarsMode ? (
          <div className="flex items-center justify-between p-2 sm:p-2.5 bg-[#12579b] text-[#fae5b8] rounded-xs border-2 border-[#0a2d52] shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <div className="font-pixel text-xs sm:text-sm font-bold text-white tracking-wider">
                {currentSlotDef.positionReq} WEEKLY SUPERSTARS
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 p-2 bg-[#ecd7ab]/90 rounded-xs border-2 border-[#c99a57] shadow-inner shrink-0">
            <div className="flex items-center gap-1.5 w-full">
              {/* Left Arrow: grayed out when no previous pages */}
              <button
                type="button"
                disabled={matchPage === 0}
                onClick={() => setMatchPage((p) => Math.max(0, p - 1))}
                className={`touch-manipulation shrink-0 w-8 sm:w-9 h-14 sm:h-16 flex items-center justify-center rounded-xs font-pixel select-none transition-all ${
                  matchPage > 0
                    ? 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-2 border-[#1a2238] cursor-pointer shadow-xs active:scale-95 font-bold'
                    : 'bg-[#d8c29a] text-gray-500 border-2 border-gray-400/50 opacity-25 cursor-default pointer-events-none'
                }`}
                title="Previous Matchups"
                aria-label="Previous Matchups"
              >
                ◀
              </button>

              {/* 2-Row, 3-Column Matchup Pills */}
              <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1.5 min-w-0">
                {currentMatchesSubset.map((m) => {
                  const away = normalizeCode(m.awayTeamCode || m.away_team || '');
                  const home = normalizeCode(m.homeTeamCode || m.home_team || '');
                  const pairKey = `${away}@${home}`;
                  const isSelected = selectedGameFilter === pairKey;
                  const isLive = m.status === 'live';
                  const isFinal = checkMatchEnded(m);
                  return (
                    <button
                      key={pairKey || m.id}
                      type="button"
                      onClick={() => setSelectedGameFilter(isSelected ? 'ALL' : pairKey)}
                      className={`touch-manipulation px-1 py-1 md:py-2 rounded-xs font-pixel text-[9px] md:text-xs border-2 text-center truncate cursor-pointer transition-all flex items-center justify-center gap-1 font-bold ${
                        isSelected
                          ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] shadow-xs'
                          : isLive
                          ? 'bg-[#ffe8e8] text-[#900] border-[#c0392b]'
                          : isFinal
                          ? 'bg-[#d8c29a] text-[#5c3509]/80 border-[#b38947]'
                          : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                      }`}
                      title={`${away} vs ${home}${isLive ? ' (LIVE)' : isFinal ? ' (FINAL)' : ''}`}
                    >
                      {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shrink-0" />}
                      <span className="truncate">{away}@{home}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Arrow: grayed out when on last page */}
              <button
                type="button"
                disabled={matchPage >= totalMatchPages - 1}
                onClick={() => setMatchPage((p) => Math.min(totalMatchPages - 1, p + 1))}
                className={`touch-manipulation shrink-0 w-8 sm:w-9 h-14 sm:h-16 flex items-center justify-center rounded-xs font-pixel select-none transition-all ${
                  matchPage < totalMatchPages - 1
                    ? 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-2 border-[#1a2238] cursor-pointer shadow-xs active:scale-95 font-bold'
                    : 'bg-[#d8c29a] text-gray-500 border-2 border-gray-400/50 opacity-25 cursor-default pointer-events-none'
                }`}
                title="Next Matchups"
                aria-label="Next Matchups"
              >
                ▶
              </button>
            </div>

            {/* Sub-bar: Active Filter Indicator & Hide Ended Games */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#c99a57]/50 text-[10px] font-pixel">
              {selectedGameFilter !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => setSelectedGameFilter('ALL')}
                  className="touch-manipulation px-2 py-0.5 bg-[#12579b] text-[#fae5b8] border border-[#0a2d52] rounded-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#0c3764]"
                >
                  <span>FILTER: {selectedGameFilter}</span>
                  <span className="text-[#fca5a5]">✕ CLEAR</span>
                </button>
              ) : (
                <span className="text-[#784610] text-[9px] font-bold">ALL GAMES</span>
              )}

              <label className="flex items-center gap-1.5 cursor-pointer font-pixel text-[9px] text-[#5c3509] font-bold select-none bg-[#fae5b8] px-2 py-0.5 rounded-xs border border-[#c99a57]">
                <input
                  type="checkbox"
                  checked={hideEndedGames}
                  onChange={(e) => setHideEndedGames(e.target.checked)}
                  className="cursor-pointer accent-[#12579b]"
                />
                <span>🔒 HIDE ENDED</span>
              </label>
            </div>
          </div>
        )}

        <div className="relative flex items-center shrink-0">
          <Search size={14} className="absolute left-2.5 text-[#784610] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${sport.toUpperCase()} player or team...`}
            className="w-full pl-8 pr-7 py-1.5 sm:py-2 bg-[#ebd2a4] border-2 border-[#c99a57] text-[#5c3509] font-retro text-xs sm:text-sm rounded-xs placeholder:text-[#8c735d] focus:outline-hidden focus:border-[#12579b] focus:bg-[#fae9c8]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-[#784610] hover:text-[#5c3509] font-pixel text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-10 font-retro text-xs text-[#784610]">
              No {sport.toUpperCase()} stars match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredPlayers.map((player, index) => {
                const isCurrentSlot = player.id === currentSlotPlayerId;
                const playerNorm = `${(player.displayName || player.shortName || '').trim().toLowerCase()}_${(player.teamCode || '').trim().toUpperCase()}`;
                const isSelectedElsewhere = (selectedPlayerIds.includes(player.id) || selectedPlayerNormKeys.has(playerNorm)) && !isCurrentSlot;
                const { firstName, lastName } = splitPlayerFirstLastName(player.displayName);

                const pTeam = normalizeCode(player.teamCode || (player as any).team || '');
                const playerMatch = activeMatches.find((m) => {
                  const away = normalizeCode(m.awayTeamCode || m.away_team || '');
                  const home = normalizeCode(m.homeTeamCode || m.home_team || '');
                  return away === pTeam || home === pTeam;
                });
                const scoringInfo = getPlayerScoringDisplay(player, playerMatch, sport);

                const isPosAllowed = isPositionAllowedForSlot(activeSlot, player, sport);
                const isGameEnded = isPlayerGameEnded(player) || scoringInfo.gameState === 'post' || scoringInfo.isFinal;

                const isInjuredOrQuestionable = player.injuryStatus === 'I' || player.injuryStatus === 'Q';
                const primaryYards = getPlayerPrimaryYardage(player, sport);
                const primaryUnit = getPlayerYardageLabel(player, sport);

                return (
                  <div
                    key={player.id || `${player.displayName}_${index}`}
                    onClick={() => onInspectPlayer?.(player)}
                    className={`touch-manipulation border-2 rounded-xs p-2.5 sm:p-3 flex flex-col items-center justify-between min-h-[290px] h-auto cursor-pointer transition-all active:translate-y-0.5 relative select-none ${
                      isInjuredOrQuestionable
                        ? 'bg-[#d8d9dc] hover:bg-[#e2e3e6] border-[#9ca3af] shadow-[0_3px_0_0_#9ca3af]'
                        : isCurrentSlot
                        ? 'bg-[#f8efdc] border-[#12579b] ring-2 ring-[#12579b]/40 shadow-[0_3px_0_0_#0a2d52]'
                        : isGameEnded
                        ? 'bg-[#e7e5e4]/50 border-[#78716c] opacity-80 shadow-[0_3px_0_0_#78716c]'
                        : !isPosAllowed
                        ? 'bg-[#fee2e2]/40 border-[#b91c1c] shadow-[0_3px_0_0_#991b1b]'
                        : isSelectedElsewhere
                        ? 'bg-[#fae5b8] border-[#c99a57] opacity-60 shadow-[0_3px_0_0_#d4a86a]'
                        : 'bg-[#fae5b8] hover:bg-[#fff9ea] border-[#c99a57] hover:border-[#12579b] shadow-[0_3px_0_0_#d4a86a] hover:shadow-[0_4px_0_0_#0a2d52]'
                    }`}
                    title={`Tap to inspect stats for ${player.displayName}${player.injuryDetail ? ` (${player.injuryDetail})` : ''}`}
                  >
                    <div
                      className="w-full flex-1 flex flex-col items-center justify-between"
                      style={isInjuredOrQuestionable ? { filter: 'grayscale(100%)' } : undefined}
                    >
                      {/* Status Ribbon (Ended Game or Invalid Position Warning) */}
                      {isGameEnded ? (
                        <div className="w-full mb-1 flex items-center justify-center">
                          <span className="w-full text-center px-1 py-0.5 bg-[#44403c] text-[#f5f5f4] font-pixel text-[8px] font-bold rounded-2xs border border-[#292524]">
                            🔒 GAME COMPLETED (FINAL)
                          </span>
                        </div>
                      ) : !isPosAllowed ? (
                        <div className="w-full mb-1 flex items-center justify-center">
                          <span className="w-full text-center px-1 py-0.5 bg-[#b91c1c] text-white font-pixel text-[8px] font-bold rounded-2xs border border-[#7f1d1d]">
                            NEEDS {currentSlotDef.positionReq}
                          </span>
                        </div>
                      ) : null}

                      {/* Header Row: Rank Badge + Helmet + Team on Left; #Number • Pos + Injury on Right */}
                      <div className="w-full flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className="h-5 px-1.5 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] font-black rounded-2xs border border-[#0a2d52] shadow-2xs tracking-wider shrink-0 flex items-center justify-center leading-none"
                            title={`Rank #${index + 1}`}
                          >
                            #{index + 1}
                          </span>
                          {sport === 'nfl' && player.teamCode ? (
                            <PixelHelmet
                              teamCode={player.teamCode}
                              size={24}
                              className="drop-shadow-xs shrink-0"
                            />
                          ) : (
                            <span className="px-1.5 py-0.5 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] font-bold rounded-2xs shrink-0">
                              {player.teamCode}
                            </span>
                          )}
                          <span className="font-pixel text-[10px] font-bold text-[#5c3509] tracking-wider truncate">
                            {player.teamCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="flex items-center gap-1 font-pixel text-[9px] font-bold text-[#784610] h-5">
                            <span>#{player.uniformNumber || '—'}</span>
                            <span className="opacity-70">•</span>
                            <span className={!isPosAllowed ? 'text-[#b91c1c] font-black underline' : ''}>
                              {getPlayerDisplayDepth(player)}
                            </span>
                          </div>
                          {player.injuryStatus === 'I' && (
                            <span
                              className="h-4 px-1 bg-[#dc2626] text-white font-pixel text-[8px] font-black rounded-2xs border border-[#991b1b] shadow-2xs flex items-center justify-center"
                              title={player.injuryDetail || 'INJURED / OUT'}
                            >
                              I
                            </span>
                          )}
                          {player.injuryStatus === 'Q' && (
                            <span
                              className="h-4 px-1 bg-[#ea580c] text-white font-pixel text-[8px] font-black rounded-2xs border border-[#c2410c] shadow-2xs flex items-center justify-center"
                              title={player.injuryDetail || 'QUESTIONABLE'}
                            >
                              Q
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="my-1 sm:my-2 flex items-center justify-center">
                        {(() => {
                          const visualAvatar = getPlayerVisualAvatar(player, playerMatch);
                          return (
                            <PixelPlayerSprite
                              avatar={visualAvatar}
                              number={visualAvatar.number || player.uniformNumber}
                              size="md"
                              withShadow={false}
                              sport={sport}
                              animate={false}
                              isOnFire={false}
                              injuryStatus={player.injuryStatus}
                            />
                          );
                        })()}
                      </div>

                      <div className="text-center leading-tight mb-1.5 w-full px-1">
                        {firstName && (
                          <div className="font-pixel text-[9px] sm:text-[10px] text-[#784610] uppercase truncate">
                            {firstName}
                          </div>
                        )}
                        <div className="font-pixel text-xs sm:text-sm font-bold text-[#5c3509] uppercase truncate">
                          {lastName || player.shortName}
                        </div>
                      </div>

                      {/* Official Season Yardage & Game Score Display */}
                      <div className={`w-full mb-2 py-1 px-2 rounded-2xs text-center shadow-2xs border ${
                        isInjuredOrQuestionable
                          ? 'bg-[#d1d5db] border-[#9ca3af]'
                          : 'bg-[#ebd2a4] border-[#c99a57]'
                      }`}>
                        {scoringInfo.gameState === 'pre' ? (
                          <div className="flex items-center justify-center">
                            <span className="font-sans text-xs font-semibold text-[#5c3509] tracking-tight">
                              {getPlayerPrimaryYardage(player, sport).toLocaleString()} {getPlayerYardageLabel(player, sport)}
                            </span>
                          </div>
                        ) : scoringInfo.gameState === 'in' ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span className="font-pixel text-xs sm:text-sm font-bold text-[#b91c1c] animate-pulse">
                              {Math.round(scoringInfo.activeScore)} PTS
                            </span>
                            <span className="font-pixel text-[8px] text-white bg-[#b91c1c] px-1 py-0.5 rounded-2xs font-bold">
                              LIVE
                            </span>
                            <span className="font-sans text-[11px] font-medium text-[#784610]">
                              · {getPlayerPrimaryYardage(player, sport).toLocaleString()} {getPlayerYardageLabel(player, sport)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span className="font-pixel text-xs sm:text-sm font-bold text-[#12579b]">
                              {Math.round(scoringInfo.activeScore)} PTS
                            </span>
                            <span className="font-pixel text-[8px] text-[#93c5fd] bg-[#12579b] px-1 py-0.5 rounded-2xs font-bold">
                              FINAL
                            </span>
                            <span className="font-sans text-[11px] font-medium text-[#784610]">
                              · {getPlayerPrimaryYardage(player, sport).toLocaleString()} {getPlayerYardageLabel(player, sport)}
                            </span>
                          </div>
                        )}
                      </div>

                      {isGameEnded ? (
                        <button
                          type="button"
                          disabled
                          className="touch-manipulation w-full shrink-0 min-h-[28px] md:min-h-[38px] py-1 md:py-2 px-2 bg-[#78716c] text-[#f5f5f4] border-2 border-[#44403c] font-pixel text-[9px] md:text-xs rounded-xs cursor-default text-center flex items-center justify-center gap-1 font-bold opacity-80"
                        >
                          <span>🔒</span>
                          <span>GAME ENDED</span>
                        </button>
                      ) : !isPosAllowed ? (
                        <button
                          type="button"
                          disabled
                          className="touch-manipulation w-full shrink-0 min-h-[28px] md:min-h-[38px] py-1 md:py-2 px-2 bg-[#991b1b] text-[#fef2f2] border-2 border-[#7f1d1d] font-pixel text-[8px] md:text-xs rounded-xs cursor-default text-center flex items-center justify-center gap-1 font-bold opacity-85"
                        >
                          <span>✕</span>
                          <span>NEEDS {currentSlotDef.positionReq}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (player.injuryStatus === 'I') {
                              setPendingInjuredPlayer(player);
                            } else {
                              onSelectPlayer(player, activeSlot);
                              onClose();
                            }
                          }}
                          className={`touch-manipulation w-full shrink-0 min-h-[28px] md:min-h-[38px] py-1 md:py-2 px-2 text-white border-2 font-pixel text-[9px] md:text-xs rounded-xs cursor-pointer active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 font-bold ${
                            player.injuryStatus === 'I'
                              ? 'bg-[#dc2626] hover:bg-[#b91c1c] border-[#7f1d1d] shadow-[0_1px_0_0_#450a0a] md:shadow-[0_2px_0_0_#450a0a]'
                              : 'bg-[#15803d] hover:bg-[#16a34a] border-[#052e16] shadow-[0_1px_0_0_#022c11] md:shadow-[0_2px_0_0_#022c11]'
                          }`}
                        >
                          <span>{player.injuryStatus === 'I' ? '⚠️' : '⭐'}</span>
                          <span>{isCurrentSlot ? 'SELECTED' : isSelectedElsewhere ? 'SWAP' : player.injuryStatus === 'I' ? 'INJURED' : 'PICK'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Injury Warning Confirmation Modal */}
        {pendingInjuredPlayer && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="relative w-full max-w-sm bg-[#fae5b8] border-4 border-[#b91c1c] shadow-[0_8px_0_0_#450a0a] p-4 rounded-xs text-center flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 text-[#b91c1c] font-pixel text-sm sm:text-base font-black uppercase">
                <span className="text-xl">⚠️</span>
                <span>INJURY REPORT ALERT</span>
              </div>
              <div className="bg-[#fef2f2] border-2 border-[#f87171] p-3 rounded-xs text-center">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 bg-[#dc2626] text-white font-pixel text-[10px] font-black rounded-2xs border border-[#991b1b] shadow-xs">
                    I
                  </span>
                  <span className="font-pixel text-xs sm:text-sm font-bold text-[#7f1d1d] uppercase">
                    {pendingInjuredPlayer.displayName}
                  </span>
                </div>
                <div className="font-retro text-xs text-[#991b1b] font-bold">
                  {pendingInjuredPlayer.injuryDetail || 'Player is listed as OUT / INJURED.'}
                </div>
                <div className="font-retro text-[11px] text-[#451a03] mt-2 bg-[#fed7aa] p-1.5 rounded-2xs border border-[#f97316]">
                  Starting an injured star may result in 0 fantasy points!
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPendingInjuredPlayer(null)}
                  className="flex-1 py-2 px-3 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#1e293b] border-2 border-[#64748b] font-pixel text-[10px] sm:text-xs rounded-xs font-bold cursor-pointer transition-all active:translate-y-0.5"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const chosen = pendingInjuredPlayer;
                    setPendingInjuredPlayer(null);
                    onSelectPlayer(chosen, activeSlot);
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white border-2 border-[#7f1d1d] font-pixel text-[10px] sm:text-xs rounded-xs font-bold cursor-pointer transition-all active:translate-y-0.5 shadow-xs"
                >
                  START ANYWAY
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};