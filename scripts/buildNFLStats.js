import fs from 'fs';

async function main() {
  console.log('1. Reading manifest...');
  const manifestRaw = fs.readFileSync('src/data/nflRosterManifest.ts', 'utf8');
  const regex = /athleteId:\s*'(\d+)',\s*displayName:\s*'([^']*)',\s*shortName:\s*'([^']*)',\s*uniformNumber:\s*(\d+),\s*teamCode:\s*'([^']*)',\s*position:\s*'([^']*)'/g;

  const athletes = [];
  const manifestIds = new Set();
  let m;
  while ((m = regex.exec(manifestRaw)) !== null) {
    athletes.push({
      athleteId: m[1],
      displayName: m[2],
      shortName: m[3],
      uniformNumber: parseInt(m[4], 10),
      teamCode: m[5],
      position: m[6]
    });
    manifestIds.add(m[1]);
  }
  console.log(`Found ${athletes.length} athletes in manifest.`);

  console.log('2. Fetching all 32 NFL teams official 2026 regular season leaders...');
  const teamsRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
  const teamsData = await teamsRes.json();
  const allTeams = teamsData.sports[0].leagues[0].teams.map(t => ({
    id: t.team.id,
    abbreviation: t.team.abbreviation
  }));

  const statsMap = new Map();
  const unmanifestedRefs = new Map(); // athleteId -> { ref, teamCode }

  for (const t of allTeams) {
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
        if (!statsMap.has(athId)) {
          statsMap.set(athId, {
            athleteId: athId,
            teamCode: t.abbreviation,
            pass_yds: 0,
            rush_yds: 0,
            rec_yds: 0,
            pass_tds: 0,
            rush_tds: 0,
            rec_tds: 0,
            tds: 0
          });
        }
        if (!manifestIds.has(athId) && !unmanifestedRefs.has(athId) && leader.athlete?.$ref) {
          unmanifestedRefs.set(athId, { ref: leader.athlete.$ref, teamCode: t.abbreviation });
        }
        const record = statsMap.get(athId);
        const val = Math.round(leader.value || 0);
        if (catName === 'passingYards') record.pass_yds = val;
        else if (catName === 'rushingYards') record.rush_yds = val;
        else if (catName === 'receivingYards') record.rec_yds = val;
        else if (catName === 'passingTouchdowns') record.pass_tds = val;
        else if (catName === 'rushingTouchdowns') record.rush_tds = val;
        else if (catName === 'receivingTouchdowns') record.rec_tds = val;
      }
    }
  }

  for (const r of statsMap.values()) {
    r.tds = r.pass_tds + r.rush_tds + r.rec_tds;
  }

  console.log(`Resolving ${unmanifestedRefs.size} additional leaders not in manifest (e.g. Matthew Golden)...`);
  const additionalAthletes = [];
  await Promise.all(Array.from(unmanifestedRefs.entries()).map(async ([athId, meta]) => {
    try {
      const aRes = await fetch(meta.ref, { signal: AbortSignal.timeout(4000) });
      if (!aRes.ok) return;
      const aData = await aRes.json();
      additionalAthletes.push({
        athleteId: athId,
        displayName: aData.displayName || aData.fullName || 'Athlete',
        shortName: aData.shortName || aData.lastName || 'ATH',
        uniformNumber: parseInt(aData.jersey || '0', 10) || 0,
        teamCode: meta.teamCode,
        position: aData.position?.abbreviation || 'WR'
      });
    } catch {}
  }));
  console.log(`Added ${additionalAthletes.length} extra active athletes.`);

  const allCombinedAthletes = [...athletes, ...additionalAthletes];

  console.log('3. Fetching 2026 completed game boxscores for accurate recent performance...');
  const recentGameMap = new Map();

  for (const w of [1, 2, 3]) {
    const sbRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${w}`);
    const sbData = await sbRes.json();
    const completedEvents = (sbData.events || []).filter(e => e.competitions?.[0]?.status?.type?.completed);

    await Promise.all(completedEvents.map(async (ev) => {
      try {
        const sumRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${ev.id}`, {
          signal: AbortSignal.timeout(6000)
        });
        if (!sumRes.ok) return;
        const sumData = await sumRes.json();
        const comp = ev.competitions?.[0];
        const awayTeam = comp?.competitors?.find(c => c.homeAway === 'away');
        const homeTeam = comp?.competitors?.find(c => c.homeAway === 'home');

        for (const tBox of (sumData.boxscore?.players || [])) {
          const isAway = tBox.team?.abbreviation === awayTeam?.team?.abbreviation;
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

            const pYds = pAth ? parseInt(pAth.stats?.[1] || '0', 10) || 0 : 0;
            const pTds = pAth ? parseInt(pAth.stats?.[3] || '0', 10) || 0 : 0;

            const rYds = rAth ? parseInt(rAth.stats?.[1] || '0', 10) || 0 : 0;
            const rTds = rAth ? parseInt(rAth.stats?.[3] || '0', 10) || 0 : 0;

            const recYds = recAth ? parseInt(recAth.stats?.[1] || '0', 10) || 0 : 0;
            const recTds = recAth ? parseInt(recAth.stats?.[3] || '0', 10) || 0 : 0;

            const totalTds = pTds + rTds + recTds;
            const pts = (totalTds * 6) + Math.floor(pYds / 25) + Math.floor(rYds / 10) + Math.floor(recYds / 10);

            const parts = [];
            if (pYds > 0) parts.push(`${pYds} PASS`);
            if (rYds > 0) parts.push(`${rYds} RUSH`);
            if (recYds > 0) parts.push(`${recYds} REC`);
            if (totalTds > 0) parts.push(`${totalTds} TD`);
            if (parts.length === 0) parts.push('0 YDS');

            const recap = `${atVs} ${oppCode}: ${parts.join(' • ')} • ${pts} PTS`;

            const existing = recentGameMap.get(aId);
            if (!existing || w >= existing.week) {
              recentGameMap.set(aId, { recap, pts, week: w });
            }
          }
        }
      } catch (e) {}
    }));
  }

  console.log('4. Merging athletes with official 2026 data...');
  const database = allCombinedAthletes.map(ath => {
    const s = statsMap.get(ath.athleteId);
    const g = recentGameMap.get(ath.athleteId);
    return {
      athleteId: ath.athleteId,
      displayName: ath.displayName,
      teamCode: ath.teamCode,
      position: ath.position,
      pass_yds: s?.pass_yds || 0,
      rush_yds: s?.rush_yds || 0,
      rec_yds: s?.rec_yds || 0,
      tds: s?.tds || 0,
      last_game_recap: g?.recap || undefined,
      last_game_pts: g?.pts !== undefined ? g.pts : undefined
    };
  });

  fs.writeFileSync('src/data/nflSeasonStatsDatabase.json', JSON.stringify(database, null, 2), 'utf8');
  fs.writeFileSync('src/data/nflSeasonStatsDatabase.ts', `export const nflStatsDatabase = ${JSON.stringify(database, null, 2)} as const;\n`, 'utf8');
  console.log('Saved src/data/nflSeasonStatsDatabase.json & .ts successfully.');

  // Verifications
  const golden = database.find(a => a.displayName === 'Matthew Golden');
  console.log('Matthew Golden:', golden);
}

main().catch(console.error);
