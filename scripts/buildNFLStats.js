import fs from 'fs';

async function main() {
  console.log('Reading nflRosterManifest.ts...');
  const manifestRaw = fs.readFileSync('src/data/nflRosterManifest.ts', 'utf8');
  const regex = /athleteId:\s*'(\d+)',\s*displayName:\s*'([^']*)',\s*shortName:\s*'([^']*)',\s*uniformNumber:\s*(\d+),\s*teamCode:\s*'([^']*)',\s*position:\s*'([^']*)'/g;
  
  const athletes = [];
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
  }
  console.log(`Found ${athletes.length} athletes to sync from ESPN.`);

  const results = [];
  const concurrency = 12;
  let completed = 0;

  async function processAthlete(ath) {
    try {
      const url = `https://site.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${ath.athleteId}/overview`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) {
        return {
          ...ath,
          pass_yds: 0,
          rush_yds: 0,
          rec_yds: 0,
          tds: 0,
          last_game_recap: undefined,
          last_game_pts: undefined
        };
      }
      const data = await res.json();
      const statsObj = data.statistics || {};
      const names = statsObj.names || [];
      const splits = statsObj.splits || [];
      const regSeason = splits.find(s => s.displayName && s.displayName.includes('Regular Season'))?.stats || [];

      const getStat = (name) => {
        const idx = names.indexOf(name);
        if (idx === -1 || !regSeason[idx]) return 0;
        return parseInt(String(regSeason[idx]).replace(/,/g, ''), 10) || 0;
      };

      const pass_yds = getStat('passingYards');
      const pass_tds = getStat('passingTouchdowns');
      const rush_yds = getStat('rushingYards');
      const rush_tds = getStat('rushingTouchdowns');
      const rec_yds = getStat('receivingYards');
      const rec_tds = getStat('receivingTouchdowns');
      const total_tds = pass_tds + rush_tds + rec_tds;

      // GameLog for last game recap
      let last_game_recap = undefined;
      let last_game_pts = undefined;
      const gameLogStats = data.gameLog?.statistics || [];
      const gameLogEvents = data.gameLog?.events || {};

      let mostRecentEventId = null;
      for (const s of gameLogStats) {
        if (s.events && s.events.length > 0) {
          mostRecentEventId = s.events[0].eventId;
          break;
        }
      }

      if (mostRecentEventId) {
        const evMeta = gameLogEvents[mostRecentEventId];
        const opp = evMeta?.opponent?.abbreviation || evMeta?.opponent?.displayName || 'OPP';
        const atVs = evMeta?.atVs || 'vs';
        let gPassYds = 0, gPassTds = 0, gRushYds = 0, gRushTds = 0, gRecYds = 0, gRecTds = 0;
        for (const cat of gameLogStats) {
          const cNames = cat.names || [];
          const evItem = cat.events?.find(e => e.eventId === mostRecentEventId);
          if (evItem && evItem.stats) {
            const getGStat = (n) => {
              const idx = cNames.indexOf(n);
              return (idx !== -1 && evItem.stats[idx]) ? parseInt(String(evItem.stats[idx]).replace(/,/g, ''), 10) || 0 : 0;
            };
            const catName = (cat.displayName || '').toLowerCase();
            if (catName.includes('pass')) {
              gPassYds = getGStat('passingYards');
              gPassTds = getGStat('passingTouchdowns');
            } else if (catName.includes('rush')) {
              gRushYds = getGStat('rushingYards');
              gRushTds = getGStat('rushingTouchdowns');
            } else if (catName.includes('rec')) {
              gRecYds = getGStat('receivingYards');
              gRecTds = getGStat('receivingTouchdowns');
            }
          }
        }
        const gTds = gPassTds + gRushTds + gRecTds;
        last_game_pts = (gTds * 6) + Math.floor(gPassYds / 25) + Math.floor(gRushYds / 10) + Math.floor(gRecYds / 10);
        const parts = [];
        if (gPassYds > 0) parts.push(`${gPassYds} PASS`);
        if (gRushYds > 0) parts.push(`${gRushYds} RUSH`);
        if (gRecYds > 0) parts.push(`${gRecYds} REC`);
        if (gTds > 0) parts.push(`${gTds} TD`);
        if (parts.length === 0) parts.push('0 YDS');
        last_game_recap = `${atVs} ${opp}: ${parts.join(' • ')} • ${last_game_pts} PTS`;
      }

      return {
        athleteId: ath.athleteId,
        displayName: ath.displayName,
        teamCode: ath.teamCode,
        position: ath.position,
        pass_yds,
        rush_yds,
        rec_yds,
        tds: total_tds,
        last_game_recap,
        last_game_pts
      };
    } catch (err) {
      return {
        ...ath,
        pass_yds: 0,
        rush_yds: 0,
        rec_yds: 0,
        tds: 0,
        last_game_recap: undefined,
        last_game_pts: undefined
      };
    } finally {
      completed++;
      if (completed % 50 === 0 || completed === athletes.length) {
        console.log(`Synced ${completed}/${athletes.length} athletes...`);
      }
    }
  }

  // Run in chunks with concurrency
  const queue = [...athletes];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const ath = queue.shift();
      if (!ath) break;
      const res = await processAthlete(ath);
      results.push(res);
    }
  });

  await Promise.all(workers);

  console.log(`Completed fetching ${results.length} athletes.`);

  // Write JSON database
  fs.writeFileSync('src/data/nflSeasonStatsDatabase.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved src/data/nflSeasonStatsDatabase.json successfully.');

  // Also verify Rachaad White & Jadarian Price
  const rw = results.find(r => r.displayName === 'Rachaad White');
  console.log('Rachaad White stats:', rw);
  const jp = results.find(r => r.displayName === 'Jadarian Price');
  console.log('Jadarian Price stats:', jp);
}

main().catch(console.error);
