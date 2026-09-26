import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// Persistent Database Storage File
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pixel_pros_db.json');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sqntjgjqtwbcqpxcqzbg.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbnRqZ2pxdHdiY3FweGNxemJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTk2NzYsImV4cCI6MjEwNDc5NTY3Nn0.2M_u9c6g2yWm2Ev0e_FeucFSnEFTCeerVvpNwNTdI4g';

let serverSupabase: any = null;
try {
  serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  console.warn('Could not initialize server Supabase client:', e);
}

interface StoredRoster {
  id: string;
  room_code: string;
  user_name: string;
  sport: 'nfl' | 'nba';
  star_1_id: string;
  star_2_id: string;
  star_3_id: string;
  is_locked: boolean;
  device_id: string;
  updated_at: string;
}

interface ServerDB {
  rosters: StoredRoster[];
  locks: Record<string, boolean>; // key: `${room}_${user}_${sport}`
  rooms?: Record<string, { sport: 'nfl' | 'nba'; createdAt: string; isArchived?: boolean; archivedAt?: string | null }>;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
      console.warn('Failed to create data directory:', err);
    }
  }
}

function loadDatabase(): ServerDB {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rosters)) {
        return {
          rosters: parsed.rosters,
          locks: parsed.locks || {},
          rooms: parsed.rooms || {},
        };
      }
    } catch (err) {
      console.warn('Failed to read pixel_pros_db.json, reinitializing:', err);
    }
  }

  const initialDB: ServerDB = {
    rosters: [],
    locks: {},
    rooms: {
      COUCH_nfl: { sport: 'nfl', createdAt: new Date().toISOString() },
      HOOPS_nba: { sport: 'nba', createdAt: new Date().toISOString() },
    },
  };
  saveDatabase(initialDB);
  return initialDB;
}

function saveDatabase(db: ServerDB): void {
  try {
    ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file atomically:', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (fallbackErr) {
      console.error('Fallback write also failed:', fallbackErr);
    }
  }
}

// In-memory state synchronized with disk
let dbState: ServerDB = loadDatabase();

