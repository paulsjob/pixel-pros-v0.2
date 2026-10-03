import React, { useState, useMemo, useCallback } from 'react';
import { Competitor, Match, SportId, UserRoster } from '../types';
import { PixelHelmet } from './PixelHelmet';
import { Trophy, Crown, Medal, ChevronDown, ChevronUp, ArrowRight, Flame, Shield, CheckCircle2, ChevronLeft, ChevronRight, Calendar, BarChart2, Users } from 'lucide-react';
import {
  getBaseSeasonRoom,
  resolveCompetitorById,
  resolvePlayerInPool,
  findMatchForPlayer,
  getPlayerScoringDisplay,
  isMatchEnded,
  sortMatchesByKickoffAndStatus,
  DEFAULT_NFL_MATCHES,
  parseLeagueIdentity,
} from '../utils/teamData';
import { getCurrentNFLWeek } from '../lib/espnSync';

interface CentralLeagueLeaderboardProps {
  roomCode: string;
  userName: string;
  sport?: SportId;
  matches: Match[];
  roomRosters: UserRoster[];
  competitors: Competitor[];
  onSelectSlate?: (slateId: string) => void;
  onOpenPlayerDetail?: (player: Competitor) => void;
  onSelectSquad?: (squadName: string) => void;
  onSwitchToPicks?: () => void;
}

export interface GamePodiumEntry {
  rank: number;
  userName: string;
  score: number;
  stars: Array<{ player: Competitor; points: number }>;
  isWinner: boolean;
  isTiedWinner: boolean;
}

export interface GamePodiumData {
  gameIndex: number;
  match: Match;
  awayCode: string;
  homeCode: string;
  slateKey: string;
  statusText: string;
  isFinal: boolean;
  isLive: boolean;
  podium: GamePodiumEntry[];
  totalParticipants: number;
  hasPicks: boolean;
  topScore: number;
  winnerNames: string[];
}

export interface UserLeagueStats {
  userName: string;
  isYou: boolean;
  // Wins
  totalWins: number;
  outrightWins: number;
  tiedWins: number;
  winRate: number; // 0 - 100
  podiumsCount: number; // 1st, 2nd, 3rd finishes
  // Points
  totalPoints: number;
  pointsBehind: number;
  avgPPG: number;
  gamesPlayed: number;
  highGameScore: number;
  highGameSlate: string;
}

