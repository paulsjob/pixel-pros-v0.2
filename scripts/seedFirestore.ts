import fs from 'fs';
import path from 'path';
import { db, handleFirestoreError, OperationType, testConnection } from '../src/lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';
import { buildRosterDocId, buildRoomDocId, buildLockDocId } from '../src/lib/firestoreService';

async function seed() {
  console.log('--- Seeding Firestore from data/pixel_pros_db.json ---');
  const connected = await testConnection();
  if (!connected) {
    console.error('Firestore connection failed!');
    process.exit(1);
  }

  const dbPath = path.resolve('data/pixel_pros_db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('pixel_pros_db.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const rosters = data.rosters || [];
  const locks = data.locks || {};
  const rooms = data.rooms || {};

  console.log(`Found ${rosters.length} rosters in local database.`);

  let seededCount = 0;
  for (const r of rosters) {
    if (!r.room_code || !r.user_name) continue;
    const cleanRoom = r.room_code.trim().toUpperCase();
    const cleanUser = r.user_name.trim().toUpperCase();
    const cleanSport = r.sport === 'nba' ? 'nba' : 'nfl';
    const docId = buildRosterDocId(cleanRoom, cleanUser, cleanSport);

    const isLocked = Boolean(r.is_locked || r.device_id === 'LOCKED' || locks[`${cleanRoom}_${cleanUser}_${cleanSport}`]);

    const payload = {
      room_code: cleanRoom,
      user_name: cleanUser,
      sport: cleanSport,
      star_1_id: String(r.star_1_id || ''),
      star_2_id: String(r.star_2_id || ''),
      star_3_id: String(r.star_3_id || ''),
      is_locked: isLocked,
      device_id: isLocked ? 'LOCKED' : (r.device_id || 'UNLOCKED'),
      updated_at: r.updated_at || new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'user_rosters', docId), payload, { merge: true });
      seededCount++;
    } catch (err) {
      console.error(`Failed to seed roster ${docId}:`, err);
    }
  }

  console.log(`Successfully seeded ${seededCount} rosters into Firestore!`);

  // Ensure Paul Jr.'s LOGRIDE roster is explicitly seeded and locked
  const paulJrId = buildRosterDocId('LOGRIDE', 'PAUL_JR', 'nfl');
  await setDoc(
    doc(db, 'user_rosters', paulJrId),
    {
      room_code: 'LOGRIDE',
      user_name: 'PAUL_JR',
      sport: 'nfl',
      star_1_id: '4241479',
      star_2_id: '4426515',
      star_3_id: '4241457',
      is_locked: true,
      device_id: 'LOCKED',
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
  await setDoc(
    doc(db, 'locks', paulJrId),
    {
      room_code: 'LOGRIDE',
      user_name: 'PAUL_JR',
      sport: 'nfl',
      is_locked: true,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );

  // Seed rooms
  const roomCodes = new Set(['COUCH', 'HOOPS', 'LOGRIDE', 'BIGBANG', 'THE_BOYS']);
  for (const k of Object.keys(rooms)) {
    const base = k.split('_')[0];
    if (base) roomCodes.add(base);
  }

  for (const room of roomCodes) {
    const rId = buildRoomDocId(room, 'nfl');
    await setDoc(
      doc(db, 'rooms', rId),
      {
        room_code: room,
        sport: 'nfl',
        isArchived: false,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  console.log('--- Firestore Seeding Complete! ---');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
