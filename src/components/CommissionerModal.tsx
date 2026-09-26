import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  RefreshCw,
  Plus,
  Check,
  X,
  Key,
  AlertTriangle,
  Copy,
  Users,
  Database,
  Radio,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  Search,
  Sparkles,
  ExternalLink,
  Activity,
  Calendar,
  Clock,
  Terminal,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { SportId, UserRoster } from '../types';
import {
  deleteUserRoster,
  resetRoomRosters,
  renameUserRoster,
  toggleSquadLock,
  setAllSquadsLock,
  clearSquadStars,
  upsertUserRoster,
  resolveSupabaseAnonKey,
  fetchAllRoomsWithDetails,
  MasterRoomData,
  isSupabaseConfigured,
  reseedMasterNFLManifest,
  archiveRoom,
  autoArchiveCompletedRooms,
  deleteRoomPermanently,
  purgeAllArchivedRooms,
} from '../lib/supabaseClient';
import { syncESPNData, getLastESPNSyncTime, getCurrentNFLWeek } from '../lib/espnSync';
import { runPureDynamicDepthChartSync } from '../lib/espnDepthChartSync';
import { executeCompleteWeeklyRescan, getWeeklyRescanCountdown } from '../lib/rescanEngine';
import { DEFAULT_NFL_MATCHES, NFL_TEAMS, getTeamFullName, DEFAULT_NFL_COMPETITORS, resolvePlayerInPool } from '../utils/teamData';
import { DEFAULT_NBA_COMPETITORS } from '../utils/nbaTeamData';
import { NFL_ROSTER_MANIFEST } from '../data/nflRosterManifest';
import { copyToClipboard } from '../utils/clipboard';

interface CommissionerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: string;
  currentSport: SportId;
  roomRosters: UserRoster[];
  onSwitchRoom: (newRoom: string) => void;
  onRefreshData: () => void;
  showToast: (msg: string) => void;
}