async function syncWithSupabase(roomCodeFilter?: string) {
  if (!serverSupabase) return;
  try {
    let query = serverSupabase.from('user_rosters').select('*');
    if (roomCodeFilter && roomCodeFilter !== '*') {
      const cleanFilter = roomCodeFilter.trim().toUpperCase();
      query = query.or(`room_code.eq.${cleanFilter},room_code.like.${cleanFilter}__%`);
    }
    const { data, error } = await query;
    if (error || !data || !Array.isArray(data)) return;

    let hasChanges = false;
    data.forEach((row: any) => {
      if (!row || !row.room_code || !row.user_name) return;
      const rRoom = row.room_code.trim().toUpperCase();
      const rUser = row.user_name.trim().toUpperCase();
      const rSport = (row.sport || 'nfl').trim().toLowerCase() as 'nfl' | 'nba';
      const lockKey = `${rRoom}_${rUser}_${rSport}`;
      const starIds = [row.star_1_id, row.star_2_id, row.star_3_id].filter(
        (id: any) => id && typeof id === 'string' && id.trim() !== ''
      );
      const isLocked = Boolean(
        row.is_locked === true ||
        String(row.is_locked) === 'true' ||
        String(row.device_id).toUpperCase() === 'LOCKED' ||
        dbState.locks[lockKey] === true
      );

      const existingIdx = dbState.rosters.findIndex(
        (r) =>
          (r.room_code || '').trim().toUpperCase() === rRoom &&
          (r.user_name || '').trim().toUpperCase() === rUser &&
          (r.sport || 'nfl').trim().toLowerCase() === rSport
      );

      const rowTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      const record: StoredRoster = {
        id: row.id || `rost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        room_code: rRoom,
        user_name: rUser,
        sport: rSport,
        star_1_id: row.star_1_id || '',
        star_2_id: row.star_2_id || '',
        star_3_id: row.star_3_id || '',
        is_locked: isLocked,
        device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
        updated_at: row.updated_at || new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        const existingTime = dbState.rosters[existingIdx].updated_at
          ? new Date(dbState.rosters[existingIdx].updated_at).getTime()
          : 0;
        if (rowTime >= existingTime || dbState.rosters[existingIdx].is_locked !== isLocked) {
          dbState.rosters[existingIdx] = record;
          dbState.locks[lockKey] = isLocked;
          hasChanges = true;
        }
      } else {
        dbState.rosters.push(record);
        dbState.locks[lockKey] = isLocked;
        hasChanges = true;
      }

      const baseRoom = rRoom.split('__')[0];
      if (!dbState.rooms) dbState.rooms = {};
      if (!dbState.rooms[`${baseRoom}_${rSport}`]) {
        dbState.rooms[`${baseRoom}_${rSport}`] = { sport: rSport, createdAt: new Date().toISOString() };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveDatabase(dbState);
    }
  } catch (err) {
    console.warn('syncWithSupabase error:', err);
  }
}

// Initial background sync
syncWithSupabase();

// Connected Server-Sent Event (SSE) clients
interface SSEClient {
  id: number;
  res: Response;
  roomCode?: string;
  sport?: string;
}
let sseClientId = 0;
const sseClients = new Map<number, SSEClient>();

function broadcastRoomUpdate(roomCode: string, sport?: string, actionDetail?: any) {
  const cleanRoom = (roomCode || '').trim().toUpperCase();
  const cleanSport = (sport || '').trim().toLowerCase();
  const payload = JSON.stringify({
    type: 'roster_update',
    room_code: cleanRoom,
    sport: cleanSport,
    detail: actionDetail || {},
    timestamp: Date.now(),
  });

  for (const [id, client] of sseClients.entries()) {
    try {
      if (
        !client.roomCode ||
        client.roomCode === '*' ||
        client.roomCode === cleanRoom
      ) {
        client.res.write(`data: ${payload}\n\n`);
      }
    } catch (err) {
      sseClients.delete(id);
    }
  }
}

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    rostersCount: dbState.rosters.length,
    activeConnections: sseClients.size,
  });
});

// 2. Real-time Server-Sent Events stream
app.get('/api/realtime', (req: Request, res: Response) => {
  const roomCode = req.query.roomCode ? String(req.query.roomCode).trim().toUpperCase() : '*';
  const sport = req.query.sport ? String(req.query.sport).trim().toLowerCase() : '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const id = ++sseClientId;
  sseClients.set(id, { id, res, roomCode, sport });

  // Initial connection handshake
  res.write(`: connected id=${id}\n\n`);

  // Periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(id);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(id);
  });
});

// 3. Fetch rosters for a room
app.get('/api/rosters', async (req: Request, res: Response) => {
  const isAll = req.query.all === 'true' || req.query.roomCode === '*';
  const roomCode = req.query.roomCode ? String(req.query.roomCode).trim().toUpperCase() : (isAll ? '*' : 'COUCH');
  const sport = req.query.sport ? String(req.query.sport).trim().toLowerCase() : '';

  if (!isAll) {
    await syncWithSupabase(roomCode);
  }

  const results = dbState.rosters.filter((r) => {
    const rRoom = (r.room_code || '').trim().toUpperCase();
    const rSport = (r.sport || 'nfl').trim().toLowerCase();
    const isRoomMatch = isAll || rRoom === roomCode || rRoom.startsWith(`${roomCode}__`);
    return isRoomMatch && (sport ? rSport === sport : true);
  });

  res.json({ success: true, rosters: results });
});

// 4. Upsert a user roster (picks, stars, lock)
app.post('/api/rosters', (req: Request, res: Response) => {
  const {
    room_code,
    user_name,
    sport = 'nfl',
    star_1_id = '',
    star_2_id = '',
    star_3_id = '',
    is_locked = false,
    device_id = 'UNLOCKED',
    force_clear = false,
  } = req.body;

  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();
  const cleanUser = (user_name || '').trim().toUpperCase();
  const cleanSport: 'nfl' | 'nba' = sport === 'nba' ? 'nba' : 'nfl';

  if (!cleanUser) {
    res.status(400).json({ success: false, error: 'user_name is required' });
    return;
  }

  const existingIdx = dbState.rosters.findIndex(
    (r) =>
      (r.room_code || '').trim().toUpperCase() === cleanRoom &&
      (r.user_name || '').trim().toUpperCase() === cleanUser &&
      (r.sport || 'nfl').trim().toLowerCase() === cleanSport
  );
  const existingRoster = existingIdx >= 0 ? dbState.rosters[existingIdx] : null;

  // Determine final star IDs: if caller passed empty stars but an existing squad has picks,
  // preserve the existing picks unless force_clear is explicitly requested.
  let finalS1 = star_1_id || '';
  let finalS2 = star_2_id || '';
  let finalS3 = star_3_id || '';

  if (!finalS1 && !finalS2 && !finalS3 && !force_clear && existingRoster) {
    finalS1 = existingRoster.star_1_id || '';
    finalS2 = existingRoster.star_2_id || '';
    finalS3 = existingRoster.star_3_id || '';
  }

  const starIds = [finalS1, finalS2, finalS3].filter(
    (id) => id && typeof id === 'string' && id.trim() !== ''
  );
  const distinctIds = new Set(starIds);
  const hasThreeDistinct = starIds.length === 3 && distinctIds.size === 3;
  const guardedLocked = hasThreeDistinct && (Boolean(is_locked) || (existingRoster?.is_locked && !force_clear));

  const lockKey = `${cleanRoom}_${cleanUser}_${cleanSport}`;
  dbState.locks[lockKey] = guardedLocked;

  const updatedRecord: StoredRoster = {
    id: existingRoster ? existingRoster.id : `rost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    room_code: cleanRoom,
    user_name: cleanUser,
    sport: cleanSport,
    star_1_id: finalS1,
    star_2_id: finalS2,
    star_3_id: finalS3,
    is_locked: guardedLocked,
    device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
    updated_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    dbState.rosters[existingIdx] = updatedRecord;
  } else {
    dbState.rosters.push(updatedRecord);
  }

  const baseRoom = cleanRoom.split('__')[0];
  if (!dbState.rooms) dbState.rooms = {};
  dbState.rooms[`${baseRoom}_${cleanSport}`] = { sport: cleanSport, createdAt: new Date().toISOString() };

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'upsert', roster: updatedRecord });

  // Sync to Supabase in background
  if (serverSupabase) {
    serverSupabase
      .from('user_rosters')
      .upsert(
        {
          room_code: cleanRoom,
          user_name: cleanUser,
          sport: cleanSport,
          star_1_id: star_1_id || '',
          star_2_id: star_2_id || '',
          star_3_id: star_3_id || '',
          is_locked: guardedLocked,
          device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
          updated_at: updatedRecord.updated_at,
        },
        { onConflict: 'room_code,user_name,sport' }
      )
      .catch((sbErr: any) => console.warn('Supabase upsert sync error from Express:', sbErr));
  }

  res.json({ success: true, data: updatedRecord });
});

