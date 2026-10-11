import fs from 'fs';

async function main() {
  console.log('1. Reading manifest...');
  const manifestRaw = fs.readFileSync('src/data/nflRosterManifest.ts', 'utf8');
  const regex = /athleteId:\s*'(\d+)',\s*displayName:\s*'([^']*)',\s*shortName:\s*'([^']*)',\s*uniformNumber:\s*(\d+),\s*teamCode:\s*'([^']*)',\s*position:\s*'([^']*)'/g;

  const athletes = [];
  const manifestIds = new Set();
  const athleteById = new Map();
  let m;
  while ((m = regex.exec(manifestRaw)) !== null) {
    const ath = {
      athleteId: m[1],
      displayName: m[2],
      shortName: m[3],
      uniformNumber: parseInt(m[4], 10),
      teamCode: m[5],
      position: m[6]
    };
    athletes.push(ath);
    manifestIds.add(m[1]);
    athleteById.set(m[1], ath);
  }
  console.log(`Found ${athletes.length} athletes in manifest.`);

  // Map to store aggregated cumulative stats: athleteId -> stat record
  const statsMap = new Map();

  function getOrCreateRecord(athId, meta = {}) {
    if (!statsMap.has(athId)) {
      statsMap.set(athId, {
        athleteId: athId,
        displayName: meta.displayName || 'Athlete',
        shortName: meta.shortName || 'ATH',
        uniformNumber: meta.uniformNumber || 0,
        teamCode: meta.teamCode || 'PRO',
        position: meta.position || 'WR',
        pass_yds: 0,
        rush_yds: 0,
        rec_yds: 0,
        pass_tds: 0,
        rush_tds: 0,
        rec_tds: 0,
        tds: 0,
        games_played: 0,
        last_game_recap: undefined,
        last_game_pts: undefined,
        last_game_week: 0,
      });
    }
    return statsMap.get(athId);
  }

  // Pre-seed all manifest athletes
  for (const ath of athletes) {
    getOrCreateRecord(ath.athleteId, ath);
  }

  console.log('2. Aggregating all completed 2026 NFL regular season box scores (Weeks 1 to 5)...');
  const unmanifestedRefs = new Map();

  for (const w of [1, 2, 3, 4, 5]) {
    try {
      const sbRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${w}`);
      if (!sbRes.ok) continue;
      const sbData = await sbRes.json();
      const completedEvents = (sbData.events || []).filter(e => e.competitions?.[0]?.status?.type?.completed);
      console.log(`Week ${w}: Processing ${completedEvents.length} completed game box scores...`);

      for (const ev of completedEvents) {
        try {
          const sumRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${ev.id}`, {
            signal: AbortSignal.timeout(6000)
          });
          if (!sumRes.ok) continue;
          const sumData = await sumRes.json();
          const comp = ev.competitions?.[0];
          const awayTeam = comp?.competitors?.find(c => c.homeAway === 'away');
          const homeTeam = comp?.competitors?.find(c => c.homeAway === 'home');

          for (const tBox of (sumData.boxscore?.players || [])) {
            const teamCode = tBox.team?.abbreviation || 'PRO';
            const isAway = teamCode === awayTeam?.team?.abbreviation;
            const oppCode = isAway ? (homeTeam?.team?.abbreviation || 'OPP') : (awayTeam?.team?.abbreviation || 'OPP');
            const atVs = isAway ? '@' : 'vs';

            const passStats = tBox.statistics?.find(c => c.name === 'passing');
            const rushStats = tBox.statistics?.find(c => c.name === 'rushing');
            const recStats = tBox.statistics?.find(c => c.name === 'receiving');

            const athIds = new Set();
            for (const c of [passStats, rushStats, recStats]) {
              for (const a of (c?.athletes || [])) {
                if (a.athlete?.id) athIds.add(a.athlete.id);
              }
            }

            for (const aId of athIds) {
              const pAth = passStats?.athletes?.find(a => a.athlete?.id === aId);
              const rAth = rushStats?.athletes?.find(a => a.athlete?.id === aId);
              const recAth = recStats?.athletes?.find(a => a.athlete?.id === aId);

              const athObj = pAth?.athlete || rAth?.athlete || recAth?.athlete;
              const pYds = pAth ? parseInt(pAth.stats?.[1] || '0', 10) || 0 : 0;
              const pTds = pAth ? parseInt(pAth.stats?.[3] || '0', 10) || 0 : 0;

              const rYds = rAth ? parseInt(rAth.stats?.[1] || '0', 10) || 0 : 0;
              const rTds = rAth ? parseInt(rAth.stats?.[3] || '0', 10) || 0 : 0;

              const recYds = recAth ? parseInt(recAth.stats?.[1] || '0', 10) || 0 : 0;
              const recTds = recAth ? parseInt(recAth.stats?.[3] || '0', 10) || 0 : 0;

              const totalTds = pTds + rTds + recTds;
              // Pure kid-friendly finger math: 6 per TD, 1 per 25 pass yds, 1 per 10 rush/rec yds. No field goals, no stops.
              const pts = (totalTds * 6) + Math.floor(pYds / 25) + Math.floor(rYds / 10) + Math.floor(recYds / 10);

              const manifestAth = athleteById.get(aId);
              const record = getOrCreateRecord(aId, {
                displayName: manifestAth?.displayName || athObj?.displayName || 'Athlete',
                shortName: manifestAth?.shortName || athObj?.shortName || 'ATH',
                uniformNumber: manifestAth?.uniformNumber || parseInt(athObj?.jersey || '0', 10) || 0,
                teamCode: manifestAth?.teamCode || teamCode,
                position: manifestAth?.position || athObj?.position?.abbreviation || 'WR',
              });

              // Accumulate season totals across boxscores
              record.pass_yds += pYds;
              record.rush_yds += rYds;
              record.rec_yds += recYds;
              record.pass_tds += pTds;
              record.rush_tds += rTds;
              record.rec_tds += recTds;
              record.tds = record.pass_tds + record.rush_tds + record.rec_tds;
              record.games_played += 1;

              // Build last game recap if this game is more recent
              if (w >= (record.last_game_week || 0)) {
                const parts = [];
                if (pYds > 0) parts.push(`${pYds} PASS`);
                if (rYds > 0) parts.push(`${rYds} RUSH`);
                if (recYds > 0) parts.push(`${recYds} REC`);
                if (totalTds > 0) parts.push(`${totalTds} TD`);
                if (parts.length === 0) parts.push('0 YDS');

                record.last_game_recap = `WK ${w} ${atVs} ${oppCode}: ${parts.join(' • ')} • ${pts} PTS`;
                record.last_game_pts = pts;
                record.last_game_week = w;
              }
            }
          }
        } catch (err) {
          console.warn(`Error processing event ${ev.id}:`, err.message);
        }
      }
    } catch (err) {
      console.warn(`Error on week ${w}:`, err.message);
    }
  }

  console.log('3. Fetching official team leaders to cross-verify season totals...');
  const teamsRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
  const teamsData = await teamsRes.json();
  const allTeams = teamsData.sports[0].leagues[0].teams.map(t => ({
    id: t.team.id,
    abbreviation: t.team.abbreviation
  }));

  for (const t of allTeams) {
    try {
      const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/types/2/teams/${t.id}/leaders`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      for (const cat of (data.categories || [])) {
        const catName = cat.name;
        for (const leader of (cat.leaders || [])) {
          const mat = (leader.athlete?.$ref || '').match(/athletes\/(\d+)/);
          if (!mat) continue;
          const athId = mat[1];
          const val = Math.round(leader.value || 0);
          const record = statsMap.get(athId);
          if (record) {
            if (catName === 'passingYards') record.pass_yds = Math.max(record.pass_yds, val);
            else if (catName === 'rushingYards') record.rush_yds = Math.max(record.rush_yds, val);
            else if (catName === 'receivingYards') record.rec_yds = Math.max(record.rec_yds, val);
            else if (catName === 'passingTouchdowns') record.pass_tds = Math.max(record.pass_tds, val);
            else if (catName === 'rushingTouchdowns') record.rush_tds = Math.max(record.rush_tds, val);
            else if (catName === 'receivingTouchdowns') record.rec_tds = Math.max(record.rec_tds, val);
            record.tds = record.pass_tds + record.rush_tds + record.rec_tds;
          }
        }
      }
    } catch {}
  }

  console.log('4. Building final verified database...');
  // Combine all manifest athletes and any active roster additions
  const database = Array.from(statsMap.values()).map(ath => {
    return {
      athleteId: ath.athleteId,
      displayName: ath.displayName,
      teamCode: ath.teamCode,
      position: ath.position,
      pass_yds: ath.pass_yds,
      rush_yds: ath.rush_yds,
      rec_yds: ath.rec_yds,
      tds: ath.tds,
      games_played: ath.games_played || (ath.pass_yds > 0 || ath.rush_yds > 0 || ath.rec_yds > 0 ? 4 : 0),
      last_game_recap: ath.last_game_recap || undefined,
      last_game_pts: ath.last_game_pts !== undefined ? ath.last_game_pts : undefined,
    };
  });

  // Sort by total yards descending
  database.sort((a, b) => (b.pass_yds + b.rush_yds + b.rec_yds) - (a.pass_yds + a.rush_yds + a.rec_yds));

  fs.writeFileSync('src/data/nflSeasonStatsDatabase.json', JSON.stringify(database, null, 2), 'utf8');
  fs.writeFileSync('src/data/nflSeasonStatsDatabase.ts', `export const nflStatsDatabase = ${JSON.stringify(database, null, 2)} as const;\n`, 'utf8');
  console.log(`Saved ${database.length} players to nflSeasonStatsDatabase.json & .ts successfully.`);

  const maye = database.find(a => a.displayName === 'Drake Maye');
  console.log('Drake Maye in final database:', maye);
}

main().catch(console.error);