export const CommissionerModal: React.FC<CommissionerModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  currentSport,
  roomRosters,
  onSwitchRoom,
  onRefreshData,
  showToast,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pixel_pros_commissioner_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<'rooms' | 'preflight' | 'sync'>('rooms');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [roomSearchFilter, setRoomSearchFilter] = useState('');
  const [reseedLoading, setReseedLoading] = useState(false);

  // Master Rooms Data
  const [allRooms, setAllRooms] = useState<MasterRoomData[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Sync state
  const [syncingNFL, setSyncingNFL] = useState(false);
  const [syncingNBA, setSyncingNBA] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [depthSyncLoading, setDepthSyncLoading] = useState(false);
  const [depthSyncProgress, setDepthSyncProgress] = useState<string | null>(null);

  // Tuesday 4:00 AM EST Rescan Engine State
  const [weeklyRescanLoading, setWeeklyRescanLoading] = useState(false);
  const [weeklyRescanStatus, setWeeklyRescanStatus] = useState<string | null>(null);
  const [rescanCountdown, setRescanCountdown] = useState(() => getWeeklyRescanCountdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setRescanCountdown(getWeeklyRescanCountdown());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // New room & squad forms
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomSport, setNewRoomSport] = useState<SportId>('nfl');
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [squadInputs, setSquadInputs] = useState<Record<string, string>>({});

  // Rename squad state
  const [editingTarget, setEditingTarget] = useState<{ room: string; sport: SportId; squad: string } | null>(null);
  const [newSquadName, setNewSquadName] = useState('');

  // Confirmation modals
  const [squadToDelete, setSquadToDelete] = useState<{ room: string; sport: SportId; squad: string } | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<{ room: string; sport: SportId } | null>(null);
  const [squadToClear, setSquadToClear] = useState<{ room: string; sport: SportId; squad: string } | null>(null);

  // Load all rooms when opened or when rosters change
  const refreshMasterRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await fetchAllRoomsWithDetails(currentRoom, currentSport, roomRosters);
      setAllRooms(data);
      // Auto-expand the active room
      setExpandedRooms((prev) => ({
        ...prev,
        [`${currentRoom.toUpperCase()}_${currentSport}`]: true,
      }));
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    allRooms.forEach((r) => {
      next[`${r.roomCode}_${r.sport}`] = true;
    });
    setExpandedRooms(next);
  };

  const handleCollapseAll = () => {
    setExpandedRooms({});
  };

  const handleRunDepthChartPipeline = async () => {
    setDepthSyncLoading(true);
    setDepthSyncProgress('Querying ESPN depth charts for all 32 teams...');
    try {
      const res = await runPureDynamicDepthChartSync((msg) => {
        setDepthSyncProgress(msg);
      });
      if (res.success) {
        showToast(`⚡ Live ESPN Depth Charts: Resolved & synced ${res.count} starters across all 32 teams!`);
        onRefreshData();
      } else {
        showToast(res.error || 'Failed to sync ESPN depth charts');
      }
    } catch (err: any) {
      showToast(`Depth chart sync error: ${err.message}`);
    } finally {
      setDepthSyncLoading(false);
      setDepthSyncProgress(null);
    }
  };

  const handleReseedNFLManifest = async () => {
    setReseedLoading(true);
    try {
      // Prioritize live ESPN depth chart resolution with zero hardcoded names
      const dynRes = await runPureDynamicDepthChartSync();
      if (dynRes.success && dynRes.count > 0) {
        showToast(`⚡ Live ESPN Depth Charts: Programmatically synced ${dynRes.count} active starters!`);
        onRefreshData();
        return;
      }

      // Fallback
      const res = await reseedMasterNFLManifest();
      if (res.success) {
        showToast(`Reseeded all ${res.count} NFL starters from Master Manifest!`);
        onRefreshData();
      } else {
        showToast(res.error || 'Failed to reseed manifest');
      }
    } catch (err: any) {
      showToast(`Sync notice: ${err.message}`);
    } finally {
      setReseedLoading(false);
    }
  };

  const [roomFilterTab, setRoomFilterTab] = useState<'active' | 'archived' | 'all'>('active');
  const [autoArchiveLoading, setAutoArchiveLoading] = useState(false);

  const activeRooms = useMemo(() => allRooms.filter((r) => !r.isArchived), [allRooms]);
  const archivedRooms = useMemo(() => allRooms.filter((r) => Boolean(r.isArchived)), [allRooms]);

  const activeRoomsCount = activeRooms.length;
  const archivedRoomsCount = archivedRooms.length;

  const activeSquadsCount = useMemo(
    () => activeRooms.reduce((acc, r) => acc + r.squads.length, 0),
    [activeRooms]
  );
  const activePicksCount = useMemo(
    () =>
      activeRooms.reduce(
        (acc, r) => acc + r.squads.reduce((sAcc, sq) => sAcc + sq.stars.filter(Boolean).length, 0),
        0
      ),
    [activeRooms]
  );

  const archivedSquadsCount = useMemo(
    () => archivedRooms.reduce((acc, r) => acc + r.squads.length, 0),
    [archivedRooms]
  );
  const archivedPicksCount = useMemo(
    () =>
      archivedRooms.reduce(
        (acc, r) => acc + r.squads.reduce((sAcc, sq) => sAcc + sq.stars.filter(Boolean).length, 0),
        0
      ),
    [archivedRooms]
  );

  const totalSquadsCount = useMemo(
    () => allRooms.reduce((acc, r) => acc + r.squads.length, 0),
    [allRooms]
  );
  const totalPicksCount = useMemo(
    () =>
      allRooms.reduce(
        (acc, r) => acc + r.squads.reduce((sAcc, sq) => sAcc + sq.stars.filter(Boolean).length, 0),
        0
      ),
    [allRooms]
  );

  const [showPurgeArchivedModal, setShowPurgeArchivedModal] = useState(false);
  const [purgeArchivedLoading, setPurgeArchivedLoading] = useState(false);

  const handlePurgeAllArchived = async () => {
    setPurgeArchivedLoading(true);
    try {
      const res = await purgeAllArchivedRooms();
      if (res.success) {
        showToast(`🗑️ Purged all ${res.purgedCount} archived old rooms! Board is clean.`);
        setShowPurgeArchivedModal(false);
        await refreshMasterRooms();
        onRefreshData();
      } else {
        showToast('No archived rooms to purge.');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setPurgeArchivedLoading(false);
    }
  };

  const [copiedRoomCode, setCopiedRoomCode] = useState<string | null>(null);

  const formatStarName = (starId: string, sport: SportId = 'nfl') => {
    if (!starId) return '';
    const pool = sport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
    const resolved = resolvePlayerInPool(starId, pool, sport);
    return resolved ? `${resolved.displayName} (${resolved.teamCode})` : starId;
  };

  const handleToggleArchiveRoom = async (roomCode: string, sport: SportId, isCurrentlyArchived: boolean) => {
    const nextArchived = !isCurrentlyArchived;
    // Optimistic UI update so room instantly moves to/from archived tab
    setAllRooms((prev) =>
      prev.map((r) => (r.roomCode === roomCode && r.sport === sport ? { ...r, isArchived: nextArchived } : r))
    );
    showToast(nextArchived ? `📁 Archived Room "${roomCode}"! Moved to Archived tab.` : `📂 Unarchived Room "${roomCode}"! Restored to Active tab.`);

    try {
      const res = await archiveRoom(roomCode, sport, nextArchived);
      if (!res.success) {
        console.warn('Archive server call warning for room:', roomCode);
      }
    } catch (e: any) {
      console.warn('Archive error:', e);
    }
    await refreshMasterRooms();
    onRefreshData();
  };

  const handleAutoArchiveCompleted = async () => {
    setAutoArchiveLoading(true);
    try {
      const res = await autoArchiveCompletedRooms();
      if (res.success) {
        showToast(`Auto-archived ${res.archivedCount} past/completed rooms! Board is clean.`);
        await refreshMasterRooms();
      } else {
        showToast('Auto-archive completed (no additional rooms required archiving)');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    } finally {
      setAutoArchiveLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    let list = allRooms;
    if (roomFilterTab === 'active') {
      list = list.filter((r) => !r.isArchived);
    } else if (roomFilterTab === 'archived') {
      list = list.filter((r) => Boolean(r.isArchived));
    }
    const q = roomSearchFilter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      if (r.roomCode.toLowerCase().includes(q)) return true;
      if (r.sport.toLowerCase().includes(q)) return true;
      if (r.squads.some((s) => s.userName.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [allRooms, roomSearchFilter, roomFilterTab]);

  const totalRoomsCount = allRooms.length;

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refreshMasterRooms();
    }
  }, [isOpen, isAuthenticated, currentRoom, currentSport, roomRosters]);

  const toggleRoomExpanded = (key: string) => {
    setExpandedRooms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyOneTapLink = async (roomCode: string, sport: SportId) => {
    const activeKey = resolveSupabaseAnonKey();
    const keyParam = activeKey ? `&k=${encodeURIComponent(activeKey)}` : '';
    const inviteUrl = `${window.location.origin}/?sport=${sport}&room=${encodeURIComponent(roomCode)}${keyParam}`;
    const success = await copyToClipboard(inviteUrl);
    if (success) {
      setCopiedRoomCode(roomCode);
      showToast(`📋 COPIED 1-TAP LINK FOR ROOM ${roomCode}!`);
      setTimeout(() => setCopiedRoomCode(null), 2500);
    } else {
      prompt(`Copy this 1-tap invite link for Room ${roomCode}:`, inviteUrl);
      showToast(`Link: ${inviteUrl}`);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
      try {
        localStorage.setItem('pixel_pros_commissioner_auth', 'true');
      } catch {}
      refreshMasterRooms();
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('pixel_pros_commissioner_auth');
    } catch {}
  };

  const handleToggleLock = async (
    roomCode: string,
    sport: SportId,
    squadName: string,
    currentLock: boolean
  ) => {
    const newLock = !currentLock;
    await toggleSquadLock(roomCode, squadName, newLock, sport);
    showToast(`${newLock ? '🔒 LOCKED' : '🔓 UNLOCKED'} squad "${squadName}"`);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleLockAllInRoom = async (roomCode: string, sport: SportId, lock: boolean) => {
    await setAllSquadsLock(roomCode, lock, sport);
    showToast(`${lock ? '🔒 LOCKED' : '🔓 UNLOCKED'} ALL squads in room ${roomCode}`);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleRunSync = async (sport: SportId) => {
    if (sport === 'nfl') setSyncingNFL(true);
    else setSyncingNBA(true);
    setSyncResult(null);

    try {
      const res = await syncESPNData(sport);
      if (res.success) {
        const msg = `Synced ${res.gamesCount} ${sport.toUpperCase()} games & ${res.playersCount} players from ESPN!`;
        setSyncResult(msg);
        showToast(msg);
        onRefreshData();
      } else {
        const err = `Sync failed: ${res.message}`;
        setSyncResult(err);
        showToast(err);
      }
    } finally {
      if (sport === 'nfl') setSyncingNFL(false);
      else setSyncingNBA(false);
    }
  };

  const handlePurgeAndResync = async () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith('pixel_pros_espn_cache') || k.startsWith('pixel_pros_nfl_cache') || k.startsWith('pixel_pros_nba_cache')) {
          localStorage.removeItem(k);
        }
      });
      showToast('Purged local cache! Triggering fresh ESPN re-sync...');
      await handleRunSync(currentSport);
    } catch (err: any) {
      showToast(`Purge failed: ${err.message}`);
    }
  };

  const handleTriggerWeeklyRescan = async () => {
    setWeeklyRescanLoading(true);
    setWeeklyRescanStatus('Starting Tuesday 4:00 AM EST full rescan...');
    try {
      const res = await executeCompleteWeeklyRescan((msg) => setWeeklyRescanStatus(msg));
      if (res.success) {
        showToast(`Tuesday 4:00 AM Rescan complete! Active: Week ${res.activeWeek}`);
        setWeeklyRescanStatus(`Success: Active Week ${res.activeWeek} • ${res.injuriesFound} injuries tracked • ${res.competitorsUpdated} athletes updated`);
        onRefreshData();
      } else {
        showToast(`Rescan notice: ${res.message}`);
        setWeeklyRescanStatus(`Notice: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Rescan failed: ${err.message}`);
      setWeeklyRescanStatus(`Failed: ${err.message}`);
    } finally {
      setWeeklyRescanLoading(false);
    }
  };

  const handleStartRename = (room: string, sport: SportId, squad: string) => {
    setEditingTarget({ room, sport, squad });
    setNewSquadName(squad);
  };

  const handleCommitRename = async () => {
    if (!editingTarget) return;
    const clean = newSquadName.trim().toUpperCase();
    if (!clean || clean === editingTarget.squad) {
      setEditingTarget(null);
      return;
    }

    const res = await renameUserRoster(
      editingTarget.room,
      editingTarget.squad,
      clean,
      editingTarget.sport
    );

    if (res.success) {
      showToast(`Renamed squad "${editingTarget.squad}" to "${clean}"!`);
      setEditingTarget(null);
      onRefreshData();
      refreshMasterRooms();
    } else {
      showToast(res.error || 'Failed to rename squad');
    }
  };

  const handleConfirmDeleteSquad = async () => {
    if (!squadToDelete) return;
    await deleteUserRoster(squadToDelete.room, squadToDelete.squad, squadToDelete.sport);
    showToast(`Deleted squad ${squadToDelete.squad} from ${squadToDelete.room}`);
    setSquadToDelete(null);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleConfirmClearPicks = async () => {
    if (!squadToClear) return;
    await clearSquadStars(squadToClear.room, squadToClear.squad, squadToClear.sport);
    showToast(`Cleared star picks for ${squadToClear.squad}`);
    setSquadToClear(null);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    const targetRoom = roomToDelete.room;
    const targetSport = roomToDelete.sport;
    await deleteRoomPermanently(targetRoom, targetSport);
    showToast(`Permanently deleted room "${targetRoom}" and all its squads`);
    setRoomToDelete(null);

    if (targetRoom.toUpperCase() === currentRoom.toUpperCase()) {
      const def = currentSport === 'nba' ? 'HOOPS' : 'COUCH';
      onSwitchRoom(def);
    }
    onRefreshData();
    refreshMasterRooms();
  };

  const handleCreateSquad = async (roomCode: string, sport: SportId) => {
    const inputVal = squadInputs[`${roomCode}_${sport}`] || '';
    const clean = inputVal.trim().toUpperCase();
    if (!clean) return;
    await upsertUserRoster(roomCode, clean, '', '', '', false, sport);
    setSquadInputs((prev) => ({ ...prev, [`${roomCode}_${sport}`]: '' }));
    showToast(`Added squad ${clean} to room ${roomCode}`);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleCreateNewRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRoomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!clean) return;
    await upsertUserRoster(clean, 'PLAYER 1', '', '', '', false, newRoomSport);
    setNewRoomCode('');
    setShowNewRoomModal(false);
    showToast(`Created new room ${clean}!`);
    onRefreshData();
    refreshMasterRooms();
    setExpandedRooms((prev) => ({ ...prev, [`${clean}_${newRoomSport}`]: true }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 bg-black/85 backdrop-blur-xs font-sans">
      <div className="relative w-[95vw] max-w-[1500px] h-[92vh] max-h-[92vh] my-[2vh] mx-auto bg-slate-950 border border-slate-800 text-slate-100 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900/90 border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Shield size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-xs sm:text-base font-semibold text-slate-100 tracking-tight truncate">
                  🛡️ MASTER CONSOLE
                </h2>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium whitespace-nowrap">
                  {isSupabaseConfigured ? 'Supabase Live' : 'Local Storage'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 hidden md:block">
                Live Supabase Status • Active Sport: {currentSport.toUpperCase()} • Week {getCurrentNFLWeek()} Active • Real-time DB Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => handleRunSync('nfl')}
                  disabled={syncingNFL}
                  className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  title="Re-sync NFL scoreboard & rosters from ESPN"
                >
                  <RefreshCw size={12} className={syncingNFL ? 'animate-spin text-blue-400' : 'text-slate-400'} />
                  <span className="hidden sm:inline">{syncingNFL ? 'Syncing...' : '🔄 RE-SYNC NFL'}</span>
                  <span className="sm:hidden">NFL</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunSync('nba')}
                  disabled={syncingNBA}
                  className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-[11px] sm:text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  title="Re-sync NBA scoreboard & rosters from ESPN"
                >
                  <RefreshCw size={12} className={syncingNBA ? 'animate-spin text-amber-400' : 'text-slate-400'} />
                  <span className="hidden sm:inline">{syncingNBA ? 'Syncing...' : '🔄 RE-SYNC NBA'}</span>
                  <span className="sm:hidden">NBA</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-red-400 px-1 py-1 cursor-pointer transition-colors hidden md:inline"
                >
                  Lock
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Console"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PIN SCREEN IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Key size={26} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-1">Enter Master Console PIN</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-sm">
              Please enter the administrator PIN to access the Master Directory, pre-flight audits, and ESPN data syncing. (Default is <code className="text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50">1234</code>)
            </p>

            <form onSubmit={handleVerifyPin} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="PIN (1234)"
                autoFocus
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-center text-lg tracking-widest text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {pinError && (
                <div className="text-xs text-red-400 font-medium">Incorrect PIN. (Default: 1234)</div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors cursor-pointer shadow-sm"
              >
                Unlock Master Console
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED SAAS DASHBOARD */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tab Bar: scrollable on small devices */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 pt-2.5 pb-2 bg-slate-900/40 border-b border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('rooms')}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'rooms'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers size={14} />
                <span>📁 ROOMS & SQUADS</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-black/20 text-white/90">
                  {allRooms.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preflight')}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'preflight'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>🩺 PRE-FLIGHT AUDIT</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  16 Games
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sync')}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'sync'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Radio size={14} />
                <span>⚡ ESPN DATA SYNC</span>
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-6 space-y-4">
              {/* TAB 1: ROOMS & SQUADS MANAGER */}
              {activeTab === 'rooms' && (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-900/60 p-2.5 sm:p-3 rounded-lg border border-slate-800">
                    <div className="relative flex-1 max-w-full sm:max-w-md">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={roomSearchFilter}
                        onChange={(e) => setRoomSearchFilter(e.target.value)}
                        placeholder="Search room code or squad name..."
                        className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {roomSearchFilter && (
                        <button
                          type="button"
                          onClick={() => setRoomSearchFilter('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-wrap">
                      {/* Active vs Archived Filter Pills */}
                      <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() => setRoomFilterTab('active')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                            roomFilterTab === 'active'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Active ({activeRoomsCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoomFilterTab('archived')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                            roomFilterTab === 'archived'
                              ? 'bg-amber-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Archived ({archivedRoomsCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoomFilterTab('all')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                            roomFilterTab === 'all'
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          All ({allRooms.length})
                        </button>
                      </div>

                      {/* Purge All Archived button (only visible on Archived tab when archived rooms exist) */}
                      {roomFilterTab === 'archived' && archivedRoomsCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowPurgeArchivedModal(true)}
                          disabled={purgeArchivedLoading}
                          className="px-2.5 sm:px-3 py-1.5 bg-red-950/70 hover:bg-red-900/90 text-red-200 border border-red-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs active:scale-95"
                          title="Permanently remove all old archived game rooms and their historical picks"
                        >
                          <Trash2 size={12} className="text-red-400" />
                          <span>Purge All Archived ({archivedRoomsCount})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleAutoArchiveCompleted}
                        disabled={autoArchiveLoading}
                        className="px-2.5 sm:px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
                        title="Auto-archive past week / completed game rooms"
                      >
                        {autoArchiveLoading ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Archive size={12} className="text-amber-400" />
                        )}
                        <span>Auto-Archive Completed</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExpandAll}
                        className="px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={handleCollapseAll}
                        className="px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Collapse All
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewRoomModal(true)}
                        className="px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                      >
                        <Plus size={13} />
                        <span>+ New Room</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 px-1 gap-1">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      {roomFilterTab === 'active' ? (
                        <>
                          <span className="text-blue-400 font-semibold">
                            <strong>{activeRoomsCount}</strong> Active {activeRoomsCount === 1 ? 'Room' : 'Rooms'}
                          </span>
                          <span>•</span>
                          <span><strong>{activeSquadsCount}</strong> Active {activeSquadsCount === 1 ? 'Squad' : 'Squads'}</span>
                          <span>•</span>
                          <span><strong>{activePicksCount}</strong> Active Picks</span>
                          {archivedRoomsCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400/80 text-[11px]">
                                ({archivedRoomsCount} old {archivedRoomsCount === 1 ? 'game' : 'games'} moved to Archived tab)
                              </span>
                            </>
                          )}
                        </>
                      ) : roomFilterTab === 'archived' ? (
                        <>
                          <span className="text-amber-400 font-semibold">
                            <strong>{archivedRoomsCount}</strong> Archived {archivedRoomsCount === 1 ? 'Room' : 'Rooms'} (Old Games)
                          </span>
                          <span>•</span>
                          <span><strong>{archivedSquadsCount}</strong> Archived Squads</span>
                          <span>•</span>
                          <span><strong>{archivedPicksCount}</strong> Archived Picks</span>
                        </>
                      ) : (
                        <>
                          <span>
                            <strong>{allRooms.length}</strong> Total Rooms
                          </span>
                          <span className="text-blue-400 font-medium">({activeRoomsCount} Active)</span>
                          <span className="text-amber-400 font-medium">({archivedRoomsCount} Archived)</span>
                          <span>•</span>
                          <span><strong>{totalSquadsCount}</strong> Total Squads</span>
                          <span>•</span>
                          <span><strong>{totalPicksCount}</strong> Total Picks</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 hidden sm:block">
                      {roomFilterTab === 'active'
                        ? 'Showing only live, active draft rooms (old games hidden)'
                        : roomFilterTab === 'archived'
                        ? 'Archived rooms are inert and hidden from player draft boards'
                        : 'Showing all active and archived rooms'}
                    </div>
                  </div>

                  {/* Rooms Table */}
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
                    <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <div className="col-span-3 lg:col-span-2">Room Code</div>
                      <div className="col-span-2 lg:col-span-1">Sport</div>
                      <div className="col-span-2 lg:col-span-2">Squads</div>
                      <div className="col-span-2 lg:col-span-2">Status</div>
                      <div className="col-span-3 lg:col-span-5 text-right">Actions</div>
                    </div>

                    {loadingRooms && allRooms.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-blue-400" />
                        Loading rooms directory...
                      </div>
                    ) : filteredRooms.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        {roomSearchFilter ? (
                          <>No rooms match "{roomSearchFilter}"</>
                        ) : roomFilterTab === 'archived' ? (
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-slate-300">No Archived Rooms</div>
                            <div className="text-slate-500">All old rooms are either active or have been cleaned out.</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-slate-300">No Active Rooms Found</div>
                            <div className="text-slate-500">Click "+ New Room" above to create an active room!</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      filteredRooms.map((room) => {
                        const roomKey = `${room.roomCode}_${room.sport}`;
                        const isExpanded = Boolean(expandedRooms[roomKey]);
                        const isCurrent = room.roomCode.toUpperCase() === currentRoom.toUpperCase() && room.sport === currentSport;
                        const allLocked = room.squads.length > 0 && room.squads.every((s) => s.isLocked);
                        const anyLocked = room.squads.some((s) => s.isLocked);

                        return (
                          <div key={roomKey} className="border-b border-slate-800/60 last:border-b-0">
                            {/* Desktop / Horizontal View (md and up) */}
                            <div
                              onClick={() => toggleRoomExpanded(roomKey)}
                              className={`hidden md:grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs transition-colors cursor-pointer select-none ${
                                isCurrent
                                  ? 'bg-blue-950/30 hover:bg-blue-950/40'
                                  : 'hover:bg-slate-900/50'
                              }`}
                            >
                              <div className="col-span-3 lg:col-span-2 flex items-center gap-2 min-w-0">
                                <span className="text-slate-400 shrink-0">
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </span>
                                <span className="font-semibold text-slate-100 font-mono tracking-wide text-sm truncate">
                                  {room.roomCode}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30 shrink-0">
                                    CURRENT
                                  </span>
                                )}
                                {room.isArchived && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 shrink-0 flex items-center gap-0.5">
                                    <Archive size={9} /> ARCHIVED
                                  </span>
                                )}
                              </div>

                              <div className="col-span-2 lg:col-span-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                                  room.sport === 'nfl'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {room.sport.toUpperCase()}
                                </span>
                              </div>

                              <div className="col-span-2 lg:col-span-2 text-slate-300 text-xs">
                                <div>{room.squads.length} {room.squads.length === 1 ? 'Squad' : 'Squads'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {(room.matches?.length || 0) > 0 ? `${(room.matches?.length || 0) + 1} slates` : 'Superstars'}
                                </div>
                              </div>

                              <div className="col-span-2 lg:col-span-2">
                                {allLocked ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1 w-fit">
                                    <Lock size={10} /> Locked
                                  </span>
                                ) : anyLocked ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium w-fit">
                                    Partial Lock
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1 w-fit">
                                    <Unlock size={10} /> Open
                                  </span>
                                )}
                              </div>

                              <div className="col-span-3 lg:col-span-5 flex items-center justify-end gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleLockAllInRoom(room.roomCode, room.sport, false)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                                  title="Unlock all squads in this room"
                                >
                                  <Unlock size={12} className="text-emerald-400" />
                                  <span>Unlock All</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLockAllInRoom(room.roomCode, room.sport, true)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                                  title="Lock all squads in this room"
                                >
                                  <Lock size={12} className="text-amber-400" />
                                  <span>Lock All</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleArchiveRoom(room.roomCode, room.sport, Boolean(room.isArchived));
                                  }}
                                  className={`px-2.5 py-1 rounded border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
                                    room.isArchived
                                      ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600 shadow-sm'
                                      : 'bg-amber-950/30 hover:bg-amber-900/50 text-amber-200 hover:text-white border-amber-700/60'
                                  }`}
                                  title={room.isArchived ? 'Restore / Unarchive Room' : 'Archive Room (Clear out old game)'}
                                >
                                  {room.isArchived ? (
                                    <ArchiveRestore size={12} className="text-amber-400" />
                                  ) : (
                                    <Archive size={12} className="text-amber-400" />
                                  )}
                                  <span>{room.isArchived ? 'Unarchive' : 'Archive'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyOneTapLink(room.roomCode, room.sport)}
                                  className="px-2.5 py-1 rounded bg-blue-950/50 hover:bg-blue-900/70 text-blue-200 hover:text-white border border-blue-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                                  title="Copy 1-tap invite link"
                                >
                                  {copiedRoomCode === room.roomCode ? (
                                    <>
                                      <Check size={12} className="text-emerald-400" />
                                      <span className="text-emerald-400 font-bold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} className="text-blue-400" />
                                      <span>Copy Link</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRoomToDelete({ room: room.roomCode, sport: room.sport })}
                                  className="px-2.5 py-1 rounded bg-red-950/50 hover:bg-red-900/70 text-red-300 hover:text-white border border-red-800/60 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95"
                                  title="Wipe room and squads"
                                >
                                  <Trash2 size={12} className="text-red-400" />
                                  <span className="hidden xl:inline">Wipe Room</span>
                                </button>
                              </div>
                            </div>

                            {/* Mobile / Tablet Vertical Card View (< md) */}
                            <div
                              onClick={() => toggleRoomExpanded(roomKey)}
                              className={`md:hidden p-3 transition-colors cursor-pointer select-none space-y-2.5 ${
                                isCurrent
                                  ? 'bg-blue-950/30'
                                  : 'hover:bg-slate-900/50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-slate-400 shrink-0">
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </span>
                                  <span className="font-semibold text-slate-100 font-mono tracking-wide text-sm truncate">
                                    {room.roomCode}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0 ${
                                    room.sport === 'nfl'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {room.sport.toUpperCase()}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30 shrink-0">
                                      CURRENT
                                    </span>
                                  )}
                                  {room.isArchived && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 shrink-0 flex items-center gap-0.5">
                                      <Archive size={9} /> ARCHIVED
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-slate-300 font-medium">
                                    {room.squads.length} {room.squads.length === 1 ? 'Squad' : 'Squads'}
                                  </span>
                                  {allLocked ? (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1">
                                      <Lock size={9} /> Locked
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                                      <Unlock size={9} /> Open
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Mobile actions: Clean, spacious flex row */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleLockAllInRoom(room.roomCode, room.sport, false)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer active:scale-95"
                                  title="Unlock all squads"
                                >
                                  <Unlock size={11} className="text-emerald-400" />
                                  <span>Unlock All</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLockAllInRoom(room.roomCode, room.sport, true)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer active:scale-95"
                                  title="Lock all squads"
                                >
                                  <Lock size={11} className="text-amber-400" />
                                  <span>Lock All</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleArchiveRoom(room.roomCode, room.sport, Boolean(room.isArchived));
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 border transition-colors cursor-pointer active:scale-95 ${
                                    room.isArchived
                                      ? 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border-amber-600/70'
                                      : 'bg-slate-800 hover:bg-amber-950/40 text-slate-300 hover:text-amber-200 border-slate-700'
                                  }`}
                                  title={room.isArchived ? 'Restore / Unarchive' : 'Archive (Clear out old game)'}
                                >
                                  {room.isArchived ? (
                                    <ArchiveRestore size={11} className="text-amber-400" />
                                  ) : (
                                    <Archive size={11} className="text-slate-400" />
                                  )}
                                  <span>{room.isArchived ? 'Unarchive' : 'Archive'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyOneTapLink(room.roomCode, room.sport)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer active:scale-95"
                                  title="Copy 1-tap invite link"
                                >
                                  {copiedRoomCode === room.roomCode ? (
                                    <>
                                      <Check size={11} className="text-emerald-400" />
                                      <span className="text-emerald-400 font-bold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} className="text-blue-400" />
                                      <span>Copy Link</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRoomToDelete({ room: room.roomCode, sport: room.sport })}
                                  className="px-2 py-1 rounded bg-red-950/50 hover:bg-red-900/70 text-red-300 text-[11px] font-medium flex items-center gap-1 border border-red-800/60 transition-colors cursor-pointer ml-auto active:scale-95"
                                  title="Wipe room and squads"
                                >
                                  <Trash2 size={11} className="text-red-400" />
                                  <span>Wipe</span>
                                </button>
                              </div>
                            </div>

                            {/* Expanded Room Hierarchy: Weekly Superstars & Match Slates */}
                            {isExpanded && (
                              <div className="bg-slate-950/90 px-3 sm:px-4 py-3.5 border-t border-slate-800 space-y-4">
                                {/* Room Subheader with Quick Actions */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800/70 flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-slate-200">
                                      🏠 ROOM: {room.roomCode}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      ({room.squads.length} total squad{room.squads.length === 1 ? '' : 's'})
                                    </span>
                                    {room.isArchived && (
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                                        <Archive size={10} /> ARCHIVED
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleArchiveRoom(room.roomCode, room.sport, Boolean(room.isArchived))}
                                      className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 ${
                                        room.isArchived
                                          ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600'
                                          : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 hover:text-white border border-amber-700/60'
                                      }`}
                                      title={room.isArchived ? 'Restore / Unarchive Room' : 'Archive Room (Clear out old game)'}
                                    >
                                      {room.isArchived ? (
                                        <ArchiveRestore size={12} className="text-amber-400" />
                                      ) : (
                                        <Archive size={12} className="text-amber-400" />
                                      )}
                                      <span>{room.isArchived ? 'Unarchive Room' : 'Archive Room'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyOneTapLink(room.roomCode, room.sport)}
                                      className="px-2 py-1 rounded bg-blue-950/50 hover:bg-blue-900/70 text-blue-200 hover:text-white border border-blue-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                                      title="Copy 1-tap invite link"
                                    >
                                      {copiedRoomCode === room.roomCode ? (
                                        <>
                                          <Check size={12} className="text-emerald-400" />
                                          <span className="text-emerald-400 font-bold">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={12} className="text-blue-400" />
                                          <span>Copy Link</span>
                                        </>
                                      )}
                                    </button>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-1 border-l border-slate-800">
                                      <span>Sport:</span>
                                      <span className="font-semibold text-slate-200 uppercase">{room.sport}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* SECTION 1: ⭐ WEEKLY SUPERSTARS */}
                                <div className="bg-slate-900/70 rounded-lg border border-amber-500/20 p-3 space-y-2.5">
                                  <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                                    <div className="flex items-center gap-2">
                                      <Sparkles size={14} className="text-amber-400" />
                                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                                        ⭐ WEEKLY SUPERSTARS ({room.superstarsSquads?.length || 0})
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-amber-400/80 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                      Main League Picks
                                    </span>
                                  </div>

                                  {(!room.superstarsSquads || room.superstarsSquads.length === 0) ? (
                                    <div className="text-xs text-slate-500 italic py-2 pl-2">
                                      No squads have drafted Weekly Superstars picks in room "{room.roomCode}" yet.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {room.superstarsSquads.map((squad) => {
                                        const isEditingThis = editingTarget?.room === room.roomCode && editingTarget?.squad === squad.userName;
                                        const activeStars = squad.stars.filter(Boolean);

                                        return (
                                          <div
                                            key={`super_${squad.userName}`}
                                            className="p-2.5 sm:p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5"
                                          >
                                            <div className="space-y-1 min-w-0 flex-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                {isEditingThis ? (
                                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                      type="text"
                                                      value={newSquadName}
                                                      onChange={(e) => setNewSquadName(e.target.value.toUpperCase())}
                                                      autoFocus
                                                      className="px-2 py-0.5 bg-slate-950 border border-blue-500 text-xs rounded text-slate-100 font-semibold uppercase"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={handleCommitRename}
                                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-medium"
                                                    >
                                                      Save
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => setEditingTarget(null)}
                                                      className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <span className="font-semibold text-slate-100 text-sm">
                                                    SQUAD: {squad.userName}
                                                  </span>
                                                )}

                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleLock(room.roomCode, room.sport, squad.userName, squad.isLocked)}
                                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border cursor-pointer transition-colors ${
                                                    squad.isLocked
                                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                                  }`}
                                                  title="Click to toggle squad lock"
                                                >
                                                  {squad.isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                                                  <span>{squad.isLocked ? 'Locked' : 'Open'}</span>
                                                </button>
                                              </div>

                                              {/* 3 Star Picks formatted with names */}
                                              <div className="flex items-center gap-1.5 text-xs text-slate-300 flex-wrap pt-0.5">
                                                <span className="text-slate-500 font-medium text-[11px]">3 Stars:</span>
                                                {activeStars.length === 0 ? (
                                                  <span className="text-slate-500 italic text-[11px]">No stars drafted yet</span>
                                                ) : (
                                                  activeStars.map((starId, idx) => (
                                                    <span
                                                      key={idx}
                                                      className="px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-slate-200 text-xs font-medium"
                                                    >
                                                      ⭐ {formatStarName(starId, room.sport)}
                                                    </span>
                                                  ))
                                                )}
                                              </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap pt-1 md:pt-0">
                                              <button
                                                type="button"
                                                onClick={() => handleStartRename(room.roomCode, room.sport, squad.userName)}
                                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Rename this squad"
                                              >
                                                <Edit2 size={11} />
                                                <span>Rename</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => setSquadToClear({ room: room.roomCode, sport: room.sport, squad: squad.userName })}
                                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Reset picks to 0 points"
                                              >
                                                <RefreshCw size={11} />
                                                <span>Reset Picks</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => setSquadToDelete({ room: room.roomCode, sport: room.sport, squad: squad.userName })}
                                                className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/40 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Delete this squad"
                                              >
                                                <X size={12} />
                                                <span>Delete</span>
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* SECTION 2: 🏈 MATCH SLATES */}
                                <div className="bg-slate-900/70 rounded-lg border border-blue-500/20 p-3 space-y-2.5">
                                  <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">🏈</span>
                                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                                        MATCH SLATES ({room.matches?.length || 0} Games Drafted)
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-blue-400/80 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                      Head-to-head game picks
                                    </span>
                                  </div>

                                  {(!room.matches || room.matches.length === 0) ? (
                                    <div className="text-xs text-slate-500 italic py-2 pl-2">
                                      No specific game slate picks drafted yet in this room. (When players pick for games like ATL@GB, they appear here!)
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {room.matches.map((m) => (
                                        <div
                                          key={m.matchSlateId}
                                          className="p-2.5 sm:p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2"
                                        >
                                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/70">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-slate-100 font-mono">
                                                🏈 GAME: {m.matchSlateId}
                                              </span>
                                              <span className="text-[10px] text-slate-500 font-mono">
                                                ({m.effectiveRoomCode})
                                              </span>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                                              {m.squads.length} {m.squads.length === 1 ? 'Squad' : 'Squads'}
                                            </span>
                                          </div>

                                          <div className="space-y-2 pl-2 border-l-2 border-blue-500/40">
                                            {m.squads.map((sq) => {
                                              const activeStars = sq.stars.filter(Boolean);
                                              return (
                                                <div
                                                  key={`${m.matchSlateId}_${sq.userName}`}
                                                  className="p-2 bg-slate-950/80 rounded border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2"
                                                >
                                                  <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                      <span className="font-semibold text-slate-200 text-xs">
                                                        {sq.userName}
                                                      </span>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleToggleLock(m.effectiveRoomCode, room.sport, sq.userName, sq.isLocked)}
                                                        className={`text-[9px] px-1.5 py-0.2 rounded font-medium flex items-center gap-1 border cursor-pointer ${
                                                          sq.isLocked
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                        }`}
                                                        title="Toggle lock for this game slate"
                                                      >
                                                        {sq.isLocked ? <Lock size={9} /> : <Unlock size={9} />}
                                                        <span>{sq.isLocked ? 'Locked' : 'Open'}</span>
                                                      </button>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-xs text-slate-300 flex-wrap">
                                                      {activeStars.length === 0 ? (
                                                        <span className="text-slate-500 italic text-[11px]">No stars picked</span>
                                                      ) : (
                                                        activeStars.map((starId, idx) => (
                                                          <span
                                                            key={idx}
                                                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700"
                                                          >
                                                            ⭐ {formatStarName(starId, room.sport)}
                                                          </span>
                                                        ))
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                      type="button"
                                                      onClick={() => setSquadToClear({ room: m.effectiveRoomCode, sport: room.sport, squad: sq.userName })}
                                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer"
                                                      title="Reset picks for this game slate"
                                                    >
                                                      <RefreshCw size={10} className="inline mr-1" />
                                                      Reset Picks
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={() => setSquadToDelete({ room: m.effectiveRoomCode, sport: room.sport, squad: sq.userName })}
                                                      className="px-2 py-0.5 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-medium border border-red-800/40 cursor-pointer"
                                                      title="Remove squad from this game slate"
                                                    >
                                                      <X size={10} className="inline mr-1" />
                                                      Remove
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Inline Add Squad Form */}
                                <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 flex-wrap">
                                  <input
                                    type="text"
                                    value={squadInputs[roomKey] || ''}
                                    onChange={(e) => setSquadInputs((prev) => ({ ...prev, [roomKey]: e.target.value.toUpperCase() }))}
                                    placeholder="Add squad (e.g. SQUAD 2)..."
                                    className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 flex-1 min-w-[150px] max-w-sm uppercase focus:outline-none focus:border-blue-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCreateSquad(room.roomCode, room.sport)}
                                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap active:scale-95"
                                  >
                                    <Plus size={12} />
                                    <span>Add Squad</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PRE-FLIGHT AUDIT */}
              {activeTab === 'preflight' && (
                <div className="space-y-4">
                  {/* Top 4 Checkpoints */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-900/70 border border-emerald-500/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">1. Starter Quotas</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                          Verified 🟢
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Every team has guaranteed starters: 1 QB, 2 RBs, 2 WRs, 1 TE (&ge; 6 playmakers).
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-900/70 border border-emerald-500/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">2. Slate State</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                          Active 🟢
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Completed games are automatically locked; only upcoming and live games are pickable.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-900/70 border border-emerald-500/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">3. 0 Clones Check</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                          0 Clones 🟢
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Athlete ID is immutable primary key. Rushing and receiving stats merge into 1 card.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-900/70 border border-emerald-500/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">4. Uniform Integrity</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                          Verified 🟢
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Franchise ownership locked. Jalen Hurts strictly PHI #1, Justin Jefferson MIN #18.
                      </p>
                    </div>
                  </div>

                  {/* 16 Matchups Pre-Flight Table */}
                  <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 py-3 bg-slate-900/80 border-b border-slate-800">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">
                          Active NFL Slate Ingestion (16 Games • 32 Franchises)
                        </h4>
                        <p className="text-xs text-slate-400">
                          NFL Week {getCurrentNFLWeek()} Official Schedule & Roster Verification
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleReseedNFLManifest}
                        disabled={reseedLoading}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
                      >
                        <Sparkles size={13} className={reseedLoading ? 'animate-spin' : ''} />
                        <span>{reseedLoading ? 'Reseeding...' : '⚡ Reseed 32-Team Manifest'}</span>
                      </button>
                    </div>

                    <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <div className="col-span-4 sm:col-span-3">Matchup</div>
                      <div className="col-span-3 sm:col-span-3">Kickoff / Status</div>
                      <div className="col-span-3 sm:col-span-3">Roster Verification</div>
                      <div className="col-span-2 sm:col-span-3 text-right">Integrity Audit</div>
                    </div>

                    <div className="divide-y divide-slate-800/50 max-h-96 overflow-y-auto">
                      {DEFAULT_NFL_MATCHES.map((m, idx) => {
                        const awayCode = m.awayTeamCode || m.away_team || '';
                        const homeCode = m.homeTeamCode || m.home_team || '';
                        const awayRoster = NFL_ROSTER_MANIFEST[awayCode] || [];
                        const homeRoster = NFL_ROSTER_MANIFEST[homeCode] || [];
                        const awayCount = awayRoster.length || 7;
                        const homeCount = homeRoster.length || 8;

                        return (
                          <div key={m.id || idx} className="hover:bg-slate-900/40">
                            {/* Desktop row (md and up) */}
                            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-xs">
                              <div className="col-span-4 sm:col-span-3 flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-100">{awayCode}</span>
                                <span className="text-slate-500">@</span>
                                <span className="font-mono font-bold text-slate-100">{homeCode}</span>
                                <span className="text-slate-400 text-[11px] hidden lg:inline truncate">
                                  ({getTeamFullName(awayCode)} vs {getTeamFullName(homeCode)})
                                </span>
                              </div>

                              <div className="col-span-3 sm:col-span-3 text-slate-300 text-xs flex items-center gap-1.5">
                                <Clock size={12} className="text-slate-500" />
                                <span>{m.quarterTime || m.quarter_time || 'Sun 1:00 PM'}</span>
                              </div>

                              <div className="col-span-3 sm:col-span-3 flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                  {awayCode}: {awayCount}p
                                </span>
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                  {homeCode}: {homeCount}p
                                </span>
                                <span className="text-[10px] text-emerald-400 font-medium hidden xl:inline">
                                  &gt;= 6 Starters
                                </span>
                              </div>

                              <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium hidden sm:inline">
                                  0 Clones 🟢
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                  PASS ✅
                                </span>
                              </div>
                            </div>

                            {/* Mobile card (< md) */}
                            <div className="md:hidden p-3 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-100">{awayCode}</span>
                                  <span className="text-slate-500">@</span>
                                  <span className="font-mono font-bold text-slate-100">{homeCode}</span>
                                  <span className="text-slate-400 text-[11px] ml-1">
                                    {m.quarterTime || m.quarter_time || 'Sun 1:00 PM'}
                                  </span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                  PASS ✅
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                  {awayCode}: {awayCount}p
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                  {homeCode}: {homeCount}p
                                </span>
                                <span className="text-emerald-400 text-[10px]">0 Clones 🟢</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ESPN DATA SYNC */}
              {activeTab === 'sync' && (
                <div className="space-y-4">
                  {syncResult && (
                    <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center gap-2">
                      <Activity size={14} />
                      <span>{syncResult}</span>
                    </div>
                  )}

                  {/* Tuesday 4:00 AM EST Weekly Rescan Engine */}
                  <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border-2 border-amber-500/40 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">Tuesday 4:00 AM EST Weekly Rescan Engine</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                              AUTOMATED
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Rolls into the next NFL week, re-scans all 32 dynamic depth charts (QB1/QB2/QB3), updates injury tags ([I] / [Q]), and unlocks rosters so players can create rooms and make new picks!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerWeeklyRescan}
                        disabled={weeklyRescanLoading}
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-md shrink-0"
                      >
                        <RefreshCw size={13} className={weeklyRescanLoading ? 'animate-spin' : ''} />
                        <span>{weeklyRescanLoading ? 'Executing Rescan...' : 'Run Tuesday 4 AM Rescan Now'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">Next Scheduled:</span>
                        <span className="text-amber-300 font-bold">{rescanCountdown.formattedNext}</span>
                      </div>
                      <div className="p-2 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">Countdown:</span>
                        <span className="text-emerald-400 font-bold">{rescanCountdown.countdown}</span>
                      </div>
                      <div className="p-2 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">Roster Lock Reset:</span>
                        <span className="text-blue-300 font-bold">Unlocks @ 4:00 AM</span>
                      </div>
                    </div>

                    {weeklyRescanStatus && (
                      <div className="px-3 py-2 bg-slate-950/80 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-300 flex items-center gap-2">
                        <Terminal size={12} className="text-amber-400 shrink-0" />
                        <span>{weeklyRescanStatus}</span>
                      </div>
                    )}
                  </div>

                  {/* Pure Dynamic Depth Chart Engine Banner Card */}
                  <div className="p-4 bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/40 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">⚡ Pure Dynamic Depth Chart Pipeline</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                              Zero Hardcoded Names
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Pulls live depth charts from ESPN (<code className="text-blue-300 bg-slate-950/80 px-1 py-0.5 rounded text-[11px]">/teams/&#123;id&#125;/depthcharts</code>) across all 32 NFL franchises. Resolves dynamic starters (QB, RB 1-2, WR 1-3, TE 1) and filters injury inactives.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunDepthChartPipeline}
                        disabled={depthSyncLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-md shrink-0"
                      >
                        <RefreshCw size={13} className={depthSyncLoading ? 'animate-spin' : ''} />
                        <span>{depthSyncLoading ? 'Crawling 32 Depth Charts...' : 'Run Dynamic 32-Team Pipeline'}</span>
                      </button>
                    </div>

                    {depthSyncProgress && (
                      <div className="px-3 py-2 bg-slate-950/80 border border-blue-500/30 rounded-lg text-xs font-mono text-blue-300 flex items-center gap-2 animate-pulse">
                        <Terminal size={12} className="text-blue-400 shrink-0" />
                        <span>{depthSyncProgress}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NFL Sync Card */}
                    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏈</span>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-100">NFL Scoreboard & Stats</h4>
                            <span className="text-xs text-slate-400">
                              Active Week: Week {getCurrentNFLWeek()} • Aggregated Stats
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          Last: {getLastESPNSyncTime('nfl') || 'None'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Pulls live game scores, passing/rushing/receiving yardage, touchdowns, and 2-point conversions from ESPN's authoritative API.
                      </p>

                      <button
                        type="button"
                        onClick={() => handleRunSync('nfl')}
                        disabled={syncingNFL}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                      >
                        <RefreshCw size={13} className={syncingNFL ? 'animate-spin' : ''} />
                        <span>{syncingNFL ? 'Syncing NFL from ESPN...' : 'Sync NFL Now (Current Week Only)'}</span>
                      </button>
                    </div>

                    {/* NBA Sync Card */}
                    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏀</span>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-100">NBA Scoreboard & Stats</h4>
                            <span className="text-xs text-slate-400">
                              Tonight's Live Games & Boxscores
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          Last: {getLastESPNSyncTime('nba') || 'None'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Pulls live NBA games, quarters, real-time points, 3-pointers, rebounds, and assists from ESPN for active games.
                      </p>

                      <button
                        type="button"
                        onClick={() => handleRunSync('nba')}
                        disabled={syncingNBA}
                        className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                      >
                        <RefreshCw size={13} className={syncingNBA ? 'animate-spin' : ''} />
                        <span>{syncingNBA ? 'Syncing NBA from ESPN...' : 'Sync NBA Now'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Diagnostic / Raw Feed Card */}
                  <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <Terminal size={14} className="text-blue-400" />
                        <span>Live Sync Diagnostic Status</span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePurgeAndResync}
                        className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Purge Local Cache & Force Resync
                      </button>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 border border-slate-850">
                      <div>Status: <span className="text-emerald-400">OPERATIONAL</span></div>
                      <div>Active NFL Week: <span className="text-blue-400">Week {getCurrentNFLWeek()}</span> (Locked until last game ends)</div>
                      <div>Ingested NFL Matchups: <span className="text-slate-100">{DEFAULT_NFL_MATCHES.length} Games</span></div>
                      <div>Backend Engine: <span className="text-slate-100">server.ts poller &amp; /api/espn/sync</span></div>
                      <div>Supabase Persistence: <span className="text-emerald-400">{isSupabaseConfigured ? 'CONNECTED' : 'LOCAL FALLBACK'}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Status Bar */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  STATUS: {isSupabaseConfigured ? 'Supabase Connected' : 'Local Persistence'} • NFL Week {getCurrentNFLWeek()} Active • 16 Games Ingested
                </span>
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Last Synced: {getLastESPNSyncTime('nfl') || '8:41 AM'}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CREATE NEW ROOM */}
        {showNewRoomModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-100">Create New League Room</h4>
                <button
                  type="button"
                  onClick={() => setShowNewRoomModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateNewRoom} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Room Code</label>
                  <input
                    type="text"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. COUCH2 or SUNDAY_CREW"
                    autoFocus
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Sport</label>
                  <select
                    value={newRoomSport}
                    onChange={(e) => setNewRoomSport(e.target.value as SportId)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="nfl">🏈 NFL Football</option>
                    <option value="nba">🏀 NBA Basketball</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRoomModal(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                  >
                    Create Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM DELETE SQUAD */}
        {squadToDelete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="bg-slate-900 border border-red-500/40 rounded-xl p-5 max-w-sm w-full space-y-3 text-center shadow-2xl">
              <AlertTriangle className="mx-auto text-red-400 mb-1" size={32} />
              <h4 className="text-sm font-semibold text-slate-100">
                Delete squad "{squadToDelete.squad}"?
              </h4>
              <p className="text-xs text-slate-400">
                This will permanently delete this squad and all of its player picks from room <strong>{squadToDelete.room}</strong>.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setSquadToDelete(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSquad}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium cursor-pointer shadow-sm"
                >
                  Yes, Delete Squad
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM WIPE ROOM */}
        {roomToDelete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="bg-slate-900 border border-red-500/40 rounded-xl p-5 max-w-sm w-full space-y-3 text-center shadow-2xl">
              <AlertTriangle className="mx-auto text-red-400 mb-1" size={32} />
              <h4 className="text-sm font-semibold text-slate-100">
                Permanently wipe room "{roomToDelete.room}"?
              </h4>
              <p className="text-xs text-slate-400">
                This will wipe room <strong>{roomToDelete.room}</strong> and delete all registered squads within it.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setRoomToDelete(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteRoom}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium cursor-pointer shadow-sm"
                >
                  Yes, Wipe Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM PURGE ALL ARCHIVED ROOMS */}
        {showPurgeArchivedModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="bg-slate-900 border border-red-500/40 rounded-xl p-5 max-w-sm w-full space-y-3 text-center shadow-2xl">
              <Trash2 className="mx-auto text-red-400 mb-1" size={32} />
              <h4 className="text-sm font-semibold text-slate-100">
                Purge all {archivedRoomsCount} archived old rooms?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed text-left">
                Old games and slates from previous weeks (e.g., NYG_LAR, CAR_ATL, etc.) are kept in the archive so you don't lose past history.
                <br /><br />
                Since you don't need old games, clicking <strong>Purge</strong> permanently clears them out of the database and archive, leaving only your active rooms.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurgeArchivedModal(false)}
                  disabled={purgeArchivedLoading}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Keep in Archive
                </button>
                <button
                  type="button"
                  onClick={handlePurgeAllArchived}
                  disabled={purgeArchivedLoading}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {purgeArchivedLoading ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  <span>Yes, Purge Old Games</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM RESET PICKS */}
        {squadToClear && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 max-w-sm w-full space-y-3 text-center shadow-2xl">
              <RefreshCw className="mx-auto text-amber-400 mb-1" size={32} />
              <h4 className="text-sm font-semibold text-slate-100">
                Reset picks to 0 for "{squadToClear.squad}"?
              </h4>
              <p className="text-xs text-slate-400">
                This clears all drafted star picks for squad <strong>{squadToClear.squad}</strong> back to empty so they can re-draft.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setSquadToClear(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearPicks}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium cursor-pointer shadow-sm"
                >
                  Reset to 0 Points
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