// 5. Delete a user roster
app.delete('/api/rosters', (req: Request, res: Response) => {
  const room_code = req.query.room_code || req.body.room_code;
  const user_name = req.query.user_name || req.body.user_name;
  const sport = req.query.sport || req.body.sport || 'nfl';

  const cleanRoom = (room_code || 'COUCH').toString().trim().toUpperCase();
  const cleanUser = (user_name || '').toString().trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';

  if (!cleanUser) {
    res.status(400).json({ success: false, error: 'user_name is required' });
    return;
  }

  dbState.rosters = dbState.rosters.filter(
    (r) =>
      !(
        (r.room_code || '').trim().toUpperCase() === cleanRoom &&
        (r.user_name || '').trim().toUpperCase() === cleanUser &&
        (r.sport || 'nfl').trim().toLowerCase() === cleanSport
      )
  );

  delete dbState.locks[`${cleanRoom}_${cleanUser}_${cleanSport}`];
  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'delete', user_name: cleanUser });

  if (serverSupabase) {
    serverSupabase
      .from('user_rosters')
      .delete()
      .eq('room_code', cleanRoom)
      .eq('user_name', cleanUser)
      .catch(() => {});
  }

  res.json({ success: true });
});

// 6. Rename a squad
app.post('/api/rosters/rename', (req: Request, res: Response) => {
  const { room_code, old_user_name, new_user_name, sport = 'nfl' } = req.body;
  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();
  const cleanOld = (old_user_name || '').trim().toUpperCase();
  const cleanNew = (new_user_name || '').trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';

  if (!cleanOld || !cleanNew) {
    res.status(400).json({ success: false, error: 'old_user_name and new_user_name are required' });
    return;
  }

  const roster = dbState.rosters.find(
    (r) =>
      (r.room_code || '').trim().toUpperCase() === cleanRoom &&
      (r.user_name || '').trim().toUpperCase() === cleanOld &&
      (r.sport || 'nfl').trim().toLowerCase() === cleanSport
  );

  if (roster) {
    roster.user_name = cleanNew;
    roster.updated_at = new Date().toISOString();

    const oldLock = dbState.locks[`${cleanRoom}_${cleanOld}_${cleanSport}`];
    if (typeof oldLock === 'boolean') {
      dbState.locks[`${cleanRoom}_${cleanNew}_${cleanSport}`] = oldLock;
      delete dbState.locks[`${cleanRoom}_${cleanOld}_${cleanSport}`];
    }

    saveDatabase(dbState);
    broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'rename', old_user_name: cleanOld, new_user_name: cleanNew });
  }

  res.json({ success: true });
});

// 7. Reset all rosters in a room
app.post('/api/rosters/reset', (req: Request, res: Response) => {
  const { room_code } = req.body;
  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();

  dbState.rosters = dbState.rosters.filter((r) => (r.room_code || '').trim().toUpperCase() !== cleanRoom);

  if (dbState.rooms) {
    delete dbState.rooms[`${cleanRoom}_nfl`];
    delete dbState.rooms[`${cleanRoom}_nba`];
  }

  for (const k of Object.keys(dbState.locks)) {
    if (k.startsWith(`${cleanRoom}_`)) {
      delete dbState.locks[k];
    }
  }

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, undefined, { action: 'reset' });

  res.json({ success: true });
});

