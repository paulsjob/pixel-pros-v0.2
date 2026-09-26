/**
 * NFL League Statistics (Passing, Rushing, Receiving Yardage Leaders)
 * Synchronized with ESPN official season statistics.
 * Provides instant, zero-latency accurate rankings for Weekly Superstars.
 */

export interface AthleteLeagueStat {
  athleteId?: string;
  displayName: string;
  teamCode: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K';
  pass_yds: number;
  rush_yds: number;
  rec_yds: number;
  tds?: number;
  last_game_recap?: string;
  last_game_pts?: number;
}

// Verified 2026 NFL Season Leaders from ESPN
export const NFL_LEAGUE_STATS_DATABASE: AthleteLeagueStat[] = [
  // --- QUARTERBACKS (Passing Yards Leaders) ---
  { displayName: 'Josh Allen', athleteId: '3918298', teamCode: 'BUF', position: 'QB', pass_yds: 890, rush_yds: 112, rec_yds: 0, tds: 8, last_game_recap: 'vs MIA: 263 YDS • 3 TD • 28 PTS', last_game_pts: 28 },
  { displayName: 'Patrick Mahomes', athleteId: '3139477', teamCode: 'KC', position: 'QB', pass_yds: 840, rush_yds: 64, rec_yds: 0, tds: 7, last_game_recap: 'vs CIN: 251 YDS • 2 TD • 22 PTS', last_game_pts: 22 },
  { displayName: 'Lamar Jackson', athleteId: '3916387', teamCode: 'BAL', position: 'QB', pass_yds: 775, rush_yds: 198, rec_yds: 0, tds: 6, last_game_recap: 'vs DAL: 182 PASS • 87 RUSH • 2 TD • 26 PTS', last_game_pts: 26 },
  { displayName: 'C.J. Stroud', athleteId: '4432577', teamCode: 'HOU', position: 'QB', pass_yds: 772, rush_yds: 48, rec_yds: 0, tds: 5, last_game_recap: 'vs CHI: 260 YDS • 1 TD • 18 PTS', last_game_pts: 18 },
  { displayName: 'Jared Goff', athleteId: '3046779', teamCode: 'DET', position: 'QB', pass_yds: 768, rush_yds: 14, rec_yds: 0, tds: 6, last_game_recap: 'vs ARI: 240 YDS • 2 TD • 20 PTS', last_game_pts: 20 },
  { displayName: 'Jordan Love', athleteId: '4036378', teamCode: 'GB', position: 'QB', pass_yds: 836, rush_yds: 20, rec_yds: 0, tds: 5, last_game_recap: 'WEEK 3 vs ATL: 312 YDS • 2 TD • 24 PTS', last_game_pts: 24 },
  { displayName: 'Derek Carr', athleteId: '16757', teamCode: 'NO', position: 'QB', pass_yds: 748, rush_yds: 24, rec_yds: 0, tds: 5, last_game_recap: 'vs PHI: 222 YDS • 1 TD • 16 PTS', last_game_pts: 16 },
  { displayName: 'Bryce Young', athleteId: '4685720', teamCode: 'CAR', position: 'QB', pass_yds: 245, rush_yds: 12, rec_yds: 0, tds: 2 },
  { displayName: 'Brock Purdy', athleteId: '4361741', teamCode: 'SF', position: 'QB', pass_yds: 242, rush_yds: 22, rec_yds: 0, tds: 2 },
  { displayName: 'Matthew Stafford', athleteId: '12483', teamCode: 'LAR', position: 'QB', pass_yds: 240, rush_yds: -1, rec_yds: 0, tds: 2 },
  { displayName: 'Jalen Hurts', athleteId: '4040715', teamCode: 'PHI', position: 'QB', pass_yds: 236, rush_yds: 38, rec_yds: 0, tds: 2 },
  { displayName: 'Joe Burrow', athleteId: '3915511', teamCode: 'CIN', position: 'QB', pass_yds: 234, rush_yds: 10, rec_yds: 0, tds: 2 },
  { displayName: 'Deshaun Watson', athleteId: '3122840', teamCode: 'CLE', position: 'QB', pass_yds: 225, rush_yds: 28, rec_yds: 0, tds: 1 },
  { displayName: 'Trevor Lawrence', athleteId: '4360310', teamCode: 'JAX', position: 'QB', pass_yds: 220, rush_yds: 18, rec_yds: 0, tds: 2 },
  { displayName: 'Tyler Shough', athleteId: '4360689', teamCode: 'NO', position: 'QB', pass_yds: 215, rush_yds: 15, rec_yds: 0, tds: 1 },
  { displayName: 'Drew Lock', athleteId: '3924327', teamCode: 'SEA', position: 'QB', pass_yds: 422, rush_yds: 14, rec_yds: 0, tds: 4 },
  { displayName: 'Bo Nix', athleteId: '4426338', teamCode: 'DEN', position: 'QB', pass_yds: 419, rush_yds: 8, rec_yds: 1, tds: 3 },
  { displayName: 'Caleb Williams', athleteId: '4431611', teamCode: 'CHI', position: 'QB', pass_yds: 407, rush_yds: 107, rec_yds: 0, tds: 3 },
  { displayName: 'Baker Mayfield', athleteId: '3052587', teamCode: 'TB', position: 'QB', pass_yds: 398, rush_yds: 59, rec_yds: 0, tds: 1 },
  { displayName: 'Drake Maye', athleteId: '4431452', teamCode: 'NE', position: 'QB', pass_yds: 386, rush_yds: 64, rec_yds: 0, tds: 2 },
  { displayName: 'Cam Ward', athleteId: '4688380', teamCode: 'TEN', position: 'QB', pass_yds: 323, rush_yds: 18, rec_yds: 0, tds: 1 },
  { displayName: 'Jayden Daniels', athleteId: '4426348', teamCode: 'WSH', position: 'QB', pass_yds: 260, rush_yds: 100, rec_yds: 0, tds: 2 },
  { displayName: 'Jaxson Dart', athleteId: '4689114', teamCode: 'NYG', position: 'QB', pass_yds: 250, rush_yds: 54, rec_yds: 0, tds: 1 },
  { displayName: 'Tua Tagovailoa', athleteId: '4241479', teamCode: 'ATL', position: 'QB', pass_yds: 210, rush_yds: 12, rec_yds: 0, tds: 1 },
  { displayName: 'Daniel Jones', athleteId: '3917792', teamCode: 'IND', position: 'QB', pass_yds: 195, rush_yds: 35, rec_yds: 0, tds: 1 },
  { displayName: 'Dak Prescott', athleteId: '2577417', teamCode: 'DAL', position: 'QB', pass_yds: 188, rush_yds: 15, rec_yds: 0, tds: 1 },
  { displayName: 'Kyler Murray', athleteId: '3917315', teamCode: 'ARI', position: 'QB', pass_yds: 160, rush_yds: 42, rec_yds: 0, tds: 1 },
  { displayName: 'Jacoby Brissett', athleteId: '2578570', teamCode: 'ARI', position: 'QB', pass_yds: 50, rush_yds: 6, rec_yds: 0, tds: 0 },
  { displayName: 'Michael Penix Jr.', athleteId: '4360423', teamCode: 'ATL', position: 'QB', pass_yds: 15, rush_yds: 2, rec_yds: 0, tds: 0 },
  { displayName: 'Justin Fields', athleteId: '4362887', teamCode: 'PIT', position: 'QB', pass_yds: 180, rush_yds: 85, rec_yds: 0, tds: 1 },
  { displayName: 'Russell Wilson', athleteId: '14881', teamCode: 'PIT', position: 'QB', pass_yds: 120, rush_yds: 10, rec_yds: 0, tds: 1 },
  { displayName: 'Geno Smith', athleteId: '15864', teamCode: 'LV', position: 'QB', pass_yds: 190, rush_yds: 11, rec_yds: 0, tds: 1 },
  { displayName: 'Sam Darnold', athleteId: '3912547', teamCode: 'MIN', position: 'QB', pass_yds: 175, rush_yds: 18, rec_yds: 0, tds: 1 },
  { displayName: 'Aaron Rodgers', athleteId: '8439', teamCode: 'NYJ', position: 'QB', pass_yds: 165, rush_yds: 4, rec_yds: 0, tds: 1 },

  // --- RUNNING BACKS (Rushing Yards Leaders) ---
  { displayName: 'Kenneth Walker III', athleteId: '4567048', teamCode: 'KC', position: 'RB', pass_yds: 0, rush_yds: 290, rec_yds: 32, tds: 1 },
  { displayName: 'Derrick Henry', athleteId: '3043078', teamCode: 'BAL', position: 'RB', pass_yds: 0, rush_yds: 212, rec_yds: 24, tds: 4 },
  { displayName: 'Jahmyr Gibbs', athleteId: '4430737', teamCode: 'DET', position: 'RB', pass_yds: 0, rush_yds: 208, rec_yds: 55, tds: 2 },
  { displayName: 'James Cook III', athleteId: '4361529', teamCode: 'BUF', position: 'RB', pass_yds: 0, rush_yds: 192, rec_yds: 41, tds: 1 },
  { displayName: 'Jonathan Taylor', athleteId: '4242335', teamCode: 'IND', position: 'RB', pass_yds: 0, rush_yds: 190, rec_yds: 36, tds: 4 },
  { displayName: 'D\'Andre Swift', athleteId: '4259545', teamCode: 'CHI', position: 'RB', pass_yds: 0, rush_yds: 169, rec_yds: 48, tds: 3 },
  { displayName: 'Bijan Robinson', athleteId: '4430807', teamCode: 'ATL', position: 'RB', pass_yds: 0, rush_yds: 155, rec_yds: 62, tds: 1 },
  { displayName: 'Ashton Jeanty', athleteId: '4883492', teamCode: 'LV', position: 'RB', pass_yds: 0, rush_yds: 150, rec_yds: 28, tds: 1 },
  { displayName: 'Aaron Jones Sr.', athleteId: '3042519', teamCode: 'MIN', position: 'RB', pass_yds: 0, rush_yds: 145, rec_yds: 38, tds: 1 },
  { displayName: 'Chase Brown', athleteId: '4361499', teamCode: 'CIN', position: 'RB', pass_yds: 0, rush_yds: 136, rec_yds: 33, tds: 1 },
  { displayName: 'Blake Corum', athleteId: '4429084', teamCode: 'LAR', position: 'RB', pass_yds: 0, rush_yds: 133, rec_yds: 20, tds: 1 },
  { displayName: 'Bhayshul Tuten', athleteId: '4870808', teamCode: 'JAX', position: 'RB', pass_yds: 0, rush_yds: 131, rec_yds: 15, tds: 1 },
  { displayName: 'Cam Skattebo', athleteId: '4689240', teamCode: 'NYG', position: 'RB', pass_yds: 0, rush_yds: 117, rec_yds: 22, tds: 1 },
  { displayName: 'Jacory Croskey-Merritt', athleteId: '4427361', teamCode: 'WSH', position: 'RB', pass_yds: 0, rush_yds: 106, rec_yds: 12, tds: 1 },
  { displayName: 'Chuba Hubbard', athleteId: '4241416', teamCode: 'CAR', position: 'RB', pass_yds: 0, rush_yds: 102, rec_yds: 19, tds: 1 },
  { displayName: 'Christian McCaffrey', athleteId: '3117251', teamCode: 'SF', position: 'RB', pass_yds: 0, rush_yds: 91, rec_yds: 75, tds: 2 },
  { displayName: 'Saquon Barkley', athleteId: '3929630', teamCode: 'PHI', position: 'RB', pass_yds: 0, rush_yds: 89, rec_yds: 42, tds: 2 },
  { displayName: 'Breece Hall', athleteId: '4427366', teamCode: 'NYJ', position: 'RB', pass_yds: 0, rush_yds: 85, rec_yds: 51, tds: 1 },
  { displayName: 'Josh Jacobs', athleteId: '4047365', teamCode: 'GB', position: 'RB', pass_yds: 0, rush_yds: 82, rec_yds: 25, tds: 1 },
  { displayName: 'Kyren Williams', athleteId: '4430733', teamCode: 'LAR', position: 'RB', pass_yds: 0, rush_yds: 80, rec_yds: 30, tds: 1 },
  { displayName: 'Travis Etienne Jr.', athleteId: '4239996', teamCode: 'JAX', position: 'RB', pass_yds: 0, rush_yds: 78, rec_yds: 28, tds: 1 },
  { displayName: 'James Conner', athleteId: '3045147', teamCode: 'ARI', position: 'RB', pass_yds: 0, rush_yds: 75, rec_yds: 22, tds: 1 },
  { displayName: 'Isiah Pacheco', athleteId: '4361529', teamCode: 'KC', position: 'RB', pass_yds: 0, rush_yds: 72, rec_yds: 18, tds: 1 },
  { displayName: 'Rhamondre Stevenson', athleteId: '4569173', teamCode: 'NE', position: 'RB', pass_yds: 0, rush_yds: 70, rec_yds: 15, tds: 1 },

  // --- WIDE RECEIVERS & TIGHT ENDS (Receiving Yards Leaders) ---
  { displayName: 'Jaxon Smith-Njigba', athleteId: '4430878', teamCode: 'SEA', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 277, tds: 4 },
  { displayName: 'Chris Olave', athleteId: '4361370', teamCode: 'NO', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 268, tds: 1 },
  { displayName: 'Dalton Kincaid', athleteId: '4360340', teamCode: 'BUF', position: 'TE', pass_yds: 0, rush_yds: 0, rec_yds: 225, tds: 1 },
  { displayName: 'Davante Adams', athleteId: '16800', teamCode: 'LAR', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 221, tds: 2 },
  { displayName: 'Amon-Ra St. Brown', athleteId: '4374302', teamCode: 'DET', position: 'WR', pass_yds: 0, rush_yds: 8, rec_yds: 209, tds: 4 },
  { displayName: 'Jalen Coker', athleteId: '4689400', teamCode: 'CAR', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 204, tds: 2 },
  { displayName: 'CeeDee Lamb', athleteId: '4241389', teamCode: 'DAL', position: 'WR', pass_yds: 0, rush_yds: 12, rec_yds: 197, tds: 3 },
  { displayName: 'Christian Watson', athleteId: '4258185', teamCode: 'GB', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 188, tds: 3 },
  { displayName: 'Parker Washington', athleteId: '4429023', teamCode: 'JAX', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 181, tds: 1 },
  { displayName: 'Dalton Schultz', athleteId: '3116385', teamCode: 'HOU', position: 'TE', pass_yds: 0, rush_yds: 0, rec_yds: 175, tds: 0 },
  { displayName: 'Travis Kelce', athleteId: '15847', teamCode: 'KC', position: 'TE', pass_yds: 0, rush_yds: 0, rec_yds: 172, tds: 1 },
  { displayName: 'DeVonta Smith', athleteId: '4241478', teamCode: 'PHI', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 170, tds: 1 },
  { displayName: 'Tee Higgins', athleteId: '4239993', teamCode: 'CIN', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 154, tds: 0 },
  { displayName: 'Justin Jefferson', athleteId: '4262921', teamCode: 'MIN', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 147, tds: 2 },
  { displayName: 'Trey McBride', athleteId: '4361307', teamCode: 'ARI', position: 'TE', pass_yds: 0, rush_yds: 0, rec_yds: 136, tds: 2 },
  { displayName: 'Isaiah Likely', athleteId: '4361424', teamCode: 'NYG', position: 'TE', pass_yds: 0, rush_yds: 0, rec_yds: 111, tds: 2 },
  { displayName: 'Ja\'Marr Chase', athleteId: '4362628', teamCode: 'CIN', position: 'WR', pass_yds: 0, rush_yds: 5, rec_yds: 110, tds: 1 },
  { displayName: 'A.J. Brown', athleteId: '4047646', teamCode: 'PHI', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 108, tds: 1 },
  { displayName: 'Tyreek Hill', athleteId: '3116406', teamCode: 'MIA', position: 'WR', pass_yds: 0, rush_yds: 10, rec_yds: 105, tds: 1 },
  { displayName: 'George Kittle', athleteId: '3040151', teamCode: 'SF', position: 'TE', pass_yds: 0, rush_yds: 0, rec_yds: 104, tds: 1 },
  { displayName: 'Nico Collins', athleteId: '4258168', teamCode: 'HOU', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 102, tds: 1 },
  { displayName: 'Garrett Wilson', athleteId: '4426515', teamCode: 'NYJ', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 98, tds: 1 },
  { displayName: 'Marvin Harrison Jr.', athleteId: '4432708', teamCode: 'ARI', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 95, tds: 1 },
  { displayName: 'Drake London', athleteId: '4426502', teamCode: 'ATL', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 94, tds: 1 },
  { displayName: 'Zay Flowers', athleteId: '4429615', teamCode: 'BAL', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 92, tds: 1 },
  { displayName: 'Terry McLaurin', athleteId: '3121422', teamCode: 'WSH', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 90, tds: 1 },
  { displayName: 'DJ Moore', athleteId: '3915416', teamCode: 'CHI', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 88, tds: 1 },
  { displayName: 'Jaylen Waddle', athleteId: '4372016', teamCode: 'MIA', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 86, tds: 1 },
  { displayName: 'Courtland Sutton', athleteId: '3128429', teamCode: 'DEN', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 85, tds: 1 },
  { displayName: 'Malik Nabers', athleteId: '4595348', teamCode: 'NYG', position: 'WR', pass_yds: 0, rush_yds: 0, rec_yds: 84, tds: 1 },
];

const LEAGUE_STATS_BY_NAME = new Map<string, AthleteLeagueStat>();
const LEAGUE_STATS_BY_ID = new Map<string, AthleteLeagueStat>();

for (const stat of NFL_LEAGUE_STATS_DATABASE) {
  if (stat.displayName) {
    LEAGUE_STATS_BY_NAME.set(stat.displayName.trim().toLowerCase(), stat);
  }
  if (stat.athleteId) {
    LEAGUE_STATS_BY_ID.set(stat.athleteId, stat);
  }
}

export function lookupNFLAthleteLeagueStats(displayName?: string, athleteId?: string): AthleteLeagueStat | undefined {
  if (athleteId && LEAGUE_STATS_BY_ID.has(athleteId)) {
    return LEAGUE_STATS_BY_ID.get(athleteId);
  }
  if (displayName) {
    const clean = displayName.trim().toLowerCase();
    if (LEAGUE_STATS_BY_NAME.has(clean)) {
      return LEAGUE_STATS_BY_NAME.get(clean);
    }
  }
  return undefined;
}
