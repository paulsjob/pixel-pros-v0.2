import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Competitor, Match, SportId, UserProfile, UserRoster } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelShieldIcon } from './PixelBadges';
import { PixelHelmet } from './PixelHelmet';
import { Users, Sparkles, ChevronLeft, ChevronRight, Trophy, ChevronDown, ChevronUp, Flame, CheckCircle2, ArrowRight, Crown } from 'lucide-react';
import { splitPlayerFirstLastName, formatPlayerInitialLastName, formatTeamPosSubtitle } from '../utils/formatters';
import { getDeviceId } from '../lib/deviceIdentity';
import { isGhostUser, getSquadLockState, fetchRoomRosters } from '../lib/supabaseClient';
import { CentralLeagueLeaderboard } from './CentralLeagueLeaderboard';
import { SeasonLeaderboard } from './SeasonLeaderboard';
import {
  getBaseSeasonRoom,
  resolveCompetitorById,
  getPlayerScoringDisplay,
  resolvePlayerInPool,
  findMatchForPlayer,
  getPlayerVisualAvatar,
  sortMatchesByKickoffAndStatus,
  isMatchEnded,
  computeGameRoomStandings,
  getTeamColors,
  getTeamHelmetPopColors,
} from '../utils/teamData';

function formatPickedByName(rawName: string): string {
  const trimmed = (rawName || '').trim();
  if (trimmed.toUpperCase() === 'MOM') return 'Mom';
  if (trimmed.toUpperCase() === 'DAD') return 'Dad';
  if (trimmed.toUpperCase() === 'BROTHER') return 'Brother';
  if (trimmed.toUpperCase() === 'SISTER') return 'Sister';
  if (trimmed.toUpperCase() === 'YOU') return 'You';
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return trimmed;
}