// 8. Lock / unlock squad(s)
app.post('/api/rosters/lock', (req: Request, res: Response) => {
  const { room_code, user_name, is_locked, sport = 'nfl', all = false } = req.body;
  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';
  const lockedBool = Boolean(is_locked);

  if (all) {
    dbState.rosters.forEach((r) => {
      if (
        (r.room_code || '').trim().toUpperCase() === cleanRoom &&
        (r.sport || 'nfl').trim().toLowerCase() === cleanSport
      ) {
        r.is_locked = lockedBool;
        r.device_id = lockedBool ? 'LOCKED' : 'UNLOCKED';
        r.updated_at = new Date().toISOString();
        dbState.locks[`${cleanRoom}_${r.user_name.toUpperCase()}_${cleanSport}`] = lockedBool;
      }
    });
  } else {
    const cleanUser = (user_name || '').trim().toUpperCase();
    if (!cleanUser) {
      res.status(400).json({ success: false, error: 'user_name required' });
      return;
    }

    const roster = dbState.rosters.find(
      (r) =>
        (r.room_code || '').trim().toUpperCase() === cleanRoom &&
        (r.user_name || '').trim().toUpperCase() === cleanUser &&
        (r.sport || 'nfl').trim().toLowerCase() === cleanSport
    );

    if (roster) {
      roster.is_locked = lockedBool;
      roster.device_id = lockedBool ? 'LOCKED' : 'UNLOCKED';
      roster.updated_at = new Date().toISOString();
    }
    dbState.locks[`${cleanRoom}_${cleanUser}_${cleanSport}`] = lockedBool;
  }

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'lock', is_locked: lockedBool, all });

  res.json({ success: true });
});

// 9. Clear squad stars
app.post('/api/rosters/clear-stars', (req: Request, res: Response) => {
  const { room_code, user_name, sport = 'nfl' } = req.body;
  const cleanRoom = (room_code || 'COUCH').trim().toUpperCase();
  const cleanUser = (user_name || '').trim().toUpperCase();
  const cleanSport = sport === 'nba' ? 'nba' : 'nfl';

  if (!cleanUser) {
    res.status(400).json({ success: false, error: 'user_name required' });
    return;
  }

  const roster = dbState.rosters.find(
    (r) =>
      (r.room_code || '').trim().toUpperCase() === cleanRoom &&
      (r.user_name || '').trim().toUpperCase() === cleanUser &&
      (r.sport || 'nfl').trim().toLowerCase() === cleanSport
  );

  if (roster) {
    roster.star_1_id = '';
    roster.star_2_id = '';
    roster.star_3_id = '';
    roster.is_locked = false;
    roster.device_id = 'UNLOCKED';
    roster.updated_at = new Date().toISOString();
  }
  dbState.locks[`${cleanRoom}_${cleanUser}_${cleanSport}`] = false;

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanRoom, cleanSport, { action: 'clear_stars', user_name: cleanUser });

  res.json({ success: true });
});

// 10. Register or touch an active room
app.post('/api/rooms', (req: Request, res: Response) => {
  const { room_code, sport = 'nfl' } = req.body;
  const cleanCode = (room_code || '').trim().toUpperCase();
  const cleanSport: 'nfl' | 'nba' = (sport || '').toString().toLowerCase() === 'nba' ? 'nba' : 'nfl';

  if (cleanCode) {
    if (!dbState.rooms) dbState.rooms = {};
    dbState.rooms[`${cleanCode}_${cleanSport}`] = {
      sport: cleanSport,
      createdAt: new Date().toISOString(),
    };
    saveDatabase(dbState);
  }

  res.json({ success: true });
});

// 11. List all active rooms across all devices
app.get('/api/rooms', async (req: Request, res: Response) => {
  await syncWithSupabase();

  const roomMap = new Map<string, { sport: 'nfl' | 'nba'; squads: Set<string> }>();

  // Ensure default rooms are present
  roomMap.set('COUCH_nfl', { sport: 'nfl', squads: new Set() });
  roomMap.set('HOOPS_nba', { sport: 'nba', squads: new Set() });

  // Include registered rooms
  if (dbState.rooms) {
    Object.entries(dbState.rooms).forEach(([mapKey, meta]) => {
      const lastUnderscore = mapKey.lastIndexOf('_');
      const baseCode = (lastUnderscore > 0 ? mapKey.slice(0, lastUnderscore) : mapKey).split('__')[0];
      const unifiedKey = `${baseCode}_${meta.sport}`;
      if (!roomMap.has(unifiedKey)) {
        roomMap.set(unifiedKey, { sport: meta.sport, squads: new Set() });
      }
    });
  }

  // Include optional query hint ?roomCode=
  const hintRoom = (req.query.roomCode as string || '').trim().toUpperCase();
  const hintSport: 'nfl' | 'nba' = (req.query.sport as string || '').toLowerCase() === 'nba' ? 'nba' : 'nfl';
  if (hintRoom) {
    const hintBase = hintRoom.split('__')[0];
    const hintKey = `${hintBase}_${hintSport}`;
    if (!roomMap.has(hintKey)) {
      roomMap.set(hintKey, { sport: hintSport, squads: new Set() });
    }
  }

  dbState.rosters.forEach((r) => {
    const code = (r.room_code || '').trim().toUpperCase();
    const user = (r.user_name || '').trim().toUpperCase();
    const sport: 'nfl' | 'nba' = r.sport === 'nba' ? 'nba' : 'nfl';

    if (!code) return;
    const baseCode = code.split('__')[0];
    const mapKey = `${baseCode}_${sport}`;

    if (!roomMap.has(mapKey)) {
      roomMap.set(mapKey, { sport, squads: new Set() });
    }
    if (user) {
      roomMap.get(mapKey)!.squads.add(user);
    }
  });

  const summaries = Array.from(roomMap.entries()).map(([key, val]) => {
    const lastUnderscore = key.lastIndexOf('_');
    const roomCode = lastUnderscore > 0 ? key.slice(0, lastUnderscore) : key;
    const meta = dbState.rooms?.[key];
    return {
      roomCode,
      sport: val.sport,
      squadCount: val.squads.size,
      squadNames: Array.from(val.squads),
      isArchived: Boolean(meta?.isArchived),
      archivedAt: meta?.archivedAt,
    };
  });

  res.json({ success: true, rooms: summaries });
});

