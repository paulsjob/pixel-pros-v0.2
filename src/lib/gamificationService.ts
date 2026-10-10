import { SportId, UserRoster, Match, Competitor } from '../types';
import { db, handleFirestoreError, OperationType } from './firebaseClient';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

export type ReactionEmoji = '👑' | '🔥' | '🧊' | '🎯' | '🚀' | '🍿' | '🧂';

export interface TrustReceipt {
  id: string;
  receipt_id: string; // e.g. #PX-8421-E4
  room_code: string;
  user_name: string;
  sport: SportId;
  slate_id: string;
  locked_at: string; // ISO
  locked_at_display: string;
  is_on_time: boolean;
  is_classified: boolean;
  star_ids: string[];
  star_names: string[];
  star_teams?: string[];
  tamper_hash: string;
}

export interface SquadReactionEntry {
  emoji: ReactionEmoji;
  sender: string;
  timestamp: string;
}

export interface SquadReactionsMap {
  [targetUser: string]: {
    [emoji: string]: SquadReactionEntry[];
  };
}

export interface AchievementBadge {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  color: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  criteria: string;
  unlocked: boolean;
  progressText?: string;
  unlockedAt?: string;
}

// Generate deterministic tamper-evident hash
export function generateTamperHash(room: string, user: string, slate: string, timestamp: string, starIds: string[]): string {
  const raw = `${room.trim().toUpperCase()}:${user.trim().toUpperCase()}:${slate}:${timestamp}:${starIds.join(',')}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const code = (Math.abs(hash * 31) % 9000 + 1000).toString();
  return `PX-${code}-${hex.slice(0, 4)}`;
}

// Format nice readable timestamp
export function formatReceiptTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

// Build receipt doc ID
export function buildReceiptDocId(room: string, user: string, slate: string, sport: SportId): string {
  const cleanRoom = (room || 'COUCH').trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
  const cleanUser = (user || 'DAD').trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
  const cleanSlate = (slate || 'SUPERSTARS').trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
  return `${cleanRoom}__${cleanUser}__${cleanSlate}__${sport}`;
}

// Save trust receipt to Firestore + localStorage
export async function saveTrustReceipt(receipt: TrustReceipt): Promise<boolean> {
  const docId = buildReceiptDocId(receipt.room_code, receipt.user_name, receipt.slate_id, receipt.sport);
  const cacheKey = `pixel_pros_receipt_${docId}`;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(receipt));
  } catch {}

  try {
    const docRef = doc(db, 'trust_receipts', docId);
    await setDoc(docRef, { ...receipt, id: docId, updated_at: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `trust_receipts/${docId}`);
    return false;
  }
}

// Fetch receipts for room & sport
export async function fetchRoomTrustReceipts(roomCode: string, sport: SportId): Promise<TrustReceipt[]> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const baseRoom = cleanRoom.split('__')[0];

  try {
    const col = collection(db, 'trust_receipts');
    const q = query(col, where('sport', '==', sport));
    const snap = await getDocs(q);
    const list: TrustReceipt[] = [];
    snap.forEach((d) => {
      const data = d.data() as TrustReceipt;
      const r = (data.room_code || '').trim().toUpperCase();
      if (r === cleanRoom || r.startsWith(`${baseRoom}__`) || r === baseRoom) {
        list.push({ ...data, id: d.id });
      }
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'trust_receipts');
    return [];
  }
}

// Subscribe to real-time room trust receipts
export function subscribeRoomTrustReceipts(
  roomCode: string,
  sport: SportId,
  callback: (receipts: TrustReceipt[]) => void
): Unsubscribe {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const baseRoom = cleanRoom.split('__')[0];
  const col = collection(db, 'trust_receipts');
  const q = query(col, where('sport', '==', sport));

  return onSnapshot(
    q,
    (snap) => {
      const list: TrustReceipt[] = [];
      snap.forEach((d) => {
        const data = d.data() as TrustReceipt;
        const r = (data.room_code || '').trim().toUpperCase();
        if (r === cleanRoom || r.startsWith(`${baseRoom}__`) || r === baseRoom) {
          list.push({ ...data, id: d.id });
        }
      });
      callback(list);
    },
    (err) => {
      console.warn('Realtime trust receipts listener error:', err);
    }
  );
}

// Build reaction doc ID
export function buildReactionDocId(room: string, targetUser: string, sport: SportId): string {
  const cleanRoom = (room || 'COUCH').trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
  const cleanUser = (targetUser || 'DAD').trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
  return `${cleanRoom}__${cleanUser}__${sport}`;
}

// Add a reaction from a family member to another squad
export async function addSquadReaction(
  roomCode: string,
  targetUser: string,
  senderUser: string,
  emoji: ReactionEmoji,
  sport: SportId
): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanTarget = (targetUser || '').trim().toUpperCase();
  const cleanSender = (senderUser || 'ANON').trim().toUpperCase();
  if (!cleanTarget) return false;

  const docId = buildReactionDocId(cleanRoom, cleanTarget, sport);
  const now = new Date().toISOString();

  // Local optimistic update
  const localKey = `pixel_pros_reactions_${cleanRoom}_${sport}`;
  try {
    const raw = localStorage.getItem(localKey);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed[cleanTarget]) parsed[cleanTarget] = {};
    if (!parsed[cleanTarget][emoji]) parsed[cleanTarget][emoji] = [];
    // Toggle: if sender already stamped this exact emoji recently, keep or append
    parsed[cleanTarget][emoji].push({ emoji, sender: cleanSender, timestamp: now });
    localStorage.setItem(localKey, JSON.stringify(parsed));
  } catch {}

  try {
    const docRef = doc(db, 'squad_reactions', docId);
    const newEntry: SquadReactionEntry = { emoji, sender: cleanSender, timestamp: now };
    await setDoc(
      docRef,
      {
        room_code: cleanRoom,
        target_user: cleanTarget,
        sport,
        updated_at: now,
        [`emoji_${emoji}`]: [newEntry], // mergeable
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `squad_reactions/${docId}`);
    return false;
  }
}

// Subscribe to real-time reactions for room
export function subscribeSquadReactions(
  roomCode: string,
  sport: SportId,
  callback: (reactions: SquadReactionsMap) => void
): Unsubscribe {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const baseRoom = cleanRoom.split('__')[0];
  const col = collection(db, 'squad_reactions');
  const q = query(col, where('sport', '==', sport));

  return onSnapshot(
    q,
    (snap) => {
      const map: SquadReactionsMap = {};
      snap.forEach((d) => {
        const data = d.data();
        const r = (data.room_code || '').trim().toUpperCase();
        if (r === cleanRoom || r.startsWith(`${baseRoom}__`) || r === baseRoom) {
          const target = (data.target_user || '').trim().toUpperCase();
          if (!map[target]) map[target] = {};
          // Gather any emoji keys
          const emojis: ReactionEmoji[] = ['👑', '🔥', '🧊', '🎯', '🚀', '🍿', '🧂'];
          emojis.forEach((em) => {
            const list = data[`emoji_${em}`];
            if (Array.isArray(list) && list.length > 0) {
              map[target][em] = list;
            }
          });
        }
      });
      callback(map);
    },
    (err) => {
      console.warn('Realtime reactions error:', err);
    }
  );
}

// Compute all unlockable badges for a given user squad
export function computeSquadAchievements(
  userName: string,
  roomRosters: UserRoster[],
  matches: Match[],
  allCompetitors: Competitor[],
  receipts: TrustReceipt[] = []
): AchievementBadge[] {
  const normalizedUser = (userName || '').trim().toUpperCase();

  // Find all rosters belonging to this user
  const userRosters = roomRosters.filter(
    (r) => (r.user_name || '').trim().toUpperCase() === normalizedUser
  );

  // User receipts
  const userReceipts = receipts.filter(
    (rc) => (rc.user_name || '').trim().toUpperCase() === normalizedUser
  );

  const lockedRostersCount = userRosters.filter((r) => r.is_locked).length;
  const onTimeReceiptsCount = userReceipts.filter((rc) => rc.is_on_time).length;

  // Check if current user is top scorer in the base room
  let isRoomLeader = false;
  let hasHighRoller = false;
  let hasClutchLock = onTimeReceiptsCount > 0;
  let hasIronRoster = lockedRostersCount >= 3;
  let hasTripleCrown = false;

  // Evaluate scores for user rosters
  const playerMap = new Map<string, Competitor>();
  allCompetitors.forEach((c) => playerMap.set(String(c.id), c));

  let maxRosterScore = 0;
  userRosters.forEach((r) => {
    const s1 = playerMap.get(r.star_1_id);
    const s2 = playerMap.get(r.star_2_id);
    const s3 = playerMap.get(r.star_3_id);

    const sc1 = s1?.score ?? s1?.current_score ?? s1?.lastGameScore ?? 0;
    const sc2 = s2?.score ?? s2?.current_score ?? s2?.lastGameScore ?? 0;
    const sc3 = s3?.score ?? s3?.current_score ?? s3?.lastGameScore ?? 0;
    const total = sc1 + sc2 + sc3;

    if (total > maxRosterScore) maxRosterScore = total;
    if (total >= 60) hasHighRoller = true;
    if (sc1 >= 15 && sc2 >= 15 && sc3 >= 15) hasTripleCrown = true;
  });

  // Check leader among all squads in room
  let maxRoomScore = 0;
  let leaderUser = '';
  roomRosters.forEach((r) => {
    const s1 = playerMap.get(r.star_1_id);
    const s2 = playerMap.get(r.star_2_id);
    const s3 = playerMap.get(r.star_3_id);
    const sc =
      (s1?.score ?? s1?.current_score ?? 0) +
      (s2?.score ?? s2?.current_score ?? 0) +
      (s3?.score ?? s3?.current_score ?? 0);
    if (sc > maxRoomScore) {
      maxRoomScore = sc;
      leaderUser = (r.user_name || '').trim().toUpperCase();
    }
  });

  if (maxRoomScore > 0 && leaderUser === normalizedUser) {
    isRoomLeader = true;
  }

  return [
    {
      id: 'room_leader',
      title: 'Crown Holder',
      tagline: '1st place in the Couch Room',
      icon: '👑',
      color: '#facc15',
      tier: 'gold',
      criteria: 'Lead the room leaderboard with the highest point total',
      unlocked: isRoomLeader,
      progressText: isRoomLeader ? 'Active Champion!' : 'Chase #1 spot',
    },
    {
      id: 'ironclad_roster',
      title: 'Ironclad Squad',
      tagline: '3+ Game Slates Locked & Ready',
      icon: '🛡️',
      color: '#38bdf8',
      tier: 'diamond',
      criteria: 'Lock in 3 or more game slates across the weekly schedule',
      unlocked: hasIronRoster,
      progressText: `${Math.min(lockedRostersCount, 3)}/3 Slates Locked`,
    },
    {
      id: 'clutch_lock',
      title: 'Social Trust Certified',
      tagline: 'Tamper-Evident On-Time Lock',
      icon: '🤝',
      color: '#10b981',
      tier: 'gold',
      criteria: 'Officially lock in your 3 stars before kickoff with receipt verified',
      unlocked: hasClutchLock,
      progressText: hasClutchLock ? 'Verified On-Time!' : 'Lock before kickoff',
    },
    {
      id: 'high_roller',
      title: 'Century Club',
      tagline: '60+ Fantasy Points in a Game',
      icon: '🚀',
      color: '#a855f7',
      tier: 'diamond',
      criteria: 'Score 60 or more points from your 3 chosen stars in a single slate',
      unlocked: hasHighRoller,
      progressText: hasHighRoller ? `${maxRosterScore} PTS Recorded` : `${maxRosterScore}/60 PTS`,
    },
    {
      id: 'triple_crown',
      title: 'Triple Threat',
      tagline: 'All 3 Stars Scored 15+ Pts',
      icon: '🎯',
      color: '#f97316',
      tier: 'silver',
      criteria: 'Every single star in your lineup produces at least 15 points',
      unlocked: hasTripleCrown,
      progressText: hasTripleCrown ? 'Unlocked!' : 'Balanced firepower',
    },
    {
      id: 'hot_streak',
      title: 'On Fire Streak',
      tagline: 'Active Pick Participation',
      icon: '🔥',
      color: '#ef4444',
      tier: 'bronze',
      criteria: 'Maintain an active squad with all 3 stars picked and ready to play',
      unlocked: lockedRostersCount >= 1,
      progressText: lockedRostersCount >= 1 ? 'Streaking!' : 'Pick your stars',
    },
    {
      id: 'diamond_arm',
      title: 'Diamond Arm',
      tagline: 'MVP Quarterback / Superstar Showcase',
      icon: '💎',
      color: '#38bdf8',
      tier: 'diamond',
      criteria: 'Have an individual star score 25+ points in a single match',
      unlocked: maxRosterScore >= 25,
      progressText: maxRosterScore >= 25 ? 'Superstar Explosion!' : 'Draft high-impact stars',
    },
  ];
}