interface LeaderboardViewProps {
  user: UserProfile;
  nflCompetitors?: Competitor[];
  roomRosters?: UserRoster[];
  matches?: Match[];
  roomCode: string;
  userName: string;
  sport?: SportId;
  activeSlateId?: string;
  onSelectSlate?: (slateId: string) => void;
  onCommitRoomCode: (code: string) => void;
  onCommitUserName: (name: string) => void;
  onOpenPlayerDetail?: (player: Competitor) => void;
  onSelectSquad?: (squadName: string) => void;
  onSwitchToPicks?: () => void;
  isGameRoomMode?: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  user,
  nflCompetitors = [],
  roomRosters = [],
  matches = [],
  roomCode,
  userName,
  sport = 'nfl',
  activeSlateId,
  onSelectSlate,
  onCommitRoomCode,
  onCommitUserName,
  onOpenPlayerDetail,
  onSelectSquad,
  onSwitchToPicks,
  isGameRoomMode = false,
}) => {
  // Top-level View Mode: 'weekly' (default), 'season', 'game_slates', 'top_players'
  const [viewMode, setViewMode] = useState<'weekly' | 'season' | 'game_slates' | 'top_players'>('weekly');
  // Two bold retro toggle buttons: [ FAMILY ] (default) and [ TOP SCORES ]
  const [activeTier, setActiveTier] = useState<'family' | 'top_scores'>('family');
  const [leagueSlateFilter, setLeagueSlateFilter] = useState<string>(() => {
    if (activeSlateId && activeSlateId.trim()) return activeSlateId.trim();
    if (matches && matches.length > 0) {
      const first = matches[0];
      const away = (first.awayTeamCode || first.away_team || '').toUpperCase();
      const home = (first.homeTeamCode || first.home_team || '').toUpperCase();
      if (away && home) return `${away}@${home}`;
    }
    return isGameRoomMode ? 'PIT@CLE' : 'MEGA_TOTAL';
  });
  const [showGameSelectorModal, setShowGameSelectorModal] = useState<boolean>(false);

  useEffect(() => {
    if (activeSlateId && activeSlateId.trim() && activeSlateId.trim() !== leagueSlateFilter) {
      setLeagueSlateFilter(activeSlateId.trim());
    }
  }, [activeSlateId]);

  const handleSelectSlateFilter = (newSlate: string) => {
    setLeagueSlateFilter(newSlate);
    onSelectSlate?.(newSlate);
  };
  const [sortBy, setSortBy] = useState<'score' | 'slates'>('score');
  const [expandedSquadName, setExpandedSquadName] = useState<string | null>(userName ? userName.trim().toUpperCase() : null);

  const safeNflPlayers = Array.isArray(nflCompetitors) ? nflCompetitors : [];
  const safeRoomRosters = Array.isArray(roomRosters) ? roomRosters : [];
  const cleanRoom = getBaseSeasonRoom(roomCode || 'COUCH');
  const activeNormalizedName = (userName || '').trim().toUpperCase();

  // Internal reactive roster state to guarantee zero-lag and self-healing rosters
  const [internalRosters, setInternalRosters] = useState<UserRoster[]>(safeRoomRosters);

  useEffect(() => {
    if (safeRoomRosters && safeRoomRosters.length > 0) {
      setInternalRosters((prev) => {
        const map = new Map<string, UserRoster>();
        for (const r of safeRoomRosters) {
          map.set(`${(r.room_code || '').toUpperCase()}___${(r.user_name || '').toUpperCase()}`, r);
        }
        for (const r of prev) {
          const k = `${(r.room_code || '').toUpperCase()}___${(r.user_name || '').toUpperCase()}`;
          if (!map.has(k)) map.set(k, r);
        }
        return Array.from(map.values());
      });
    }
  }, [safeRoomRosters]);

  const refreshRosters = useCallback(async () => {
    try {
      const fresh = await fetchRoomRosters(cleanRoom, sport);
      if (fresh && Array.isArray(fresh) && fresh.length > 0) {
        setInternalRosters((prev) => {
          const map = new Map<string, UserRoster>();
          for (const r of fresh) {
            map.set(`${(r.room_code || '').toUpperCase()}___${(r.user_name || '').toUpperCase()}`, r);
          }
          for (const r of prev) {
            const k = `${(r.room_code || '').toUpperCase()}___${(r.user_name || '').toUpperCase()}`;
            if (!map.has(k)) map.set(k, r);
          }
          return Array.from(map.values());
        });
      }
    } catch {}
  }, [cleanRoom, sport]);

  useEffect(() => {
    refreshRosters();
    const interval = setInterval(refreshRosters, 5000);
    const handleUpdate = () => refreshRosters();
    window.addEventListener('pixel_pros_roster_update', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pixel_pros_roster_update', handleUpdate);
    };
  }, [refreshRosters]);

  const effectiveRoomRosters = useMemo(() => {
    return internalRosters.length > 0 ? internalRosters : safeRoomRosters;
  }, [internalRosters, safeRoomRosters]);

  const sortedMatches = useMemo(() => {
    return sortMatchesByKickoffAndStatus(matches || []);
  }, [matches]);

  const standingsSlateOptions = useMemo(() => {
    const list = ['MEGA_TOTAL', 'SUPERSTARS'];
    sortedMatches.forEach((m) => {
      const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
      const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
      list.push(`${away}@${home}`);
    });
    return list;
  }, [sortedMatches]);

  const handleScrollStandingSlate = (direction: 'left' | 'right') => {
    if (standingSlateScrollRef.current) {
      standingSlateScrollRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth',
      });
    }
  };

  const standingSlateScrollRef = useRef<HTMLDivElement>(null);
  const activeStandingSlateBtnRef = useRef<HTMLButtonElement>(null);

  const getPlayerLivePoints = useCallback((p: Competitor) => {
    if (!p) return 0;
    const match = findMatchForPlayer(p, matches);
    const info = getPlayerScoringDisplay(p, match, sport);
    // CRITICAL: If the game has not kicked off yet (gameState === 'pre'), active fantasy points are strictly 0.
    // Never fall back to stale or unverified mock scores from the database for unplayed games!
    if (info.gameState === 'pre') return 0;
    return info.activeScore > 0 ? info.activeScore : 0;
  }, [matches, sport]);

  // Top 20 NFL Competitors ordered by live score DESC with rock-solid deterministic secondary tiebreakers
  const top20Players = useMemo(() => {
    const seenPlayerIds = new Set<string>();
    return safeNflPlayers
      .filter((p) => {
        if (!p || !p.id) return false;
        if (seenPlayerIds.has(p.id)) return false;
        seenPlayerIds.add(p.id);
        return true;
      })
      .sort((a, b) => {
        const scoreB = getPlayerLivePoints(b);
        const scoreA = getPlayerLivePoints(a);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        // Deterministic secondary sort: Marquee starters & superstar ratings first (99, 95, 90...)
        const ratingDiff = (b.rating || 90) - (a.rating || 90);
        if (ratingDiff !== 0) return ratingDiff;

        // Depth rank: QB1 / RB1 / WR1 ahead of backups
        const depthA = a.depthRank || 99;
        const depthB = b.depthRank || 99;
        if (depthA !== depthB) return depthA - depthB;

        // Rock-solid alphabetical tiebreaker to prevent ANY sort blipping or jitter
        return (a.displayName || '').localeCompare(b.displayName || '');
      })
      .slice(0, 20);
  }, [safeNflPlayers, getPlayerLivePoints]);

  const hasAnyLiveScoring = useMemo(() => {
    return top20Players.some((p) => getPlayerLivePoints(p) > 0);
  }, [top20Players, getPlayerLivePoints]);

  // Current active user roster entry for this room
  const currentUserRoster: UserRoster = useMemo(() => {
    let s1 = user.selectedPlayerIds?.[0] || '';
    let s2 = user.selectedPlayerIds?.[1] || '';
    let s3 = user.selectedPlayerIds?.[2] || '';
    if (!s1 && !s2 && !s3 && activeNormalizedName) {
      try {
        const cached = localStorage.getItem(`pixel_pros_roster_${sport}_${cleanRoom}_${activeNormalizedName}`);
        if (cached) {
          const ids = JSON.parse(cached);
          if (Array.isArray(ids)) {
            s1 = ids[0] || '';
            s2 = ids[1] || '';
            s3 = ids[2] || '';
          }
        }
      } catch {}
    }
    return {
      room_code: cleanRoom,
      user_name: activeNormalizedName,
      star_1_id: s1,
      star_2_id: s2,
      star_3_id: s3,
      is_locked: (user as any).isLocked || false,
      updated_at: new Date().toISOString(),
    };
  }, [user.selectedPlayerIds, (user as any).isLocked, cleanRoom, activeNormalizedName, sport]);

  const familyListWithDynamicTotals = useMemo(() => {
    // 1. Gather all unique user names in this room across ALL slates
    const userNames = new Set<string>();
    effectiveRoomRosters.forEach((r) => {
      const rCode = (r.room_code || '').toUpperCase();
      if (rCode === cleanRoom || rCode.startsWith(`${cleanRoom}__`)) {
        const u = (r.user_name || '').trim().toUpperCase();
        if (u && !isGhostUser(u)) userNames.add(u);
      }
    });
    if (activeNormalizedName) userNames.add(activeNormalizedName);

    return Array.from(userNames).map((entryName) => {
      const isUser = entryName === activeNormalizedName;

      if (leagueSlateFilter === 'MEGA_TOTAL') {
        // Accumulate across ALL slates for this user in this room
        let totalScore = 0;
        let slatesCount = 0;
        let superstarsScore = 0;
        const allUserRosters = effectiveRoomRosters.filter(
          (r) =>
            (r.user_name || '').trim().toUpperCase() === entryName &&
            ((r.room_code || '').toUpperCase() === cleanRoom ||
              (r.room_code || '').toUpperCase().startsWith(`${cleanRoom}__`))
        );

        // Prioritize persistent database roster with picks; fallback to active session if user
        const dbSuperstarRoster = allUserRosters.find((r) => (r.room_code || '').toUpperCase() === cleanRoom);
        const hasDbPicks = Boolean(dbSuperstarRoster && (dbSuperstarRoster.star_1_id || dbSuperstarRoster.star_2_id || dbSuperstarRoster.star_3_id));
        const superstarRoster = hasDbPicks ? dbSuperstarRoster : (isUser ? currentUserRoster : dbSuperstarRoster);

        const star1 = superstarRoster ? resolvePlayerInPool(superstarRoster.star_1_id, safeNflPlayers, sport) : null;
        const star2 = superstarRoster ? resolvePlayerInPool(superstarRoster.star_2_id, safeNflPlayers, sport) : null;
        const star3 = superstarRoster ? resolvePlayerInPool(superstarRoster.star_3_id, safeNflPlayers, sport) : null;
        const superstarPlayers = [star1, star2, star3].filter(Boolean) as Competitor[];
        if (superstarPlayers.length > 0) {
          superstarsScore = superstarPlayers.reduce((s, p) => s + getPlayerLivePoints(p), 0);
        }

        // In MEGA BATTLE (Total Week): The score is driven by the user's 3 Weekly Superstars!
        // Never double-count by summing Weekly Superstars AND individual game rosters!
        if (superstarPlayers.length > 0) {
          totalScore = superstarsScore;
          slatesCount = 1;
        } else {
          // Fallback if no Weekly Superstars were drafted yet
          const gameRosters = allUserRosters.filter((r) => (r.room_code || '').toUpperCase().startsWith(`${cleanRoom}__`));
          if (gameRosters.length > 0) {
            totalScore = gameRosters.reduce((sum, r) => {
              const s1 = resolvePlayerInPool(r.star_1_id, safeNflPlayers, sport);
              const s2 = resolvePlayerInPool(r.star_2_id, safeNflPlayers, sport);
              const s3 = resolvePlayerInPool(r.star_3_id, safeNflPlayers, sport);
              return sum + [s1, s2, s3].filter(Boolean).reduce((s, p) => s + getPlayerLivePoints(p as Competitor), 0);
            }, 0);
            slatesCount = gameRosters.length;
          } else {
            totalScore = 0;
            slatesCount = 0;
          }
        }

        const slateBreakdowns: Array<{
          slateId: string;
          label: string;
          points: number;
          stars: (Competitor | null)[];
          isLocked: boolean;
        }> = [];

        if (superstarPlayers.length > 0) {
          slateBreakdowns.push({
            slateId: 'SUPERSTARS',
            label: '⭐ SUPERSTARS',
            points: superstarsScore,
            stars: [star1, star2, star3],
            isLocked: Boolean(superstarRoster?.is_locked || superstarRoster?.device_id === 'LOCKED'),
          });
        }

        allUserRosters.forEach((r) => {
          const rCode = (r.room_code || '').toUpperCase();
          if (rCode.startsWith(`${cleanRoom}__`)) {
            const rawSlateId = rCode.replace(`${cleanRoom}__`, '').replace('_', '@');
            const s1 = resolvePlayerInPool(r.star_1_id, safeNflPlayers, sport);
            const s2 = resolvePlayerInPool(r.star_2_id, safeNflPlayers, sport);
            const s3 = resolvePlayerInPool(r.star_3_id, safeNflPlayers, sport);
            const stars = [s1, s2, s3];
            const validStars = stars.filter(Boolean) as Competitor[];
            if (validStars.length > 0) {
              const pts = validStars.reduce((s, p) => s + getPlayerLivePoints(p), 0);
              slateBreakdowns.push({
                slateId: rawSlateId,
                label: `🏈 ${rawSlateId}`,
                points: pts,
                stars,
                isLocked: Boolean(r.is_locked || r.device_id === 'LOCKED'),
              });
            }
          }
        });

        if (allUserRosters.length === 0 && isUser) {
          totalScore = superstarsScore;
          slatesCount = superstarPlayers.length > 0 ? 1 : 0;
        }

        // Determine best 3 stars to display for the summary row in MEGA_TOTAL
        let displayStars: (Competitor | null)[] = [star1, star2, star3];
        let displaySlateName = '⭐ SUPERSTARS';
        if (superstarPlayers.length === 0 && slateBreakdowns.length > 0) {
          const firstWithPicks = slateBreakdowns.find((b) => b.stars.filter(Boolean).length > 0);
          if (firstWithPicks) {
            displayStars = firstWithPicks.stars;
            displaySlateName = firstWithPicks.label;
          }
        }

        return {
          userName: entryName,
          isYou: isUser,
          isLocked: Boolean(
            superstarRoster?.is_locked ||
            superstarRoster?.device_id === 'LOCKED' ||
            getSquadLockState(cleanRoom, entryName, sport)
          ),
          starPlayers: displayStars.filter(Boolean) as Competitor[],
          totalScore,
          slatesCount: Math.max(slatesCount, slateBreakdowns.length, 1),
          superstarsScore,
          stars: displayStars,
          slateBreakdowns,
          displaySlateName,
        };
      }

      // Filtered to a specific slate ('SUPERSTARS' or 'ATL@GB')
      const targetRoomCode =
        leagueSlateFilter === 'SUPERSTARS'
          ? cleanRoom
          : `${cleanRoom}__${leagueSlateFilter.replace('@', '_')}`;

      const dbRoster = effectiveRoomRosters.find(
        (r) =>
          (r.room_code || '').toUpperCase() === targetRoomCode &&
          (r.user_name || '').trim().toUpperCase() === entryName
      );
      const hasDbRosterPicks = Boolean(dbRoster && (dbRoster.star_1_id || dbRoster.star_2_id || dbRoster.star_3_id));

      const rosterEntry =
        hasDbRosterPicks
          ? dbRoster
          : (dbRoster || (isUser && leagueSlateFilter === 'SUPERSTARS' ? currentUserRoster : null));

      let star1Id = rosterEntry?.star_1_id;
      let star2Id = rosterEntry?.star_2_id;
      let star3Id = rosterEntry?.star_3_id;

      if (!star1Id && !star2Id && !star3Id) {
        try {
          const cached = localStorage.getItem(`pixel_pros_roster_${sport}_${targetRoomCode}_${entryName}`);
          if (cached) {
            const ids = JSON.parse(cached);
            if (Array.isArray(ids)) {
              star1Id = ids[0];
              star2Id = ids[1];
              star3Id = ids[2];
            }
          }
        } catch {}
      }

      const star1 = resolveCompetitorById(star1Id, safeNflPlayers, null, sport) || null;
      const star2 = resolveCompetitorById(star2Id, safeNflPlayers, null, sport) || null;
      const star3 = resolveCompetitorById(star3Id, safeNflPlayers, null, sport) || null;
      const starPlayers = [star1, star2, star3].filter(Boolean) as Competitor[];
      const sumPoints = starPlayers.reduce((sum, p) => sum + getPlayerLivePoints(p), 0);

      const isLocked = Boolean(
        rosterEntry?.is_locked ||
        rosterEntry?.device_id === 'LOCKED' ||
        getSquadLockState(targetRoomCode, entryName, sport)
      );

      return {
        userName: entryName,
        isYou: isUser,
        isLocked,
        starPlayers,
        totalScore: sumPoints,
        slatesCount: 1,
        superstarsScore: sumPoints,
        stars: [star1, star2, star3],
        slateBreakdowns: [],
        displaySlateName: leagueSlateFilter,
      };
    }).sort((a, b) => {
      if (sortBy === 'slates') {
        if (b.slatesCount !== a.slatesCount) return b.slatesCount - a.slatesCount;
      }
      return b.totalScore - a.totalScore;
    });
  }, [effectiveRoomRosters, cleanRoom, activeNormalizedName, leagueSlateFilter, safeNflPlayers, sport, currentUserRoster, sortBy, getPlayerLivePoints]);

  // Helper for rank medal styling
  const getRankBadge = (rankNumber: number) => {
    if (rankNumber === 1) {
      return 'bg-[#f59e0b] text-[#78350f] border-[#b45309]';
    }
    if (rankNumber === 2) {
      return 'bg-[#94a3b8] text-[#0f172a] border-[#64748b]';
    }
    if (rankNumber === 3) {
      return 'bg-[#b45309] text-[#fae5b8] border-[#78350f]';
    }
    return 'bg-[#1e293b] text-[#94a3b8] border-[#334155]';
  };

  const isGameRoom = leagueSlateFilter !== 'MEGA_TOTAL' && leagueSlateFilter !== 'SUPERSTARS';
  const activeGameMatch = useMemo(() => {
    if (!isGameRoom) return null;
    const cleanFilter = leagueSlateFilter.replace('_', '@').toUpperCase();
    return sortedMatches.find((m) => {
      const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
      const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
      return `${away}@${home}` === cleanFilter;
    }) || sortedMatches[0] || null;
  }, [sortedMatches, leagueSlateFilter, isGameRoom]);

  const getGameStatusDateReadout = (m: Match): string => {
    const isFinal = isMatchEnded(m);
    const isLive = m.status === 'live';

    if (isFinal) {
      let datePart = '';
      if (m.gameDate) {
        try {
          const d = new Date(m.gameDate);
          if (!isNaN(d.getTime())) {
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            datePart = `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
          }
        } catch {}
      }
      if (!datePart && m.quarter_time) {
        const cleaned = m.quarter_time.replace(/FINAL/gi, '').replace(/[•\-\/]/g, '').trim().toUpperCase();
        if (cleaned) datePart = cleaned;
      }
      if (!datePart && m.periodLabel) {
        const cleaned = m.periodLabel.replace(/FINAL/gi, '').replace(/[•\-\/]/g, '').trim().toUpperCase();
        if (cleaned) datePart = cleaned;
      }
      const pair = `${(m.awayTeamCode || '').toUpperCase()}@${(m.homeTeamCode || '').toUpperCase()}`;
      if (!datePart && (pair === 'ATL@GB' || pair === 'GB@ATL')) {
        datePart = 'THU 9/24';
      }

      // Clean out any residual "FINAL" substring in datePart to prevent any "FINAL • FINAL"
      const cleanDate = datePart.replace(/FINAL/gi, '').replace(/^[•\s\-]+|[•\s\-]+$/g, '').trim();
      return cleanDate ? `FINAL • ${cleanDate}` : 'FINAL';
    }

    if (isLive) {
      const qTime = (m.quarter_time || m.quarterTime || m.periodLabel || 'Q3 08:14')
        .toUpperCase()
        .replace(/LIVE/gi, '')
        .replace(/^[•\s\-]+|[•\s\-]+$/g, '')
        .trim();
      return `🔴 ${qTime || 'Q3'} • LIVE`;
    }

    // Upcoming: Clean date/time without "KICKOFF" or "KICKOFF •"
    let cleanTime = '';
    if (m.gameDate) {
      try {
        const d = new Date(m.gameDate);
        if (!isNaN(d.getTime())) {
          const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          const hours = d.getHours();
          const mins = d.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h12 = hours % 12 || 12;
          cleanTime = `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()} • ${h12}:${mins} ${ampm} ET`;
        }
      } catch {}
    }
    if (!cleanTime) {
      const raw = m.quarter_time || m.periodLabel || m.quarterTime || 'SUN 1:00 PM ET';
      cleanTime = raw
        .replace(/KICKOFF\s*•?\s*/gi, '')
        .replace(/^[•\s\-]+|[•\s\-]+$/g, '')
        .trim()
        .toUpperCase();
    }
    return cleanTime || 'SUN 1:00 PM ET';
  };

  return (
    <div className="leaderboard-column-wrapper w-full max-w-4xl mx-auto px-1 sm:px-3 box-border flex flex-col items-stretch space-y-2.5 sm:space-y-3">
      {/* 1. Master 4-Way Navigation Bar: [ 🏆 THIS WEEK ] [ 🏈 MATCHUPS ] [ 👑 SEASON ] [ ⭐ TOP STARS ] */}
      <div className="w-full grid grid-cols-4 gap-1 sm:gap-1.5 box-border p-1 bg-[#0b1a2e] border-2 border-[#1e3a5f] rounded-xs shadow-md">
        <button
          type="button"
          onClick={() => setViewMode('weekly')}
          className={`touch-manipulation py-1.5 sm:py-2 px-1 sm:px-2 font-pixel text-[9px] sm:text-xs rounded-xs border-2 cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 font-bold ${
            viewMode === 'weekly'
              ? 'bg-[#ca8a04] text-[#451a03] border-[#fef08a] shadow-[0_2px_0_0_#713f12]'
              : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:text-white'
          }`}
        >
          <Trophy size={13} className={viewMode === 'weekly' ? 'text-[#451a03]' : 'text-[#facc15]'} />
          <span className="truncate">THIS WEEK</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewMode('game_slates');
            setActiveTier('family');
          }}
          className={`touch-manipulation py-1.5 sm:py-2 px-1 sm:px-2 font-pixel text-[9px] sm:text-xs rounded-xs border-2 cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 font-bold ${
            viewMode === 'game_slates'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#38bdf8] shadow-[0_2px_0_0_#051a30]'
              : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:text-white'
          }`}
        >
          <Users size={13} className={viewMode === 'game_slates' ? 'text-[#38bdf8]' : 'text-[#94a3b8]'} />
          <span className="truncate">MATCHUPS</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('season')}
          className={`touch-manipulation py-1.5 sm:py-2 px-1 sm:px-2 font-pixel text-[9px] sm:text-xs rounded-xs border-2 cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 font-bold ${
            viewMode === 'season'
              ? 'bg-[#ca8a04] text-[#451a03] border-[#fef08a] shadow-[0_2px_0_0_#713f12]'
              : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:text-white'
          }`}
        >
          <Crown size={13} className={viewMode === 'season' ? 'text-[#451a03]' : 'text-[#facc15]'} />
          <span className="truncate">SEASON</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewMode('top_players');
            setActiveTier('top_scores');
          }}
          className={`touch-manipulation py-1.5 sm:py-2 px-1 sm:px-2 font-pixel text-[9px] sm:text-xs rounded-xs border-2 cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 font-bold ${
            viewMode === 'top_players'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#38bdf8] shadow-[0_2px_0_0_#051a30]'
              : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:text-white'
          }`}
        >
          <Sparkles size={13} className={viewMode === 'top_players' ? 'text-[#facc15]' : 'text-[#94a3b8]'} />
          <span className="truncate">TOP STARS</span>
        </button>
      </div>

      {/* VIEW MODE A: THIS WEEK'S MULTI-GAME PODIUM LEADERBOARD */}
      {viewMode === 'weekly' && (
        <CentralLeagueLeaderboard
          roomCode={roomCode}
          userName={userName}
          sport={sport}
          matches={matches}
          roomRosters={effectiveRoomRosters}
          competitors={safeNflPlayers}
          onSelectSlate={(slateId) => {
            handleSelectSlateFilter(slateId);
            setViewMode('game_slates');
          }}
          onOpenPlayerDetail={onOpenPlayerDetail}
        />
      )}

      {/* VIEW MODE B: SEASON RUNNING LEADERBOARD */}
      {viewMode === 'season' && (
        <SeasonLeaderboard
          roomCode={roomCode}
          userName={userName}
          sport={sport}
          matches={matches}
          roomRosters={effectiveRoomRosters}
          competitors={safeNflPlayers}
          onSelectWeek={() => {
            setViewMode('weekly');
          }}
        />
      )}

      {/* VIEW MODES C & D: SINGLE GAME SLATES OR STAR PLAYERS */}
      {viewMode !== 'weekly' && viewMode !== 'season' && (
        <>
      {/* 1. Single Clean Game Selector Bar (Flush width) */}
      <div className="w-full p-1 sm:p-1.5 bg-[#ecd7ab]/90 border-2 border-[#c99a57] rounded-xs shadow-inner box-border">
        <div className="relative flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => handleScrollStandingSlate('left')}
            className="touch-manipulation w-7 h-7 sm:w-8 sm:h-8 bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border border-[#c99a57] rounded-xs font-pixel text-xs font-bold shadow-xs active:translate-y-0.5 shrink-0 flex items-center justify-center cursor-pointer"
            title="Scroll Left"
            aria-label="Scroll Left"
          >
            <ChevronLeft size={16} className="text-[#5c3509]" />
          </button>

          <div
            ref={standingSlateScrollRef}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
          >
            {/* 🏆 ALL WEEK */}
            <button
              ref={leagueSlateFilter === 'MEGA_TOTAL' ? activeStandingSlateBtnRef : undefined}
              type="button"
              onClick={() => handleSelectSlateFilter('MEGA_TOTAL')}
              className={`touch-manipulation px-2.5 sm:px-3 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-xs ${
                leagueSlateFilter === 'MEGA_TOTAL'
                  ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-1 ring-[#38bdf8] font-bold'
                  : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
              }`}
            >
              <Trophy size={11} className="text-[#f59e0b]" />
              <span>ALL WEEK</span>
            </button>

            {/* Individual Matches in Chronological Day/Time Block & Alphabetical Order */}
            {sortedMatches.map((m) => {
              const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
              const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
              const pairKey = `${away}@${home}`;
              const isSelected = leagueSlateFilter === pairKey;
              const isFinal = isMatchEnded(m);
              const isLive = m.status === 'live';

              return (
                <button
                  key={pairKey || m.id}
                  ref={isSelected ? activeStandingSlateBtnRef : undefined}
                  type="button"
                  onClick={() => handleSelectSlateFilter(pairKey)}
                  className={`touch-manipulation px-2 sm:px-2.5 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all shrink-0 whitespace-nowrap shadow-xs flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-1 ring-[#38bdf8] font-bold'
                      : isLive
                      ? 'bg-[#ffe4e6] text-[#9f1239] border-[#fda4af]'
                      : isFinal
                      ? 'bg-[#d8c29a] text-[#5c3509] border-[#b38947]'
                      : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                  }`}
                >
                  {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shrink-0" />}
                  {isFinal && <span className="text-[8px]">🏁</span>}
                  <span>{away}@{home}</span>
                  {m.awayScore != null && m.homeScore != null && (
                    <span className="text-[8px] opacity-80 font-normal">
                      {m.awayScore}-{m.homeScore}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleScrollStandingSlate('right')}
            className="touch-manipulation w-7 h-7 sm:w-8 sm:h-8 bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border border-[#c99a57] rounded-xs font-pixel text-xs font-bold shadow-xs active:translate-y-0.5 shrink-0 flex items-center justify-center cursor-pointer"
            title="Scroll Right"
            aria-label="Scroll Right"
          >
            <ChevronRight size={16} className="text-[#5c3509]" />
          </button>

          <button
            type="button"
            onClick={() => setShowGameSelectorModal(true)}
            className="touch-manipulation px-2 py-1 bg-[#12579b] hover:bg-[#1b6ca8] text-[#fae5b8] border border-[#0a2d52] rounded-xs font-pixel text-[9px] sm:text-[10px] font-bold shadow-xs cursor-pointer shrink-0"
            title="All Games List"
          >
            ALL ▾
          </button>
        </div>
      </div>

      {/* 2. Hero Scoreboard Marquee (Flush width with Team Color Backing) */}
      {isGameRoom && activeGameMatch ? (() => {
        const awayCode = (activeGameMatch.awayTeamCode || activeGameMatch.away_team || '').trim().toUpperCase();
        const homeCode = (activeGameMatch.homeTeamCode || activeGameMatch.home_team || '').trim().toUpperCase();
        const awayPop = getTeamHelmetPopColors(awayCode);
        const homePop = getTeamHelmetPopColors(homeCode);

        return (
          <div
            className="w-full my-0 p-2 sm:p-4 bg-[#0b1a2e] border-2 border-[#1e3a5f] rounded-lg shadow-lg text-[#fae5b8] box-border relative overflow-hidden"
            style={{
              background: `linear-gradient(90deg, ${awayPop.background}30 0%, #0b1a2e 38%, #0b1a2e 62%, ${homePop.background}30 100%)`
            }}
          >
            <div className="flex items-center justify-between relative z-10 w-full">
              {/* Away Team (Left): High-contrast pop color pedestal */}
              <div className="flex flex-col items-center justify-center w-16 sm:w-24 shrink-0 text-center">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-md flex items-center justify-center border-2 shadow-md relative"
                  style={{
                    backgroundColor: awayPop.background,
                    borderColor: awayPop.border,
                    boxShadow: `0 3px 0 0 #000000, 0 0 12px ${awayPop.background}50`
                  }}
                >
                  <PixelHelmet teamCode={awayCode} size={42} />
                </div>
                <span
                  className="mt-1 font-pixel text-[9px] sm:text-xs font-bold tracking-wider px-1.5 py-0.5 rounded-2xs border"
                  style={{
                    backgroundColor: '#080d1a',
                    borderColor: awayPop.border,
                    color: '#ffffff'
                  }}
                >
                  {awayCode}
                </span>
              </div>

              {/* Center Score Readout: ALWAYS on one single horizontal line */}
              <div className="flex-1 flex flex-col items-center justify-center px-1 sm:px-2 text-center min-w-0">
                <div className="font-pixel text-[22px] xs:text-[28px] sm:text-[38px] md:text-[44px] leading-none font-bold tracking-wider text-[#fde047] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] whitespace-nowrap">
                  {activeGameMatch.awayScore ?? activeGameMatch.away_score ?? 0} - {activeGameMatch.homeScore ?? activeGameMatch.home_score ?? 0}
                </div>
                <div className="mt-1 font-pixel text-[9px] sm:text-[11px] text-[#fae5b8] tracking-wide uppercase font-bold flex items-center justify-center gap-1.5 whitespace-nowrap">
                  {getGameStatusDateReadout(activeGameMatch)}
                </div>
              </div>

              {/* Home Team (Right): High-contrast pop color pedestal facing inward */}
              <div className="flex flex-col items-center justify-center w-16 sm:w-24 shrink-0 text-center">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-md flex items-center justify-center border-2 shadow-md relative"
                  style={{
                    backgroundColor: homePop.background,
                    borderColor: homePop.border,
                    boxShadow: `0 3px 0 0 #000000, 0 0 12px ${homePop.background}50`
                  }}
                >
                  <div style={{ transform: 'scaleX(-1)' }}>
                    <PixelHelmet teamCode={homeCode} size={42} />
                  </div>
                </div>
                <span
                  className="mt-1 font-pixel text-[9px] sm:text-xs font-bold tracking-wider px-1.5 py-0.5 rounded-2xs border"
                  style={{
                    backgroundColor: '#080d1a',
                    borderColor: homePop.border,
                    color: '#ffffff'
                  }}
                >
                  {homeCode}
                </span>
              </div>
            </div>
          </div>
        );
      })() : (
        <div className="w-full my-0 p-2.5 sm:p-4 bg-[#0b1a2e] border-2 border-[#1e3a5f] rounded-lg shadow-lg text-[#fae5b8] box-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center justify-center w-16 sm:w-24 shrink-0 text-center">
              <span className="text-2xl sm:text-4xl select-none">🏆</span>
              <span className="mt-0.5 font-pixel text-[9px] sm:text-xs font-bold tracking-wider text-[#fde047]">
                ALL WEEK
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-1 text-center">
              <div className="font-pixel text-[22px] sm:text-[32px] leading-tight font-bold tracking-wider text-[#fde047] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                MEGA BATTLE
              </div>
              <div className="mt-0.5 font-pixel text-[9px] sm:text-[10px] text-[#93c5fd] tracking-wide uppercase font-bold">
                ALL GAMES TOTAL
              </div>
            </div>

            <div className="flex flex-col items-center justify-center w-16 sm:w-24 shrink-0 text-center">
              <span className="text-2xl sm:text-4xl select-none">👑</span>
              <span className="mt-0.5 font-pixel text-[9px] sm:text-xs font-bold tracking-wider text-[#fde047]">
                LEADER
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Mode Toggle: Centered [ 👥 FAMILY ] and [ ✨ TOP SCORES ] (Flush width) */}
      <div className="w-full flex justify-center gap-2.5 sm:gap-3 box-border">
        <button
          onClick={() => setActiveTier('family')}
          className={`touch-manipulation flex-1 py-2 sm:py-2.5 px-3 sm:px-5 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2 rounded-t-xs ${
            activeTier === 'family'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          <Users size={16} />
          <span>FAMILY</span>
        </button>

        <button
          onClick={() => setActiveTier('top_scores')}
          className={`touch-manipulation flex-1 py-2 sm:py-2.5 px-3 sm:px-5 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2 rounded-t-xs ${
            activeTier === 'top_scores'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          <Sparkles size={16} />
          <span>TOP SCORES</span>
        </button>
      </div>

      {/* 4. Standings Container (Flush width) */}
      <div className="pixel-box-cream p-3 sm:p-5 rounded-xs w-full overflow-hidden box-border">
        
        {/* Tier Subheader Banner */}
        <div className="flex items-center justify-between pb-2 sm:pb-2.5 mb-2 border-b-2 border-[#d4a86a]">
          <div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
              {activeTier === 'family' ? 'STANDINGS' : 'TOP PLAYERS'}
            </h2>
          </div>

          <span className="font-pixel text-[10px] sm:text-[11px] text-[#12579b] bg-[#fae9c8] px-2 py-0.5 border border-[#d4a86a] rounded-xs shrink-0 whitespace-nowrap font-bold">
            {activeTier === 'family'
              ? `${familyListWithDynamicTotals.length === 1 ? '1 SQUAD' : `${familyListWithDynamicTotals.length} SQUADS`}`
              : `${top20Players.length} STARS`}
          </span>
        </div>

        {/* Arcade Top 3 Podium Showcase - Only show when points are scored */}
        {activeTier === 'family' && familyListWithDynamicTotals.length >= 2 && (() => {
          const topScore = familyListWithDynamicTotals[0]?.totalScore || 0;
          if (topScore <= 0) return null; // Clean mobile: skip pre-game 0pt podium clutter
          const isPodiumZeroPts = false;

          return (
            <div className="mb-3 p-2.5 sm:p-3 bg-linear-to-b from-[#10223f] to-[#0a1628] border-2 border-[#38bdf8] rounded-xs shadow-[0_4px_0_0_#051a30] text-[#fae5b8]">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#38bdf8]/30">
                <div className="flex items-center gap-1.5 font-pixel text-[10px] sm:text-xs text-[#fde047] font-bold">
                  <Trophy size={14} className="text-[#facc15]" />
                  <span>PODIUM</span>
                </div>
                <span className="font-retro text-[10px] text-[#93c5fd]">
                  TOP 3
                </span>
              </div>

              {/* 3 Pedestals: 2nd (left), 1st (center, tallest), 3rd (right) */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 items-end pt-1">
                {/* 🥈 #2 Silver */}
                {familyListWithDynamicTotals[1] && (
                  <div
                    onClick={() => setExpandedSquadName((prev) => (prev === familyListWithDynamicTotals[1].userName ? null : familyListWithDynamicTotals[1].userName))}
                    className="flex flex-col items-center p-1.5 bg-[#1e293b] hover:bg-[#334155] border-2 border-[#94a3b8] rounded-xs cursor-pointer transition-transform active:scale-95 text-center min-h-[92px] justify-between shadow-xs"
                  >
                    <div className="font-pixel text-[9px] sm:text-[10px] text-[#cbd5e1] font-bold flex items-center gap-0.5">
                      <span>🥈</span> #2
                    </div>
                    <div className="my-0.5">
                      <div className="font-pixel text-[10px] sm:text-xs text-white truncate max-w-[85px] sm:max-w-[110px] font-bold">
                        {familyListWithDynamicTotals[1].userName}
                      </div>
                      <div className="font-pixel text-xs sm:text-sm text-[#facc15] font-bold">
                        {Math.round(familyListWithDynamicTotals[1].totalScore)}p
                      </div>
                    </div>
                    <div className="text-[8px] font-retro text-[#94a3b8]">
                      {isPodiumZeroPts || Math.round(familyListWithDynamicTotals[0].totalScore - familyListWithDynamicTotals[1].totalScore) === 0
                        ? 'TIED'
                        : `-${Math.round(familyListWithDynamicTotals[0].totalScore - familyListWithDynamicTotals[1].totalScore)}p`}
                    </div>
                  </div>
                )}

                {/* 🥇 #1 Gold (TALLEST / HIGHLIGHTED) */}
                {familyListWithDynamicTotals[0] && (
                  <div
                    onClick={() => setExpandedSquadName((prev) => (prev === familyListWithDynamicTotals[0].userName ? null : familyListWithDynamicTotals[0].userName))}
                    className={`flex flex-col items-center p-2 rounded-xs cursor-pointer transition-transform active:scale-95 text-center min-h-[114px] sm:min-h-[120px] justify-between relative ${
                      isPodiumZeroPts
                        ? 'bg-[#1e293b] hover:bg-[#334155] border-2 border-[#cbd5e1] shadow-xs'
                        : 'bg-[#854d0e]/95 hover:bg-[#a16207] border-2 border-[#fde047] shadow-[0_0_16px_rgba(250,204,21,0.45)] ring-2 ring-[#facc15]/60'
                    }`}
                  >
                    {!isPodiumZeroPts && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm select-none animate-bounce">
                        👑
                      </div>
                    )}
                    <div className="font-pixel text-[10px] sm:text-xs text-[#fef08a] font-bold flex items-center gap-1">
                      {isPodiumZeroPts ? (
                        <span>PRE-GAME</span>
                      ) : (
                        <>
                          <span>🥇</span> {isGameRoom ? '#1 WINNER' : '#1 LEADER'}
                        </>
                      )}
                    </div>
                    <div className="my-0.5">
                      <div className="font-pixel text-xs sm:text-sm text-white truncate max-w-[95px] sm:max-w-[125px] font-bold">
                        {familyListWithDynamicTotals[0].userName}
                      </div>
                      <div className="font-pixel text-sm sm:text-base text-[#fde047] font-bold">
                        {Math.round(familyListWithDynamicTotals[0].totalScore)}p
                      </div>
                    </div>
                    <div className={`text-[8px] font-pixel px-1.5 py-0.5 rounded-2xs font-bold ${
                      isPodiumZeroPts ? 'text-[#cbd5e1] bg-[#0f172a]' : 'text-[#fef08a] bg-[#713f12]'
                    }`}>
                      {isPodiumZeroPts ? 'TIED (0 PTS)' : '1ST PLACE'}
                    </div>
                  </div>
                )}

                {/* 🥉 #3 Bronze */}
                {familyListWithDynamicTotals[2] ? (
                  <div
                    onClick={() => setExpandedSquadName((prev) => (prev === familyListWithDynamicTotals[2].userName ? null : familyListWithDynamicTotals[2].userName))}
                    className="flex flex-col items-center p-1.5 bg-[#1e293b] hover:bg-[#334155] border-2 border-[#b45309] rounded-xs cursor-pointer transition-transform active:scale-95 text-center min-h-[85px] justify-between shadow-xs"
                  >
                    <div className="font-pixel text-[9px] sm:text-[10px] text-[#fed7aa] font-bold flex items-center gap-0.5">
                      <span>🥉</span> #3
                    </div>
                    <div className="my-0.5">
                      <div className="font-pixel text-[10px] sm:text-xs text-white truncate max-w-[85px] sm:max-w-[110px] font-bold">
                        {familyListWithDynamicTotals[2].userName}
                      </div>
                      <div className="font-pixel text-xs sm:text-sm text-[#facc15] font-bold">
                        {Math.round(familyListWithDynamicTotals[2].totalScore)}p
                      </div>
                    </div>
                    <div className="text-[8px] font-retro text-[#cbd5e1]">
                      {isPodiumZeroPts || Math.round(familyListWithDynamicTotals[0].totalScore - familyListWithDynamicTotals[2].totalScore) === 0
                        ? 'TIED'
                        : `-${Math.round(familyListWithDynamicTotals[0].totalScore - familyListWithDynamicTotals[2].totalScore)}p`}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-1.5 bg-[#1e293b]/40 border-2 border-dashed border-[#475569] rounded-xs min-h-[85px] text-center">
                    <span className="font-pixel text-[8px] text-[#64748b]">OPEN SPOT</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Pre-kickoff informational banner when games have not started yet */}
        {activeTier === 'top_scores' && !hasAnyLiveScoring && (
          <div className="mb-2 p-1.5 bg-[#faebd0] border border-[#c99a57] rounded-xs text-center shadow-2xs">
            <div className="font-pixel text-[10px] sm:text-xs text-[#5c3509] font-bold flex items-center justify-center gap-1.5">
              <span>⏱️</span>
              <span>WAIT UNTIL KICKOFF!</span>
            </div>
          </div>
        )}

        {/* 2-Column Table Column Headers */}
        <div className="flex items-center justify-between px-2.5 sm:px-3 py-1 mb-1.5 bg-[#d4a86a]/30 border border-[#d4a86a] rounded-xs font-pixel text-[10px] text-[#784610]">
          <span className="tracking-wider">{activeTier === 'family' ? 'SQUAD' : 'PLAYER'}</span>
          <span className="tracking-wider text-right">PTS</span>
        </div>

        {/* List Content */}
        <div className="space-y-2 w-full">
          {activeTier === 'family' ? (
            /* TIER 1: FAMILY RANKING (Dynamic sum of chosen 3 Stars) */
            familyListWithDynamicTotals.length === 0 ? (
              <div className="p-6 sm:p-8 text-center border-2 border-dashed border-[#c99a57] rounded-xs bg-[#fae9c8]/50 flex flex-col items-center justify-center">
                <span className="text-2xl mb-2">{sport === 'nba' ? '🏀' : '🏈'}</span>
                <p className="font-pixel text-xs sm:text-sm text-[#5c3509] mb-1">NO SQUADS IN ROOM "{cleanRoom}" YET</p>
                <p className="font-retro text-xs text-[#784610]">Create your first squad to start the household competition!</p>
              </div>
            ) : (
              familyListWithDynamicTotals.map((entry, index) => {
                const displayRank = index + 1;
                const isUser = entry.isYou;
                const isExpanded = expandedSquadName === entry.userName;

                return (
                  <div
                    key={entry.userName}
                    className={`w-full border-2 rounded-xs transition-all box-border overflow-hidden ${
                      isUser
                        ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-[0_3px_0_0_#051a30]'
                        : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57]'
                    }`}
                  >
                    {/* Main Row: Click to toggle expand */}
                    <div
                      onClick={() => setExpandedSquadName((prev) => (prev === entry.userName ? null : entry.userName))}
                      className="w-full p-2 sm:p-2.5 cursor-pointer select-none"
                    >
                      {/* Top Line: Rank + Helmet + Squad Name on Left; Score + Chevron on Right */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Rank Badge */}
                          <span
                            className={`font-pixel text-[10px] sm:text-xs px-1.5 py-0.5 border rounded-xs shrink-0 font-bold ${getRankBadge(
                              displayRank
                            )}`}
                          >
                            #{displayRank}
                          </span>

                          {/* Helmet / Ball */}
                          <div className="shrink-0">
                            {sport === 'nfl' ? (
                              <PixelHelmet
                                teamCode={entry.stars.find((s) => s?.teamCode)?.teamCode || 'KC'}
                                size={22}
                                className="shrink-0"
                              />
                            ) : (
                              <span className="text-base select-none">🏀</span>
                            )}
                          </div>

                          {/* Name + You / Locked Badges */}
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <span className="font-pixel text-xs sm:text-sm tracking-wide truncate font-bold">
                              {entry.userName}
                            </span>
                            {isUser && (
                              <span className="font-pixel text-[8px] px-1 py-0.2 bg-[#fde047] text-[#78350f] border border-[#b45309] rounded-2xs shrink-0 font-bold">
                                YOU
                              </span>
                            )}
                            {entry.isLocked && (
                              <span className="text-xs shrink-0" title="Locked Lineup">
                                🔒
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Total Points + Chevron */}
                        <div className="shrink-0 flex items-center gap-1.5 ml-1">
                          <div
                            className={`px-2 py-0.5 font-pixel text-xs sm:text-sm font-bold border rounded-xs shadow-xs text-right whitespace-nowrap ${
                              isUser
                                ? 'bg-[#38bdf8] text-[#080d1a] border-[#0284c7]'
                                : 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                            }`}
                          >
                            {Math.round(entry.totalScore)} PTS
                          </div>
                          <div className="text-current opacity-70">
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Line: Clean, prominent stars summary badges */}
                      <div className="mt-1.5 pl-6 sm:pl-7 flex flex-wrap items-center gap-1.5">
                        {entry.stars.filter(Boolean).length > 0 ? (
                          <>
                            {entry.stars.filter(Boolean).map((s) => {
                              const pts = Math.round(getPlayerLivePoints(s!));
                              return (
                                <span
                                  key={s!.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenPlayerDetail && onOpenPlayerDetail(s!);
                                  }}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs font-pixel text-[9px] sm:text-[10px] border font-bold cursor-pointer transition-colors ${
                                    isUser
                                      ? 'bg-[#0f4370] hover:bg-[#1a5b94] text-[#fae5b8] border-[#38bdf8]/60'
                                      : 'bg-[#faebd0] hover:bg-white text-[#5c3509] border-[#c99a57]'
                                  }`}
                                >
                                  <span className="text-[#facc15]">★</span>
                                  <span>{formatPlayerInitialLastName(s!.displayName)}</span>
                                  <span className="opacity-75 text-[8px]">({s!.teamCode}·{s!.position})</span>
                                  <span className={isUser ? 'text-[#38bdf8]' : 'text-[#12579b]'}>{pts}p</span>
                                </span>
                              );
                            })}
                            {leagueSlateFilter === 'MEGA_TOTAL' && (entry.slateBreakdowns?.length || 0) > 1 && (
                              <span className="text-[8px] font-pixel opacity-75 self-center">
                                +{(entry.slateBreakdowns?.length || 1) - 1} more game{((entry.slateBreakdowns?.length || 1) - 1) > 1 ? 's' : ''}
                              </span>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Expandable Squad Details Drawer */}
                    {isExpanded && (
                      <div className={`p-2 sm:p-2.5 border-t-2 ${isUser ? 'bg-[#0e4475] border-[#38bdf8]/40' : 'bg-[#f7edd9] border-[#c99a57]'}`}>
                        <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-current/20">
                          <span className="font-pixel text-[9px] sm:text-[10px] font-bold tracking-wide uppercase">
                            LINEUP ({entry.stars.filter(Boolean).length}/3)
                          </span>
                          {onSelectSquad && (
                            <button
                              type="button"
                              onClick={() => onSelectSquad(entry.userName)}
                              className="touch-manipulation px-2 py-0.5 bg-[#facc15] hover:bg-[#fde047] text-[#451a03] font-pixel text-[8px] sm:text-[9px] font-bold rounded-2xs border border-[#ca8a04] cursor-pointer shadow-xs active:translate-y-0.5 flex items-center gap-1"
                            >
                              <span>{isUser ? 'EDIT ROSTER ➔' : `SWITCH ➔`}</span>
                            </button>
                          )}
                        </div>

                        {/* 3 Stars Detailed Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
                          {[0, 1, 2].map((idx) => {
                            const star = entry.stars[idx];
                            if (!star) {
                              return (
                                <div
                                  key={idx}
                                  className="p-2 bg-[#ebd2a4]/50 border border-dashed border-[#c99a57] rounded-xs text-center flex flex-col items-center justify-center min-h-[60px]"
                                >
                                  <span className="font-pixel text-[9px] text-[#784610]/70">★ STAR {idx + 1}: EMPTY</span>
                                </div>
                              );
                            }

                            const livePts = getPlayerLivePoints(star);
                            return (
                              <div
                                key={star.id || idx}
                                onClick={() => onOpenPlayerDetail && onOpenPlayerDetail(star)}
                                className="p-1.5 sm:p-2 bg-[#fae5b8] text-[#5c3509] border border-[#c99a57] rounded-xs cursor-pointer hover:bg-white transition-colors flex items-center justify-between gap-1.5 shadow-2xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-pixel text-[10px] sm:text-xs font-bold truncate">
                                    {star.displayName}
                                  </div>
                                  <div className="font-retro text-[9px] text-[#784610] font-bold">
                                    #{star.uniformNumber} · {star.teamCode} · {star.position}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-pixel text-xs sm:text-sm font-bold text-[#12579b]">
                                    {livePts}p
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* In MEGA_TOTAL: Game Slates Breakdown list */}
                        {leagueSlateFilter === 'MEGA_TOTAL' && entry.slateBreakdowns && entry.slateBreakdowns.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-current/15">
                            <div className="font-pixel text-[9px] sm:text-[10px] font-bold mb-1.5 opacity-90">
                              🏈 GAMES CONTRIBUTING TO TOTAL:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {entry.slateBreakdowns.map((sb) => (
                                <button
                                  key={sb.slateId}
                                  type="button"
                                  onClick={() => setLeagueSlateFilter(sb.slateId)}
                                  className="touch-manipulation px-2 py-1 bg-[#faebd0] hover:bg-white text-[#5c3509] border border-[#c99a57] rounded-2xs font-pixel text-[8px] sm:text-[9px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title={`Tap to jump to ${sb.label} standings`}
                                >
                                  <span>{sb.label}:</span>
                                  <span className="text-[#12579b]">{Math.round(sb.points)}p</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
          /* TIER 2: TOP SCORES (Top 20 Real NFL Athletes from competitors table) */
            top20Players.map((player, index) => {
              const displayRank = index + 1;
              const { firstName, lastName } = splitPlayerFirstLastName(player.displayName);
              const teamPosSubtitle = formatTeamPosSubtitle(player.teamCode, player.position || player.positionGeneric);

              // Find all members in the current room who picked this athlete
              const pickedByUsers: string[] = [];
              familyListWithDynamicTotals.forEach((fam) => {
                const hasPlayer = fam.stars.some(
                  (s) =>
                    s &&
                    (s.id.toLowerCase() === player.id.toLowerCase() ||
                      s.shortName.toLowerCase() === player.shortName.toLowerCase())
                );
                if (hasPlayer) {
                  pickedByUsers.push(formatPickedByName(fam.userName));
                }
              });
              const pickedByLabel = pickedByUsers.join(' & ');

              return (
                <div
                  key={player.id || index}
                  onClick={() => onOpenPlayerDetail && onOpenPlayerDetail(player)}
                  className="w-full flex items-center justify-between p-2 sm:p-2.5 bg-[#ebd2a4] hover:bg-[#fae9c8] text-[#5c3509] border-2 border-[#c99a57] rounded-xs cursor-pointer transition-all active:translate-y-0.5 box-border"
                >
                  {/* Column 1: Rank Badge + Sprite + Stacked Name + [TEAM] · [POS] */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
                    {/* Rank Badge */}
                    <span
                      className={`font-pixel text-[10px] sm:text-xs px-2 py-0.5 border rounded-xs shrink-0 font-bold ${getRankBadge(
                        displayRank
                      )}`}
                    >
                      #{displayRank}
                    </span>

                    {/* Sprite */}
                    <div className="shrink-0">
                      {(() => {
                        const playerMatch = findMatchForPlayer(player, matches);
                        const visualAvatar = getPlayerVisualAvatar(player, playerMatch);
                        const livePts = getPlayerLivePoints(player);
                        return (
                          <PixelPlayerSprite
                            avatar={visualAvatar}
                            number={visualAvatar.number}
                            size="sm"
                            withShadow={false}
                            sport={sport}
                            isOnFire={sport === 'nba' && livePts >= 40}
                          />
                        );
                      })()}
                    </div>

                    {/* Stacked Name + (TEAM · POS) + Picked By Arcade Tag */}
                    <div className="min-w-0 flex-1">
                      <div className="leading-tight">
                        {firstName && (
                          <div className="font-pixel text-[9px] sm:text-[10px] text-[#784610] uppercase opacity-85">
                            {firstName}
                          </div>
                        )}
                        <div className="font-pixel text-xs sm:text-sm text-[#451a03] font-bold uppercase tracking-wide break-words">
                          {lastName}
                        </div>
                      </div>
                      <div className="font-retro text-[10px] sm:text-[11px] text-[#784610] mt-0.5">
                        {teamPosSubtitle} • #{player.uniformNumber}
                      </div>

                      {/* Arcade Tag: 🏷️ Picked by [User Name] */}
                      {pickedByUsers.length > 0 && (
                        <div className="mt-1 flex items-center">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#fef3c7] text-[#92400e] border border-[#f59e0b] font-pixel text-[8px] sm:text-[9px] rounded-2xs shadow-2xs font-bold whitespace-nowrap">
                            🏷️ Picked by {pickedByLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Total Points Right-Aligned */}
                  <div className="shrink-0 whitespace-nowrap ml-2">
                    <div className="px-2.5 py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm font-bold border border-[#0a2d52] shadow-xs rounded-xs text-right whitespace-nowrap">
                      {(() => {
                        const pts = getPlayerLivePoints(player);
                        return pts ? `${pts.toLocaleString()} PTS` : '0 PTS';
                      })()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
      </>
      )}

      {/* Game Selector Hub Modal */}
      {showGameSelectorModal && (
        <div className="fixed inset-0 z-50 bg-[#080d1a]/85 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#faebd0] border-4 border-[#1a2238] rounded-xs max-w-lg w-full max-h-[85vh] flex flex-col shadow-[0_8px_0_0_#0a0f1d] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-3 bg-[#12579b] text-[#fae5b8] border-b-2 border-[#0a2d52] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base select-none">🏈</span>
                <h3 className="font-pixel text-xs sm:text-sm font-bold tracking-wide truncate">
                  ALL MATCHUPS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGameSelectorModal(false)}
                className="w-7 h-7 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs rounded-2xs flex items-center justify-center cursor-pointer border border-[#7f1d1d] shadow-2xs active:translate-y-0.5 shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-3 overflow-y-auto space-y-3 flex-1 max-h-[60vh]">
              {/* Total Week Option */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectSlateFilter('MEGA_TOTAL');
                    setShowGameSelectorModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xs border-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    leagueSlateFilter === 'MEGA_TOTAL'
                      ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] shadow-xs'
                      : 'bg-[#fef3c7] hover:bg-[#fde68a] text-[#78350f] border-[#f59e0b]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <div>
                      <div className="font-pixel text-xs font-bold">ALL WEEK (TOTAL)</div>
                      <div className="font-retro text-[10px] opacity-80">All 16 Games + Superstars Combined</div>
                    </div>
                  </div>
                  <span className="font-pixel text-[9px] bg-[#f59e0b] text-[#78350f] px-2 py-0.5 rounded-2xs font-bold">
                    OVERALL
                  </span>
                </button>
              </div>

              {/* 1. Finished Games (Finals) */}
              {(() => {
                const finals = sortedMatches.filter((m) => isMatchEnded(m));
                if (finals.length === 0) return null;
                return (
                  <div>
                    <div className="font-pixel text-[10px] text-[#5c3509] font-bold mb-1 flex items-center gap-1">
                      <span>🏁</span>
                      <span>FINAL GAMES</span>
                    </div>
                    <div className="space-y-1.5">
                      {finals.map((m) => {
                        const away = (m.awayTeamCode || m.away_team || '').toUpperCase();
                        const home = (m.homeTeamCode || m.home_team || '').toUpperCase();
                        const pairKey = `${away}@${home}`;
                        const isSelected = leagueSlateFilter === pairKey;
                        const winnerSummary = computeGameRoomStandings(
                          pairKey,
                          cleanRoom,
                          effectiveRoomRosters,
                          safeNflPlayers,
                          matches,
                          sport
                        );

                        return (
                          <button
                            key={pairKey}
                            type="button"
                            onClick={() => {
                              handleSelectSlateFilter(pairKey);
                              setShowGameSelectorModal(false);
                            }}
                            className={`w-full p-2.5 rounded-xs border-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] shadow-xs'
                                : 'bg-[#faebd0] hover:bg-white text-[#5c3509] border-[#c99a57]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-pixel text-xs font-bold flex items-center gap-1.5">
                                <span>{away} {m.awayScore != null ? m.awayScore : 0} @ {home} {m.homeScore != null ? m.homeScore : 0}</span>
                                <span className="text-[8px] bg-[#475569] text-white px-1 rounded-2xs font-normal">FINAL</span>
                              </div>
                              <div className="font-retro text-[11px] text-[#784610] mt-0.5 truncate">
                                {winnerSummary.hasPicks ? (
                                  <span className="text-[#15803d] font-bold">
                                    👑 {winnerSummary.leaderName} won with {winnerSummary.leaderScore} pts!
                                  </span>
                                ) : (
                                  <span className="opacity-70">No family picks recorded</span>
                                )}
                              </div>
                            </div>
                            <span className="font-pixel text-[9px] text-[#12579b] bg-[#e0f2fe] px-2 py-1 rounded-2xs shrink-0 font-bold border border-[#bae6fd]">
                              VIEW STANDINGS →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 2. Live Games */}
              {(() => {
                const liveGames = sortedMatches.filter((m) => m.status === 'live');
                if (liveGames.length === 0) return null;
                return (
                  <div>
                    <div className="font-pixel text-[10px] text-[#b91c1c] font-bold mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                      <span>LIVE IN PROGRESS</span>
                    </div>
                    <div className="space-y-1.5">
                      {liveGames.map((m) => {
                        const away = (m.awayTeamCode || m.away_team || '').toUpperCase();
                        const home = (m.homeTeamCode || m.home_team || '').toUpperCase();
                        const pairKey = `${away}@${home}`;
                        const isSelected = leagueSlateFilter === pairKey;
                        const winnerSummary = computeGameRoomStandings(
                          pairKey,
                          cleanRoom,
                          effectiveRoomRosters,
                          safeNflPlayers,
                          matches,
                          sport
                        );

                        return (
                          <button
                            key={pairKey}
                            type="button"
                            onClick={() => {
                              handleSelectSlateFilter(pairKey);
                              setShowGameSelectorModal(false);
                            }}
                            className={`w-full p-2.5 rounded-xs border-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] shadow-xs'
                                : 'bg-[#ffe4e6] hover:bg-[#fecdd3] text-[#9f1239] border-[#fda4af]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-pixel text-xs font-bold flex items-center gap-1.5">
                                <span>{away} {m.awayScore != null ? m.awayScore : 0} @ {home} {m.homeScore != null ? m.homeScore : 0}</span>
                                <span className="text-[8px] bg-red-600 text-white px-1 rounded-2xs animate-pulse font-normal">LIVE</span>
                              </div>
                              <div className="font-retro text-[11px] mt-0.5 truncate">
                                {winnerSummary.hasPicks ? (
                                  <span className="font-bold text-[#991b1b]">
                                    👑 {winnerSummary.leaderName} leading ({winnerSummary.leaderScore} pts)
                                  </span>
                                ) : (
                                  <span className="opacity-70">No family picks recorded</span>
                                )}
                              </div>
                            </div>
                            <span className="font-pixel text-[9px] text-[#991b1b] bg-white px-2 py-1 rounded-2xs shrink-0 font-bold border border-[#fca5a5]">
                              VIEW LIVE →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 3. Upcoming Games */}
              {(() => {
                const upcoming = sortedMatches.filter((m) => !isMatchEnded(m) && m.status !== 'live');
                if (upcoming.length === 0) return null;
                return (
                  <div>
                    <div className="font-pixel text-[10px] text-[#5c3509] font-bold mb-1 flex items-center gap-1">
                      <span>⏳</span>
                      <span>UPCOMING GAMES (SCHEDULE & LINEUPS)</span>
                    </div>
                    <div className="space-y-1.5">
                      {upcoming.map((m) => {
                        const away = (m.awayTeamCode || m.away_team || '').toUpperCase();
                        const home = (m.homeTeamCode || m.home_team || '').toUpperCase();
                        const pairKey = `${away}@${home}`;
                        const isSelected = leagueSlateFilter === pairKey;

                        return (
                          <button
                            key={pairKey}
                            type="button"
                            onClick={() => {
                              handleSelectSlateFilter(pairKey);
                              setShowGameSelectorModal(false);
                            }}
                            className={`w-full p-2.5 rounded-xs border-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] shadow-xs'
                                : 'bg-[#faebd0] hover:bg-white text-[#5c3509] border-[#c99a57]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-pixel text-xs font-bold">
                                {away} @ {home}
                              </div>
                              <div className="font-retro text-[10px] text-[#784610] mt-0.5">
                                {m.quarter_time || m.periodLabel || 'Upcoming'}
                              </div>
                            </div>
                            <span className="font-pixel text-[9px] text-[#5c3509] bg-[#fae5b8] px-2 py-1 rounded-2xs shrink-0 font-bold border border-[#c99a57]">
                              SELECT →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-2.5 bg-[#ecd7ab] border-t-2 border-[#c99a57] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowGameSelectorModal(false)}
                className="px-4 py-1.5 bg-[#12579b] hover:bg-[#1a6cb8] text-white font-pixel text-xs rounded-xs border border-[#0a2d52] font-bold cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