// Archive or Unarchive a Room
app.post('/api/rooms/archive', (req: Request, res: Response) => {
  const { room_code, sport = 'nfl', is_archived = true } = req.body;
  const cleanCode = (room_code || '').trim().toUpperCase();
  const cleanSport: 'nfl' | 'nba' = (sport || '').toString().toLowerCase() === 'nba' ? 'nba' : 'nfl';
  if (!cleanCode) {
    res.status(400).json({ error: 'room_code is required' });
    return;
  }
  const key = `${cleanCode}_${cleanSport}`;
  if (!dbState.rooms) dbState.rooms = {};
  if (!dbState.rooms[key]) {
    dbState.rooms[key] = {
      sport: cleanSport,
      createdAt: new Date().toISOString(),
    };
  }
  dbState.rooms[key].isArchived = Boolean(is_archived);
  if (is_archived) {
    dbState.rooms[key].archivedAt = new Date().toISOString();
  } else {
    delete dbState.rooms[key].archivedAt;
  }

  // Also cascade archive status to all match slates in this room
  Object.keys(dbState.rooms).forEach((rKey) => {
    if (rKey.startsWith(`${cleanCode}__`) && rKey.endsWith(`_${cleanSport}`)) {
      dbState.rooms[rKey].isArchived = Boolean(is_archived);
      if (is_archived) {
        dbState.rooms[rKey].archivedAt = new Date().toISOString();
      } else {
        delete dbState.rooms[rKey].archivedAt;
      }
    }
  });

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanCode, cleanSport, { action: 'room_archive', is_archived: Boolean(is_archived) });
  res.json({ success: true, roomCode: cleanCode, sport: cleanSport, isArchived: Boolean(is_archived) });
});

// Auto-archive all completed/past week rooms
app.post('/api/rooms/auto-archive-completed', (req: Request, res: Response) => {
  let archivedCount = 0;
  if (!dbState.rooms) dbState.rooms = {};

  // Check all existing room records
  Object.entries(dbState.rooms).forEach(([key, meta]) => {
    const [code] = key.split('_');
    if (code !== 'COUCH' && code !== 'HOOPS' && !meta.isArchived) {
      meta.isArchived = true;
      meta.archivedAt = new Date().toISOString();
      archivedCount++;
    }
  });

  // Also verify all rooms derived from rosters
  const roomKeys = new Set(
    dbState.rosters.map(
      (r) => `${(r.room_code || 'COUCH').toUpperCase()}_${(r.sport || 'nfl').toLowerCase()}`
    )
  );
  roomKeys.forEach((k) => {
    const [code, sp] = k.split('_');
    if (code !== 'COUCH' && code !== 'HOOPS') {
      if (!dbState.rooms[k]) {
        dbState.rooms[k] = {
          sport: sp as any,
          createdAt: new Date().toISOString(),
          isArchived: true,
          archivedAt: new Date().toISOString(),
        };
        archivedCount++;
      } else if (!dbState.rooms[k].isArchived) {
        dbState.rooms[k].isArchived = true;
        dbState.rooms[k].archivedAt = new Date().toISOString();
        archivedCount++;
      }
    }
  });

  saveDatabase(dbState);
  res.json({ success: true, archivedCount });
});

// Permanently delete a room and all its subslates and rosters
app.post('/api/rooms/delete', (req: Request, res: Response) => {
  const { room_code, sport = 'nfl' } = req.body;
  const cleanCode = (room_code || '').trim().toUpperCase();
  const cleanSport: 'nfl' | 'nba' = (sport || '').toString().toLowerCase() === 'nba' ? 'nba' : 'nfl';
  if (!cleanCode) {
    res.status(400).json({ error: 'room_code is required' });
    return;
  }

  if (dbState.rooms) {
    delete dbState.rooms[`${cleanCode}_${cleanSport}`];
    delete dbState.rooms[`${cleanCode}_nfl`];
    delete dbState.rooms[`${cleanCode}_nba`];
    // Also remove any sub-slates under this room
    Object.keys(dbState.rooms).forEach((k) => {
      if (k.startsWith(`${cleanCode}__`)) {
        delete dbState.rooms[k];
      }
    });
  }

  // Remove all rosters for this room and its match slates
  dbState.rosters = dbState.rosters.filter((r) => {
    const raw = (r.room_code || '').trim().toUpperCase();
    return raw !== cleanCode && !raw.startsWith(`${cleanCode}__`);
  });

  // Remove locks
  for (const k of Object.keys(dbState.locks)) {
    if (k.startsWith(`${cleanCode}_`) || k.startsWith(`${cleanCode}__`)) {
      delete dbState.locks[k];
    }
  }

  saveDatabase(dbState);
  broadcastRoomUpdate(cleanCode, cleanSport, { action: 'room_deleted' });
  res.json({ success: true, roomCode: cleanCode });
});

