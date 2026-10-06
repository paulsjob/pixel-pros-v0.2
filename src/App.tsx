import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { INITIAL_USER } from './data/mockData';
import { Competitor, UserProfile, Match, UserRoster, ActiveSlot, SquadSlots, SportId } from './types';
import {
  resetRoomRosters,
  subscribeToRealtimeScores,
  subscribeToRoomRosters,
  fetchLiveCompetitors,
  deduplicateCompetitors,
  fetchLiveMatches,
  upsertUserRoster,
  fetchRoomRosters,
  deleteUserRoster,
  getSquadLockState,
  setSquadLockState,
  toggleSquadLock,
  isGhostUser,
  fetchAllActiveRooms,
  registerActiveRoom,
  registerActiveUser,
  archiveRoom,
  unarchiveRoom,
  ActiveRoomSummary,
  resolveSupabaseAnonKey,
  setCustomSupabaseKey,
  checkSupabaseConfigured,
  clearClientAllWeekPicks,
} from './lib/supabaseClient';
import { MyTeamView } from './components/MyTeamView';

import { getBaseSeasonRoom, resolveCompetitorById, DEFAULT_NFL_MATCHES, DEFAULT_NFL_COMPETITORS, sortMatchesByKickoffAndStatus, getPlayerScoringDisplay, isPositionAllowedForSlot } from './utils/teamData';

export function getCorrectSlotForPlayer(player: Competitor, sport: SportId = 'nfl'): ActiveSlot {
  if (sport !== 'nfl') return 'star1';
  if (isPositionAllowedForSlot('star1', player, 'nfl')) return 'star1';
  if (isPositionAllowedForSlot('star2', player, 'nfl')) return 'star2';
  if (isPositionAllowedForSlot('star3', player, 'nfl')) return 'star3';
  return 'star1';
}

export function getEffectiveRoomCodeForSlate(rCode: string, slateId?: string): string {
  const base = getBaseSeasonRoom(rCode || 'COUCH');
  if (!slateId || slateId === 'SUPERSTARS' || slateId === 'ALL') {
    return base;
  }
  return `${base}__${slateId.replace('@', '_')}`;
}
import { LeaderboardView } from './components/LeaderboardView';
import { SimpleRulesView } from './components/SimpleRulesView';
import { PlayerCardModal } from './components/PlayerCardModal';
import { PlayerPickerModal } from './components/PlayerPickerModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PixelHelmet } from './components/PixelHelmet';
import { PixelShieldIcon } from './components/PixelBadges';
import { SportSwitcher } from './components/SportSwitcher';
import { CommissionerModal } from './components/CommissionerModal';
import { copyToClipboard } from './utils/clipboard';
import { getCurrentNFLWeek, syncESPNData } from './lib/espnSync';
import { executeCompleteWeeklyRescan, isWeeklyRescanDue } from './lib/rescanEngine';
import { DEFAULT_NBA_MATCHES, DEFAULT_NBA_COMPETITORS } from './utils/nbaTeamData';
import { ROSTER_CACHE_VERSION } from './data/nflRosterManifest';
import { Users, Trophy, HelpCircle, Share2, ShieldAlert, Plus, X } from 'lucide-react';
import { useDeviceMode } from './utils/useDeviceMode';

