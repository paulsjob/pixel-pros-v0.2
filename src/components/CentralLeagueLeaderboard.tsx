import React, { useState, useMemo } from 'react';
import { Competitor, Match, SportId, UserRoster } from '../types';
import { PixelHelmet } from './PixelHelmet';
import { Trophy, Crown, Medal, ChevronDown, ChevronUp, ArrowRight, Flame, Shield, CheckCircle2 } from 'lucide-react';
import {
  resolvePlayerInPool,
  findMatchForPlayer,
  getPlayerScoringDisplay,
  isMatchEnded,
  sortMatchesByKickoffAndStatus,
} from '../utils/teamData';

interface CentralLeagueLeaderboardProps {
  roomCode: string;
  userName: string;
  sport?: SportId;
  matches: Match[];
  roomRosters: UserRoster[];
  competitors: Competitor[];
  onSelectSlate?: (slateId: string) => void;
  onOpenPlayerDetail?: (player: Competitor) => void;
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
}) => {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const activeNormalizedName = (userName || '').trim().toUpperCase();
  const [filterMode, setFilterMode] = useState<'all' | 'live_final' | 'upcoming'>('all');
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});

  const toggleExpandGame = (slateKey: string) => {
    setExpandedGames((prev) => ({ ...prev, [slateKey]: !prev[slateKey] }));
  };

  const getPlayerLivePoints = (p: Competitor | null | undefined): number => {
    if (!p) return 0;
    const match = findMatchForPlayer(p, matches);
    const info = getPlayerScoringDisplay(p, match, sport);
    if (info.gameState === 'pre') return 0;
    return info.activeScore > 0 ? info.activeScore : 0;
  };

  const sortedMatches = useMemo(() => {
    return sortMatchesByKickoffAndStatus(matches || []);
  }, [matches]);

  // 1. Compute Game Podiums for every match on schedule
  const gamePodiums: GamePodiumData[] = useMemo(() => {
    return sortedMatches.map((m, idx) => {
      const awayCode = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
      const homeCode = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
      const slateKey = `${awayCode}@${homeCode}`;
      const targetRoom = `${cleanRoom}__${awayCode}_${homeCode}`;

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

      // Filter rosters for this specific game slate
      const slateRosters = (roomRosters || []).filter(
        (r) => (r.room_code || '').trim().toUpperCase() === targetRoom
      );

      const participants: Array<{
        userName: string;
        score: number;
        stars: Array<{ player: Competitor; points: number }>;
      }> = [];

      slateRosters.forEach((r) => {
        const u = (r.user_name || '').trim().toUpperCase();
        if (!u) return;
        const s1 = resolvePlayerInPool(r.star_1_id, competitors, sport);
        const s2 = resolvePlayerInPool(r.star_2_id, competitors, sport);
        const s3 = resolvePlayerInPool(r.star_3_id, competitors, sport);
        const validStars = [s1, s2, s3].filter(Boolean) as Competitor[];
        if (validStars.length > 0) {
          const detailedStars = validStars.map((p) => ({
            player: p,
            points: getPlayerLivePoints(p),
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
  }, [sortedMatches, roomRosters, competitors, sport, cleanRoom]);

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
      const targetRoom = `${cleanRoom}__${gp.awayCode}_${gp.homeCode}`;
      const slateRosters = (roomRosters || []).filter(
        (r) => (r.room_code || '').trim().toUpperCase() === targetRoom
      );
      slateRosters.forEach((r) => {
        const u = (r.user_name || '').trim().toUpperCase();
        if (!u || !statsMap[u]) return;
        const s1 = resolvePlayerInPool(r.star_1_id, competitors, sport);
        const s2 = resolvePlayerInPool(r.star_2_id, competitors, sport);
        const s3 = resolvePlayerInPool(r.star_3_id, competitors, sport);
        const validStars = [s1, s2, s3].filter(Boolean) as Competitor[];
        if (validStars.length > 0) {
          const gameScore = validStars.reduce((sum, p) => sum + getPlayerLivePoints(p), 0);
          statsMap[u].totalPoints += gameScore;
          statsMap[u].gamesPlayed += 1;
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
      {/* 1. CLEAN LEAGUE HEADER */}
      <div className="w-full py-2.5 px-3.5 sm:px-4 bg-[#0b1a2e] border-2 border-[#1e3a5f] rounded-xs shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-[#facc15]" />
          <h1 className="font-pixel text-xs sm:text-sm text-white font-bold tracking-wider uppercase">
            LEAGUE LEADERBOARD
          </h1>
        </div>
        <div className="font-pixel text-[10px] sm:text-xs text-[#fde047] font-bold">
          ROOM: {cleanRoom}
        </div>
      </div>

      {/* 2. THE TWO STANDINGS CARDS (WINS & POINTS) */}
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
              <div className="py-4 text-center font-retro text-xs text-[#784610]">
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
                          className={`font-retro text-[11px] block ${
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
              TOTAL POINTS
            </h2>
          </div>

          <div className="space-y-1.5">
            {pointsStandings.length === 0 ? (
              <div className="py-4 text-center font-retro text-xs text-[#784610]">
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
                          className={`font-retro text-[11px] block ${
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
  );
};