// Permanently purge all archived old rooms and their rosters
app.post('/api/rooms/purge-archived', (req: Request, res: Response) => {
  let purgedCount = 0;
  if (!dbState.rooms) dbState.rooms = {};

  const archivedKeys: string[] = [];
  const archivedRoomCodes = new Set<string>();

  Object.entries(dbState.rooms).forEach(([key, meta]) => {
    if (meta.isArchived) {
      archivedKeys.push(key);
      const code = key.split('_')[0];
      if (code && code !== 'COUCH' && code !== 'HOOPS') {
        archivedRoomCodes.add(code);
      }
    }
  });

  // Delete all archived room records
  archivedKeys.forEach((key) => {
    delete dbState.rooms[key];
    purgedCount++;
  });

  // Delete all rosters belonging to those archived rooms
  dbState.rosters = dbState.rosters.filter((r) => {
    const raw = (r.room_code || '').trim().toUpperCase();
    const baseCode = raw.includes('__') ? raw.split('__')[0] : raw;
    return !archivedRoomCodes.has(baseCode);
  });

  // Clear locks for those archived rooms
  for (const k of Object.keys(dbState.locks)) {
    const parts = k.split('_');
    const baseCode = parts[0];
    if (archivedRoomCodes.has(baseCode)) {
      delete dbState.locks[k];
    }
  }

  saveDatabase(dbState);
  res.json({ success: true, purgedCount });
});

// -------------------------------------------------------------
// ESPN Proxy Endpoints (Zero-CORS backend fetching)
// -------------------------------------------------------------
app.get('/api/espn/scoreboard', async (req: Request, res: Response) => {
  try {
    const sport = req.query.sport === 'nba' ? 'nba' : 'nfl';
    const week = req.query.week ? String(req.query.week) : '';
    const seasonType = req.query.seasontype ? String(req.query.seasontype) : '2';

    const baseUrl = sport === 'nba'
      ? 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'
      : 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

    const params = new URLSearchParams();
    if (sport === 'nfl') {
      params.set('seasontype', seasonType);
      // If client requests a week, use it; otherwise use the current active week
      const targetWeek = week || String(weeklyRescanState.lastRescanWeek || 3);
      params.set('week', targetWeek);
    }
    const fullUrl = `${baseUrl}?${params.toString()}`;
    const resp = await fetch(fullUrl, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      res.status(resp.status).json({ error: `ESPN returned ${resp.status}` });
      return;
    }
    let data = await resp.json();

    // If all games in returned data are completed and no explicit week was forced, auto-advance to next week
    if (sport === 'nfl' && !week && Array.isArray(data.events) && data.events.length > 0) {
      const allDone = data.events.every(
        (ev: any) => ev.status?.type?.state === 'post' || ev.status?.type?.completed
      );
      if (allDone) {
        const nextWeekNum = (data.week?.number || weeklyRescanState.lastRescanWeek || 2) + 1;
        try {
          const nextUrl = `${baseUrl}?seasontype=${seasonType}&week=${nextWeekNum}`;
          const nextResp = await fetch(nextUrl, { headers: { Accept: 'application/json' } });
          if (nextResp.ok) {
            const nextData = await nextResp.json();
            if (nextData.events && nextData.events.length > 0) {
              data = nextData;
              weeklyRescanState.lastRescanWeek = nextWeekNum;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to proxy ESPN scoreboard' });
  }
});

app.get('/api/espn/summary', async (req: Request, res: Response) => {
  try {
    const event = String(req.query.event || '');
    const sport = req.query.sport === 'nba' ? 'basketball/nba' : 'football/nfl';
    if (!event) {
      res.status(400).json({ error: 'event ID is required' });
      return;
    }
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/summary?event=${event}`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      res.status(resp.status).json({ error: `ESPN returned ${resp.status}` });
      return;
    }
    const data = await resp.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to proxy ESPN summary' });
  }
});

app.get('/api/espn/depthchart', async (req: Request, res: Response) => {
  try {
    const teamId = String(req.query.teamId || req.query.team || '');
    if (!teamId) {
      res.status(400).json({ error: 'teamId is required' });
      return;
    }
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/depthcharts`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      res.status(resp.status).json({ error: `ESPN returned ${resp.status}` });
      return;
    }
    const data = await resp.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to proxy ESPN depthchart' });
  }
});

app.get('/api/espn/roster', async (req: Request, res: Response) => {
  try {
    const teamId = String(req.query.teamId || req.query.team || '');
    if (!teamId) {
      res.status(400).json({ error: 'teamId is required' });
      return;
    }
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      res.status(resp.status).json({ error: `ESPN returned ${resp.status}` });
      return;
    }
    const data = await resp.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to proxy ESPN roster' });
  }
});

// ESPN Live Injuries Proxy
app.get('/api/espn/injuries', async (req: Request, res: Response) => {
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries';
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      res.status(resp.status).json({ error: `ESPN returned ${resp.status}` });
      return;
    }
    const data = await resp.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to proxy ESPN injuries' });
  }
});

// -------------------------------------------------------------
// Tuesday 4:00 AM EST Weekly Automated Rescan Engine
// -------------------------------------------------------------
function getEasternParts(d = new Date()): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  return map;
}