export const CentralLeagueLeaderboard: React.FC<CentralLeagueLeaderboardProps> = ({
  roomCode,
  userName,
  sport = 'nfl',
  matches = [],
  roomRosters = [],
  competitors = [],
  onSelectSlate,
  onOpenPlayerDetail,
  onSelectSquad,
  onSwitchToPicks,
}) => {
  const cleanRoom = getBaseSeasonRoom(roomCode || 'COUCH');
  const activeNormalizedName = (userName || '').trim().toUpperCase();
  const [showNerdStats, setShowNerdStats] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'live_final' | 'upcoming'>('all');
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});
  const [expandedStandingsUser, setExpandedStandingsUser] = useState<string | null>(null);

  const getUserStars = useCallback(
    (uName: string) => {
      const norm = (uName || '').trim().toUpperCase();
      const superRoster = (roomRosters || []).find((r) => {
        const p = parseLeagueIdentity(r.room_code || '');
        return (
          p.baseLeague === cleanRoom &&
          (!p.isGameSlate || r.room_code === cleanRoom) &&
          (r.user_name || '').trim().toUpperCase() === norm
        );
      });
      if (!superRoster) return [];
      const s1 = resolveCompetitorById(superRoster.star_1_id, competitors, null, sport);
      const s2 = resolveCompetitorById(superRoster.star_2_id, competitors, null, sport);
      const s3 = resolveCompetitorById(superRoster.star_3_id, competitors, null, sport);
      return [
        { slotLabel: 'QB', player: s1 },
        { slotLabel: 'RB', player: s2 },
        { slotLabel: 'WR/TE', player: s3 },
      ].filter((x) => Boolean(x.player)) as Array<{ slotLabel: string; player: Competitor }>;
    },
    [roomRosters, cleanRoom, competitors, sport]
  );

  const allSeasonMatches = useMemo(() => {
    const map = new Map<string, Match>();
    if (sport === 'nfl') {
      DEFAULT_NFL_MATCHES.forEach((m) => map.set(m.id, m));
    }
    (matches || []).forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [matches, sport]);

  const activeNFLWeek = sport === 'nfl' ? getCurrentNFLWeek() : 1;

  const availableWeeks = useMemo(() => {
    const set = new Set<number>();
    allSeasonMatches.forEach((m) => {
      if (typeof m.week === 'number') set.add(m.week);
    });
    (roomRosters || []).forEach((r) => {
      const parsed = parseLeagueIdentity(r.room_code || '');
      if (parsed.weekNumber) set.add(parsed.weekNumber);
    });
    if (activeNFLWeek) set.add(activeNFLWeek);
    const sorted = Array.from(set).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : [activeNFLWeek || 4];
  }, [allSeasonMatches, roomRosters, activeNFLWeek]);

  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    if (availableWeeks.includes(activeNFLWeek)) return activeNFLWeek;
    return availableWeeks[availableWeeks.length - 1] || 4;
  });

  const weekMatches = useMemo(() => {
    const filtered = allSeasonMatches.filter((m) => m.week === selectedWeek);
    return sortMatchesByKickoffAndStatus(filtered.length > 0 ? filtered : matches);
  }, [allSeasonMatches, selectedWeek, matches]);

  const toggleExpandGame = (slateKey: string) => {
    setExpandedGames((prev) => ({ ...prev, [slateKey]: !prev[slateKey] }));
  };

  const getPlayerLivePoints = (p: Competitor | null | undefined, m?: Match): number => {
    if (!p) return 0;
    const match = m || findMatchForPlayer(p, weekMatches);
    if (!match) return 0;
    if (match.status === 'upcoming') return 0;
    const info = getPlayerScoringDisplay(p, match, sport);
    if (info.gameState === 'pre') return 0;
    if (info.activeScore > 0) return info.activeScore;
    if (match.status === 'final' || match.status === 'live' || isMatchEnded(match)) {
      if (p.score && p.score > 0) return p.score;
      if (p.lastGameScore && p.lastGameScore > 0) return p.lastGameScore;
      if (info.historicalScore && info.historicalScore > 0) return info.historicalScore;
    }
    return 0;
  };

  // 1. Compute Game Podiums for every match on selected week schedule
  const gamePodiums: GamePodiumData[] = useMemo(() => {
    return weekMatches.map((m, idx) => {
      const awayCode = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
      const homeCode = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
      const slateKey = `${awayCode}@${homeCode}`;
      const targetSlate = `${awayCode}_${homeCode}`;

      const isFinal = isMatchEnded(m);
      const isLive = m.status === 'live';

      let statusText = '';
      if (isFinal) {
        statusText = `FINAL: ${m.awayScore ?? m.away_score ?? 0} - ${m.homeScore ?? m.home_score ?? 0}`;
      } else if (isLive) {
        statusText = `LIVE: ${m.periodLabel || m.quarterTime || 'IN PROGRESS'}`;
      } else if (m.gameDate) {
        try {
          const d = new Date(m.gameDate);
          if (!isNaN(d.getTime())) {
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            let hours = d.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const minutes = d.getMinutes().toString().padStart(2, '0');
            statusText = `${days[d.getDay()]} ${hours}:${minutes} ${ampm} EDT`;
          } else {
            statusText = 'UPCOMING';
          }
        } catch {
          statusText = 'UPCOMING';
        }
      } else {
        statusText = 'UPCOMING';
      }

      // Robust roster matching for this specific game slate and week
      const slateRosters = (roomRosters || []).filter((r) => {
        const parsed = parseLeagueIdentity(r.room_code || '');
        if (parsed.baseLeague !== cleanRoom) return false;
        if (!parsed.isGameSlate) return false;
        if (parsed.slateMatchup !== targetSlate) return false;
        if (parsed.weekNumber != null && parsed.weekNumber !== selectedWeek) return false;
        return true;
      });

      const participants: Array<{
        userName: string;
        score: number;
        stars: Array<{ player: Competitor; points: number }>;
      }> = [];

      slateRosters.forEach((r) => {
        const u = (r.user_name || '').trim().toUpperCase();
        if (!u) return;
        let s1 = resolveCompetitorById(r.star_1_id, competitors, null, sport);
        let s2 = resolveCompetitorById(r.star_2_id, competitors, null, sport);
        let s3 = resolveCompetitorById(r.star_3_id, competitors, null, sport);
        const isPlayerInGame = (p: Competitor | null) => {
          if (!p) return false;
          const pTeam = (p.teamCode || (p as any).team || '').trim().toUpperCase();
          return pTeam === awayCode || pTeam === homeCode;
        };
        if (s1 && !isPlayerInGame(s1)) s1 = null;
        if (s2 && !isPlayerInGame(s2)) s2 = null;
        if (s3 && !isPlayerInGame(s3)) s3 = null;
        const validStars = [s1, s2, s3].filter(Boolean) as Competitor[];
        if (validStars.length > 0) {
          const detailedStars = validStars.map((p) => ({
            player: p,
            points: getPlayerLivePoints(p, m),
          }));
          const totalPoints = detailedStars.reduce((sum, item) => sum + item.points, 0);
          participants.push({
            userName: u,
            score: totalPoints,
            stars: detailedStars,
          });
        }
      });

      // Sort participants descending by score
      participants.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.userName.localeCompare(b.userName);
      });

      const topScore = participants[0]?.score ?? 0;
      const winnerNames: string[] = [];
      if (participants.length > 0 && (topScore > 0 || isFinal || isLive)) {
        participants.forEach((p) => {
          if (p.score === topScore) {
            winnerNames.push(p.userName);
          }
        });
      }

      // Build podium (Top 3)
      const podium: GamePodiumEntry[] = participants.slice(0, 3).map((p, pIdx) => {
        const isWinner = winnerNames.includes(p.userName);
        const isTiedWinner = isWinner && winnerNames.length > 1;
        return {
          rank: pIdx + 1,
          userName: p.userName,
          score: p.score,
          stars: p.stars,
          isWinner,
          isTiedWinner,
        };
      });

      return {
        gameIndex: idx + 1,
        match: m,
        awayCode,
        homeCode,
        slateKey,
        statusText,
        isFinal,
        isLive,
        podium,
        totalParticipants: participants.length,
        hasPicks: participants.length > 0,
        topScore,
        winnerNames,
      };
    });
  }, [weekMatches, roomRosters, competitors, sport, cleanRoom, selectedWeek]);

  // 2. Gather All League Members & Compute Statistics across all games
  const { winsStandings, pointsStandings, championLeader } = useMemo(() => {
    const userNamesSet = new Set<string>();

    // Collect all members who have rosters anywhere in this room
    (roomRosters || []).forEach((r) => {
      const rCode = (r.room_code || '').trim().toUpperCase();
      if (rCode === cleanRoom || rCode.startsWith(`${cleanRoom}__`)) {
        const u = (r.user_name || '').trim().toUpperCase();
        if (u) userNamesSet.add(u);
      }
    });

    if (activeNormalizedName) userNamesSet.add(activeNormalizedName);

    const statsMap: Record<string, UserLeagueStats> = {};
    userNamesSet.forEach((u) => {
      statsMap[u] = {
        userName: u,
        isYou: u === activeNormalizedName,
        totalWins: 0,
        outrightWins: 0,
        tiedWins: 0,
        winRate: 0,
        podiumsCount: 0,
        totalPoints: 0,
        pointsBehind: 0,
        avgPPG: 0,
        gamesPlayed: 0,
        highGameScore: 0,
        highGameSlate: '',
      };
    });

    // Accumulate across each game on schedule
    gamePodiums.forEach((gp) => {
      // Award wins if game has participants and has scores or has concluded
      const hasAction = gp.topScore > 0 || gp.isFinal || gp.isLive;
      if (hasAction && gp.winnerNames.length > 0) {
        if (gp.winnerNames.length === 1) {
          const w = gp.winnerNames[0];
          if (statsMap[w]) {
            statsMap[w].totalWins += 1;
            statsMap[w].outrightWins += 1;
          }
        } else {
          gp.winnerNames.forEach((w) => {
            if (statsMap[w]) {
              statsMap[w].totalWins += 1;
              statsMap[w].tiedWins += 1;
            }
          });
        }
      }

      // Record podium appearances and cumulative points
      gp.podium.forEach((entry) => {
        if (statsMap[entry.userName]) {
          statsMap[entry.userName].podiumsCount += 1;
        }
      });

      // Sum points for all participants in this game
      const targetSlate = `${gp.awayCode}_${gp.homeCode}`;
      const slateRosters = (roomRosters || []).filter((r) => {
        const parsed = parseLeagueIdentity(r.room_code || '');
        if (parsed.baseLeague !== cleanRoom) return false;
        if (!parsed.isGameSlate) return false;
        if (parsed.slateMatchup !== targetSlate) return false;
        if (parsed.weekNumber != null && parsed.weekNumber !== selectedWeek) return false;
        return true;
      });

      slateRosters.forEach((r) => {
        const u = (r.user_name || '').trim().toUpperCase();
        if (!u || !statsMap[u]) return;
        let s1 = resolveCompetitorById(r.star_1_id, competitors, null, sport);
        let s2 = resolveCompetitorById(r.star_2_id, competitors, null, sport);
        let s3 = resolveCompetitorById(r.star_3_id, competitors, null, sport);
        const isPlayerInGame = (p: Competitor | null) => {
          if (!p) return false;
          const pTeam = (p.teamCode || (p as any).team || '').trim().toUpperCase();
          return pTeam === gp.awayCode || pTeam === gp.homeCode;
        };
        if (s1 && !isPlayerInGame(s1)) s1 = null;
        if (s2 && !isPlayerInGame(s2)) s2 = null;
        if (s3 && !isPlayerInGame(s3)) s3 = null;
        const validStars = [s1, s2, s3].filter(Boolean) as Competitor[];
        if (validStars.length > 0) {
          const gameScore = validStars.reduce((sum, p) => sum + getPlayerLivePoints(p, gp.match), 0);
          statsMap[u].totalPoints += gameScore;
          if (gp.isFinal || gp.isLive || gameScore > 0) {
            statsMap[u].gamesPlayed += 1;
          }
          if (gameScore > statsMap[u].highGameScore) {
            statsMap[u].highGameScore = gameScore;
            statsMap[u].highGameSlate = gp.slateKey;
          }
        }
      });
    });

    // Compute win rate & averages
    Object.values(statsMap).forEach((st) => {
      st.winRate = st.gamesPlayed > 0 ? Math.round((st.totalWins / st.gamesPlayed) * 100) : 0;
      st.avgPPG = st.gamesPlayed > 0 ? Number((st.totalPoints / st.gamesPlayed).toFixed(1)) : 0;
    });

    // Standings 1: Ordered by Total Wins DESC, Outright Wins DESC, Total Points DESC
    const winsStandings = Object.values(statsMap).sort((a, b) => {
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      if (b.outrightWins !== a.outrightWins) return b.outrightWins - a.outrightWins;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.userName.localeCompare(b.userName);
    });

    // Standings 2: Ordered by Total Points DESC, Total Wins DESC
    const pointsStandings = Object.values(statsMap).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return a.userName.localeCompare(b.userName);
    });

    const maxPoints = pointsStandings[0]?.totalPoints || 0;
    pointsStandings.forEach((st) => {
      st.pointsBehind = Math.max(0, maxPoints - st.totalPoints);
    });

    const championLeader = winsStandings[0] || null;

    return { winsStandings, pointsStandings, championLeader };
  }, [cleanRoom, activeNormalizedName, roomRosters, competitors, sport, gamePodiums]);

  const filteredGames = useMemo(() => {
    if (filterMode === 'live_final') {
      return gamePodiums.filter((g) => g.isFinal || g.isLive);
    }
    if (filterMode === 'upcoming') {
      return gamePodiums.filter((g) => !g.isFinal && !g.isLive);
    }
    return gamePodiums;
  }, [gamePodiums, filterMode]);

  const activeOrFinalGamesCount = useMemo(() => {
    return gamePodiums.filter((g) => g.isFinal || g.isLive || g.topScore > 0).length;
  }, [gamePodiums]);

  return (
    <div className="w-full space-y-3.5 box-border">
      {/* 1. CLEAN LEAGUE HEADER WITH WEEK SELECTOR */}
      <div className="w-full p-2.5 sm:p-3 bg-[#0b1a2e] border-2 border-[#1e3a5f] rounded-xs shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#facc15]" />
            <h1 className="font-pixel text-xs sm:text-sm text-white font-bold tracking-wider uppercase">
              COUCH LEADERBOARD
            </h1>
          </div>
          <div className="font-pixel text-[10px] sm:text-xs text-[#fde047] font-bold">
            COUCH: {cleanRoom}
          </div>
        </div>

        {/* Week Switcher Pills */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1e3a5f]/80 gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {availableWeeks.map((w) => {
              const isActive = w === selectedWeek;
              const isCurrent = w === activeNFLWeek;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelectedWeek(w)}
                  className={`touch-manipulation px-2.5 py-1 font-pixel text-[9px] sm:text-[10px] rounded-xs border transition-all cursor-pointer font-bold flex items-center gap-1 ${
                    isActive
                      ? 'bg-[#facc15] text-[#451a03] border-[#fef08a] shadow-xs'
                      : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:text-white'
                  }`}
                >
                  <Calendar size={11} className={isActive ? 'text-[#451a03]' : 'text-[#94a3b8]'} />
                  <span>WEEK {w}</span>
                  {isCurrent && (
                    <span className="text-[7px] px-1 py-0.2 rounded-2xs bg-[#0284c7] text-white">
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="font-sans text-[11px] text-[#94a3b8] font-medium">
            Week {selectedWeek} · {gamePodiums.length} Games
          </div>
        </div>
      </div>

      {/* 2. MARIO KART STYLE UNIFIED STANDINGS (SIMPLE 1ST-4TH RANKING BASED ON TOTAL POINTS) */}
      <div className="pixel-box-cream p-3 sm:p-4 rounded-xs w-full shadow-[0_3px_0_0_#c99a57] border-2 border-[#c99a57] box-border">
        <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#d4a86a] gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#ca8a04]" />
            <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold tracking-wider uppercase">
              WEEK {selectedWeek} STANDINGS
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowNerdStats((v) => !v)}
            className={`touch-manipulation px-2.5 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all flex items-center gap-1.5 font-bold shadow-xs active:translate-y-0.5 ${
              showNerdStats
                ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                : 'bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border-[#c99a57]'
            }`}
            title="Toggle advanced statistical breakdown"
          >
            <BarChart2 size={12} className={showNerdStats ? 'text-[#38bdf8]' : 'text-[#784610]'} />
            <span>{showNerdStats ? '🤓 NERD STATS: ON' : '🤓 NERD STATS: OFF'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {pointsStandings.length === 0 ? (
            <div className="py-6 text-center font-sans text-xs text-[#784610]">
              No points scored yet in Week {selectedWeek}.
            </div>
          ) : (
            pointsStandings.map((st, idx) => {
              const isFirst = idx === 0 && st.totalPoints > 0;
              const isSecond = idx === 1 && st.totalPoints > 0;
              const isThird = idx === 2 && st.totalPoints > 0;
              const isExpanded = expandedStandingsUser === st.userName;
              const squadStars = isExpanded ? getUserStars(st.userName) : [];

              return (
                <div
                  key={st.userName}
                  className={`rounded-xs border-2 transition-all overflow-hidden ${
                    st.isYou
                      ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-xs'
                      : isFirst
                      ? 'bg-[#fef08a] text-[#713f12] border-[#ca8a04] shadow-xs ring-1 ring-[#fde047]'
                      : isSecond
                      ? 'bg-[#f1f5f9] text-[#1e293b] border-[#cbd5e1] shadow-xs'
                      : isThird
                      ? 'bg-[#ffedd5] text-[#7c2d12] border-[#fdba74] shadow-xs'
                      : 'bg-[#faebd0] text-[#5c3509] border-[#d4a86a]'
                  }`}
                >
                  {/* Clickable Header Row: Tap to inspect roster */}
                  <div
                    onClick={() => setExpandedStandingsUser((prev) => (prev === st.userName ? null : st.userName))}
                    className="p-2.5 sm:p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                    title={`Tap to ${isExpanded ? 'hide' : 'view'} ${st.userName}'s roster`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-2xs flex items-center justify-center font-pixel text-xs sm:text-sm font-bold shrink-0 border ${
                          isFirst
                            ? 'bg-[#ca8a04] text-white border-[#854d0e] shadow-xs'
                            : isSecond
                            ? 'bg-[#94a3b8] text-white border-[#64748b] shadow-xs'
                            : isThird
                            ? 'bg-[#b45309] text-white border-[#78350f] shadow-xs'
                            : st.isYou
                            ? 'bg-[#0369a1] text-white border-[#38bdf8]'
                            : 'bg-[#ebd2a4] text-[#784610] border-[#c99a57]'
                        }`}
                      >
                        {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `${idx + 1}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-pixel text-xs sm:text-sm font-bold truncate">
                            {st.userName}
                          </span>
                          {st.isYou && (
                            <span className="font-pixel text-[8px] bg-[#38bdf8] text-[#082f49] px-1 py-0.2 rounded-2xs font-bold shrink-0">
                              YOU
                            </span>
                          )}
                          {isFirst && (
                            <span className="text-xs select-none">👑</span>
                          )}
                        </div>
                        <div className="font-sans text-[11px] sm:text-xs font-medium truncate mt-0.5 opacity-90">
                          {isFirst
                            ? '🏆 Leading the Couch!'
                            : st.pointsBehind > 0
                            ? `${st.pointsBehind} pts behind 1st place`
                            : 'Tied for 1st place!'}
                          <span className="ml-1 text-[10px] opacity-75 font-normal">
                            · {isExpanded ? 'Tap to close roster ▲' : 'Tap to view roster ▼'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <div
                        className={`font-pixel text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xs border inline-block ${
                          isFirst
                            ? 'bg-[#ca8a04] text-white border-[#854d0e]'
                            : st.isYou
                            ? 'bg-[#0284c7] text-white border-[#38bdf8]'
                            : 'bg-[#ebd2a4] text-[#784610] border-[#c99a57]'
                        }`}
                      >
                        {st.totalPoints} PTS
                      </div>
                      <span className="font-pixel text-[10px] opacity-60">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Roster Inspection Drawer */}
                  {isExpanded && (
                    <div className="p-2.5 sm:p-3 bg-[#0a1226] text-[#fae5b8] border-t-2 border-[#1e293b] space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#1e293b]">
                        <span className="font-pixel text-[9px] sm:text-[10px] text-[#93c5fd] font-bold tracking-wider uppercase flex items-center gap-1">
                          <Users size={12} className="text-[#38bdf8]" />
                          <span>{st.userName}&apos;S WEEK {selectedWeek} ROSTER</span>
                        </span>
                        {st.isYou && onSwitchToPicks && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSwitchToPicks();
                            }}
                            className="touch-manipulation px-2 py-0.5 bg-[#facc15] hover:bg-[#fde047] text-[#451a03] font-pixel text-[8px] sm:text-[9px] font-bold rounded-2xs border border-[#ca8a04] cursor-pointer shadow-xs active:translate-y-0.5"
                          >
                            ⚡ EDIT PICKS ➔
                          </button>
                        )}
                      </div>

                      {squadStars.length === 0 ? (
                        <div className="py-3 text-center font-sans text-xs text-[#94a3b8]">
                          No superstar picks submitted for this week yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {squadStars.map(({ slotLabel, player }) => {
                            const pScore = getPlayerLivePoints(player);
                            return (
                              <div
                                key={player.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenPlayerDetail?.(player);
                                }}
                                className="p-2 bg-[#121c38] hover:bg-[#1a2950] border border-[#273860] hover:border-[#38bdf8] rounded-xs cursor-pointer transition-all flex items-center justify-between gap-2 shadow-xs"
                                title={`Tap to view full scout card for ${player.displayName}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {player.teamCode ? (
                                    <PixelHelmet teamCode={player.teamCode} size={22} className="shrink-0" />
                                  ) : (
                                    <span className="text-base select-none shrink-0">⭐</span>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-sans text-[10px] text-[#38bdf8] font-bold uppercase tracking-wider">
                                      {slotLabel} · {player.position}
                                    </div>
                                    <div className="font-pixel text-[10px] text-white font-bold truncate">
                                      {player.shortName || player.displayName}
                                    </div>
                                    <div className="font-sans text-[10px] text-[#94a3b8] truncate">
                                      {player.teamCode}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-pixel text-[11px] text-[#facc15] font-bold block">
                                    {pScore} PTS
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[10px] font-sans text-[#64748b]">
                        <span>Tap any superstar to inspect game log & stats</span>
                        <span className="font-bold text-[#94a3b8]">{st.gamesPlayed} games played</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. PROGRESSIVE DISCLOSURE: NERD STATS & ADVANCED BREAKDOWN */}
      {showNerdStats && (
        <div className="space-y-3.5 border-t-2 border-[#d4a86a] pt-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 px-1">
            <BarChart2 size={16} className="text-[#38bdf8]" />
            <h3 className="font-pixel text-xs text-[#fae5b8] font-bold tracking-wider uppercase">
              📊 ADVANCED BREAKDOWN & NERD STATS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full box-border">
            {/* CARD A: MOST WINS */}
            <div className="pixel-box-cream p-3 rounded-xs w-full shadow-[0_3px_0_0_#c99a57] border-2 border-[#c99a57]">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b-2 border-[#d4a86a]">
                <Crown size={15} className="text-[#ca8a04]" />
                <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold tracking-wider uppercase">
                  MOST WINS
                </h2>
              </div>

              <div className="space-y-1.5">
                {winsStandings.length === 0 ? (
                  <div className="py-4 text-center font-sans text-xs text-[#784610]">
                    No squads have picked yet.
                  </div>
                ) : (
                  winsStandings.map((st, idx) => {
                    const isFirst = idx === 0 && st.totalWins > 0;
                    return (
                      <div
                        key={st.userName}
                        className={`p-2 rounded-xs border-2 transition-all flex items-center justify-between gap-2 ${
                          st.isYou
                            ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-xs'
                            : isFirst
                            ? 'bg-[#fef08a] text-[#713f12] border-[#ca8a04] shadow-xs'
                            : 'bg-[#faebd0] text-[#5c3509] border-[#d4a86a]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-2xs flex items-center justify-center font-pixel text-[10px] font-bold shrink-0 border ${
                              isFirst
                                ? 'bg-[#ca8a04] text-white border-[#854d0e]'
                                : st.isYou
                                ? 'bg-[#0369a1] text-white border-[#38bdf8]'
                                : 'bg-[#ebd2a4] text-[#784610] border-[#c99a57]'
                            }`}
                          >
                            {isFirst ? '👑' : `${idx + 1}`}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-pixel text-xs sm:text-sm font-bold truncate">
                                {st.userName}
                              </span>
                              {st.isYou && (
                                <span className="font-pixel text-[8px] bg-[#38bdf8] text-[#082f49] px-1 py-0.2 rounded-2xs font-bold shrink-0">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-sans text-[11px] block font-medium ${
                                st.isYou ? 'text-[#bae6fd]' : 'text-[#784610]'
                              }`}
                            >
                              {st.outrightWins} Outright · {st.tiedWins} Tied
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-pixel text-xs sm:text-sm font-bold px-2 py-0.5 rounded-xs border inline-block ${
                              isFirst
                                ? 'bg-[#ca8a04] text-white border-[#854d0e]'
                                : st.isYou
                                ? 'bg-[#0284c7] text-white border-[#38bdf8]'
                                : 'bg-[#ebd2a4] text-[#784610] border-[#c99a57]'
                            }`}
                          >
                            {st.totalWins} {st.totalWins === 1 ? 'WIN' : 'WINS'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CARD B: TOTAL POINTS */}
            <div className="pixel-box-cream p-3 rounded-xs w-full shadow-[0_3px_0_0_#c99a57] border-2 border-[#c99a57]">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b-2 border-[#d4a86a]">
                <Trophy size={15} className="text-[#12579b]" />
                <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold tracking-wider uppercase">
                  POINTS & PPG
                </h2>
              </div>

              <div className="space-y-1.5">
                {pointsStandings.length === 0 ? (
                  <div className="py-4 text-center font-sans text-xs text-[#784610]">
                    No points scored yet.
                  </div>
                ) : (
                  pointsStandings.map((st, idx) => {
                    const isFirst = idx === 0 && st.totalPoints > 0;
                    return (
                      <div
                        key={st.userName}
                        className={`p-2 rounded-xs border-2 transition-all flex items-center justify-between gap-2 ${
                          st.isYou
                            ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-xs'
                            : isFirst
                            ? 'bg-[#fef08a] text-[#713f12] border-[#ca8a04] shadow-xs'
                            : 'bg-[#faebd0] text-[#5c3509] border-[#d4a86a]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-2xs flex items-center justify-center font-pixel text-[10px] font-bold shrink-0 border ${
                              isFirst
                                ? 'bg-[#ca8a04] text-white border-[#854d0e]'
                                : st.isYou
                                ? 'bg-[#0369a1] text-white border-[#38bdf8]'
                                : 'bg-[#ebd2a4] text-[#784610] border-[#c99a57]'
                            }`}
                          >
                            {isFirst ? '🏆' : `${idx + 1}`}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-pixel text-xs sm:text-sm font-bold truncate">
                                {st.userName}
                              </span>
                              {st.isYou && (
                                <span className="font-pixel text-[8px] bg-[#38bdf8] text-[#082f49] px-1 py-0.2 rounded-2xs font-bold shrink-0">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-sans text-[11px] block font-medium ${
                                st.isYou ? 'text-[#bae6fd]' : 'text-[#784610]'
                              }`}
                            >
                              {st.avgPPG} PPG · {st.gamesPlayed} Games
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-pixel text-xs sm:text-sm font-bold px-2 py-0.5 rounded-xs border inline-block ${
                              isFirst
                                ? 'bg-[#ca8a04] text-white border-[#854d0e]'
                                : st.isYou
                                ? 'bg-[#0284c7] text-white border-[#38bdf8]'
                                : 'bg-[#ebd2a4] text-[#784610] border-[#c99a57]'
                            }`}
                          >
                            {st.totalPoints} PTS
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 3. PODIUMS GRID */}
      <div className="pixel-box-cream p-3 sm:p-4 rounded-xs w-full shadow-[0_3px_0_0_#c99a57] border-2 border-[#c99a57] box-border">
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-2.5 mb-3 border-b-2 border-[#d4a86a] gap-2">
          <div className="flex items-center gap-2">
            <Medal size={16} className="text-[#12579b]" />
            <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold tracking-wider uppercase">
              PODIUMS
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#ebd2a4] p-0.5 border border-[#c99a57] rounded-xs font-pixel text-[9px] sm:text-[10px]">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`touch-manipulation px-2.5 py-1 rounded-2xs cursor-pointer transition-all ${
                filterMode === 'all'
                  ? 'bg-[#12579b] text-white shadow-xs font-bold'
                  : 'text-[#784610] hover:bg-[#faebd0]'
              }`}
            >
              ALL ({gamePodiums.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('live_final')}
              className={`touch-manipulation px-2.5 py-1 rounded-2xs cursor-pointer transition-all ${
                filterMode === 'live_final'
                  ? 'bg-[#12579b] text-white shadow-xs font-bold'
                  : 'text-[#784610] hover:bg-[#faebd0]'
              }`}
            >
              FINAL / LIVE ({activeOrFinalGamesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('upcoming')}
              className={`touch-manipulation px-2.5 py-1 rounded-2xs cursor-pointer transition-all ${
                filterMode === 'upcoming'
                  ? 'bg-[#12579b] text-white shadow-xs font-bold'
                  : 'text-[#784610] hover:bg-[#faebd0]'
              }`}
            >
              UPCOMING ({gamePodiums.length - activeOrFinalGamesCount})
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGames.length === 0 ? (
            <div className="col-span-full p-6 text-center bg-[#fae9c8]/60 border-2 border-dashed border-[#c99a57] rounded-xs font-pixel text-xs text-[#5c3509]">
              No games match this filter.
            </div>
          ) : (
            filteredGames.map((gp) => {
              const isExpanded = Boolean(expandedGames[gp.slateKey]);
              const firstPlace = gp.podium.find((p) => p.rank === 1);
              const secondPlace = gp.podium.find((p) => p.rank === 2);
              const thirdPlace = gp.podium.find((p) => p.rank === 3);

              return (
                <div
                  key={gp.slateKey}
                  className="bg-[#0f172a] border-2 border-[#1e293b] rounded-xs text-[#fae5b8] shadow-[0_3px_0_0_#020617] overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Bar: Game Number (Left) & Match Status (Right) */}
                  <div className="px-3 py-1.5 bg-[#1e293b] border-b border-[#334155] flex items-center justify-between gap-2">
                    <span className="font-pixel text-[10px] text-[#facc15] font-bold">
                      GAME #{gp.gameIndex}
                    </span>
                    <span
                      className={`font-pixel text-[9px] px-2 py-0.5 rounded-2xs border font-bold ${
                        gp.isFinal
                          ? 'bg-[#064e3b] text-[#34d399] border-[#047857]'
                          : gp.isLive
                          ? 'bg-[#7f1d1d] text-[#fca5a5] border-[#b91c1c] animate-pulse'
                          : 'bg-[#0f172a] text-[#94a3b8] border-[#334155]'
                      }`}
                    >
                      {gp.statusText}
                    </span>
                  </div>

                  {/* Matchup Banner: Helmets & Team Codes with Dedicated Space */}
                  <div className="px-3 py-2 bg-[#0b1329] border-b border-[#1e293b] flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <PixelHelmet teamCode={gp.awayCode} size={20} />
                      <span className="font-pixel text-xs sm:text-sm font-bold text-white tracking-wider">
                        {gp.awayCode}
                      </span>
                    </div>
                    <span className="font-pixel text-xs text-[#fde047] font-bold">@</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-pixel text-xs sm:text-sm font-bold text-white tracking-wider">
                        {gp.homeCode}
                      </span>
                      <PixelHelmet teamCode={gp.homeCode} size={20} />
                    </div>
                  </div>

                  {/* Podium Standings */}
                  <div className="p-2.5 space-y-1.5 flex-1">
                    {/* 🥇 #1 Winner */}
                    {firstPlace ? (
                      <div className="p-2 bg-[#854d0e]/30 border border-[#ca8a04] rounded-2xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm select-none">🥇</span>
                          <span className="font-pixel text-xs text-[#fde047] font-bold truncate">
                            {firstPlace.userName}
                          </span>
                          <span className="text-xs">👑</span>
                          {firstPlace.userName === activeNormalizedName && (
                            <span className="font-pixel text-[8px] bg-[#38bdf8] text-[#082f49] px-1 rounded-2xs font-bold shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="font-pixel text-xs sm:text-sm text-[#fde047] font-bold shrink-0">
                          {firstPlace.score}p
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 bg-[#1e293b]/40 border border-dashed border-[#334155] rounded-2xs text-center font-retro text-[11px] text-[#94a3b8]">
                        Picks open · No squad locked in yet
                      </div>
                    )}

                    {/* 🥈 #2 & 🥉 #3 */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-1.5 bg-[#1e293b]/70 border border-[#475569] rounded-2xs flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-xs select-none">🥈</span>
                          <span className="font-pixel text-[10px] text-[#cbd5e1] font-bold truncate">
                            {secondPlace ? secondPlace.userName : 'Open'}
                          </span>
                        </div>
                        <span className="font-pixel text-[10px] text-[#cbd5e1] font-bold shrink-0">
                          {secondPlace ? `${secondPlace.score}p` : '-'}
                        </span>
                      </div>

                      <div className="p-1.5 bg-[#1e293b]/70 border border-[#475569] rounded-2xs flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-xs select-none">🥉</span>
                          <span className="font-pixel text-[10px] text-[#fed7aa] font-bold truncate">
                            {thirdPlace ? thirdPlace.userName : 'Open'}
                          </span>
                        </div>
                        <span className="font-pixel text-[10px] text-[#fed7aa] font-bold shrink-0">
                          {thirdPlace ? `${thirdPlace.score}p` : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Star Breakdown */}
                    {isExpanded && gp.podium.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#334155] space-y-1.5 animate-in fade-in duration-150">
                        {gp.podium.map((p) => (
                          <div key={p.userName} className="p-1.5 bg-[#0b1329] border border-[#1e293b] rounded-2xs">
                            <div className="flex items-center justify-between text-[10px] font-pixel text-[#94a3b8] mb-1">
                              <span className="font-bold text-white flex items-center gap-1">
                                {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'} {p.userName}
                              </span>
                              <span className="text-[#facc15] font-bold">{p.score} PTS</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {p.stars.map(({ player, points }) => (
                                <div
                                  key={player.id}
                                  onClick={() => onOpenPlayerDetail?.(player)}
                                  className="p-1 bg-[#1e293b] hover:bg-[#334155] rounded-2xs text-center cursor-pointer transition-colors border border-[#334155]"
                                  title={`${player.displayName} (${player.position}) - ${points} pts`}
                                >
                                  <span className="font-pixel text-[9px] text-[#38bdf8] font-bold block truncate">
                                    {player.displayName?.split(' ').pop()}
                                  </span>
                                  <span className="font-retro text-[9px] text-[#94a3b8] block">
                                    {player.position} · {points}p
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Roster Toggle & Jump Button */}
                  <div className="px-2.5 py-1.5 bg-[#0b1329] border-t border-[#1e293b] flex items-center justify-between gap-2">
                    {gp.podium.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleExpandGame(gp.slateKey)}
                        className="touch-manipulation font-pixel text-[9px] text-[#93c5fd] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={11} />
                            <span>HIDE ROSTERS</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={11} />
                            <span>ROSTERS</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="font-retro text-[10px] text-[#64748b]">Open</span>
                    )}

                    {onSelectSlate && (
                      <button
                        type="button"
                        onClick={() => onSelectSlate(gp.slateKey)}
                        className="touch-manipulation px-2.5 py-1 bg-[#12579b] hover:bg-[#1d4ed8] text-[#fae5b8] font-pixel text-[9px] rounded-2xs border border-[#0a2d52] flex items-center gap-1 cursor-pointer transition-all active:translate-y-0.5 font-bold"
                      >
                        <span>MATCHUP</span>
                        <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