export default function App() {
  const { isMobile, isDesktop, deviceMode, setManualOverride } = useDeviceMode();
  const [currentSport, setCurrentSport] = useState<SportId>(() => {
    try {
      const saved = localStorage.getItem('pixel_pros_sport');
      if (saved === 'nba' || saved === 'nfl') return saved;
    } catch {}
    return 'nfl';
  });

  const [currentTab, setCurrentTab] = useState<'squad' | 'couch'>('squad');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCommissionerOpen, setIsCommissionerOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room') || params.get('r');
      if (urlRoom && urlRoom.trim()) {
        return getBaseSeasonRoom(urlRoom.trim().toUpperCase());
      }
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      const saved = localStorage.getItem(`pixel_pros_room_code_${sport}`);
      return getBaseSeasonRoom(saved || (sport === 'nba' ? 'HOOPS' : 'COUCH'));
    } catch {
      return 'COUCH';
    }
  });

  const [userName, setUserName] = useState<string>(() => {
    try {
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      const r = (localStorage.getItem(`pixel_pros_room_code_${sport}`) || 'COUCH').toUpperCase();
      const saved = localStorage.getItem(`pixel_pros_user_${sport}_${r}`);
      return saved ? saved.trim().toUpperCase() : 'DAD';
    } catch {
      return 'DAD';
    }
  });
  const userNameRef = useRef<string>(userName);
  userNameRef.current = userName;

  const [isAddSquadDrawerOpen, setIsAddSquadDrawerOpen] = useState(false);
  const userExplicitlyJoinedRoomRef = useRef<string | null>(null);

  const [roster, setRoster] = useState<Competitor[]>(() => {
    try {
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      const version = localStorage.getItem('pixel_pros_roster_cache_version');
      if (version === ROSTER_CACHE_VERSION) {
        const cached = localStorage.getItem(`pixel_pros_synced_competitors_${sport}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return deduplicateCompetitors(parsed);
        }
      } else {
        localStorage.removeItem('pixel_pros_synced_competitors_nfl');
        localStorage.removeItem('pixel_pros_synced_competitors_nba');
        localStorage.setItem('pixel_pros_roster_cache_version', ROSTER_CACHE_VERSION);
      }
    } catch {}
    return currentSport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
  });
  const rosterRef = useRef<Competitor[]>([]);
  rosterRef.current = roster;

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      const cached = localStorage.getItem(`pixel_pros_synced_matches_${sport}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return sortMatchesByKickoffAndStatus(parsed);
      }
    } catch {}
    return sortMatchesByKickoffAndStatus(currentSport === 'nba' ? DEFAULT_NBA_MATCHES : DEFAULT_NFL_MATCHES);
  });
  const [roomRosters, setRoomRosters] = useState<UserRoster[]>([]);

  const [squadSlots, setSquadSlots] = useState<SquadSlots>({
    star1: null,
    star2: null,
    star3: null,
  });

  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      const r = (localStorage.getItem(`pixel_pros_room_code_${sport}`) || 'COUCH').toUpperCase();
      const u = (localStorage.getItem(`pixel_pros_user_${sport}_${r}`) || '').toUpperCase();
      return u ? getSquadLockState(r, u, sport) : false;
    } catch {
      return false;
    }
  });

  const [recentRooms, setRecentRooms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`pixel_pros_recent_rooms_${currentSport}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return currentSport === 'nba' ? ['HOOPS', 'FINALS', 'COUCH'] : ['COUCH', 'CUSE001', 'SUPERBOWL'];
  });

  const [detailedPlayer, setDetailedPlayer] = useState<Competitor | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [tempRoomCode, setTempRoomCode] = useState(roomCode);
  const [availableRooms, setAvailableRooms] = useState<ActiveRoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default game battle slate (Thursday Night Football or live match first, instead of burying games)
  const defaultMatchSlate = useMemo(() => {
    if (matches && matches.length > 0) {
      const live = matches.find((m) => m.status === 'live');
      if (live) {
        const away = (live.awayTeamCode || live.away_team || '').toUpperCase();
        const home = (live.homeTeamCode || live.home_team || '').toUpperCase();
        if (away && home) return `${away}@${home}`;
      }
      const first = matches[0];
      const away = (first.awayTeamCode || first.away_team || '').toUpperCase();
      const home = (first.homeTeamCode || first.home_team || '').toUpperCase();
      if (away && home) return `${away}@${home}`;
    }
    return currentSport === 'nba' ? 'BOS@NYK' : 'PIT@CLE';
  }, [matches, currentSport]);

  // Overarching App Mode:
  // 'game' = INDIVIDUAL GAME BATTLE (e.g. Thursday Night Football PIT@CLE)
  // 'total_week' = TOTAL WEEK (Weekly Superstars & Mega Battle Leaderboard)
  const [appMode, setAppMode] = useState<'game' | 'total_week'>('total_week');
  const [activeSlateId, setActiveSlateId] = useState<string>(() => {
    try {
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      const saved = localStorage.getItem(`pixel_pros_active_slate_${sport}`);
      if (saved && saved.trim()) return saved.trim();
    } catch {}
    return 'SUPERSTARS';
  });
  const activeSlateIdRef = useRef<string>(activeSlateId);
  const [showArchivedInSwitcher, setShowArchivedInSwitcher] = useState<boolean>(false);

  useEffect(() => {
    activeSlateIdRef.current = activeSlateId;
  }, [activeSlateId]);

  // Auto-sync activeSlateId if current selection is from a stale week (not in active matches)
  useEffect(() => {
    if (matches && matches.length > 0 && activeSlateId !== 'SUPERSTARS' && activeSlateId !== 'MEGA_TOTAL') {
      const matchExists = matches.some((m) => {
        const away = (m.awayTeamCode || m.away_team || '').toUpperCase();
        const home = (m.homeTeamCode || m.home_team || '').toUpperCase();
        return `${away}@${home}` === activeSlateId || `${home}@${away}` === activeSlateId;
      });
      if (!matchExists) {
        setActiveSlateId(defaultMatchSlate);
      }
    }
  }, [matches, activeSlateId, defaultMatchSlate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || window.location.pathname.startsWith('/admin')) {
        setIsCommissionerOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isRoomModalOpen) {
      setTempRoomCode(roomCode);
      setIsLoadingRooms(true);
      fetchAllActiveRooms(roomCode, currentSport, roomRosters)
        .then((rooms) => {
          setAvailableRooms(rooms);
        })
        .finally(() => {
          setIsLoadingRooms(false);
        });
    }
  }, [isRoomModalOpen, roomCode, currentSport, roomRosters]);

  const consolidatedCouches = useMemo(() => {
    const map = new Map<string, { roomCode: string; sport: SportId; squadCount: number; squadNames: string[]; isArchived: boolean }>();

    // 1. Include ALL available rooms stored on the database
    availableRooms.forEach((r) => {
      const rawCode = (r.roomCode || '').trim().toUpperCase();
      // Strip slate sub-code and week suffix so slates and weekly rooms roll up to the persistent season-long room
      const code = getBaseSeasonRoom(rawCode);
      if (!code) return;

      const isProtectedRoom = code === 'BIGBANG' || code === 'COUCH' || code === 'HOOPS';

      const localArchived = typeof localStorage !== 'undefined'
        ? localStorage.getItem(`pixel_pros_room_archived_${code}_${r.sport || currentSport}`)
        : null;

      let isArchived = false;
      if (isProtectedRoom) {
        isArchived = false;
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.removeItem(`pixel_pros_room_archived_${code}_${r.sport || currentSport}`);
            localStorage.removeItem(`pixel_pros_room_archived_${code}`);
            localStorage.setItem(`pixel_pros_room_archived_${code}_${r.sport || currentSport}`, 'false');
            localStorage.setItem(`pixel_pros_room_archived_${code}`, 'false');
          } catch {}
        }
      } else if (typeof r.isArchived === 'boolean') {
        isArchived = r.isArchived;
      } else if (localArchived !== null) {
        isArchived = localArchived === 'true';
      }

      const existing = map.get(code);
      if (existing) {
        existing.squadCount = Math.max(existing.squadCount, r.squadCount || 0);
        existing.squadNames = Array.from(new Set([...existing.squadNames, ...(r.squadNames || [])]));
        if (isProtectedRoom) {
          existing.isArchived = false;
        } else if (isArchived) {
          existing.isArchived = true;
        }
      } else {
        map.set(code, {
          roomCode: code,
          sport: r.sport || currentSport,
          squadCount: r.squadCount || 0,
          squadNames: r.squadNames || [],
          isArchived: isProtectedRoom ? false : isArchived,
        });
      }
    });

    // 2. Ensure current room is always present with its current squads
    const rawCurrentCode = (roomCode || '').trim().toUpperCase();
    const currentCode = getBaseSeasonRoom(rawCurrentCode);
    if (currentCode) {
      const isProtectedCurrent = currentCode === 'BIGBANG' || currentCode === 'COUCH' || currentCode === 'HOOPS';
      const existing = map.get(currentCode);
      const activeSquads = roomRosters
        .filter((r) => !isGhostUser(r.user_name))
        .map((r) => r.user_name.toUpperCase());
      const localArchived = typeof localStorage !== 'undefined'
        ? localStorage.getItem(`pixel_pros_room_archived_${currentCode}_${currentSport}`)
        : null;

      map.set(currentCode, {
        roomCode: currentCode,
        sport: currentSport,
        squadCount: Math.max(existing?.squadCount || 0, activeSquads.length),
        squadNames: Array.from(new Set([...(existing?.squadNames || []), ...activeSquads])),
        isArchived: isProtectedCurrent ? false : Boolean(existing?.isArchived || localArchived === 'true'),
      });
    }

    // 3. Default room COUCH / HOOPS is always available
    const defaultCode = currentSport === 'nba' ? 'HOOPS' : 'COUCH';
    if (!map.has(defaultCode)) {
      map.set(defaultCode, {
        roomCode: defaultCode,
        sport: currentSport,
        squadCount: 0,
        squadNames: [],
        isArchived: false,
      });
    }

    // Sort: Current room first, then by squad count descending, then alphabetical
    return Array.from(map.values()).sort((a, b) => {
      const aIsCurrent = a.roomCode === currentCode;
      const bIsCurrent = b.roomCode === currentCode;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      if (b.squadCount !== a.squadCount) return b.squadCount - a.squadCount;
      return a.roomCode.localeCompare(b.roomCode);
    });
  }, [availableRooms, currentSport, roomCode, roomRosters]);

  // Archived rooms should NOT show up in the main SWITCH ROOM box!
  const activeCouches = useMemo(() => {
    return consolidatedCouches.filter((c) => !c.isArchived);
  }, [consolidatedCouches]);

  const archivedCouches = useMemo(() => {
    return consolidatedCouches.filter((c) => Boolean(c.isArchived));
  }, [consolidatedCouches]);

  const previousRoom = useMemo(() => {
    const defaultCode = currentSport === 'nba' ? 'HOOPS' : 'COUCH';
    const alt = activeCouches.find((c) => c.roomCode.toUpperCase() !== roomCode.toUpperCase());
    if (alt) return alt.roomCode;
    return defaultCode;
  }, [activeCouches, roomCode, currentSport]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room') || params.get('r');
      const urlSport = (params.get('sport') || params.get('s') || '').toLowerCase() as SportId;
      const urlKey = params.get('k') || params.get('anonKey') || params.get('anon');

      if (urlKey && urlKey.trim()) {
        const configured = setCustomSupabaseKey(urlKey.trim());
        if (configured) {
          showToast('🟢 Connected to Cloud Sync!');
        }
      }

      if (urlSport === 'nba' || urlSport === 'nfl') {
        setCurrentSport(urlSport);
        localStorage.setItem('pixel_pros_sport', urlSport);
      }

      if (urlRoom && urlRoom.trim()) {
        const clean = urlRoom.trim().toUpperCase();
        userExplicitlyJoinedRoomRef.current = clean;
        setRoomCode(clean);
        setTempRoomCode(clean);
        localStorage.setItem(`pixel_pros_room_code_${urlSport || currentSport}`, clean);
        registerActiveRoom(clean, urlSport || currentSport);
        showToast(`Joined Room ${clean}!`);
      }

      // Keep sport and room in URL so bookmarking or copying address bar preserves the room
      const activeSport = (urlSport === 'nba' || urlSport === 'nfl') ? urlSport : currentSport;
      const activeRoom = (urlRoom && urlRoom.trim()) ? urlRoom.trim().toUpperCase() : roomCode;
      const url = new URL(window.location.href);
      url.searchParams.set('sport', activeSport);
      url.searchParams.set('room', activeRoom);
      window.history.replaceState({}, document.title, url.pathname + url.search);
    } catch {}
  }, []);

  // Sync browser URL whenever room or sport changes
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('sport', currentSport);
      url.searchParams.set('room', roomCode);
      window.history.replaceState({}, document.title, url.pathname + url.search);
    } catch {}
  }, [roomCode, currentSport]);

  const handleSportChange = (sport: SportId) => {
    if (sport === currentSport) return;
    setCurrentSport(sport);
    localStorage.setItem('pixel_pros_sport', sport);

    const scopedRoom = (localStorage.getItem(`pixel_pros_room_code_${sport}`) || (sport === 'nba' ? 'HOOPS' : 'COUCH')).toUpperCase();
    userExplicitlyJoinedRoomRef.current = scopedRoom;
    setRoomCode(scopedRoom);
    setTempRoomCode(scopedRoom);

    const scopedUser = (localStorage.getItem(`pixel_pros_user_${sport}_${scopedRoom}`) || '').toUpperCase();
    setUserName(scopedUser);

    setSquadSlots({ star1: null, star2: null, star3: null });
    setIsLocked(false);

    try {
      const savedRecent = localStorage.getItem(`pixel_pros_recent_rooms_${sport}`);
      setRecentRooms(savedRecent ? JSON.parse(savedRecent) : (sport === 'nba' ? ['HOOPS', 'FINALS'] : ['COUCH', 'CUSE001']));
    } catch {}

    showToast(sport === 'nba' ? 'Switched to NBA Edition!' : 'Switched to NFL Edition!');
  };

  const handleShareRoom = async () => {
    const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
    const activeKey = resolveSupabaseAnonKey();
    const keyParam = activeKey ? `&k=${encodeURIComponent(activeKey)}` : '';
    const inviteUrl = `${window.location.origin}/?sport=${currentSport}&room=${cleanRoom}${keyParam}`;

    const copied = await copyToClipboard(inviteUrl);
    if (copied) {
      showToast(`📋 COPIED COUCH ${cleanRoom} INVITE LINK!`);
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: `Pixel Pros ${currentSport.toUpperCase()}`,
          text: `Join couch "${cleanRoom}" on Pixel Pros and draft your 3 ${currentSport.toUpperCase()} stars!`,
          url: inviteUrl,
        });
      } catch {
        showToast(`Link: ${inviteUrl}`);
      }
    } else {
      prompt(`Copy Room ${cleanRoom} link:`, inviteUrl);
      showToast(`Link: ${inviteUrl}`);
    }
  };

  const syncLineupToSupabase = useCallback(
    async (
      rCode: string,
      uName: string,
      slotsObj: SquadSlots,
      lockedFlag?: boolean,
      targetSport?: SportId,
      slateIdOverride?: string
    ) => {
      const activeSport = targetSport || currentSport;
      const baseRoom = (rCode || (activeSport === 'nba' ? 'HOOPS' : 'COUCH')).trim().toUpperCase();
      const cleanName = (uName || '').trim().toUpperCase();
      if (!cleanName) return;

      const effectiveRoom = getEffectiveRoomCodeForSlate(baseRoom, slateIdOverride || activeSlateId);

      const s1 = slotsObj.star1?.id || '';
      const s2 = slotsObj.star2?.id || '';
      const s3 = slotsObj.star3?.id || '';
      const filledIds = [s1, s2, s3].filter(Boolean);
      const distinctIds = new Set(filledIds);
      const hasThreeDistinct = filledIds.length === 3 && distinctIds.size === 3;
      const rawLocked = typeof lockedFlag === 'boolean' ? lockedFlag : isLocked;
      const guardedLocked = hasThreeDistinct && Boolean(rawLocked);

      setSquadLockState(effectiveRoom, cleanName, guardedLocked, activeSport);
      localStorage.setItem(`pixel_pros_roster_${activeSport}_${effectiveRoom}_${cleanName}`, JSON.stringify([s1, s2, s3]));

      // Immediately reflect the updated roster in local roomRosters state
      setRoomRosters((prev) => {
        const next = prev.filter(
          (r) => !((r.room_code || '').toUpperCase() === effectiveRoom && (r.user_name || '').toUpperCase() === cleanName)
        );
        next.push({
          id: `roster_${Date.now()}`,
          room_code: effectiveRoom,
          user_name: cleanName,
          sport: activeSport,
          star_1_id: s1,
          star_2_id: s2,
          star_3_id: s3,
          is_locked: guardedLocked,
          device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
          updated_at: new Date().toISOString(),
        });
        return next;
      });

      const result = await upsertUserRoster(
        effectiveRoom,
        cleanName,
        s1,
        s2,
        s3,
        guardedLocked,
        activeSport
      );

      if (!result.success) {
        console.error('Failed to sync squad to room in Supabase:', result.error);
        showToast('Failed to sync squad to room!');
      }
    },
    [isLocked, currentSport, activeSlateId]
  );

  const handleSelectSlate = (newSlate: string) => {
    setActiveSlateId(newSlate);
    try {
      localStorage.setItem(`pixel_pros_active_slate_${currentSport}`, newSlate);
    } catch {}
    if (newSlate === 'SUPERSTARS') {
      setAppMode('total_week');
    } else {
      setAppMode('game');
    }
    const baseRoom = (roomCode || 'COUCH').toUpperCase();
    const targetRoom = getEffectiveRoomCodeForSlate(baseRoom, newSlate);
    const cleanUser = (userName || '').trim().toUpperCase();

    if (!cleanUser) {
      setSquadSlots({ star1: null, star2: null, star3: null });
      setIsLocked(false);
      return;
    }

    const dbRoster = roomRosters.find(
      (r) => (r.room_code || '').toUpperCase() === targetRoom && (r.user_name || '').toUpperCase() === cleanUser
    );

    const masterList = rosterRef.current.length > 0 ? rosterRef.current : roster;
    let s1: Competitor | null = null;
    let s2: Competitor | null = null;
    let s3: Competitor | null = null;
    let initialLock = false;

    if (dbRoster) {
      s1 = resolveCompetitorById(dbRoster.star_1_id, masterList, null, currentSport);
      s2 = resolveCompetitorById(dbRoster.star_2_id, masterList, null, currentSport);
      s3 = resolveCompetitorById(dbRoster.star_3_id, masterList, null, currentSport);
      const isExplicitlyUnlocked =
        dbRoster.is_locked === false ||
        String(dbRoster.is_locked) === 'false' ||
        String(dbRoster.device_id).toUpperCase() === 'UNLOCKED';
      initialLock = !isExplicitlyUnlocked && Boolean(dbRoster.is_locked || dbRoster.device_id === 'LOCKED');
    } else {
      try {
        const cached = localStorage.getItem(`pixel_pros_roster_${currentSport}_${targetRoom}_${cleanUser}`);
        if (cached) {
          const ids = JSON.parse(cached);
          if (Array.isArray(ids)) {
            s1 = resolveCompetitorById(ids[0], masterList, null, currentSport);
            s2 = resolveCompetitorById(ids[1], masterList, null, currentSport);
            s3 = resolveCompetitorById(ids[2], masterList, null, currentSport);
          }
        }
      } catch {}
      initialLock = getSquadLockState(targetRoom, cleanUser, currentSport);
    }

    // STRICT GAME VALIDATION: If this slate is a specific matchup (AWAY@HOME),
    // players MUST belong to AWAY or HOME. Never let players from other games leak in!
    if (newSlate && newSlate.includes('@') && newSlate !== 'SUPERSTARS') {
      const [awayTeam, homeTeam] = newSlate.split('@').map((t) => (t || '').trim().toUpperCase());
      const isPlayerInGame = (p: Competitor | null) => {
        if (!p) return false;
        const pTeam = (p.teamCode || '').trim().toUpperCase();
        return pTeam === awayTeam || pTeam === homeTeam;
      };
      if (s1 && !isPlayerInGame(s1)) s1 = null;
      if (s2 && !isPlayerInGame(s2)) s2 = null;
      if (s3 && !isPlayerInGame(s3)) s3 = null;
    }

    // Slot position auto-aligner: guarantee QB -> star1, RB -> star2, WR/TE -> star3
    if (currentSport === 'nfl') {
      const loaded = [s1, s2, s3].filter(Boolean) as Competitor[];
      if (loaded.length > 0) {
        const mismatch =
          (s1 && !isPositionAllowedForSlot('star1', s1, 'nfl')) ||
          (s2 && !isPositionAllowedForSlot('star2', s2, 'nfl')) ||
          (s3 && !isPositionAllowedForSlot('star3', s3, 'nfl'));
        if (mismatch) {
          let newS1: Competitor | null = null;
          let newS2: Competitor | null = null;
          let newS3: Competitor | null = null;
          for (const p of loaded) {
            if (!newS1 && isPositionAllowedForSlot('star1', p, 'nfl')) newS1 = p;
            else if (!newS2 && isPositionAllowedForSlot('star2', p, 'nfl')) newS2 = p;
            else if (!newS3 && isPositionAllowedForSlot('star3', p, 'nfl')) newS3 = p;
          }
          s1 = newS1;
          s2 = newS2;
          s3 = newS3;
        }
      }
    }

    const filledCount = [s1, s2, s3].filter(Boolean).length;
    const isCooldownActive = Date.now() - unlockCooldownRef.current < 10000;
    const finalLock = !isCooldownActive && filledCount === 3 && initialLock;

    setSquadSlots({ star1: s1, star2: s2, star3: s3 });
    setIsLocked(finalLock);
  };

  const handleSwitchMode = (mode: 'game' | 'total_week') => {
    setAppMode(mode);
    if (mode === 'total_week') {
      if (currentTab === 'squad') {
        handleSelectSlate('SUPERSTARS');
      }
    } else {
      if (activeSlateId === 'SUPERSTARS' || activeSlateId === 'MEGA_TOTAL') {
        handleSelectSlate(defaultMatchSlate);
      }
    }
  };

  const handleSwitchToBoard = () => {
    setCurrentTab('couch');
    fetchRoomRosters(roomCode, currentSport).then((fresh) => {
      if (fresh && fresh.length > 0) {
        setRoomRosters((prev) => {
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
    });
  };

  const handleSelectSquad = async (squadName: string) => {
    const cleanName = squadName.trim().toUpperCase();
    if (!cleanName) return;

    setUserName(cleanName);
    localStorage.setItem(`pixel_pros_user_${currentSport}_${roomCode}`, cleanName);

    const baseRoom = (roomCode || 'COUCH').toUpperCase();
    const targetRoom = getEffectiveRoomCodeForSlate(baseRoom, activeSlateId);

    let existingRoster = roomRosters.find(
      (r) => (r.room_code || '').toUpperCase() === targetRoom && r.user_name.toUpperCase() === cleanName
    );

    if (!existingRoster) {
      const freshRosters = await fetchRoomRosters(baseRoom, currentSport);
      setRoomRosters(freshRosters);
      existingRoster = freshRosters.find(
        (r) => (r.room_code || '').toUpperCase() === targetRoom && r.user_name.toUpperCase() === cleanName
      );
    }

    let s1: Competitor | null = null;
    let s2: Competitor | null = null;
    let s3: Competitor | null = null;
    let isLockedFromDb = false;

    if (existingRoster) {
      const masterList = rosterRef.current.length > 0 ? rosterRef.current : roster;
      s1 = resolveCompetitorById(existingRoster.star_1_id, masterList, null, currentSport);
      s2 = resolveCompetitorById(existingRoster.star_2_id, masterList, null, currentSport);
      s3 = resolveCompetitorById(existingRoster.star_3_id, masterList, null, currentSport);
      const isExplicitlyUnlocked =
        existingRoster.is_locked === false ||
        String(existingRoster.is_locked) === 'false' ||
        String(existingRoster.device_id).toUpperCase() === 'UNLOCKED';
      isLockedFromDb = !isExplicitlyUnlocked && Boolean(existingRoster.is_locked || existingRoster.device_id === 'LOCKED');
    } else {
      try {
        const cached = localStorage.getItem(`pixel_pros_roster_${currentSport}_${targetRoom}_${cleanName}`);
        if (cached) {
          const ids = JSON.parse(cached);
          if (Array.isArray(ids)) {
            const masterList = rosterRef.current.length > 0 ? rosterRef.current : roster;
            s1 = resolveCompetitorById(ids[0], masterList, null, currentSport);
            s2 = resolveCompetitorById(ids[1], masterList, null, currentSport);
            s3 = resolveCompetitorById(ids[2], masterList, null, currentSport);
          }
        }
      } catch {}
    }

    // Seamless UX: If active slate currently has no picks, automatically jump to where this squad has picks!
    if (!s1 && !s2 && !s3) {
      const superRoster = roomRosters.find(
        (r) => (r.room_code || '').toUpperCase() === baseRoom && r.user_name.toUpperCase() === cleanName
      );
      if (superRoster && (superRoster.star_1_id || superRoster.star_2_id || superRoster.star_3_id)) {
        setActiveSlateId('SUPERSTARS');
        setAppMode('total_week');
        const masterList = rosterRef.current.length > 0 ? rosterRef.current : roster;
        s1 = resolveCompetitorById(superRoster.star_1_id, masterList, null, currentSport);
        s2 = resolveCompetitorById(superRoster.star_2_id, masterList, null, currentSport);
        s3 = resolveCompetitorById(superRoster.star_3_id, masterList, null, currentSport);
        const isExplicitlyUnlocked =
          superRoster.is_locked === false ||
          String(superRoster.is_locked) === 'false' ||
          String(superRoster.device_id).toUpperCase() === 'UNLOCKED';
        isLockedFromDb = !isExplicitlyUnlocked && Boolean(superRoster.is_locked || superRoster.device_id === 'LOCKED');
      } else {
        // Check game slates in this room
        const slateWithPicks = roomRosters.find(
          (r) =>
            (r.room_code || '').toUpperCase().startsWith(`${baseRoom}__`) &&
            r.user_name.toUpperCase() === cleanName &&
            (r.star_1_id || r.star_2_id || r.star_3_id)
        );
        if (slateWithPicks) {
          const matchCode = slateWithPicks.room_code.split('__')[1];
          if (matchCode) {
            const slateName = matchCode.replace('_', '@');
            setActiveSlateId(slateName);
            setAppMode('game');
            const masterList = rosterRef.current.length > 0 ? rosterRef.current : roster;
            s1 = resolveCompetitorById(slateWithPicks.star_1_id, masterList, null, currentSport);
            s2 = resolveCompetitorById(slateWithPicks.star_2_id, masterList, null, currentSport);
            s3 = resolveCompetitorById(slateWithPicks.star_3_id, masterList, null, currentSport);
            const isExplicitlyUnlocked =
              slateWithPicks.is_locked === false ||
              String(slateWithPicks.is_locked) === 'false' ||
              String(slateWithPicks.device_id).toUpperCase() === 'UNLOCKED';
            isLockedFromDb = !isExplicitlyUnlocked && Boolean(slateWithPicks.is_locked || slateWithPicks.device_id === 'LOCKED');
          }
        }
      }
    }

    // STRICT GAME VALIDATION: If this slate is a specific matchup (AWAY@HOME),
    // players MUST belong to AWAY or HOME. Never let players from other games leak in!
    if (activeSlateId && activeSlateId.includes('@') && activeSlateId !== 'SUPERSTARS') {
      const [awayTeam, homeTeam] = activeSlateId.split('@').map((t) => (t || '').trim().toUpperCase());
      const isPlayerInGame = (p: Competitor | null) => {
        if (!p) return false;
        const pTeam = (p.teamCode || '').trim().toUpperCase();
        return pTeam === awayTeam || pTeam === homeTeam;
      };
      if (s1 && !isPlayerInGame(s1)) s1 = null;
      if (s2 && !isPlayerInGame(s2)) s2 = null;
      if (s3 && !isPlayerInGame(s3)) s3 = null;
    }

    const filledStars = [s1, s2, s3].filter(Boolean) as Competitor[];
    const distinctIds = new Set(filledStars.map((p) => p.id));
    const hasThreeDistinct = filledStars.length === 3 && distinctIds.size === 3;
    const isCooldownActive = Date.now() - unlockCooldownRef.current < 10000;
    const squadLocked = !isCooldownActive && hasThreeDistinct && isLockedFromDb;

    setSquadSlots({ star1: s1, star2: s2, star3: s3 });
    setIsLocked(squadLocked);
    setSquadLockState(targetRoom, cleanName, squadLocked, currentSport);
    setCurrentTab('squad');
    showToast(`Switched active squad to "${cleanName}"`);
  };

  const handleCreateSquad = async (squadName: string) => {
    const cleanName = squadName.trim().toUpperCase();
    if (!cleanName) return;

    setUserName(cleanName);
    localStorage.setItem(`pixel_pros_user_${currentSport}_${roomCode}`, cleanName);
    localStorage.setItem(`pixel_pros_roster_${currentSport}_${roomCode}_${cleanName}`, JSON.stringify(['', '', '']));
    setSquadLockState(roomCode, cleanName, false, currentSport);

    setSquadSlots({ star1: null, star2: null, star3: null });
    setIsLocked(false);

    await upsertUserRoster(roomCode, cleanName, null, null, null, false, currentSport);
    registerActiveUser(cleanName, currentSport).catch(() => {});
    const updated = await fetchRoomRosters(roomCode, currentSport);
    setRoomRosters(updated);

    setCurrentTab('squad');
    showToast(`Created squad "${cleanName}" in ${currentSport.toUpperCase()}!`);
  };

  const handleDeleteSquad = async (targetUserName: string) => {
    const cleanName = (targetUserName || '').trim().toUpperCase();
    if (!cleanName) return;

    await deleteUserRoster(roomCode, cleanName, currentSport);
    setSquadLockState(roomCode, cleanName, false, currentSport);
    localStorage.removeItem(`pixel_pros_roster_${currentSport}_${roomCode}_${cleanName}`);

    const updatedRosters = roomRosters.filter(
      (r) => !(r.room_code.toUpperCase() === roomCode && r.user_name.toUpperCase() === cleanName)
    );
    setRoomRosters(updatedRosters);

    if (userName.toUpperCase() === cleanName) {
      if (updatedRosters.length > 0) {
        const nextName = updatedRosters[0].user_name.toUpperCase();
        setUserName(nextName);
        localStorage.setItem(`pixel_pros_user_${currentSport}_${roomCode}`, nextName);
        handleSelectSquad(nextName);
      } else {
        setUserName('');
        localStorage.removeItem(`pixel_pros_user_${currentSport}_${roomCode}`);
        setSquadSlots({ star1: null, star2: null, star3: null });
        setIsLocked(false);
      }
    }
    showToast(`Dropped squad "${cleanName}".`);
  };

  const handleCommitRoomCode = (newCode: string, targetSport?: SportId) => {
    const nextSport = targetSport || currentSport;
    if (targetSport && targetSport !== currentSport) {
      setCurrentSport(targetSport);
      try {
        localStorage.setItem('pixel_pros_sport', targetSport);
      } catch {}
    }
    const rawInput = (newCode || (nextSport === 'nba' ? 'HOOPS' : 'COUCH')).trim().toUpperCase();
    const clean = getBaseSeasonRoom(rawInput);
    userExplicitlyJoinedRoomRef.current = clean;
    setRoomCode(clean);
    setTempRoomCode(clean);
    try {
      localStorage.setItem(`pixel_pros_room_code_${nextSport}`, clean);
      localStorage.setItem(`pixel_pros_room_archived_${clean}_${nextSport}`, 'false');
      localStorage.removeItem(`pixel_pros_room_archived_${clean}`);
    } catch {}

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', clean);
      if (nextSport) url.searchParams.set('sport', nextSport);
      window.history.replaceState({}, '', url.toString());
    } catch {}

    setRecentRooms((prev) => {
      const updated = [clean, ...prev.filter((r) => r !== clean)].slice(0, 8);
      try {
        localStorage.setItem(`pixel_pros_recent_rooms_${nextSport}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const scopedUser = (localStorage.getItem(`pixel_pros_user_${nextSport}_${clean}`) || '').toUpperCase();
    setUserName(scopedUser);

    registerActiveRoom(clean, nextSport);
    fetchRoomRosters(clean, nextSport).then((fresh) => {
      setRoomRosters(fresh);
      const valid = fresh.filter((r) => !isGhostUser(r.user_name));
      if (!scopedUser && valid.length > 0) {
        const firstUser = valid[0].user_name.toUpperCase();
        setUserName(firstUser);
        handleSelectSquad(firstUser);
      }
    });
    fetchAllActiveRooms(clean, nextSport).then((rooms) => {
      setAvailableRooms(rooms);
    });

    showToast(`Switched to Room ${clean}!`);
  };

  const handleRemoveRecentRoom = (roomToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = roomToRemove.trim().toUpperCase();
    setRecentRooms((prev) => {
      const updated = prev.filter((r) => r !== clean);
      localStorage.setItem(`pixel_pros_recent_rooms_${currentSport}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetCurrentRoom = async () => {
    const confirmed = window.confirm(`Clear all ${currentSport.toUpperCase()} squads in room "${roomCode}"?`);
    if (!confirmed) return;

    try {
      await resetRoomRosters(roomCode);
    } catch {}

    setRoomRosters([]);
    setUserName('');
    setSquadSlots({ star1: null, star2: null, star3: null });
    setIsLocked(false);
    localStorage.removeItem(`pixel_pros_user_${currentSport}_${roomCode}`);

    setIsRoomModalOpen(false);
    showToast(`Room ${roomCode} reset.`);
  };

  const handleAssignSlot = (player: Competitor, targetSlot: ActiveSlot) => {
    if (!userName) {
      setIsAddSquadDrawerOpen(true);
      showToast('Please create a squad first!');
      return;
    }

    let effectiveSlot = targetSlot;
    if (currentSport === 'nfl') {
      if (!isPositionAllowedForSlot(targetSlot, player, 'nfl')) {
        effectiveSlot = getCorrectSlotForPlayer(player, 'nfl');
        const posReq = effectiveSlot === 'star1' ? 'STAR 1 (QB)' : effectiveSlot === 'star2' ? 'STAR 2 (RB)' : 'STAR 3 (WR/TE)';
        showToast(`${player.displayName} (${player.position}) placed into ${posReq}!`);
      }
    }

    const filledCount = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean).length;
    if (filledCount === 3 && isLocked) {
      showToast('Lineup is LOCKED! Tap UNLOCK PICKS to make changes.');
      return;
    }

    const next: SquadSlots = { ...squadSlots };
    const isSamePlayer = (slotPlayer: Competitor | null) => {
      if (!slotPlayer) return false;
      if (slotPlayer.id === player.id) return true;
      const sNorm = `${(slotPlayer.displayName || slotPlayer.shortName || '').trim().toLowerCase()}_${(slotPlayer.teamCode || '').trim().toUpperCase()}`;
      const pNorm = `${(player.displayName || player.shortName || '').trim().toLowerCase()}_${(player.teamCode || '').trim().toUpperCase()}`;
      return sNorm === pNorm;
    };

    if (isSamePlayer(next.star1) && effectiveSlot !== 'star1') next.star1 = null;
    if (isSamePlayer(next.star2) && effectiveSlot !== 'star2') next.star2 = null;
    if (isSamePlayer(next.star3) && effectiveSlot !== 'star3') next.star3 = null;

    next[effectiveSlot] = player;
    const newCount = [next.star1, next.star2, next.star3].filter(Boolean).length;
    const willBeLocked = newCount === 3 && isLocked;

    const currentSlate = activeSlateIdRef.current || activeSlateId;
    const targetRoom = getEffectiveRoomCodeForSlate(roomCode, currentSlate);

    setSquadSlots(next);
    setIsLocked(willBeLocked);
    setSquadLockState(targetRoom, userName, willBeLocked, currentSport);
    syncLineupToSupabase(roomCode, userName, next, willBeLocked, currentSport, currentSlate);

    const slotLabel = effectiveSlot === 'star1' ? 'STAR 1' : effectiveSlot === 'star2' ? 'STAR 2' : 'STAR 3';
    showToast(`${player.displayName} assigned to ${slotLabel}!`);
  };

  const handleClearSlot = (slotKey: ActiveSlot) => {
    if (!userName) return;
    const currentSlate = activeSlateIdRef.current || activeSlateId;
    const targetRoom = getEffectiveRoomCodeForSlate(roomCode, currentSlate);
    const next = { ...squadSlots, [slotKey]: null };
    setSquadSlots(next);
    setIsLocked(false);
    setSquadLockState(targetRoom, userName, false, currentSport);
    syncLineupToSupabase(roomCode, userName, next, false, currentSport, currentSlate);
    showToast(`Cleared ${slotKey.toUpperCase()} slot.`);
  };

  const unlockCooldownRef = useRef<number>(0);

  const handleUnlockSquad = () => {
    if (!userName) return;
    const currentSlate = activeSlateIdRef.current || activeSlateId;
    const targetRoom = getEffectiveRoomCodeForSlate(roomCode, currentSlate);
    const cleanUser = userName.trim().toUpperCase();
    unlockCooldownRef.current = Date.now();

    setIsLocked(false);
    setSquadLockState(targetRoom, cleanUser, false, currentSport);

    setRoomRosters((prev) =>
      prev.map((r) => {
        if (
          (r.room_code || '').trim().toUpperCase() === targetRoom &&
          (r.user_name || '').trim().toUpperCase() === cleanUser
        ) {
          return {
            ...r,
            is_locked: false,
            device_id: 'UNLOCKED',
            updated_at: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    syncLineupToSupabase(roomCode, cleanUser, squadSlots, false, currentSport, currentSlate);
    toggleSquadLock(targetRoom, cleanUser, false, currentSport).catch(() => {});
    showToast(`PICKS UNLOCKED for ${cleanUser}!`);
  };

  const handleLockSquad = (advanceToNext: boolean = true) => {
    if (!userName) {
      setIsAddSquadDrawerOpen(true);
      return;
    }

    // Safety guard: if unlock was triggered less than 1500ms ago, ignore lock attempt
    if (Date.now() - unlockCooldownRef.current < 1500) {
      return;
    }

    const filledCount = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean).length;
    if (filledCount < 3) {
      showToast('Select all 3 Stars before locking your squad!');
      return;
    }

    const currentSlate = activeSlateId;
    const targetRoom = getEffectiveRoomCodeForSlate(roomCode, currentSlate);
    setIsLocked(true);
    setSquadLockState(targetRoom, userName, true, currentSport);
    syncLineupToSupabase(roomCode, userName, squadSlots, true, currentSport, currentSlate);
    toggleSquadLock(targetRoom, userName, true, currentSport).catch(() => {});

    const currentSlateLabel = currentSlate === 'SUPERSTARS' ? 'SUPERSTARS' : currentSlate;

    if (advanceToNext) {
      // Find list of all game slates in EXACT CAROUSEL ORDER (sorted matches)
      const sorted = sortMatchesByKickoffAndStatus(matches || []);
      const matchSlates = sorted
        .map((m) => {
          const away = (m.awayTeamCode || m.away_team || '').toUpperCase();
          const home = (m.homeTeamCode || m.home_team || '').toUpperCase();
          return away && home ? `${away}@${home}` : null;
        })
        .filter(Boolean) as string[];

      const allSlates = ['SUPERSTARS', ...matchSlates];
      const currentIndex = allSlates.indexOf(currentSlate);

      const nextIndex =
        currentIndex >= 0 && currentIndex < allSlates.length - 1
          ? currentIndex + 1
          : 0;
      const nextSlate = allSlates[nextIndex];

      if (nextSlate && nextSlate !== currentSlate) {
        const nextSlateLabel =
          nextSlate === 'SUPERSTARS' ? 'WEEKLY SUPERSTARS' : `GAME ${nextSlate.replace('@', ' @ ')}`;
        showToast(`🔒 ${currentSlateLabel} LOCKED! Next Up: ${nextSlateLabel} ⭐`);
        setTimeout(() => {
          handleSelectSlate(nextSlate);
        }, 280);
      } else {
        showToast(`🔒 ${currentSlateLabel} LOCKED! 🎉 ALL GAME SLATES COMPLETE!`);
      }
    } else {
      showToast(`🔒 ${currentSlateLabel} SQUAD LOCKED!`);
    }
  };

  const handleToggleLock = () => {
    if (isLocked) {
      handleUnlockSquad();
    } else {
      handleLockSquad(true);
    }
  };

  useEffect(() => {
    let active = true;
    async function sync() {
      try {
        const [compData, matchData, rost, allRooms] = await Promise.all([
          fetchLiveCompetitors(currentSport),
          fetchLiveMatches(currentSport),
          fetchRoomRosters(roomCode, currentSport),
          fetchAllActiveRooms(roomCode, currentSport),
        ]);

        if (!active) return;

        setRoster(compData || []);
        setMatches(matchData || []);
        setAvailableRooms(allRooms || []);

        const validRosters = (rost || []).filter((r) => !isGhostUser(r.user_name));

        // Keep active room in recentRooms in localStorage
        const activeRoomCodes = new Set(
          (allRooms || [])
            .filter((r) => r.squadCount > 0 && r.sport === currentSport)
            .map((r) => r.roomCode.toUpperCase())
        );
        activeRoomCodes.add(roomCode.toUpperCase());
        activeRoomCodes.add(currentSport === 'nba' ? 'HOOPS' : 'COUCH');
        setRecentRooms((prev) => {
          const cleaned = prev.filter((r) => activeRoomCodes.has((r || '').toUpperCase()));
          if (cleaned.length === 0) cleaned.push(currentSport === 'nba' ? 'HOOPS' : 'COUCH');
          try {
            localStorage.setItem(`pixel_pros_recent_rooms_${currentSport}`, JSON.stringify(cleaned));
          } catch {}
          return cleaned;
        });

        setRoomRosters(rost || []);

        let activeUserClean = (userName || '').trim().toUpperCase();

        // If userName is not set on this device, check local storage or choose first squad in the room
        if (!activeUserClean) {
          try {
            const saved = localStorage.getItem(`pixel_pros_user_${currentSport}_${roomCode}`);
            if (saved && saved.trim()) {
              activeUserClean = saved.trim().toUpperCase();
            } else if (validRosters.length > 0) {
              activeUserClean = validRosters[0].user_name.toUpperCase();
            } else {
              activeUserClean = 'DAD';
            }
          } catch {
            activeUserClean = validRosters.length > 0 ? validRosters[0].user_name.toUpperCase() : 'DAD';
          }
          setUserName(activeUserClean);
        }

        let s1: Competitor | null = null;
        let s2: Competitor | null = null;
        let s3: Competitor | null = null;
        let initialLock = false;

        if (activeUserClean) {
          const targetSlate = activeSlateIdRef.current || 'SUPERSTARS';
          const targetRoom = getEffectiveRoomCodeForSlate(roomCode, targetSlate);
          let dbRoster = validRosters.find(
            (r) => (r.room_code || '').toUpperCase() === targetRoom && r.user_name.toUpperCase() === activeUserClean
          );
          if (!dbRoster && targetRoom !== roomCode) {
            try {
              const gameRosters = await fetchRoomRosters(targetRoom, currentSport);
              dbRoster = gameRosters.find(
                (r) => (r.room_code || '').toUpperCase() === targetRoom && r.user_name.toUpperCase() === activeUserClean
              );
            } catch {}
          }
          if (dbRoster) {
            s1 = resolveCompetitorById(dbRoster.star_1_id, compData || [], null, currentSport);
            s2 = resolveCompetitorById(dbRoster.star_2_id, compData || [], null, currentSport);
            s3 = resolveCompetitorById(dbRoster.star_3_id, compData || [], null, currentSport);
            initialLock = Boolean(dbRoster.is_locked || dbRoster.device_id === 'LOCKED');
          } else {
            // Check localStorage
            try {
              const cached = localStorage.getItem(`pixel_pros_roster_${currentSport}_${targetRoom}_${activeUserClean}`);
              if (cached) {
                const ids = JSON.parse(cached);
                if (Array.isArray(ids)) {
                  s1 = resolveCompetitorById(ids[0], compData || [], null, currentSport);
                  s2 = resolveCompetitorById(ids[1], compData || [], null, currentSport);
                  s3 = resolveCompetitorById(ids[2], compData || [], null, currentSport);
                }
              }
            } catch {}
            initialLock = getSquadLockState(targetRoom, activeUserClean, currentSport);
          }
        }

        // STRICT GAME VALIDATION: Filter out any players not matching this activeSlateId if game matchup
        const currentCheckSlate = activeSlateIdRef.current;
        if (currentCheckSlate && currentCheckSlate.includes('@') && currentCheckSlate !== 'SUPERSTARS') {
          const [awayT, homeT] = currentCheckSlate.split('@').map((t) => (t || '').trim().toUpperCase());
          const isPlayerInGame = (p: Competitor | null) => {
            if (!p) return false;
            const pTeam = (p.teamCode || '').trim().toUpperCase();
            return pTeam === awayT || pTeam === homeT;
          };
          if (s1 && !isPlayerInGame(s1)) s1 = null;
          if (s2 && !isPlayerInGame(s2)) s2 = null;
          if (s3 && !isPlayerInGame(s3)) s3 = null;
        }

        // Slot position auto-aligner: guarantee QB -> star1, RB -> star2, WR/TE -> star3
        if (currentSport === 'nfl') {
          const loaded = [s1, s2, s3].filter(Boolean) as Competitor[];
          if (loaded.length > 0) {
            const mismatch =
              (s1 && !isPositionAllowedForSlot('star1', s1, 'nfl')) ||
              (s2 && !isPositionAllowedForSlot('star2', s2, 'nfl')) ||
              (s3 && !isPositionAllowedForSlot('star3', s3, 'nfl'));
            if (mismatch) {
              let newS1: Competitor | null = null;
              let newS2: Competitor | null = null;
              let newS3: Competitor | null = null;
              for (const p of loaded) {
                if (!newS1 && isPositionAllowedForSlot('star1', p, 'nfl')) newS1 = p;
                else if (!newS2 && isPositionAllowedForSlot('star2', p, 'nfl')) newS2 = p;
                else if (!newS3 && isPositionAllowedForSlot('star3', p, 'nfl')) newS3 = p;
              }
              s1 = newS1;
              s2 = newS2;
              s3 = newS3;
            }
          }
        }

        const filledCount = [s1, s2, s3].filter(Boolean).length;
        const isCooldownActive = Date.now() - unlockCooldownRef.current < 5000;
        const finalLock = activeUserClean && !isCooldownActive ? filledCount === 3 && initialLock : false;

        setSquadSlots({ star1: s1, star2: s2, star3: s3 });
        if (!isCooldownActive) {
          setIsLocked(finalLock);
        }
      } catch (err) {
        console.warn('Room sync error:', err);
      }
    }

    sync();
    return () => {
      active = false;
    };
  }, [roomCode, currentSport, refreshTick]);

  useEffect(() => {
    const unsubscribeScores = subscribeToRealtimeScores(
      (competitorPayload) => {
        const updated = competitorPayload?.new as any;
        if (updated && (updated.id || updated.short_name)) {
          setRoster((prev) =>
            (prev || []).map((p) =>
              p.id === updated.id
                ? {
                    ...p,
                    score: Math.round(Number(updated.score ?? p.score) || 0),
                    stats: updated.stats || p.stats,
                  }
                : p
            )
          );
        }
      },
      () => {}
    );

    return () => {
      unsubscribeScores();
    };
  }, []);

  // Background ESPN Live Scoreboard Synchronization on mount & periodically
  useEffect(() => {
    let mounted = true;
    const runESPNLiveSync = async () => {
      try {
        await syncESPNData(currentSport);
      } catch (err) {
        console.warn('Auto ESPN live sync notice:', err);
      }
    };

    // Run on sport change / mount
    runESPNLiveSync();

    // Auto-poll ESPN live scoreboard every 30 seconds to keep live scores, quarters, and game state fresh
    const pollTimer = setInterval(runESPNLiveSync, 30000);
    return () => {
      mounted = false;
      clearInterval(pollTimer);
    };
  }, [currentSport]);

  // Tuesday 4:00 AM EST Automated Rescan Handler
  useEffect(() => {
    // 0. Ensure week is tracked without destructive clearing
    const activeWeekNum = getCurrentNFLWeek();
    localStorage.setItem('pixel_pros_picks_active_week', String(activeWeekNum));

    // 1. Check if depth chart/schedule rescan is due on initial app mount
    const lastRescan = localStorage.getItem('pixel_pros_last_tuesday_rescan');
    if (!lastRescan) {
      localStorage.setItem('pixel_pros_last_tuesday_rescan', new Date().toISOString());
    } else if (isWeeklyRescanDue(lastRescan)) {
      executeCompleteWeeklyRescan().then((res) => {
        if (res.success) {
          setRefreshTick((t) => t + 1);
          showToast(`⚡ Tuesday 4:00 AM Rescan: Week ${res.activeWeek} matchups and rosters updated!`);
        }
      });
    }

    // 2. Custom event listener from client-side triggered rescan
    const handleRescanEvent = (e: any) => {
      // Depth chart & injury updates must NEVER wipe users' saved picks!
      fetchRoomRosters(roomCode, currentSport).then((fresh) => {
        if (fresh) setRoomRosters(fresh);
      });
      setRefreshTick((t) => t + 1);
      const wk = e.detail?.week || getCurrentNFLWeek();
      showToast(`⚡ NFL Week ${wk} depth charts & matchups synchronized!`);
    };

    const handlePicksCleared = () => {
      // Explicit commissioner / turnover action
      setSquadSlots({ star1: null, star2: null, star3: null });
      setIsLocked(false);
      setRoomRosters((prev) =>
        prev.map((r) =>
          (r.sport || 'nfl') === 'nfl' && !r.room_code.includes('__')
            ? { ...r, star_1_id: '', star_2_id: '', star_3_id: '', is_locked: false, device_id: 'UNLOCKED' }
            : r
        )
      );
      fetchRoomRosters(roomCode, currentSport).then((fresh) => {
        if (fresh) setRoomRosters(fresh);
      });
      setRefreshTick((t) => t + 1);
    };

    window.addEventListener('pixel_pros_weekly_rescan_completed', handleRescanEvent);
    window.addEventListener('pixel_pros_week_picks_cleared', handlePicksCleared);

    // 3. SSE event listener from server-side Tuesday 4:00 AM automated scheduler
    let sse: EventSource | null = null;
    try {
      sse = new EventSource('/api/events');
      const processRescanPayload = (rawData: string) => {
        try {
          const data = JSON.parse(rawData);
          // ONLY clear picks if explicitly flagged as clearedPicks: true on week_picks_cleared
          if (data.type === 'week_picks_cleared' && data.clearedPicks === true) {
            const wk = data.activeWeek || data.week || getCurrentNFLWeek();
            setSquadSlots({ star1: null, star2: null, star3: null });
            setIsLocked(false);
            setRoomRosters((prev) =>
              prev.map((r) =>
                (r.sport || 'nfl') === 'nfl' && !r.room_code.includes('__')
                  ? { ...r, star_1_id: '', star_2_id: '', star_3_id: '', is_locked: false, device_id: 'UNLOCKED' }
                  : r
              )
            );
            fetchRoomRosters(roomCode, currentSport).then((fresh) => {
              if (fresh) setRoomRosters(fresh);
            });
            setRefreshTick((t) => t + 1);
            syncESPNData(currentSport).catch(() => {});
            showToast(`⚡ NFL Week ${wk} active! Previous week picks archived.`);
          } else if (data.type === 'weekly_rescan_completed') {
            // Matchup and injury updates only - protect all user picks
            setRefreshTick((t) => t + 1);
            syncESPNData(currentSport).catch(() => {});
          }
        } catch {}
      };

      sse.addEventListener('tuesday_rescan_completed', (e: any) => {
        processRescanPayload(e.data);
      });
      sse.addEventListener('week_picks_cleared', (e: any) => {
        processRescanPayload(e.data);
      });

      sse.onmessage = (e: any) => {
        processRescanPayload(e.data);
      };
    } catch {}

    return () => {
      window.removeEventListener('pixel_pros_weekly_rescan_completed', handleRescanEvent);
      window.removeEventListener('pixel_pros_week_picks_cleared', handlePicksCleared);
      if (sse) sse.close();
    };
  }, []);

  useEffect(() => {
    const handleMatchesUpdate = (e: any) => {
      if (e.detail?.matches && (!e.detail?.sport || e.detail?.sport === currentSport)) {
        const currentNFLWeek = getCurrentNFLWeek();
        const incoming: Match[] = Array.isArray(e.detail.matches) ? e.detail.matches : [];
        const filtered = incoming.filter((m) => {
          if (currentSport === 'nfl' && m.week && m.week !== currentNFLWeek) return false;
          return true;
        });
        const sorted = sortMatchesByKickoffAndStatus(filtered);
        setMatches((prev) => {
          if (prev.length === sorted.length) {
            let changed = false;
            for (let i = 0; i < sorted.length; i++) {
              const p = prev[i];
              const s = sorted[i];
              if (
                !p ||
                p.id !== s.id ||
                p.homeScore !== s.homeScore ||
                p.awayScore !== s.awayScore ||
                p.status !== s.status ||
                p.quarter_time !== s.quarter_time
              ) {
                changed = true;
                break;
              }
            }
            if (!changed) return prev;
          }
          return sorted;
        });
      }
    };
    const handleScoresUpdate = (e: any) => {
      if (e.detail?.competitors && (!e.detail?.sport || e.detail?.sport === currentSport)) {
        const fresh = deduplicateCompetitors(e.detail.competitors);
        setRoster((prev) => {
          if (prev.length === fresh.length) {
            let changed = false;
            for (let i = 0; i < fresh.length; i++) {
              const p = prev[i];
              const f = fresh[i];
              if (!p || p.id !== f.id || p.score !== f.score || p.injuryStatus !== f.injuryStatus) {
                changed = true;
                break;
              }
            }
            if (!changed) return prev;
          }
          return fresh;
        });
        setSquadSlots((prev) => {
          const s1 = prev.star1 ? fresh.find((p) => p.id === prev.star1!.id) || prev.star1 : null;
          const s2 = prev.star2 ? fresh.find((p) => p.id === prev.star2!.id) || prev.star2 : null;
          const s3 = prev.star3 ? fresh.find((p) => p.id === prev.star3!.id) || prev.star3 : null;
          if (
            s1?.id === prev.star1?.id &&
            s1?.score === prev.star1?.score &&
            s2?.id === prev.star2?.id &&
            s2?.score === prev.star2?.score &&
            s3?.id === prev.star3?.id &&
            s3?.score === prev.star3?.score
          ) {
            return prev;
          }
          return { star1: s1, star2: s2, star3: s3 };
        });
      }
    };

    window.addEventListener('pixel_pros_live_matches_updated', handleMatchesUpdate);
    window.addEventListener('pixel_pros_scores_updated', handleScoresUpdate);
    return () => {
      window.removeEventListener('pixel_pros_live_matches_updated', handleMatchesUpdate);
      window.removeEventListener('pixel_pros_scores_updated', handleScoresUpdate);
    };
  }, [currentSport]);

  useEffect(() => {
    const unsubscribeRoom = subscribeToRoomRosters(roomCode, currentSport, async () => {
      const fresh = await fetchRoomRosters(roomCode, currentSport);
      setRoomRosters((prev) => {
        const map = new Map<string, UserRoster>();
        for (const r of prev) map.set(`${r.room_code}__${r.user_name}`, r);
        for (const r of fresh) map.set(`${r.room_code}__${r.user_name}`, r);
        const nextList = Array.from(map.values());
        if (prev.length === nextList.length) {
          let hasDiff = false;
          for (let i = 0; i < nextList.length; i++) {
            const a = prev[i];
            const b = nextList[i];
            if (
              !a ||
              a.room_code !== b.room_code ||
              a.user_name !== b.user_name ||
              a.star_1_id !== b.star_1_id ||
              a.star_2_id !== b.star_2_id ||
              a.star_3_id !== b.star_3_id ||
              a.is_locked !== b.is_locked
            ) {
              hasDiff = true;
              break;
            }
          }
          if (!hasDiff) return prev;
        }
        return nextList;
      });

      const currentClean = (userNameRef.current || '').trim().toUpperCase();
      const currentSlate = activeSlateIdRef.current || 'SUPERSTARS';
      const targetRoom = getEffectiveRoomCodeForSlate(roomCode, currentSlate);

      if (currentClean) {
        const remoteSquad = fresh.find(
          (r) => (r.room_code || '').trim().toUpperCase() === targetRoom && (r.user_name || '').trim().toUpperCase() === currentClean
        );
        if (remoteSquad) {
          const currentRoster = rosterRef.current;
          let s1 = remoteSquad.star_1_id ? resolveCompetitorById(remoteSquad.star_1_id, currentRoster, null, currentSport) : null;
          let s2 = remoteSquad.star_2_id ? resolveCompetitorById(remoteSquad.star_2_id, currentRoster, null, currentSport) : null;
          let s3 = remoteSquad.star_3_id ? resolveCompetitorById(remoteSquad.star_3_id, currentRoster, null, currentSport) : null;

          if (currentSlate && currentSlate.includes('@') && currentSlate !== 'SUPERSTARS') {
            const [awayT, homeT] = currentSlate.split('@').map((t) => (t || '').trim().toUpperCase());
            const isPlayerInGame = (p: Competitor | null) => {
              if (!p) return false;
              const pTeam = (p.teamCode || '').trim().toUpperCase();
              return pTeam === awayT || pTeam === homeT;
            };
            if (s1 && !isPlayerInGame(s1)) s1 = null;
            if (s2 && !isPlayerInGame(s2)) s2 = null;
            if (s3 && !isPlayerInGame(s3)) s3 = null;
          }

          // Slot position auto-aligner: ensure QB -> star1, RB -> star2, WR/TE -> star3
          if (currentSport === 'nfl') {
            const loaded = [s1, s2, s3].filter(Boolean) as Competitor[];
            if (loaded.length > 0) {
              const mismatch =
                (s1 && !isPositionAllowedForSlot('star1', s1, 'nfl')) ||
                (s2 && !isPositionAllowedForSlot('star2', s2, 'nfl')) ||
                (s3 && !isPositionAllowedForSlot('star3', s3, 'nfl'));
              if (mismatch) {
                let newS1: Competitor | null = null;
                let newS2: Competitor | null = null;
                let newS3: Competitor | null = null;
                for (const p of loaded) {
                  if (!newS1 && isPositionAllowedForSlot('star1', p, 'nfl')) newS1 = p;
                  else if (!newS2 && isPositionAllowedForSlot('star2', p, 'nfl')) newS2 = p;
                  else if (!newS3 && isPositionAllowedForSlot('star3', p, 'nfl')) newS3 = p;
                }
                s1 = newS1;
                s2 = newS2;
                s3 = newS3;
              }
            }
          }

          const filledCount = [s1, s2, s3].filter(Boolean).length;
          const isExplicitlyUnlocked =
            remoteSquad.is_locked === false ||
            String(remoteSquad.is_locked) === 'false' ||
            String(remoteSquad.device_id).toUpperCase() === 'UNLOCKED';
          const isRemoteLocked =
            !isExplicitlyUnlocked &&
            Boolean(remoteSquad.is_locked || remoteSquad.device_id === 'LOCKED') &&
            filledCount === 3;

          setSquadSlots((prev) => {
            const curS1 = prev.star1?.id || '';
            const curS2 = prev.star2?.id || '';
            const curS3 = prev.star3?.id || '';
            const newS1 = s1?.id || '';
            const newS2 = s2?.id || '';
            const newS3 = s3?.id || '';
            if (curS1 !== newS1 || curS2 !== newS2 || curS3 !== newS3) {
              return { star1: s1, star2: s2, star3: s3 };
            }
            return prev;
          });

          if (Date.now() - unlockCooldownRef.current > 10000) {
            setIsLocked(isRemoteLocked);
          }
        }
      }
    });

    return () => {
      unsubscribeRoom();
    };
  }, [roomCode, currentSport]);

  // Resilient Network Layer: Re-validate room picks whenever user refocuses tab or resumes app
  useEffect(() => {
    const handleRevalidate = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchRoomRosters(roomCode, currentSport).then((fresh) => {
          if (fresh && fresh.length > 0) {
            setRoomRosters((prev) => {
              const map = new Map<string, UserRoster>();
              for (const r of prev) map.set(`${r.room_code}__${r.user_name}`, r);
              for (const r of fresh) map.set(`${r.room_code}__${r.user_name}`, r);
              return Array.from(map.values());
            });
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleRevalidate);
    window.addEventListener('focus', handleRevalidate);
    window.addEventListener('online', handleRevalidate);

    return () => {
      document.removeEventListener('visibilitychange', handleRevalidate);
      window.removeEventListener('focus', handleRevalidate);
      window.removeEventListener('online', handleRevalidate);
    };
  }, [roomCode, currentSport]);

  // Keep squadSlots strictly in sync with updated live scores and stats from roster
  useEffect(() => {
    if (!roster || roster.length === 0) return;
    setSquadSlots((prev) => {
      const curS1 = prev.star1;
      const curS2 = prev.star2;
      const curS3 = prev.star3;

      const nextS1 = curS1 ? roster.find((p) => p.id === curS1.id) || curS1 : null;
      const nextS2 = curS2 ? roster.find((p) => p.id === curS2.id) || curS2 : null;
      const nextS3 = curS3 ? roster.find((p) => p.id === curS3.id) || curS3 : null;

      const s1Diff = (curS1?.score !== nextS1?.score) || (JSON.stringify(curS1?.stats) !== JSON.stringify(nextS1?.stats));
      const s2Diff = (curS2?.score !== nextS2?.score) || (JSON.stringify(curS2?.stats) !== JSON.stringify(nextS2?.stats));
      const s3Diff = (curS3?.score !== nextS3?.score) || (JSON.stringify(curS3?.stats) !== JSON.stringify(nextS3?.stats));

      if (s1Diff || s2Diff || s3Diff) {
        return { star1: nextS1, star2: nextS2, star3: nextS3 };
      }
      return prev;
    });
  }, [roster]);

  const getPlayerLivePoints = useCallback(
    (p: Competitor | null | undefined): number => {
      if (!p) return 0;
      const playerTeam = (p.teamCode || '').trim().toUpperCase();
      const currentNFLWeek = getCurrentNFLWeek();
      const m = (matches || []).find((match) => {
        if (currentSport === 'nfl' && match.week && match.week !== currentNFLWeek) return false;
        const h = (match.homeTeamCode || match.home_team || '').trim().toUpperCase();
        const a = (match.awayTeamCode || match.away_team || '').trim().toUpperCase();
        return h === playerTeam || a === playerTeam;
      });
      const info = getPlayerScoringDisplay(p, m, currentSport);
      return info.gameState === 'pre' ? 0 : info.activeScore;
    },
    [matches, currentSport]
  );

  const filledStars = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean) as Competitor[];
  const userTotalPoints = filledStars.reduce((sum, p) => sum + getPlayerLivePoints(p), 0);

  const selectedPlayerIdsArray = [
    squadSlots.star1?.id || '',
    squadSlots.star2?.id || '',
    squadSlots.star3?.id || '',
  ].filter(Boolean);

  const currentEffectiveRoom = getEffectiveRoomCodeForSlate(roomCode, activeSlateId);

  const isCurrentSquadLocked =
    Boolean(userName) &&
    selectedPlayerIdsArray.length === 3 &&
    Boolean(isLocked);

  const squadPillsData = useMemo(() => {
    const baseCode = (roomCode || 'COUCH').toUpperCase();
    // Gather all members of this league room across base room and all game slates
    const memberNames = Array.from(
      new Set(
        roomRosters
          .filter(
            (r) =>
              !isGhostUser(r.user_name) &&
              ((r.room_code || '').toUpperCase() === baseCode ||
                (r.room_code || '').toUpperCase().startsWith(`${baseCode}__`))
          )
          .map((r) => r.user_name.toUpperCase())
      )
    );

    if (userName && !memberNames.includes(userName.toUpperCase())) {
      memberNames.push(userName.toUpperCase());
    }

    const pills = memberNames.map((uName) => {
      const isCurrent = Boolean(userName && uName === userName.toUpperCase());
      if (isCurrent) {
        return {
          userName: uName,
          name: uName,
          isLocked: isCurrentSquadLocked,
          isComplete: filledStars.length === 3,
          isCurrent: true,
          starCount: filledStars.length,
          totalScore: userTotalPoints,
        };
      }

      const slateRoster = roomRosters.find(
        (r) =>
          (r.room_code || '').toUpperCase() === currentEffectiveRoom &&
          r.user_name.toUpperCase() === uName
      );

      const s1 = slateRoster ? roster.find((p) => p.id === slateRoster.star_1_id) : null;
      const s2 = slateRoster ? roster.find((p) => p.id === slateRoster.star_2_id) : null;
      const s3 = slateRoster ? roster.find((p) => p.id === slateRoster.star_3_id) : null;
      const stars = [s1, s2, s3].filter(Boolean) as Competitor[];
      const squadLocked =
        stars.length === 3 &&
        Boolean(
          slateRoster?.is_locked ||
            slateRoster?.device_id === 'LOCKED' ||
            getSquadLockState(currentEffectiveRoom, uName, currentSport)
        );

      return {
        userName: uName,
        name: uName,
        isLocked: squadLocked,
        isComplete: stars.length === 3,
        isCurrent: false,
        starCount: stars.length,
        totalScore: stars.reduce((sum, p) => sum + getPlayerLivePoints(p), 0),
      };
    });

    return pills;
  }, [
    roomRosters,
    roomCode,
    userName,
    currentEffectiveRoom,
    isCurrentSquadLocked,
    filledStars.length,
    userTotalPoints,
    roster,
    currentSport,
    getPlayerLivePoints,
  ]);

  const slatePicksStatus = useMemo(() => {
    const statusMap: Record<string, { count: number; isLocked: boolean }> = {};
    const baseCode = (roomCode || 'COUCH').toUpperCase();
    const cleanUser = (userName || '').trim().toUpperCase();

    if (!cleanUser) return statusMap;

    // Superstars status
    const superRoster = roomRosters.find(
      (r) => (r.room_code || '').toUpperCase() === baseCode && r.user_name.toUpperCase() === cleanUser
    );
    if (activeSlateId === 'SUPERSTARS') {
      statusMap['SUPERSTARS'] = {
        count: filledStars.length,
        isLocked: isCurrentSquadLocked,
      };
    } else {
      const superPicks = [superRoster?.star_1_id, superRoster?.star_2_id, superRoster?.star_3_id].filter(Boolean);
      statusMap['SUPERSTARS'] = {
        count: superPicks.length,
        isLocked: Boolean(
          superRoster?.is_locked ||
            superRoster?.device_id === 'LOCKED' ||
            getSquadLockState(baseCode, cleanUser, currentSport)
        ),
      };
    }

    // Match slates status
    matches.forEach((m) => {
      const away = (m.awayTeamCode || m.away_team || '').toUpperCase();
      const home = (m.homeTeamCode || m.home_team || '').toUpperCase();
      const slateKey = `${away}@${home}`;
      const effectiveR = `${baseCode}__${away}_${home}`;

      if (activeSlateId === slateKey) {
        statusMap[slateKey] = {
          count: filledStars.length,
          isLocked: isCurrentSquadLocked,
        };
      } else {
        const slateRoster = roomRosters.find(
          (r) => (r.room_code || '').toUpperCase() === effectiveR && r.user_name.toUpperCase() === cleanUser
        );
        let picksCount = [slateRoster?.star_1_id, slateRoster?.star_2_id, slateRoster?.star_3_id].filter(Boolean).length;
        if (picksCount === 0 && typeof localStorage !== 'undefined') {
          try {
            const cached = localStorage.getItem(`pixel_pros_roster_${currentSport}_${effectiveR}_${cleanUser}`);
            if (cached) {
              const ids = JSON.parse(cached);
              if (Array.isArray(ids)) {
                picksCount = ids.filter(Boolean).length;
              }
            }
          } catch {}
        }
        statusMap[slateKey] = {
          count: picksCount,
          isLocked: Boolean(
            slateRoster?.is_locked ||
              slateRoster?.device_id === 'LOCKED' ||
              getSquadLockState(effectiveR, cleanUser, currentSport)
          ),
        };
      }
    });

    return statusMap;
  }, [
    roomRosters,
    roomCode,
    userName,
    activeSlateId,
    filledStars.length,
    isCurrentSquadLocked,
    currentSport,
    matches,
  ]);

  const maxSquadScore = squadPillsData.reduce((max, s) => Math.max(max, s.totalScore ?? 0), 0);

  const activeUser: UserProfile = {
    ...INITIAL_USER,
    username: userName,
    totalScore: userTotalPoints,
    selectedPlayerIds: selectedPlayerIdsArray,
    isLocked: isCurrentSquadLocked,
  };

  const cleanRoom = getBaseSeasonRoom(roomCode || 'COUCH');

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#0b1021] text-[#fae5b8] selection:bg-[#12579b] selection:text-white">
        <header className="flex-shrink-0 z-40 bg-[#080d1a] border-b-2 border-[#1a264a] w-full shadow-md overflow-x-hidden box-border">
          {/* Mobile Header (2-Row Layout, screen width <= 600px) */}
          <div className="sm:hidden w-full flex flex-col box-border">
            {/* Row 1: Left: Logo (PROS) | Center: Sport switcher [ 🏈 | 🏀 ] | Right: Pinned Room badge + Rules */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#1a264a]/80 bg-[#080d1a] gap-1.5">
              {/* Left: Pixel Pros logo icon and PROS title */}
              <button
                type="button"
                onClick={() => setCurrentTab('squad')}
                className="touch-manipulation flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 text-left shrink-0"
              >
                {currentSport === 'nfl' ? (
                  <PixelShieldIcon size={20} color="#155e9e" className="shrink-0" />
                ) : (
                  <span className="text-base select-none">🏀</span>
                )}
                <span className="font-pixel text-[11px] text-[#fae5b8] tracking-wider font-bold">PROS</span>
              </button>

              {/* Center: Sport switcher [ 🏈 | 🏀 ] in compact pill */}
              <div className="shrink-0 flex items-center justify-center">
                <SportSwitcher currentSport={currentSport} onSportChange={handleSportChange} />
              </div>

              {/* Mobile Right Controls: Couch + Admin + Scoring Rules */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTempRoomCode(roomCode);
                    setIsRoomModalOpen(true);
                  }}
                  className="touch-manipulation flex items-center gap-1 px-1.5 py-0.5 bg-[#1a2238] hover:bg-[#283554] border border-[#d4a86a] text-[#fde047] rounded-xs font-pixel text-[9px] cursor-pointer shrink-0"
                  title={`Couch: ${cleanRoom} (Click to switch)`}
                >
                  <span>🛋️</span>
                  <span className="font-bold truncate max-w-[65px]">{cleanRoom}</span>
                </button>

                <button
                  type="button"
                  id="mobile-admin-console-btn"
                  onClick={() => setIsCommissionerOpen(true)}
                  className="touch-manipulation w-6.5 h-6.5 flex items-center justify-center bg-[#1a2238] hover:bg-[#283554] text-[#38bdf8] border border-[#3b82f6]/60 rounded-xs cursor-pointer shrink-0 active:scale-95"
                  title="Master Admin Console (Rooms, Squads & ESPN Data Sync)"
                  aria-label="Master Admin Console"
                >
                  <ShieldAlert size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(true)}
                  className="touch-manipulation w-6.5 h-6.5 flex items-center justify-center bg-[#1a2238] text-[#fde047] border border-[#273552] rounded-xs cursor-pointer shrink-0 active:scale-95"
                  title="How Scoring Works"
                  aria-label="How Scoring Works"
                >
                  <HelpCircle size={13} />
                </button>
              </div>
            </div>

            {/* Row 2: Full-Width Navigation Segmented Tabs [ SQUAD ] [ LEADERBOARD ] */}
            <div className="grid grid-cols-2 gap-1.5 px-2 py-1 bg-[#090e1f] border-b border-[#1a264a]/70 w-full box-border">
              <button
                type="button"
                onClick={() => setCurrentTab('squad')}
                className={`touch-manipulation py-1.5 flex items-center justify-center gap-1.5 font-pixel text-[10px] rounded-xs border-2 cursor-pointer transition-all active:scale-[0.98] ${
                  currentTab === 'squad'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#38bdf8] font-bold shadow-xs'
                    : 'bg-[#141d33] text-[#fae5b8]/70 border-[#273552] hover:text-[#fae5b8]'
                }`}
              >
                <Users size={12} className={currentTab === 'squad' ? 'text-[#38bdf8]' : ''} />
                <span>SQUAD</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchToBoard}
                className={`touch-manipulation py-1.5 flex items-center justify-center gap-1.5 font-pixel text-[10px] rounded-xs border-2 cursor-pointer transition-all active:scale-[0.98] ${
                  currentTab === 'couch'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#38bdf8] font-bold shadow-xs'
                    : 'bg-[#141d33] text-[#fae5b8]/70 border-[#273552] hover:text-[#fae5b8]'
                }`}
              >
                <Trophy size={12} className={currentTab === 'couch' ? 'text-[#facc15]' : ''} />
                <span>LEADERBOARD</span>
              </button>
            </div>
          </div>

          {/* Desktop & Landscape Header (> 600px) */}
          <div className="hidden sm:flex max-w-5xl mx-auto px-2 sm:px-3 md:px-4 w-full py-1 sm:py-1.5 items-center justify-between gap-1 sm:gap-2 box-border">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setCurrentTab('squad')}
                className="touch-manipulation flex items-center gap-1.5 sm:gap-2 cursor-pointer group bg-transparent border-0 p-0 text-left shrink-0"
              >
                {currentSport === 'nfl' ? (
                  <PixelShieldIcon size={22} color="#155e9e" className="shrink-0" />
                ) : (
                  <span className="text-base select-none">🏀</span>
                )}
                <span className="font-pixel text-[10px] sm:text-xs md:text-sm text-[#fae5b8] tracking-wider group-hover:text-white transition-colors whitespace-nowrap">
                  <span className="hidden md:inline">PIXEL </span>PROS
                </span>
              </button>

              <SportSwitcher currentSport={currentSport} onSportChange={handleSportChange} />
            </div>

            <nav className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setCurrentTab('squad')}
                className={`touch-manipulation px-2.5 py-1 sm:px-3 sm:py-1 flex items-center justify-center gap-1.5 font-pixel text-[10px] md:text-xs border-2 cursor-pointer transition-all ${
                  currentTab === 'squad'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-1 ring-[#38bdf8] font-bold shadow-xs'
                    : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552]'
                }`}
              >
                <Users size={12} className={currentTab === 'squad' ? 'text-[#38bdf8]' : ''} />
                <span>SQUAD</span>
              </button>

              <button
                onClick={handleSwitchToBoard}
                className={`touch-manipulation px-2.5 py-1 sm:px-3 sm:py-1 flex items-center justify-center gap-1.5 font-pixel text-[10px] md:text-xs border-2 cursor-pointer transition-all ${
                  currentTab === 'couch'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-1 ring-[#38bdf8] font-bold shadow-xs'
                    : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552]'
                }`}
              >
                <Trophy size={12} className={currentTab === 'couch' ? 'text-[#facc15]' : ''} />
                <span>LEADERBOARD</span>
              </button>
            </nav>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTempRoomCode(roomCode);
                  setIsRoomModalOpen(true);
                }}
                className="touch-manipulation flex items-center gap-1.5 px-2.5 py-1 bg-[#1a2238] hover:bg-[#283554] border border-[#d4a86a] text-[#fde047] rounded-xs font-pixel text-[9px] sm:text-xs cursor-pointer shadow-xs shrink-0"
                title={`Couch: ${cleanRoom} (Click to switch)`}
              >
                <span>🛋️</span>
                <span className="font-bold">{cleanRoom}</span>
              </button>

              <button
                type="button"
                onClick={handleShareRoom}
                className="touch-manipulation flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#064e3b] hover:bg-[#047857] text-[#34d399] hover:text-white border border-[#059669] rounded-xs font-pixel text-[9px] sm:text-xs cursor-pointer shadow-xs shrink-0"
                title="Invite to Couch"
              >
                <Share2 size={11} />
                <span className="hidden xl:inline">INVITE</span>
              </button>

              <button
                type="button"
                id="desktop-admin-console-btn"
                onClick={() => setIsCommissionerOpen(true)}
                className="touch-manipulation flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#1a2238] hover:bg-[#283554] border border-[#3b82f6]/60 hover:border-[#38bdf8] text-[#38bdf8] rounded-xs font-pixel text-[9px] sm:text-xs cursor-pointer shadow-xs shrink-0"
                title="Master Admin Console (Manage Couches, Squads & ESPN Data Sync)"
              >
                <ShieldAlert size={12} className="text-[#38bdf8]" />
                <span className="hidden sm:inline font-bold">ADMIN</span>
              </button>

              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="touch-manipulation w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-[#1a2238] text-[#fde047] border border-[#273552] rounded-xs cursor-pointer shrink-0"
                title="How Scoring Works"
              >
                <HelpCircle size={13} />
              </button>
            </div>
          </div>
        </header>

        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-[90vw]">
            <div className="bg-[#064e3b] text-[#fae5b8] px-3.5 py-1.5 border-2 border-[#10b981] rounded-xs font-pixel text-[10px] sm:text-xs shadow-xl flex items-center justify-center gap-2">
              <span className="font-bold">{toastMessage}</span>
            </div>
          </div>
        )}

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-1.5 sm:px-6 sm:py-4 overscroll-contain relative box-border ${
            currentSport === 'nba' ? 'basketball-court' : 'football-field'
          }`}
        >
          {currentSport === 'nfl' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-between items-center opacity-15 px-4 sm:px-8 text-white font-pixel text-2xl sm:text-4xl select-none">
              <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span>
            </div>
          )}

          {currentSport === 'nba' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-between items-center opacity-15 px-4 sm:px-8 text-[#fae5b8] font-pixel text-xl sm:text-3xl select-none">
              <span>KEY</span><span>3-PT</span><span>HALF</span><span>3-PT</span><span>KEY</span>
            </div>
          )}

          <div className="relative z-10 max-w-5xl mx-auto w-full px-0.5 sm:px-4 py-1 sm:py-4 box-border">
            {currentTab === 'squad' && (
              <MyTeamView
                slots={squadSlots}
                userName={userName}
                roomCode={roomCode}
                previousRoom={previousRoom}
                isLocked={isCurrentSquadLocked}
                matches={matches}
                sport={currentSport}
                activeSlateId={activeSlateId}
                onSelectSlate={handleSelectSlate}
                slatePicksStatus={slatePicksStatus}
                allPlayers={roster}
                roomRosters={roomRosters}
                squads={squadPillsData}
                onSelectSquad={handleSelectSquad}
                onSwitchToStandings={handleSwitchToBoard}
                onCommitUserName={(name) => setUserName(name.toUpperCase())}
                onCommitRoomCode={handleCommitRoomCode}
                onSelectSlot={(slotKey) => setActiveSlot(slotKey)}
                onClearSlot={handleClearSlot}
                onToggleLock={handleToggleLock}
                onLockSquad={handleLockSquad}
                onUnlockSquad={handleUnlockSquad}
                onLockedSlotAttempt={() => showToast('Lineup is LOCKED!')}
                onInspectPlayer={(player) => setDetailedPlayer(player)}
                onRequestCreateSquad={() => setIsAddSquadDrawerOpen(true)}
              />
            )}

            {currentTab === 'couch' && (
              <LeaderboardView
                user={activeUser}
                nflCompetitors={roster}
                roomRosters={roomRosters}
                matches={matches}
                roomCode={roomCode}
                userName={userName}
                sport={currentSport}
                activeSlateId={activeSlateId}
                onSelectSlate={handleSelectSlate}
                onSwitchToPicks={() => setCurrentTab('squad')}
                isGameRoomMode={appMode === 'game'}
                onCommitRoomCode={handleCommitRoomCode}
                onCommitUserName={(name) => setUserName(name.toUpperCase())}
                onOpenPlayerDetail={(player) => setDetailedPlayer(player)}
                onSelectSquad={handleSelectSquad}
              />
            )}
          </div>
        </main>

        <footer className="flex-shrink-0 bg-[#080d1a] border-t-2 border-[#1a264a] py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[10px] sm:text-xs font-retro text-[#fae5b8]/75 z-20">
          <div className="max-w-5xl mx-auto px-4 w-full flex items-center justify-center gap-2">
            <span className="font-bold text-[#fae5b8]">PIXEL PROS {currentSport.toUpperCase()}</span>
            <span className="text-[#38bdf8]/60">·</span>
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="hover:underline text-[#fde047] cursor-pointer font-bold"
            >
              RULES (?)
            </button>
          </div>
        </footer>

        {isRulesModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto"
            onClick={() => setIsRulesModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#0b1021] border-4 border-[#1a264a] p-3 sm:p-4 text-[#fae5b8] rounded-xs shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pinned Sticky Header with Prominent Close Button */}
              <div className="flex items-center justify-between border-b-2 border-[#1a264a] pb-2 mb-2 shrink-0">
                <h2 className="font-pixel text-xs sm:text-sm text-[#fae5b8] uppercase font-bold flex items-center gap-1.5">
                  <span>📖</span>
                  <span>{currentSport.toUpperCase()} SCORING RULES</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(false)}
                  className="touch-manipulation px-2.5 py-1 bg-[#b91c1c] hover:bg-[#dc2626] active:bg-[#991b1b] text-white font-pixel text-xs rounded-xs font-bold cursor-pointer border border-[#ef4444]/60 shadow-xs flex items-center gap-1"
                  aria-label="Close rules"
                >
                  <X size={13} strokeWidth={3} />
                  <span>CLOSE</span>
                </button>
              </div>

              {/* Scrollable Rules Content */}
              <div className="flex-1 overflow-y-auto pr-1">
                <SimpleRulesView sport={currentSport} />
              </div>

              {/* Bottom Quick Dismiss for Mobile */}
              <div className="pt-2 border-t border-[#1a264a] mt-2 shrink-0 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsRulesModalOpen(false)}
                  className="touch-manipulation px-3 py-1 bg-[#1a2238] hover:bg-[#273552] text-[#93c5fd] font-pixel text-xs rounded-xs border border-[#3b82f6]/40 cursor-pointer"
                >
                  GOT IT (CLOSE)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSlot !== null && (
          <PlayerPickerModal
            isOpen={activeSlot !== null}
            onClose={() => setActiveSlot(null)}
            activeSlot={activeSlot}
            allPlayers={roster}
            currentSlotPlayerId={squadSlots[activeSlot]?.id || null}
            selectedPlayerIds={selectedPlayerIdsArray}
            matches={matches}
            sport={currentSport}
            restrictToMatchPair={activeSlateId === 'SUPERSTARS' ? 'SUPERSTARS' : activeSlateId}
            onInspectPlayer={(player) => setDetailedPlayer(player)}
            onSelectPlayer={(player, targetSlot) => {
              handleAssignSlot(player, targetSlot);
              setActiveSlot(null);
              setDetailedPlayer(null);
            }}
          />
        )}

        {detailedPlayer && (
          <PlayerCardModal
            player={detailedPlayer}
            match={matches.find(m =>
              m.home_team === detailedPlayer.teamCode ||
              m.away_team === detailedPlayer.teamCode ||
              m.homeTeamCode === detailedPlayer.teamCode ||
              m.awayTeamCode === detailedPlayer.teamCode
            ) || null}
            onClose={() => setDetailedPlayer(null)}
            sport={currentSport}
            isLocked={isCurrentSquadLocked}
            isSelectedForTeam={selectedPlayerIdsArray.includes(detailedPlayer.id)}
            onSelectForTeam={(player) => {
              if (isCurrentSquadLocked) {
                showToast('Squad is LOCKED! Click [ 🔓 UNLOCK SQUAD ] to make substitutions.');
                return;
              }
              const target: ActiveSlot = activeSlot && isPositionAllowedForSlot(activeSlot, player, currentSport)
                ? activeSlot
                : getCorrectSlotForPlayer(player, currentSport);
              handleAssignSlot(player, target);
              setDetailedPlayer(null);
              setActiveSlot(null);
            }}
            onSwapThisStar={() => {
              if (isCurrentSquadLocked) {
                showToast('Squad is LOCKED! Click [ 🔓 UNLOCK SQUAD ] to make substitutions.');
                return;
              }
              setDetailedPlayer(null);
              setActiveSlot('star1');
            }}
            onDropPlayer={(player) => {
              if (isCurrentSquadLocked) {
                showToast('Squad is LOCKED! Click [ 🔓 UNLOCK SQUAD ] to make substitutions.');
                return;
              }
              const slotKey: ActiveSlot | null = squadSlots.star1?.id === player.id
                ? 'star1'
                : squadSlots.star2?.id === player.id
                ? 'star2'
                : squadSlots.star3?.id === player.id
                ? 'star3'
                : null;
              if (slotKey) {
                handleClearSlot(slotKey);
              }
              setDetailedPlayer(null);
            }}
          />
        )}

        {isRoomModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="pixel-box-cream p-4 sm:p-5 w-full max-w-[440px] border-4 border-[#1a2238] max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2 mb-3">
                <h3 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold uppercase tracking-wider">
                  SWITCH {currentSport.toUpperCase()} COUCH
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="w-6 h-6 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs cursor-pointer flex items-center justify-center rounded-xs"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (tempRoomCode.trim()) {
                    handleCommitRoomCode(tempRoomCode);
                    setIsRoomModalOpen(false);
                  }
                }}
              >
                <label className="block font-pixel text-[10px] text-[#5c3509] mb-1 font-bold">
                  COUCH CODE:
                </label>
                <div className="flex gap-2 mb-3.5">
                  <input
                    type="text"
                    value={tempRoomCode}
                    onChange={(e) => setTempRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. COUCH or GAMEDAY"
                    className="flex-1 min-w-0 px-3 py-2 bg-[#fae9c8] border-2 border-[#c99a57] font-pixel text-xs sm:text-sm text-[#451a03] text-center uppercase tracking-wider rounded-xs focus:outline-none focus:border-[#12579b]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 sm:px-4 py-2 bg-[#12579b] hover:bg-[#1a6cb8] text-[#fae5b8] font-pixel text-xs font-bold rounded-xs cursor-pointer shadow-[0_2px_0_0_#0a2e52] active:translate-y-0.5 whitespace-nowrap"
                  >
                    JOIN COUCH
                  </button>
                </div>

                {/* Consolidated Active Database Couches */}
                <div className="mb-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-pixel text-[10px] text-[#5c3509] font-bold flex items-center gap-1">
                      ⭐ ACTIVE COUCHES ({activeCouches.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoadingRooms(true);
                        fetchAllActiveRooms(roomCode, currentSport, roomRosters)
                          .then((rooms) => {
                            setAvailableRooms(rooms);
                            showToast('Refreshed couches from database!');
                          })
                          .finally(() => {
                            setIsLoadingRooms(false);
                          });
                      }}
                      className="font-pixel text-[9px] text-[#12579b] hover:text-[#1a6cb8] underline cursor-pointer flex items-center gap-1"
                    >
                      {isLoadingRooms ? 'SYNCING...' : '🔄 REFRESH'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                    {activeCouches.length === 0 ? (
                      <div className="p-3 text-center text-[10px] font-retro text-[#784610] bg-[#ebd2a4]/50 border border-[#c99a57] rounded-xs">
                        No active couches found. Enter a Couch Code above to start one!
                      </div>
                    ) : (
                      activeCouches.map((c) => {
                        const isCurrent = (roomCode || '').toUpperCase() === c.roomCode.toUpperCase();
                        const teamCountLabel = c.squadCount === 1 ? '1 Team' : `${c.squadCount} Teams`;
                        const icon = c.sport === 'nba' ? '🏀' : '🛋️';
                        const teamsPreview = c.squadNames && c.squadNames.length > 0 ? c.squadNames.join(', ') : 'No teams yet';

                        return (
                          <button
                            key={c.roomCode}
                            type="button"
                            onClick={() => {
                              setTempRoomCode(c.roomCode);
                              handleCommitRoomCode(c.roomCode);
                              setIsRoomModalOpen(false);
                            }}
                            className={`touch-manipulation p-2 font-pixel text-left rounded-xs border-2 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-xs active:translate-y-0.5 ${
                              isCurrent
                                ? 'bg-[#12579b] text-white border-[#0a2e52] shadow-[0_2px_0_0_#0a2e52]'
                                : 'bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border-[#c99a57] hover:border-[#b48340]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base">{icon}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold tracking-wider text-xs sm:text-sm">{c.roomCode}</span>
                                  <span className="text-[7.5px] px-1 py-0.2 bg-[#f59e0b]/20 text-[#b45309] border border-[#f59e0b]/40 font-bold rounded-2xs uppercase">
                                    SEASON-LONG
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[8px] px-1 py-0.2 bg-[#f59e0b] text-[#0f172a] font-bold rounded-2xs uppercase">
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[9px] font-retro truncate ${isCurrent ? 'text-[#bfdbfe]' : 'text-[#784610]'}`}>
                                  {c.squadCount > 0 ? `Teams: ${teamsPreview}` : 'Ready for first squad'}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className={`text-[10px] font-bold font-retro block ${isCurrent ? 'text-[#fde047]' : 'text-[#12579b]'}`}>
                                {teamCountLabel}
                              </span>
                              <span className={`text-[8px] uppercase ${isCurrent ? 'text-white/80' : 'text-[#8c532b]'}`}>
                                {isCurrent ? 'Active' : 'Tap to Enter →'}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Out-of-the-way Archived Couches Section */}
                {archivedCouches.length > 0 && (
                  <div className="mb-3.5 pt-2 border-t border-[#d4a86a]/60">
                    <button
                      type="button"
                      onClick={() => setShowArchivedInSwitcher((prev) => !prev)}
                      className="w-full flex items-center justify-between p-2 bg-[#ebd2a4]/70 hover:bg-[#ebd2a4] border border-[#c99a57] rounded-xs font-pixel text-[10px] text-[#784610] cursor-pointer transition-all"
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <span>📁</span> ARCHIVED COUCHES ({archivedCouches.length})
                      </span>
                      <span className="text-[9px] font-bold text-[#12579b]">
                        {showArchivedInSwitcher ? '▲ HIDE ARCHIVED' : '▼ SHOW ARCHIVED'}
                      </span>
                    </button>

                    {showArchivedInSwitcher && (
                      <div className="mt-2 flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {archivedCouches.map((c) => {
                          const icon = c.sport === 'nba' ? '🏀' : '🛋️';
                          return (
                            <div
                              key={c.roomCode}
                              className="p-2 font-pixel rounded-xs border border-[#b38947] bg-[#d8c29a]/90 text-[#5c3509] flex items-center justify-between gap-2 shadow-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span>{icon}</span>
                                  <span className="font-bold tracking-wider text-xs">{c.roomCode}</span>
                                  <span className="text-[8px] px-1 py-0.2 bg-[#78350f] text-[#fae5b8] font-bold rounded-2xs">
                                    ARCHIVED
                                  </span>
                                </div>
                                <div className="text-[9px] font-retro text-[#784610] truncate">
                                  {c.squadCount > 0 ? `${c.squadCount} Squads: ${c.squadNames.join(', ')}` : 'Empty couch'}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await unarchiveRoom(c.roomCode, c.sport);
                                    showToast(`Restored room "${c.roomCode}"!`);
                                    handleCommitRoomCode(c.roomCode, c.sport);
                                    setIsRoomModalOpen(false);
                                  }}
                                  className="px-2.5 py-1.5 bg-[#12579b] hover:bg-[#1a6cb8] text-[#fae5b8] font-pixel text-[9px] font-bold rounded-xs cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                                >
                                  RESTORE & LOAD →
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await unarchiveRoom(c.roomCode, c.sport);
                                    setTempRoomCode(c.roomCode);
                                    handleCommitRoomCode(c.roomCode, c.sport);
                                    setIsRoomModalOpen(false);
                                  }}
                                  className="px-2.5 py-1.5 bg-[#fae5b8] hover:bg-white text-[#5c3509] border border-[#c99a57] font-pixel text-[9px] font-bold rounded-xs cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                                >
                                  VIEW →
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Commissioner Mode Link in Room Modal */}
                <div className="mb-3 pt-2.5 border-t border-[#d4a86a] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoomModalOpen(false);
                      setIsCommissionerOpen(true);
                    }}
                    className="text-[10px] font-pixel text-[#12579b] hover:text-[#1a6cb8] flex items-center gap-1 cursor-pointer underline"
                  >
                    <ShieldAlert size={12} />
                    OPEN MASTER ADMIN & DATA SYNC CONSOLE
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(false)}
                    className="px-4 py-1.5 bg-[#784610] hover:bg-[#8f5415] text-[#fae5b8] font-pixel text-[10px] font-bold rounded-xs cursor-pointer"
                  >
                    CLOSE
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <CommissionerModal
          isOpen={isCommissionerOpen}
          onClose={() => setIsCommissionerOpen(false)}
          currentRoom={roomCode}
          currentSport={currentSport}
          roomRosters={roomRosters}
          matches={matches}
          onSwitchRoom={(newRoom, newSport) => {
            handleCommitRoomCode(newRoom, newSport);
          }}
          onRefreshData={triggerRefresh}
          showToast={showToast}
        />
      </div>
    </ErrorBoundary>
  );
}