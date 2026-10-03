import React, { useState, useEffect, useMemo } from 'react';
import { Competitor, Match, SportId, UserRoster } from '../types';
import { Trophy, Crown, Calendar, Sparkles, ChevronRight, CheckCircle2, BarChart2 } from 'lucide-react';
import {
  parseLeagueIdentity,
  resolveCompetitorById,
  findMatchForPlayer,
  getPlayerScoringDisplay,
  DEFAULT_NFL_MATCHES,
  normalizeTeamCode,
} from '../utils/teamData';
import { getCurrentNFLWeek } from '../lib/espnSync';
import { isGhostUser } from '../lib/supabaseClient';

interface SeasonLeaderboardProps {
  roomCode: string;
  userName: string;
  sport?: SportId;
  matches?: Match[];
  roomRosters?: UserRoster[];
  competitors?: Competitor[];
  onSelectWeek?: (weekNumber: number) => void;
}

export interface WeeklyScoreBreakdown {
  weekNumber: number;
  points: number;
  wins: number;
  outrightWins: number;
  isWeeklyWinner: boolean;
}

export interface SquadSeasonStats {
  userName: string;
  isYou: boolean;
  totalSeasonWins: number;
  outrightWins: number;
  tiedWins: number;
  weeklyTitlesWon: number; // How many times they finished #1 in a week
  totalSeasonPoints: number;
  pointsBehind: number;
  seasonAvgPPG: number;
  totalGamesPlayed: number;
  weeksPlayedCount: number;
  weekBreakdown: Record<number, WeeklyScoreBreakdown>;
}