function easternToDate(year: string, month: string, day: string, hour = '04', min = '00', sec = '00'): Date {
  const dateStr = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
  const estDate = new Date(new Date(dateStr + 'Z').toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const diff = new Date(dateStr + 'Z').getTime() - estDate.getTime();
  return new Date(new Date(dateStr + 'Z').getTime() + diff);
}

function getLastTuesday4AMEST(now = new Date()): Date {
  const p = getEasternParts(now);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = dayNames.indexOf(p.weekday);
  const hour = parseInt(p.hour, 10);

  let daysSinceTuesday = (dayIndex - 2 + 7) % 7;
  if (daysSinceTuesday === 0 && hour < 4) {
    daysSinceTuesday = 7;
  }

  const targetDate = new Date(now.getTime() - daysSinceTuesday * 86400000);
  const tp = getEasternParts(targetDate);
  return easternToDate(tp.year, tp.month, tp.day, '04', '00', '00');
}

function getNextTuesday4AMEST(now = new Date()): Date {
  const last = getLastTuesday4AMEST(now);
  return new Date(last.getTime() + 7 * 86400000);
}

// Rescan State
interface WeeklyRescanState {
  lastRescanTimestamp: string;
  lastRescanWeek: number;
  inProgress: boolean;
}

let weeklyRescanState: WeeklyRescanState = {
  lastRescanTimestamp: '',
  lastRescanWeek: 3,
  inProgress: false,
};

async function executeWeeklyTuesdayRescan(isForced = false): Promise<{ success: boolean; week: number; message: string }> {
  if (weeklyRescanState.inProgress) {
    return { success: false, week: weeklyRescanState.lastRescanWeek, message: 'Rescan already in progress' };
  }
  weeklyRescanState.inProgress = true;
  console.log(`[Weekly Rescan] Initiating Tuesday 4:00 AM EST full data rescan (forced: ${isForced})...`);

  try {
    // 1. Fetch fresh scoreboard from ESPN to determine the new week
    let newWeek = weeklyRescanState.lastRescanWeek || 3;
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week=${newWeek}`);
      if (res.ok) {
        const data = await res.json();
        const allCompleted = Array.isArray(data.events) && data.events.length > 0 &&
          data.events.every((ev: any) => ev.status?.type?.state === 'post' || ev.status?.type?.completed);
        if (allCompleted) {
          newWeek = (data.week?.number || newWeek) + 1;
        } else {
          newWeek = data.week?.number || newWeek;
        }
      }
    } catch {
      // fallback
    }

    // 2. Sync games to Supabase matches table
    await syncESPNToSupabase();

    // 3. Reset lock states on rosters for the fresh week so family members can make new picks
    for (const k of Object.keys(dbState.locks)) {
      if (k.endsWith('_nfl')) {
        dbState.locks[k] = false;
      }
    }
    dbState.rosters.forEach((r) => {
      if ((r.sport || 'nfl').toLowerCase() === 'nfl') {
        r.is_locked = false;
        r.device_id = 'UNLOCKED';
      }
    });

    // 4. Auto-archive past-week/completed rooms to reduce board clutter
    if (!dbState.rooms) dbState.rooms = {};
    Object.entries(dbState.rooms).forEach(([key, meta]) => {
      const [code] = key.split('_');
      if (code !== 'COUCH' && code !== 'HOOPS' && !meta.isArchived) {
        meta.isArchived = true;
        meta.archivedAt = new Date().toISOString();
      }
    });

    saveDatabase(dbState);

    // 4. Update status and broadcast to all connected clients
    weeklyRescanState.lastRescanTimestamp = new Date().toISOString();
    weeklyRescanState.lastRescanWeek = newWeek;
    weeklyRescanState.inProgress = false;

    console.log(`[Weekly Rescan] ✓ Tuesday 4:00 AM EST rescan complete for Week ${newWeek}! Squad locks cleared.`);

    // Broadcast SSE to all connected clients so they refresh with fresh picks & week
    const payload = JSON.stringify({
      type: 'weekly_rescan_completed',
      week: newWeek,
      timestamp: weeklyRescanState.lastRescanTimestamp,
      message: `Week ${newWeek} slate is active! Ready for new squad picks.`,
    });
    for (const client of sseClients.values()) {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      week: newWeek,
      message: `Successfully executed Tuesday 4:00 AM EST rescan for NFL Week ${newWeek}`,
    };
  } catch (err: any) {
    weeklyRescanState.inProgress = false;
    console.error('[Weekly Rescan] Rescan error:', err.message);
    return { success: false, week: weeklyRescanState.lastRescanWeek, message: err.message };
  }
}

// Automated timer check for Tuesday 4:00 AM EST
function checkTuesday4AMSchedule(): void {
  const now = new Date();
  const lastTue4AM = getLastTuesday4AMEST(now);
  const lastRescanDate = weeklyRescanState.lastRescanTimestamp
    ? new Date(weeklyRescanState.lastRescanTimestamp)
    : null;

  // If last rescan was before this week's Tuesday 4:00 AM EST, trigger automatic rescan!
  if (!lastRescanDate || lastRescanDate.getTime() < lastTue4AM.getTime()) {
    console.log(`[Weekly Rescan] Tuesday 4:00 AM EST threshold passed! Triggering automatic weekly rescan...`);
    executeWeeklyTuesdayRescan(false);
  }
}

// Rescan status endpoint
app.get('/api/espn/rescan-status', (req: Request, res: Response) => {
  const now = new Date();
  const nextTue4AM = getNextTuesday4AMEST(now);
  const lastTue4AM = getLastTuesday4AMEST(now);
  const msUntilNext = Math.max(0, nextTue4AM.getTime() - now.getTime());
  const hoursUntil = Math.floor(msUntilNext / (1000 * 60 * 60));
  const minsUntil = Math.floor((msUntilNext % (1000 * 60 * 60)) / (1000 * 60));

  res.json({
    success: true,
    lastRescanTimestamp: weeklyRescanState.lastRescanTimestamp || lastTue4AM.toISOString(),
    lastRescanWeek: weeklyRescanState.lastRescanWeek,
    nextScheduledTuesday4AM: nextTue4AM.toISOString(),
    nextScheduledFormatted: nextTue4AM.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' }) + ' EST',
    countdown: `${hoursUntil}h ${minsUntil}m`,
    inProgress: weeklyRescanState.inProgress,
  });
});

// Force rescan endpoint (Commissioner button or test)
app.post('/api/espn/rescan-weekly', async (req: Request, res: Response) => {
  const result = await executeWeeklyTuesdayRescan(true);
  res.json(result);
});

app.post('/api/espn/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncESPNToSupabase();
    res.json({ success: true, message: `ESPN active week matches synced to Supabase successfully`, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Background Poller: Writes real ESPN current active week games to Supabase
// -------------------------------------------------------------
async function syncESPNToSupabase() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iugxryuapgocygjckxve.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Z3hyeXVhcGdvY3lnamNreHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDQzMDMsImV4cCI6MjA1NzYyMDMwM30.4i4n4wHwM9uPms3xGv0_oPjWbF_K0Y8l7p4m1Q2k5zM';
    if (!supabaseUrl || !supabaseKey) return;

    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(supabaseUrl, supabaseKey);

    // Fetch ESPN scoreboard without hardcoding a week; ESPN authoritatively holds the current active week
    // until the last game (Monday Night Football) completes!
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data.events)) return;

    const activeWeek = data.week?.number || 2;

    const records = data.events
      .map((ev: any) => {
        const comp = ev.competitions?.[0];
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        return {
          id: String(ev.id),
          sport: 'nfl',
          home_team: home?.team?.abbreviation || '',
          away_team: away?.team?.abbreviation || '',
          home_score: parseInt(home?.score || '0', 10),
          away_score: parseInt(away?.score || '0', 10),
          quarter_time: ev.status?.type?.detail || 'SCHEDULED',
          status: ev.status?.type?.state === 'post' ? 'final' : ev.status?.type?.state === 'in' ? 'live' : 'scheduled',
          updated_at: new Date().toISOString(),
        };
      })
      .filter((r: any) => r.home_team && r.away_team);

    if (records.length > 0) {
      const { error } = await sb.from('matches').upsert(records);
      if (!error) {
        console.log(`[ESPN Sync] Successfully synced ${records.length} Week ${activeWeek} matches to Supabase matches table.`);
      }
    }
  } catch (err: any) {
    console.warn('[ESPN Sync] Background sync error:', err.message);
  }
}

// -------------------------------------------------------------
// Vite middleware / Static Serving Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pixel Pros server running at http://0.0.0.0:${PORT} [persistent storage enabled]`);
    // Run initial ESPN sync and set periodic interval
    syncESPNToSupabase();
    setInterval(syncESPNToSupabase, 180000);
    // Check Tuesday 4:00 AM EST schedule every minute
    checkTuesday4AMSchedule();
    setInterval(checkTuesday4AMSchedule, 60000);
  });
}

startServer();
