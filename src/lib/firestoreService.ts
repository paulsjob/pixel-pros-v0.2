import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseClient';
import { SportId, UserRoster } from '../types';

export interface FirestoreRoomDoc {
  room_code: string;
  sport: 'nfl' | 'nba';
  isArchived?: boolean;
  createdAt?: string;
  archivedAt?: string;
}

export function buildRosterDocId(roomCode: string, userName: string, sport: string): string {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
  const cleanUser = (userName || 'DAD').trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';
  return `${cleanRoom}__${cleanUser}__${cleanSport}`;
}

export function buildRoomDocId(roomCode: string, sport: string): string {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';
  return `${cleanRoom}__${cleanSport}`;
}

export function buildLockDocId(roomCode: string, userName: string, sport: string): string {
  return buildRosterDocId(roomCode, userName, sport);
}

/**
 * Saves or updates a user roster in Firestore with zero-trust validation
 */
export async function saveRosterToFirestore(roster: UserRoster): Promise<boolean> {
  const cleanRoom = (roster.room_code || 'COUCH').trim().toUpperCase();
  const cleanUser = (roster.user_name || '').trim().toUpperCase();
  const cleanSport: 'nfl' | 'nba' = (roster.sport || 'nfl').toLowerCase() === 'nba' ? 'nba' : 'nfl';
  const docId = buildRosterDocId(cleanRoom, cleanUser, cleanSport);

  const payload = {
    room_code: cleanRoom,
    user_name: cleanUser,
    sport: cleanSport,
    star_1_id: String(roster.star_1_id || ''),
    star_2_id: String(roster.star_2_id || ''),
    star_3_id: String(roster.star_3_id || ''),
    is_locked: Boolean(roster.is_locked),
    device_id: roster.is_locked ? 'LOCKED' : (roster.device_id || 'UNLOCKED'),
    updated_at: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'user_rosters', docId);
    await setDoc(docRef, payload, { merge: true });

    // Also touch the parent room document
    await saveRoomToFirestore(cleanRoom.split('__')[0], cleanSport);

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `user_rosters/${docId}`);
  }
}

/**
 * Fetches all user rosters for a specific room and sport from Firestore
 */
export async function fetchRoomRostersFromFirestore(
  roomCode: string,
  sport: SportId
): Promise<UserRoster[]> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';
  const baseRoom = cleanRoom.split('__')[0];

  try {
    const rostersCol = collection(db, 'user_rosters');
    const q = query(
      rostersCol,
      where('sport', '==', cleanSport)
    );

    const snapshot = await getDocs(q);
    const results: UserRoster[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserRoster;
      const rCode = (data.room_code || '').trim().toUpperCase();
      // Match exact room or any slate room belonging to this base room
      if (rCode === cleanRoom || rCode.startsWith(`${baseRoom}__`)) {
        results.push({
          id: docSnap.id,
          room_code: data.room_code,
          user_name: data.user_name,
          sport: data.sport || cleanSport,
          star_1_id: data.star_1_id || '',
          star_2_id: data.star_2_id || '',
          star_3_id: data.star_3_id || '',
          is_locked: Boolean(data.is_locked),
          device_id: data.device_id || (data.is_locked ? 'LOCKED' : 'UNLOCKED'),
          updated_at: data.updated_at,
        });
      }
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'user_rosters');
  }
}

/**
 * Subscribes to real-time changes for a room and its slates
 */
export function subscribeToRoomRostersFirestore(
  roomCode: string,
  sport: SportId,
  callback: (rosters: UserRoster[]) => void
): Unsubscribe {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';
  const baseRoom = cleanRoom.split('__')[0];

  const rostersCol = collection(db, 'user_rosters');
  const q = query(
    rostersCol,
    where('sport', '==', cleanSport)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rosters: UserRoster[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserRoster;
        const rCode = (data.room_code || '').trim().toUpperCase();
        if (rCode === cleanRoom || rCode.startsWith(`${baseRoom}__`)) {
          rosters.push({
            id: docSnap.id,
            room_code: data.room_code,
            user_name: data.user_name,
            sport: data.sport || cleanSport,
            star_1_id: data.star_1_id || '',
            star_2_id: data.star_2_id || '',
            star_3_id: data.star_3_id || '',
            is_locked: Boolean(data.is_locked),
            device_id: data.device_id || (data.is_locked ? 'LOCKED' : 'UNLOCKED'),
            updated_at: data.updated_at,
          });
        }
      });
      callback(rosters);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'user_rosters');
    }
  );
}

/**
 * Registers or touches an active battle room
 */
export async function saveRoomToFirestore(roomCode: string, sport: SportId): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase().split('__')[0];
  const cleanSport: 'nfl' | 'nba' = sport === 'nba' ? 'nba' : 'nfl';
  const docId = buildRoomDocId(cleanRoom, cleanSport);

  try {
    const docRef = doc(db, 'rooms', docId);
    await setDoc(
      docRef,
      {
        room_code: cleanRoom,
        sport: cleanSport,
        isArchived: false,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rooms/${docId}`);
  }
}

/**
 * Fetches all registered battle rooms
 */
export async function fetchAllRoomsFromFirestore(
  sport: SportId
): Promise<{ roomCode: string; sport: 'nfl' | 'nba' }[]> {
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';
  const defaultRoom = cleanSport === 'nba' ? 'HOOPS' : 'COUCH';
  const set = new Set<string>([defaultRoom]);

  try {
    const roomsCol = collection(db, 'rooms');
    const q = query(roomsCol, where('sport', '==', cleanSport));
    const snapshot = await getDocs(q);

    const list: { roomCode: string; sport: 'nfl' | 'nba' }[] = [];
    snapshot.forEach((snap) => {
      const data = snap.data();
      const code = (data.room_code || '').trim().toUpperCase();
      if (code && !data.isArchived) {
        set.add(code);
      }
    });

    // Also scan user_rosters to discover any rooms with saved squads
    const rostersCol = collection(db, 'user_rosters');
    const rq = query(rostersCol, where('sport', '==', cleanSport));
    const rSnap = await getDocs(rq);
    rSnap.forEach((snap) => {
      const data = snap.data();
      const baseCode = (data.room_code || '').trim().toUpperCase().split('__')[0];
      if (baseCode) set.add(baseCode);
    });

    set.forEach((code) => list.push({ roomCode: code, sport: cleanSport }));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'rooms');
  }
}

/**
 * Toggles or updates squad lock status
 */
export async function setSquadLockFirestore(
  roomCode: string,
  userName: string,
  sport: SportId,
  isLocked: boolean
): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanUser = (userName || '').trim().toUpperCase();
  const cleanSport: 'nfl' | 'nba' = sport === 'nba' ? 'nba' : 'nfl';
  const docId = buildLockDocId(cleanRoom, cleanUser, cleanSport);

  try {
    const lockRef = doc(db, 'locks', docId);
    await setDoc(
      lockRef,
      {
        room_code: cleanRoom,
        user_name: cleanUser,
        sport: cleanSport,
        is_locked: Boolean(isLocked),
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    // Also update user_roster doc if it exists
    const rosterRef = doc(db, 'user_rosters', docId);
    await setDoc(
      rosterRef,
      {
        is_locked: Boolean(isLocked),
        device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `locks/${docId}`);
  }
}