export const SeasonLeaderboard: React.FC<SeasonLeaderboardProps> = ({
  roomCode,
  userName,
  sport = 'nfl',
  matches = [],
  roomRosters = [],
  competitors = [],
  onSelectWeek,
}) => {
  const activeNormalizedName = (userName || '').trim().toUpperCase();
  const identity = useMemo(() => parseLeagueIdentity(roomCode), [roomCode]);
  const baseLeague = identity.baseLeague;

  const [allLeagueRosters, setAllLeagueRosters] = useState<UserRoster[]>(roomRosters);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState<boolean>(false);

  // Fetch all historical rosters for this entire league franchise across all weeks
  useEffect(() => {
    let isCancelled = false;
    const fetchLeagueData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/rosters?league=${encodeURIComponent(baseLeague)}&sport=${sport}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.rosters) && !isCancelled) {
            setAllLeagueRosters(data.rosters);
          }
        }
      } catch (err) {
        console.warn('Could not load season rosters:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchLeagueData();
    return () => {
      isCancelled = true;
    };
  }, [baseLeague, sport]);

  // Combine matches to ensure we have all week matches available
  const allSeasonMatches = useMemo(() => {
    const map = new Map<string, Match>();
    // First default full schedule
    if (sport === 'nfl') {
      DEFAULT_NFL_MATCHES.forEach((m) => map.set(m.id, m));
    }
    // Overlay any live match updates from props
    (matches || []).forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [matches, sport]);

  const getPlayerLivePoints = (p: Competitor | null | undefined, weekNumber?: number): number => {
    if (!p) return 0;
    let match: Match | undefined;
    if (weekNumber) {
      match = allSeasonMatches.find((m) => {
        if (m.week !== weekNumber) return false;
        const pTeam = normalizeTeamCode(p.teamCode || (p as any).team || '');
        const away = normalizeTeamCode(m.awayTeamCode || m.away_team || '');
        const home = normalizeTeamCode(m.homeTeamCode || m.home_team || '');
        return away === pTeam || home === pTeam;
      });
    }
    if (!match) {
      match = findMatchForPlayer(p, allSeasonMatches);
    }
    if (!match) return 0;

    // Upcoming games: strictly 0 fantasy points!
    if (match.status === 'upcoming') {
      return 0;
    }

    const info = getPlayerScoringDisplay(p, match, sport);
    if (info.gameState === 'pre') return 0;
    if (info.activeScore > 0) return info.activeScore;

    // For completed or live games, use recorded scores:
    if (match.status === 'final' || match.status === 'live') {
      if (p.score && p.score > 0) return p.score;
      if (p.lastGameScore && p.lastGameScore > 0) return p.lastGameScore;
      if (info.historicalScore && info.historicalScore > 0) return info.historicalScore;
    }
    return 0;
  };

  // Group rosters by week
  const { distinctWeeks, seasonStatsList, seasonChampion } = useMemo(() => {
    const currentWeek = sport === 'nfl' ? getCurrentNFLWeek() : 1;
    // 1. Identify all weeks on the schedule up to current week
    const weeksSet = new Set<number>();
    allSeasonMatches.forEach((m) => {
      if (m.week && typeof m.week === 'number' && m.week <= currentWeek) {
        weeksSet.add(m.week);
      }
    });

    // Also include weeks from saved roster records
    allLeagueRosters.forEach((r) => {
      const rId = parseLeagueIdentity(r.room_code || '');
      if (rId.weekNumber && rId.weekNumber <= currentWeek) {
        weeksSet.add(rId.weekNumber);
      }
    });

    if (currentWeek) {
      weeksSet.add(currentWeek);
    }

    const distinctWeeks = Array.from(weeksSet).sort((a, b) => a - b);
    if (distinctWeeks.length === 0) distinctWeeks.push(currentWeek || 4);

    // 2. Identify all unique legitimate squads participating in this league
    const squadNames = new Set<string>();
    allLeagueRosters.forEach((r) => {
      const u = (r.user_name || '').trim().toUpperCase();
      if (u && !isGhostUser(u)) squadNames.add(u);
    });
    if (activeNormalizedName && !isGhostUser(activeNormalizedName)) {
      squadNames.add(activeNormalizedName);
    }

    // Initial stats structure for each squad
    const statsMap: Record<string, SquadSeasonStats> = {};
    squadNames.forEach((u) => {
      const weekBreakdown: Record<number, WeeklyScoreBreakdown> = {};
      distinctWeeks.forEach((w) => {
        weekBreakdown[w] = {
          weekNumber: w,
          points: 0,
          wins: 0,
          outrightWins: 0,
          isWeeklyWinner: false,
        };
      });

      statsMap[u] = {
        userName: u,
        isYou: u === activeNormalizedName,
        totalSeasonWins: 0,
        outrightWins: 0,
        tiedWins: 0,
        weeklyTitlesWon: 0,
        totalSeasonPoints: 0,
        pointsBehind: 0,
        seasonAvgPPG: 0,
        totalGamesPlayed: 0,
        weeksPlayedCount: 0,
        weekBreakdown,
      };
    });

    // 3. For each week, compute game matchup points and wins
    distinctWeeks.forEach((w) => {
      const weekMatches = allSeasonMatches.filter((m) => m.week === w);

      // Track game slate points per squad for this week
      const weeklySquadGamePoints: Record<string, number> = {};
      squadNames.forEach((u) => {
        weeklySquadGamePoints[u] = 0;
      });

      // Process each game in this week
      weekMatches.forEach((m) => {
        const awayCode = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
        const homeCode = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();

        // Find rosters entered in this game slate (supporting season-long rooms and legacy week rooms)
        const slateRosters = allLeagueRosters.filter((r) => {
          const rCode = (r.room_code || '').trim().toUpperCase();
          if (!rCode.endsWith(`__${awayCode}_${homeCode}`)) return false;
          const id = parseLeagueIdentity(rCode);
          if (id.baseLeague !== baseLeague) return false;
          if (id.weekNumber !== null && id.weekNumber !== undefined) {
            return id.weekNumber === w;
          }
          return m.week === w;
        });

        const gameScores: Array<{ userName: string; score: number }> = [];

        slateRosters.forEach((r) => {
          const u = (r.user_name || '').trim().toUpperCase();
          if (!u || !statsMap[u]) return;
          const s1 = resolveCompetitorById(r.star_1_id, competitors, null, sport);
          const s2 = resolveCompetitorById(r.star_2_id, competitors, null, sport);
          const s3 = resolveCompetitorById(r.star_3_id, competitors, null, sport);
          const valid = [s1, s2, s3].filter(Boolean) as Competitor[];
          if (valid.length > 0) {
            const score = valid.reduce((sum, p) => sum + getPlayerLivePoints(p, w), 0);
            gameScores.push({ userName: u, score });
            weeklySquadGamePoints[u] = (weeklySquadGamePoints[u] || 0) + score;
            if (m.status === 'final' || m.status === 'live') {
              statsMap[u].totalGamesPlayed += 1;
            }
          }
        });

        // Determine winner of this game: only for completed or active games!
        const isGamePlayedOrLive = m.status === 'final' || m.status === 'live';
        if (isGamePlayedOrLive && gameScores.length > 0) {
          gameScores.sort((a, b) => b.score - a.score);
          const topScore = gameScores[0].score;
          if (topScore > 0 || m.status === 'final') {
            const winners = gameScores.filter((g) => g.score === topScore);
            if (winners.length === 1) {
              const wName = winners[0].userName;
              if (statsMap[wName]) {
                statsMap[wName].totalSeasonWins += 1;
                statsMap[wName].outrightWins += 1;
                statsMap[wName].weekBreakdown[w].wins += 1;
                statsMap[wName].weekBreakdown[w].outrightWins += 1;
              }
            } else if (winners.length > 1 && topScore > 0) {
              winners.forEach((win) => {
                if (statsMap[win.userName]) {
                  statsMap[win.userName].totalSeasonWins += 1;
                  statsMap[win.userName].tiedWins += 1;
                  statsMap[win.userName].weekBreakdown[w].wins += 1;
                }
              });
            }
          }
        }
      });

      // Process Weekly Superstars Contest for Week w
      const superstarRosters = allLeagueRosters.filter((r) => {
        const rCode = (r.room_code || '').trim().toUpperCase();
        if (rCode.includes('__')) return false;
        const id = parseLeagueIdentity(rCode);
        if (id.baseLeague !== baseLeague) return false;
        if (id.weekNumber !== null && id.weekNumber !== undefined) {
          return id.weekNumber === w;
        }
        return w === currentWeek;
      });

      if (superstarRosters.length > 0) {
        const superstarScores: Array<{ userName: string; score: number }> = [];
        superstarRosters.forEach((r) => {
          const u = (r.user_name || '').trim().toUpperCase();
          if (!u || !statsMap[u]) return;
          const s1 = resolveCompetitorById(r.star_1_id, competitors, null, sport);
          const s2 = resolveCompetitorById(r.star_2_id, competitors, null, sport);
          const s3 = resolveCompetitorById(r.star_3_id, competitors, null, sport);
          const valid = [s1, s2, s3].filter(Boolean) as Competitor[];
          if (valid.length > 0) {
            const ssScore = valid.reduce((sum, p) => sum + getPlayerLivePoints(p, w), 0);
            superstarScores.push({ userName: u, score: ssScore });
            weeklySquadGamePoints[u] = (weeklySquadGamePoints[u] || 0) + ssScore;
            if (ssScore > 0) {
              statsMap[u].totalGamesPlayed += 1;
            }
          }
        });

        // Award Superstars contest win
        if (superstarScores.length > 0) {
          superstarScores.sort((a, b) => b.score - a.score);
          const topScore = superstarScores[0].score;
          if (topScore > 0) {
            const winners = superstarScores.filter((g) => g.score === topScore);
            if (winners.length === 1) {
              const wName = winners[0].userName;
              if (statsMap[wName]) {
                statsMap[wName].totalSeasonWins += 1;
                statsMap[wName].outrightWins += 1;
                statsMap[wName].weekBreakdown[w].wins += 1;
                statsMap[wName].weekBreakdown[w].outrightWins += 1;
              }
            } else if (winners.length > 1) {
              winners.forEach((win) => {
                if (statsMap[win.userName]) {
                  statsMap[win.userName].totalSeasonWins += 1;
                  statsMap[win.userName].tiedWins += 1;
                  statsMap[win.userName].weekBreakdown[w].wins += 1;
                }
              });
            }
          }
        }
      }

      // Record weekly points total & check weekly champion
      let weeklyHighScore = -1;
      let weeklyWinnerName = '';

      squadNames.forEach((u) => {
        const pts = weeklySquadGamePoints[u] || 0;
        statsMap[u].weekBreakdown[w].points = pts;
        statsMap[u].totalSeasonPoints += pts;
        if (pts > 0) {
          statsMap[u].weeksPlayedCount += 1;
        }
        if (pts > weeklyHighScore && pts > 0) {
          weeklyHighScore = pts;
          weeklyWinnerName = u;
        }
      });

      // Award weekly title
      if (weeklyWinnerName && statsMap[weeklyWinnerName] && weeklyHighScore > 0) {
        statsMap[weeklyWinnerName].weekBreakdown[w].isWeeklyWinner = true;
        statsMap[weeklyWinnerName].weeklyTitlesWon += 1;
      }
    });

    // Compute averages & points behind
    const statsList = Object.values(statsMap).map((st) => {
      st.seasonAvgPPG =
        st.totalGamesPlayed > 0 ? Number((st.totalSeasonPoints / st.totalGamesPlayed).toFixed(1)) : 0;
      return st;
    });

    // Sort by Total Season Wins DESC, Outright Wins DESC, Total Season Points DESC
    statsList.sort((a, b) => {
      if (b.totalSeasonWins !== a.totalSeasonWins) return b.totalSeasonWins - a.totalSeasonWins;
      if (b.outrightWins !== a.outrightWins) return b.outrightWins - a.outrightWins;
      if (b.totalSeasonPoints !== a.totalSeasonPoints) return b.totalSeasonPoints - a.totalSeasonPoints;
      return a.userName.localeCompare(b.userName);
    });

    const maxPoints = Math.max(...statsList.map((s) => s.totalSeasonPoints), 0);
    statsList.forEach((st) => {
      st.pointsBehind = Math.max(0, maxPoints - st.totalSeasonPoints);
    });

    const seasonChampion = statsList[0] || null;

    return { distinctWeeks, seasonStatsList: statsList, seasonChampion };
  }, [allLeagueRosters, allSeasonMatches, baseLeague, activeNormalizedName, competitors, sport]);

  return (
    <div className="w-full space-y-3.5 box-border">
      {/* 1. CLEAN SEASON CHAMPIONSHIP BANNER */}
      <div className="w-full py-2.5 px-3.5 sm:px-4 bg-[#0b1a2e] border-2 border-[#ca8a04] rounded-xs shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Crown size={20} className="text-[#facc15] animate-pulse" />
          <div>
            <h1 className="font-pixel text-xs sm:text-sm text-white font-bold tracking-wider uppercase">
              SEASON RUNNING LEADERBOARD
            </h1>
            <span className="font-sans text-xs text-[#93c5fd] block -mt-0.5">
              COUCH: {baseLeague} · {distinctWeeks.length} WEEKS TRACKED
            </span>
          </div>
        </div>

        {seasonChampion && seasonChampion.totalSeasonWins > 0 && (
          <div className="text-right shrink-0">
            <span className="font-pixel text-[10px] sm:text-xs text-[#fde047] font-bold block">
              👑 {seasonChampion.userName}
            </span>
            <span className="font-sans text-[11px] text-[#cbd5e1] block">
              {seasonChampion.totalSeasonWins} WINS · {seasonChampion.totalSeasonPoints} PTS
            </span>
          </div>
        )}
      </div>

      {/* 2. UNIFIED DEFAULT VIEW: MARIO KART SEASON STANDINGS (ORDERED BY TOTAL POINTS) */}
      <div className="pixel-box-cream p-3 sm:p-4 rounded-xs w-full shadow-[0_3px_0_0_#c99a57] border-2 border-[#c99a57] box-border">
        <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#d4a86a] gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#ca8a04]" />
            <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold tracking-wider uppercase">
              OVERALL COUCH SEASON STANDINGS
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedStats((v) => !v)}
            className={`touch-manipulation px-2.5 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all flex items-center gap-1.5 font-bold shadow-xs active:translate-y-0.5 ${
              showAdvancedStats
                ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                : 'bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border-[#c99a57]'
            }`}
            title="Toggle advanced statistical breakdown"
          >
            <BarChart2 size={12} className={showAdvancedStats ? 'text-[#38bdf8]' : 'text-[#784610]'} />
            <span>{showAdvancedStats ? '🤓 NERD STATS: ON' : '🤓 NERD STATS: OFF'}</span>
          </button>
        </div>

        <div className="space-y-2">
          {seasonStatsList.length === 0 ? (
            <div className="py-6 text-center font-sans text-xs text-[#784610]">
              No points scored yet this season.
            </div>
          ) : (
            [...seasonStatsList]
              .sort((a, b) => b.totalSeasonPoints - a.totalSeasonPoints)
              .map((st, idx) => {
                const isFirst = idx === 0 && st.totalSeasonPoints > 0;
                const isSecond = idx === 1 && st.totalSeasonPoints > 0;
                const isThird = idx === 2 && st.totalSeasonPoints > 0;
                const topScore = [...seasonStatsList].sort((a, b) => b.totalSeasonPoints - a.totalSeasonPoints)[0]?.totalSeasonPoints || 0;
                const gap = Math.max(0, topScore - st.totalSeasonPoints);

                return (
                  <div
                    key={st.userName}
                    className={`p-2.5 sm:p-3 rounded-xs border-2 transition-all flex items-center justify-between gap-3 ${
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
                            ? '🏆 Leading the Couch Season!'
                            : gap > 0
                            ? `${gap} pts behind 1st place`
                            : 'Tied for 1st place!'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-pixel text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xs border inline-block ${
                          isFirst
                            ? 'bg-[#ca8a04] text-white border-[#854d0e]'
                            : st.isYou
                            ? 'bg-[#0284c7] text-white border-[#38bdf8]'
                            : 'bg-[#ebd2a4] text-[#784610] border-[#c99a57]'
                        }`}
                      >
                        {st.totalSeasonPoints} PTS
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* 3. PROGRESSIVE DISCLOSURE: NERD STATS (MOST WINS & WEEKLY MATRIX) */}
      {showAdvancedStats && (
        <div className="space-y-3.5 border-t-2 border-[#d4a86a] pt-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 px-1">
            <BarChart2 size={16} className="text-[#38bdf8]" />
            <h3 className="font-pixel text-xs text-[#fae5b8] font-bold tracking-wider uppercase">
              📊 ADVANCED SEASON BREAKDOWN & STATS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full box-border">
            {/* CARD A: MOST SEASON WINS */}
            <div className="pixel-box-cream p-3 rounded-xs w-full shadow-[0_3px_0_0_#c99a57] border-2 border-[#c99a57]">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b-2 border-[#d4a86a]">
                <Crown size={15} className="text-[#ca8a04]" />
                <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold tracking-wider uppercase">
                  MOST SEASON WINS
                </h2>
              </div>

              <div className="space-y-1.5">
                {seasonStatsList.length === 0 ? (
                  <div className="py-4 text-center font-sans text-xs text-[#784610]">
                    No season picks recorded yet.
                  </div>
                ) : (
                  seasonStatsList.map((st, idx) => {
                    const isFirst = idx === 0 && st.totalSeasonWins > 0;
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
                              {st.weeklyTitlesWon > 0 ? `${st.weeklyTitlesWon}x Champ · ` : ''}
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
                            {st.totalSeasonWins} WINS
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CARD B: PPG & GAMES PLAYED */}
            <div className="pixel-box-cream p-3 rounded-xs w-full shadow-[0_3px_0_0_#c99a57] border-2 border-[#c99a57]">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b-2 border-[#d4a86a]">
                <Trophy size={15} className="text-[#12579b]" />
                <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold tracking-wider uppercase">
                  SEASON PPG & GAMES
                </h2>
              </div>

              <div className="space-y-1.5">
                {seasonStatsList.length === 0 ? (
                  <div className="py-4 text-center font-sans text-xs text-[#784610]">
                    No points scored yet.
                  </div>
                ) : (
                  [...seasonStatsList]
                    .sort((a, b) => b.seasonAvgPPG - a.seasonAvgPPG)
                    .map((st, idx) => {
                      const isFirst = idx === 0 && st.seasonAvgPPG > 0;
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
                                {st.totalGamesPlayed} Games Played
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
                              {st.seasonAvgPPG} PPG
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

      {/* 3. WEEK-BY-WEEK RUNNING TOTAL MATRIX */}
      <div className="pixel-box-cream p-3 sm:p-4 rounded-xs w-full shadow-[0_3px_0_0_#c99a57] border-2 border-[#c99a57] box-border overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#d4a86a]">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#12579b]" />
            <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold tracking-wider uppercase">
              WEEK-OVER-WEEK BREAKDOWN
            </h2>
          </div>
          <span className="font-pixel text-[9px] text-[#784610] bg-[#ebd2a4] px-2 py-0.5 border border-[#c99a57] rounded-xs font-bold">
            RUNNING RECORD
          </span>
        </div>

        {/* Matrix Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-[#ebd2a4]/80 border-b-2 border-[#d4a86a] font-pixel text-[9px] text-[#5c3509]">
                <th className="py-2 px-2.5">SQUAD</th>
                {distinctWeeks.map((w) => (
                  <th key={w} className="py-2 px-2 text-center">
                    {onSelectWeek ? (
                      <button
                        type="button"
                        onClick={() => onSelectWeek(w)}
                        className="hover:underline font-bold text-[#12579b] cursor-pointer"
                        title={`View Week ${w}`}
                      >
                        WK {w}
                      </button>
                    ) : (
                      `WK ${w}`
                    )}
                  </th>
                ))}
                <th className="py-2 px-2 text-center text-[#ca8a04]">TOTAL WINS</th>
                <th className="py-2 px-2 text-right text-[#12579b]">TOTAL PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4a86a]/40">
              {seasonStatsList.map((st, idx) => (
                <tr
                  key={st.userName}
                  className={`transition-colors ${
                    st.isYou ? 'bg-[#38bdf8]/15 font-bold' : idx % 2 === 0 ? 'bg-[#faebd0]' : 'bg-[#fae9c8]/50'
                  }`}
                >
                  {/* Squad Name */}
                  <td className="py-2.5 px-2.5 flex items-center gap-1.5 min-w-[120px]">
                    <span className="font-pixel text-[9px] text-[#784610] w-4">
                      {idx === 0 ? '👑' : `${idx + 1}.`}
                    </span>
                    <span className="font-pixel text-xs text-[#5c3509] font-bold truncate">
                      {st.userName}
                    </span>
                    {st.isYou && (
                      <span className="font-pixel text-[7px] bg-[#0284c7] text-white px-1 py-0.2 rounded-2xs">
                        YOU
                      </span>
                    )}
                  </td>

                  {/* Week by Week cells */}
                  {distinctWeeks.map((w) => {
                    const cell = st.weekBreakdown[w];
                    const isWeekActiveOrFinal = allSeasonMatches.some(
                      (m) => m.week === w && (m.status === 'final' || m.status === 'live')
                    );
                    const hasActivity = cell && (cell.points > 0 || cell.wins > 0);
                    return (
                      <td key={w} className="py-2 px-2 text-center font-pixel text-[10px]">
                        {cell && (isWeekActiveOrFinal || hasActivity) ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-[#1e293b] flex items-center gap-0.5">
                              {cell.points}p
                              {cell.isWeeklyWinner && <span className="text-[10px]">🏆</span>}
                            </span>
                            <span className="font-retro text-[9px] text-[#784610]">
                              {cell.wins}W
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#94a3b8] font-retro text-sm">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Total Wins */}
                  <td className="py-2 px-2 text-center font-pixel text-xs font-bold text-[#854d0e]">
                    {st.totalSeasonWins}W
                  </td>

                  {/* Total Points */}
                  <td className="py-2 px-2 text-right font-pixel text-xs font-bold text-[#0369a1]">
                    {st.totalSeasonPoints} PTS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
