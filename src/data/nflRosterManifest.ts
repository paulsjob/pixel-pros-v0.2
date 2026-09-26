/**
 * NFL Roster Manifest (Synchronized with ESPN Dynamic Depth Charts)
 * Guarantees exactly 3 QBs, 3 RBs, and 6 WR/TE (12 active athletes per team) for all 32 NFL teams.
 * Synchronized with live starting rosters and dynamic depth charts.
 */

export interface ManifestAthlete {
  athleteId: string;
  displayName: string;
  shortName: string;
  uniformNumber: number;
  teamCode: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K';
  skinTone?: string;
  depthRank?: number;
  depthOrder?: string;
  injuryStatus?: 'I' | 'Q' | null;
  injuryDetail?: string;
}

export const NFL_ROSTER_MANIFEST: Record<string, ManifestAthlete[]> = {
  ARI: [
    { athleteId: '2578570', displayName: 'Jacoby Brissett', shortName: 'JBRISSETT', uniformNumber: 7, teamCode: 'ARI', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4038524', displayName: 'Gardner Minshew II', shortName: 'GMINSHEWII', uniformNumber: 15, teamCode: 'ARI', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4430841', displayName: 'Carson Beck', shortName: 'CBECK', uniformNumber: 19, teamCode: 'ARI', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4870808', displayName: 'Jeremiyah Love', shortName: 'JLOVE', uniformNumber: 4, teamCode: 'ARI', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4373626', displayName: 'Tyler Allgeier', shortName: 'TALLGEIER', uniformNumber: 22, teamCode: 'ARI', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4427728', displayName: 'Bam Knight', shortName: 'BKNIGHT', uniformNumber: 20, teamCode: 'ARI', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4360761', displayName: 'Michael Wilson', shortName: 'MWILSON', uniformNumber: 14, teamCode: 'ARI', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4692835', displayName: 'Jalen Brooks', shortName: 'JBROOKS', uniformNumber: 86, teamCode: 'ARI', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4869132', displayName: 'Reggie Virgil', shortName: 'RVIRGIL', uniformNumber: 82, teamCode: 'ARI', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4432708', displayName: 'Marvin Harrison Jr.', shortName: 'MHARRISONJR', uniformNumber: 18, teamCode: 'ARI', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4361307', displayName: 'Trey McBride', shortName: 'TMCBRIDE', uniformNumber: 85, teamCode: 'ARI', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4426844', displayName: 'Elijah Higgins', shortName: 'EHIGGINS', uniformNumber: 84, teamCode: 'ARI', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  ATL: [
    { athleteId: '4360423', displayName: 'Michael Penix Jr.', shortName: 'MPENIXJR', uniformNumber: 9, teamCode: 'ATL', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4241479', displayName: 'Tua Tagovailoa', shortName: 'TTAGOVAILOA', uniformNumber: 1, teamCode: 'ATL', position: 'QB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '2972515', displayName: 'Cooper Rush', shortName: 'CRUSH', uniformNumber: 13, teamCode: 'ATL', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4430807', displayName: 'Bijan Robinson', shortName: 'BROBINSON', uniformNumber: 7, teamCode: 'ATL', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4241474', displayName: 'Brian Robinson Jr.', shortName: 'BROBINSONJR', uniformNumber: 15, teamCode: 'ATL', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4241401', displayName: 'Trey Sermon', shortName: 'TSERMON', uniformNumber: 44, teamCode: 'ATL', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4426502', displayName: 'Drake London', shortName: 'DLONDON', uniformNumber: 5, teamCode: 'ATL', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4870612', displayName: 'Zachariah Branch', shortName: 'ZBRANCH', uniformNumber: 17, teamCode: 'ATL', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4361409', displayName: 'Jahan Dotson', shortName: 'JDOTSON', uniformNumber: 4, teamCode: 'ATL', position: 'WR', skinTone: '#523318', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4369886', displayName: 'Chris Blair', shortName: 'CBLAIR', uniformNumber: 19, teamCode: 'ATL', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4360248', displayName: 'Kyle Pitts Sr.', shortName: 'KPITTSSR', uniformNumber: 8, teamCode: 'ATL', position: 'TE', skinTone: '#8d5524', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4035020', displayName: 'Charlie Woerner', shortName: 'CWOERNER', uniformNumber: 89, teamCode: 'ATL', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  BAL: [
    { athleteId: '3916387', displayName: 'Lamar Jackson', shortName: 'LJACKSON', uniformNumber: 8, teamCode: 'BAL', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4035671', displayName: 'Tyler Huntley', shortName: 'THUNTLEY', uniformNumber: 5, teamCode: 'BAL', position: 'QB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4429582', displayName: 'Joe Fagnano', shortName: 'JFAGNANO', uniformNumber: 12, teamCode: 'BAL', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '3043078', displayName: 'Derrick Henry', shortName: 'DHENRY', uniformNumber: 22, teamCode: 'BAL', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4038441', displayName: 'Justice Hill', shortName: 'JHILL', uniformNumber: 43, teamCode: 'BAL', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4690013', displayName: 'Rasheen Ali', shortName: 'RALI', uniformNumber: 26, teamCode: 'BAL', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4429615', displayName: 'Zay Flowers', shortName: 'ZFLOWERS', uniformNumber: 4, teamCode: 'BAL', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '2576581', displayName: 'Chris Moore', shortName: 'CMOORE', uniformNumber: 17, teamCode: 'BAL', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4870847', displayName: 'Ja\'Kobi Lane', shortName: 'JLANE', uniformNumber: 6, teamCode: 'BAL', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4360939', displayName: 'Rashod Bateman', shortName: 'RBATEMAN', uniformNumber: 7, teamCode: 'BAL', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '3116365', displayName: 'Mark Andrews', shortName: 'MANDREWS', uniformNumber: 89, teamCode: 'BAL', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '3052897', displayName: 'Durham Smythe', shortName: 'DSMYTHE', uniformNumber: 80, teamCode: 'BAL', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  BUF: [
    { athleteId: '3918298', displayName: 'Josh Allen', shortName: 'JALLEN', uniformNumber: 17, teamCode: 'BUF', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '3115293', displayName: 'Kyle Allen', shortName: 'KALLEN', uniformNumber: 11, teamCode: 'BUF', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4039034', displayName: 'Shane Buechele', shortName: 'SBUECHELE', uniformNumber: 6, teamCode: 'BUF', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4379399', displayName: 'James Cook III', shortName: 'JCOOKIII', uniformNumber: 4, teamCode: 'BUF', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4429501', displayName: 'Ray Davis', shortName: 'RDAVIS', uniformNumber: 7, teamCode: 'BUF', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '3915411', displayName: 'Ty Johnson', shortName: 'TJOHNSON', uniformNumber: 26, teamCode: 'BUF', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '3915416', displayName: 'DJ Moore', shortName: 'DMOORE', uniformNumber: 2, teamCode: 'BUF', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4242433', displayName: 'Joshua Palmer', shortName: 'JPALMER', uniformNumber: 5, teamCode: 'BUF', position: 'WR', skinTone: '#523318', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4373678', displayName: 'Khalil Shakir', shortName: 'KSHAKIR', uniformNumber: 10, teamCode: 'BUF', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4683153', displayName: 'Skyler Bell', shortName: 'SBELL', uniformNumber: 13, teamCode: 'BUF', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4385690', displayName: 'Dalton Kincaid', shortName: 'DKINCAID', uniformNumber: 86, teamCode: 'BUF', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '3930086', displayName: 'Dawson Knox', shortName: 'DKNOX', uniformNumber: 88, teamCode: 'BUF', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  CAR: [
    { athleteId: '4685720', displayName: 'Bryce Young', shortName: 'BYOUNG', uniformNumber: 9, teamCode: 'CAR', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4240703', displayName: 'Kenny Pickett', shortName: 'KPICKETT', uniformNumber: 12, teamCode: 'CAR', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4428993', displayName: 'Haynes King', shortName: 'HKING', uniformNumber: 16, teamCode: 'CAR', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4241416', displayName: 'Chuba Hubbard', shortName: 'CHUBBARD', uniformNumber: 30, teamCode: 'CAR', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4678008', displayName: 'Jonathon Brooks', shortName: 'JBROOKS', uniformNumber: 25, teamCode: 'CAR', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4239934', displayName: 'AJ Dillon', shortName: 'ADILLON', uniformNumber: 28, teamCode: 'CAR', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4685472', displayName: 'Tetairoa McMillan', shortName: 'TMCMILLAN', uniformNumber: 4, teamCode: 'CAR', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4360763', displayName: 'Brycen Tremayne', shortName: 'BTREMAYNE', uniformNumber: 87, teamCode: 'CAR', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4695883', displayName: 'Jalen Coker', shortName: 'JCOKER', uniformNumber: 18, teamCode: 'CAR', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4567096', displayName: 'John Metchie III', shortName: 'JMETCHIEIII', uniformNumber: 13, teamCode: 'CAR', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4372780', displayName: 'Tommy Tremble', shortName: 'TTREMBLE', uniformNumber: 82, teamCode: 'CAR', position: 'TE', skinTone: '#8d5524', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4683243', displayName: 'Mitchell Evans', shortName: 'MEVANS', uniformNumber: 84, teamCode: 'CAR', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  CHI: [
    { athleteId: '4431611', displayName: 'Caleb Williams', shortName: 'CWILLIAMS', uniformNumber: 18, teamCode: 'CHI', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4434153', displayName: 'Tyson Bagent', shortName: 'TBAGENT', uniformNumber: 17, teamCode: 'CHI', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '15168', displayName: 'Case Keenum', shortName: 'CKEENUM', uniformNumber: 11, teamCode: 'CHI', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4259545', displayName: 'D\'Andre Swift', shortName: 'DSWIFT', uniformNumber: 4, teamCode: 'CHI', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4608686', displayName: 'Kyle Monangai', shortName: 'KMONANGAI', uniformNumber: 25, teamCode: 'CHI', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4426386', displayName: 'Roschon Johnson', shortName: 'RJOHNSON', uniformNumber: 23, teamCode: 'CHI', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4431299', displayName: 'Rome Odunze', shortName: 'RODUNZE', uniformNumber: 15, teamCode: 'CHI', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4869748', displayName: 'Zavion Thomas', shortName: 'ZTHOMAS', uniformNumber: 13, teamCode: 'CHI', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4685278', displayName: 'Luther Burden III', shortName: 'LBURDENIII', uniformNumber: 10, teamCode: 'CHI', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '5160110', displayName: 'Jahdae Walker', shortName: 'JWALKER', uniformNumber: 9, teamCode: 'CHI', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4723086', displayName: 'Colston Loveland', shortName: 'CLOVELAND', uniformNumber: 84, teamCode: 'CHI', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4258595', displayName: 'Cole Kmet', shortName: 'CKMET', uniformNumber: 85, teamCode: 'CHI', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  CIN: [
    { athleteId: '3915511', displayName: 'Joe Burrow', shortName: 'JBURROW', uniformNumber: 9, teamCode: 'CIN', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '11252', displayName: 'Joe Flacco', shortName: 'JFLACCO', uniformNumber: 16, teamCode: 'CIN', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '11394', displayName: 'Josh Johnson', shortName: 'JJOHNSON', uniformNumber: 11, teamCode: 'CIN', position: 'QB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4362238', displayName: 'Chase Brown', shortName: 'CBROWN', uniformNumber: 30, teamCode: 'CIN', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '3116389', displayName: 'Samaje Perine', shortName: 'SPERINE', uniformNumber: 34, teamCode: 'CIN', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4429299', displayName: 'Tahj Brooks', shortName: 'TBROOKS', uniformNumber: 25, teamCode: 'CIN', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4362628', displayName: 'Ja\'Marr Chase', shortName: 'JCHASE', uniformNumber: 1, teamCode: 'CIN', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '5092508', displayName: 'Colbie Young', shortName: 'CYOUNG', uniformNumber: 86, teamCode: 'CIN', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4239993', displayName: 'Tee Higgins', shortName: 'THIGGINS', uniformNumber: 5, teamCode: 'CIN', position: 'WR', skinTone: '#523318', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4384852', displayName: 'Dohnte Meyers', shortName: 'DMEYERS', uniformNumber: 81, teamCode: 'CIN', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '3116164', displayName: 'Mike Gesicki', shortName: 'MGESICKI', uniformNumber: 88, teamCode: 'CIN', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '3127310', displayName: 'Drew Sample', shortName: 'DSAMPLE', uniformNumber: 89, teamCode: 'CIN', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  CLE: [
    { athleteId: '3122840', displayName: 'Deshaun Watson', shortName: 'DWATSON', uniformNumber: 4, teamCode: 'CLE', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4432762', displayName: 'Shedeur Sanders', shortName: 'SSANDERS', uniformNumber: 2, teamCode: 'CLE', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4431325', displayName: 'Taylen Green', shortName: 'TGREEN', uniformNumber: 15, teamCode: 'CLE', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4685702', displayName: 'Quinshon Judkins', shortName: 'QJUDKINS', uniformNumber: 10, teamCode: 'CLE', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4601080', displayName: 'Raheim Sanders', shortName: 'RSANDERS', uniformNumber: 23, teamCode: 'CLE', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4722893', displayName: 'Jaleel McLaughlin', shortName: 'JMCLAUGHLIN', uniformNumber: 38, teamCode: 'CLE', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4832800', displayName: 'Denzel Boston', shortName: 'DBOSTON', uniformNumber: 12, teamCode: 'CLE', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4808839', displayName: 'Isaiah Bond', shortName: 'IBOND', uniformNumber: 0, teamCode: 'CLE', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4870653', displayName: 'KC Concepcion', shortName: 'KCONCEPCION', uniformNumber: 1, teamCode: 'CLE', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4241424', displayName: 'Tylan Wallace', shortName: 'TWALLACE', uniformNumber: 16, teamCode: 'CLE', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '5083076', displayName: 'Harold Fannin Jr.', shortName: 'HFANNINJR', uniformNumber: 44, teamCode: 'CLE', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4362018', displayName: 'Blake Whiteheart', shortName: 'BWHITEHEART', uniformNumber: 86, teamCode: 'CLE', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  DAL: [
    { athleteId: '2577417', displayName: 'Dak Prescott', shortName: 'DPRESCOTT', uniformNumber: 4, teamCode: 'DAL', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4426875', displayName: 'Sam Howell', shortName: 'SHOWELL', uniformNumber: 16, teamCode: 'DAL', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4360698', displayName: 'Joe Milton III', shortName: 'JMILTONIII', uniformNumber: 10, teamCode: 'DAL', position: 'QB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4361579', displayName: 'Javonte Williams', shortName: 'JWILLIAMS', uniformNumber: 33, teamCode: 'DAL', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4362478', displayName: 'Emari Demercado', shortName: 'EDEMERCADO', uniformNumber: 31, teamCode: 'DAL', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4429676', displayName: 'Tyler Goodson', shortName: 'TGOODSON', uniformNumber: 25, teamCode: 'DAL', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4241389', displayName: 'CeeDee Lamb', shortName: 'CLAMB', uniformNumber: 88, teamCode: 'DAL', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '3676833', displayName: 'KaVontae Turpin', shortName: 'KTURPIN', uniformNumber: 9, teamCode: 'DAL', position: 'WR', skinTone: '#523318', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4426354', displayName: 'George Pickens', shortName: 'GPICKENS', uniformNumber: 3, teamCode: 'DAL', position: 'WR', skinTone: '#523318', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4426485', displayName: 'Jonathan Mingo', shortName: 'JMINGO', uniformNumber: 18, teamCode: 'DAL', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4242355', displayName: 'Jake Ferguson', shortName: 'JFERGUSON', uniformNumber: 87, teamCode: 'DAL', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4360967', displayName: 'Brevyn Spann-Ford', shortName: 'BSPANN-FORD', uniformNumber: 89, teamCode: 'DAL', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  DEN: [
    { athleteId: '4426338', displayName: 'Bo Nix', shortName: 'BNIX', uniformNumber: 10, teamCode: 'DEN', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '3892775', displayName: 'Jarrett Stidham', shortName: 'JSTIDHAM', uniformNumber: 8, teamCode: 'DEN', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4241820', displayName: 'Sam Ehlinger', shortName: 'SEHLINGER', uniformNumber: 12, teamCode: 'DEN', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4241985', displayName: 'J.K. Dobbins', shortName: 'JKDOBBINS', uniformNumber: 27, teamCode: 'DEN', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4568490', displayName: 'RJ Harvey', shortName: 'RHARVEY', uniformNumber: 12, teamCode: 'DEN', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4702555', displayName: 'Jonah Coleman', shortName: 'JCOLEMAN', uniformNumber: 20, teamCode: 'DEN', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4372016', displayName: 'Jaylen Waddle', shortName: 'JWADDLE', uniformNumber: 17, teamCode: 'DEN', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4600981', displayName: 'Pat Bryant', shortName: 'PBRYANT', uniformNumber: 13, teamCode: 'DEN', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '3128429', displayName: 'Courtland Sutton', shortName: 'CSUTTON', uniformNumber: 14, teamCode: 'DEN', position: 'WR', skinTone: '#523318', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4431280', displayName: 'Troy Franklin', shortName: 'TFRANKLIN', uniformNumber: 11, teamCode: 'DEN', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '3051876', displayName: 'Evan Engram', shortName: 'EENGRAM', uniformNumber: 1, teamCode: 'DEN', position: 'TE', skinTone: '#8d5524', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '3911853', displayName: 'Adam Trautman', shortName: 'ATRAUTMAN', uniformNumber: 82, teamCode: 'DEN', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  DET: [
    { athleteId: '3046779', displayName: 'Jared Goff', shortName: 'JGOFF', uniformNumber: 16, teamCode: 'DET', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '3044720', displayName: 'Joshua Dobbs', shortName: 'JDOBBS', uniformNumber: 11, teamCode: 'DET', position: 'QB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4597679', displayName: 'Luke Altmyer', shortName: 'LALTMYER', uniformNumber: 2, teamCode: 'DET', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4429795', displayName: 'Jahmyr Gibbs', shortName: 'JGIBBS', uniformNumber: 0, teamCode: 'DET', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4912274', displayName: 'Sione Vaki', shortName: 'SVAKI', uniformNumber: 33, teamCode: 'DET', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4383429', displayName: 'Jacob Saylors', shortName: 'JSAYLORS', uniformNumber: 25, teamCode: 'DET', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4374302', displayName: 'Amon-Ra St. Brown', shortName: 'ASTBROWN', uniformNumber: 14, teamCode: 'DET', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '3126997', displayName: 'Tom Kennedy', shortName: 'TKENNEDY', uniformNumber: 85, teamCode: 'DET', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4426388', displayName: 'Jameson Williams', shortName: 'JWILLIAMS', uniformNumber: 1, teamCode: 'DET', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4245144', displayName: 'Tay Martin', shortName: 'TMARTIN', uniformNumber: 17, teamCode: 'DET', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4430027', displayName: 'Sam LaPorta', shortName: 'SLAPORTA', uniformNumber: 87, teamCode: 'DET', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4242392', displayName: 'Brock Wright', shortName: 'BWRIGHT', uniformNumber: 89, teamCode: 'DET', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  GB: [
    { athleteId: '4036378', displayName: 'Jordan Love', shortName: 'JLOVE', uniformNumber: 10, teamCode: 'GB', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '14163', displayName: 'Tyrod Taylor', shortName: 'TTAYLOR', uniformNumber: 6, teamCode: 'GB', position: 'QB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4428512', displayName: 'Kedon Slovis', shortName: 'KSLOVIS', uniformNumber: 12, teamCode: 'GB', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4429023', displayName: 'MarShawn Lloyd', shortName: 'MLLOYD', uniformNumber: 32, teamCode: 'GB', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '3149687', displayName: 'Chris Brooks', shortName: 'CBROOKS', uniformNumber: 30, teamCode: 'GB', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4819231', displayName: 'Kaleb Johnson', shortName: 'KJOHNSON', uniformNumber: 26, teamCode: 'GB', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4248528', displayName: 'Christian Watson', shortName: 'CWATSON', uniformNumber: 9, teamCode: 'GB', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4430191', displayName: 'Skyy Moore', shortName: 'SMOORE', uniformNumber: 23, teamCode: 'GB', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4431487', displayName: 'Savion Williams', shortName: 'SWILLIAMS', uniformNumber: 83, teamCode: 'GB', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4362249', displayName: 'Jayden Reed', shortName: 'JREED', uniformNumber: 11, teamCode: 'GB', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4572680', displayName: 'Tucker Kraft', shortName: 'TKRAFT', uniformNumber: 85, teamCode: 'GB', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '3054212', displayName: 'Jonnu Smith', shortName: 'JSMITH', uniformNumber: 18, teamCode: 'GB', position: 'TE', skinTone: '#8d5524', depthRank: 2, depthOrder: 'TE2' },
  ],
  HOU: [
    { athleteId: '4432577', displayName: 'C.J. Stroud', shortName: 'CJSTROUD', uniformNumber: 7, teamCode: 'HOU', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4242546', displayName: 'Davis Mills', shortName: 'DMILLS', uniformNumber: 10, teamCode: 'HOU', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4426335', displayName: 'Graham Mertz', shortName: 'GMERTZ', uniformNumber: 18, teamCode: 'HOU', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4035538', displayName: 'David Montgomery', shortName: 'DMONTGOMERY', uniformNumber: 32, teamCode: 'HOU', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4429059', displayName: 'Woody Marks', shortName: 'WMARKS', uniformNumber: 4, teamCode: 'HOU', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4373273', displayName: 'British Brooks', shortName: 'BBROOKS', uniformNumber: 44, teamCode: 'HOU', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4258173', displayName: 'Nico Collins', shortName: 'NCOLLINS', uniformNumber: 12, teamCode: 'HOU', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4586312', displayName: 'Jaylin Noel', shortName: 'JNOEL', uniformNumber: 13, teamCode: 'HOU', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4877706', displayName: 'Jayden Higgins', shortName: 'JHIGGINS', uniformNumber: 81, teamCode: 'HOU', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4686422', displayName: 'Xavier Hutchinson', shortName: 'XHUTCHINSON', uniformNumber: 19, teamCode: 'HOU', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '3117256', displayName: 'Dalton Schultz', shortName: 'DSCHULTZ', uniformNumber: 86, teamCode: 'HOU', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '3843945', displayName: 'Foster Moreau', shortName: 'FMOREAU', uniformNumber: 87, teamCode: 'HOU', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  IND: [
    { athleteId: '3917792', displayName: 'Daniel Jones', shortName: 'DJONES', uniformNumber: 17, teamCode: 'IND', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4429084', displayName: 'Anthony Richardson Sr.', shortName: 'ARICHARDSONSR', uniformNumber: 5, teamCode: 'IND', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4683423', displayName: 'Riley Leonard', shortName: 'RLEONARD', uniformNumber: 15, teamCode: 'IND', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4242335', displayName: 'Jonathan Taylor', shortName: 'JTAYLOR', uniformNumber: 28, teamCode: 'IND', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4686468', displayName: 'Seth McGowan', shortName: 'SMCGOWAN', uniformNumber: 20, teamCode: 'IND', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4874509', displayName: 'DJ Giddens', shortName: 'DGIDDENS', uniformNumber: 21, teamCode: 'IND', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4360078', displayName: 'Alec Pierce', shortName: 'APIERCE', uniformNumber: 14, teamCode: 'IND', position: 'WR', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '3916945', displayName: 'Darius Slayton', shortName: 'DSLAYTON', uniformNumber: 11, teamCode: 'IND', position: 'WR', skinTone: '#523318', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4683151', displayName: 'Deion Burks', shortName: 'DBURKS', uniformNumber: 80, teamCode: 'IND', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4688813', displayName: 'Josh Downs', shortName: 'JDOWNS', uniformNumber: 2, teamCode: 'IND', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4431459', displayName: 'Tyler Warren', shortName: 'TWARREN', uniformNumber: 84, teamCode: 'IND', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '2998565', displayName: 'Mo Alie-Cox', shortName: 'MALIE-COX', uniformNumber: 81, teamCode: 'IND', position: 'TE', skinTone: '#8d5524', depthRank: 2, depthOrder: 'TE2' },
  ],
  JAX: [
    { athleteId: '4360310', displayName: 'Trevor Lawrence', shortName: 'TLAWRENCE', uniformNumber: 16, teamCode: 'JAX', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4889929', displayName: 'Quinn Ewers', shortName: 'QEWERS', uniformNumber: 10, teamCode: 'JAX', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '3059989', displayName: 'Nick Mullens', shortName: 'NMULLENS', uniformNumber: 14, teamCode: 'JAX', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4882093', displayName: 'Bhayshul Tuten', shortName: 'BTUTEN', uniformNumber: 33, teamCode: 'JAX', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4362619', displayName: 'Chris Rodriguez Jr.', shortName: 'CRODRIGUEZJR', uniformNumber: 24, teamCode: 'JAX', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4911851', displayName: 'LeQuint Allen Jr.', shortName: 'LALLENJR', uniformNumber: 5, teamCode: 'JAX', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4432620', displayName: 'Parker Washington', shortName: 'PWASHINGTON', uniformNumber: 11, teamCode: 'JAX', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4879194', displayName: 'Josh Cameron', shortName: 'JCAMERON', uniformNumber: 19, teamCode: 'JAX', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4432773', displayName: 'Brian Thomas Jr.', shortName: 'BTHOMASJR', uniformNumber: 7, teamCode: 'JAX', position: 'WR', skinTone: '#523318', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4685415', displayName: 'Travis Hunter', shortName: 'THUNTER', uniformNumber: 12, teamCode: 'JAX', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4430539', displayName: 'Brenton Strange', shortName: 'BSTRANGE', uniformNumber: 85, teamCode: 'JAX', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4686248', displayName: 'Nate Boerkircher', shortName: 'NBOERKIRCHER', uniformNumber: 87, teamCode: 'JAX', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  KC: [
    { athleteId: '3139477', displayName: 'Patrick Mahomes', shortName: 'PMAHOMES', uniformNumber: 15, teamCode: 'KC', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4362887', displayName: 'Justin Fields', shortName: 'JFIELDS', uniformNumber: 6, teamCode: 'KC', position: 'QB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4567747', displayName: 'Garrett Nussmeier', shortName: 'GNUSSMEIER', uniformNumber: 12, teamCode: 'KC', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4567048', displayName: 'Kenneth Walker III', shortName: 'KWALKERIII', uniformNumber: 9, teamCode: 'KC', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4832955', displayName: 'Emmett Johnson', shortName: 'EJOHNSON', uniformNumber: 10, teamCode: 'KC', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4596602', displayName: 'Brashard Smith', shortName: 'BSMITH', uniformNumber: 24, teamCode: 'KC', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4428331', displayName: 'Rashee Rice', shortName: 'RRICE', uniformNumber: 4, teamCode: 'KC', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4912218', displayName: 'Cyrus Allen', shortName: 'CALLEN', uniformNumber: 13, teamCode: 'KC', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4885466', displayName: 'Jeff Caldwell', shortName: 'JCALDWELL', uniformNumber: 8, teamCode: 'KC', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4683062', displayName: 'Xavier Worthy', shortName: 'XWORTHY', uniformNumber: 1, teamCode: 'KC', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '15847', displayName: 'Travis Kelce', shortName: 'TKELCE', uniformNumber: 87, teamCode: 'KC', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4240472', displayName: 'Noah Gray', shortName: 'NGRAY', uniformNumber: 83, teamCode: 'KC', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  LAC: [
    { athleteId: '4038941', displayName: 'Justin Herbert', shortName: 'JHERBERT', uniformNumber: 10, teamCode: 'LAC', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4383351', displayName: 'Trey Lance', shortName: 'TLANCE', uniformNumber: 5, teamCode: 'LAC', position: 'QB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4429020', displayName: 'DJ Uiagalelei', shortName: 'DUIAGALELEI', uniformNumber: 7, teamCode: 'LAC', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4685382', displayName: 'Omarion Hampton', shortName: 'OHAMPTON', uniformNumber: 8, teamCode: 'LAC', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4596334', displayName: 'Keaton Mitchell', shortName: 'KMITCHELL', uniformNumber: 34, teamCode: 'LAC', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4430968', displayName: 'Kimani Vidal', shortName: 'KVIDAL', uniformNumber: 28, teamCode: 'LAC', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4612826', displayName: 'Ladd McConkey', shortName: 'LMCCONKEY', uniformNumber: 15, teamCode: 'LAC', position: 'WR', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4685553', displayName: 'Brenen Thompson', shortName: 'BTHOMPSON', uniformNumber: 89, teamCode: 'LAC', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4429025', displayName: 'Quentin Johnston', shortName: 'QJOHNSTON', uniformNumber: 1, teamCode: 'LAC', position: 'WR', skinTone: '#523318', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4362477', displayName: 'Derius Davis', shortName: 'DDAVIS', uniformNumber: 12, teamCode: 'LAC', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4595342', displayName: 'Oronde Gadsden', shortName: 'OGADSDEN', uniformNumber: 86, teamCode: 'LAC', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4428396', displayName: 'Hayden Rucci', shortName: 'HRUCCI', uniformNumber: 81, teamCode: 'LAC', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  LAR: [
    { athleteId: '12483', displayName: 'Matthew Stafford', shortName: 'MSTAFFORD', uniformNumber: 9, teamCode: 'LAR', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4259553', displayName: 'Stetson Bennett IV', shortName: 'SBENNETTIV', uniformNumber: 13, teamCode: 'LAR', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4685522', displayName: 'Ty Simpson', shortName: 'TSIMPSON', uniformNumber: 15, teamCode: 'LAR', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4430737', displayName: 'Kyren Williams', shortName: 'KWILLIAMS', uniformNumber: 23, teamCode: 'LAR', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4429096', displayName: 'Blake Corum', shortName: 'BCORUM', uniformNumber: 24, teamCode: 'LAR', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4243003', displayName: 'Ronnie Rivers', shortName: 'RRIVERS', uniformNumber: 20, teamCode: 'LAR', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4426515', displayName: 'Puka Nacua', shortName: 'PNACUA', uniformNumber: 12, teamCode: 'LAR', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4710855', displayName: 'Konata Mumpfield', shortName: 'KMUMPFIELD', uniformNumber: 4, teamCode: 'LAR', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4605951', displayName: 'CJ Daniels', shortName: 'CDANIELS', uniformNumber: 6, teamCode: 'LAR', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '16800', displayName: 'Davante Adams', shortName: 'DADAMS', uniformNumber: 17, teamCode: 'LAR', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4242557', displayName: 'Colby Parkinson', shortName: 'CPARKINSON', uniformNumber: 84, teamCode: 'LAR', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4570037', displayName: 'Terrance Ferguson', shortName: 'TFERGUSON', uniformNumber: 18, teamCode: 'LAR', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  LV: [
    { athleteId: '14880', displayName: 'Kirk Cousins', shortName: 'KCOUSINS', uniformNumber: 8, teamCode: 'LV', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4837248', displayName: 'Fernando Mendoza', shortName: 'FMENDOZA', uniformNumber: 15, teamCode: 'LV', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4260394', displayName: 'Aidan O\'Connell', shortName: 'AO\'CONNELL', uniformNumber: 12, teamCode: 'LV', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4890973', displayName: 'Ashton Jeanty', shortName: 'AJEANTY', uniformNumber: 2, teamCode: 'LV', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4686658', displayName: 'Mike Washington Jr.', shortName: 'MWASHINGTONJR', uniformNumber: 30, teamCode: 'LV', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4366963', displayName: 'Dylan Laube', shortName: 'DLAUBE', uniformNumber: 23, teamCode: 'LV', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4428718', displayName: 'Tre Tucker', shortName: 'TTUCKER', uniformNumber: 1, teamCode: 'LV', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '5150247', displayName: 'Malik Benson', shortName: 'MBENSON', uniformNumber: 19, teamCode: 'LV', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4361426', displayName: 'Justin Shorter', shortName: 'JSHORTER', uniformNumber: 88, teamCode: 'LV', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4382466', displayName: 'Jalen Nailor', shortName: 'JNAILOR', uniformNumber: 9, teamCode: 'LV', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4432665', displayName: 'Brock Bowers', shortName: 'BBOWERS', uniformNumber: 89, teamCode: 'LV', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4429086', displayName: 'Michael Mayer', shortName: 'MMAYER', uniformNumber: 87, teamCode: 'LV', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  MIA: [
    { athleteId: '4242512', displayName: 'Malik Willis', shortName: 'MWILLIS', uniformNumber: 2, teamCode: 'MIA', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4433971', displayName: 'Kyle McCord', shortName: 'KMCCORD', uniformNumber: 14, teamCode: 'MIA', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4429435', displayName: 'Brady Cook', shortName: 'BCOOK', uniformNumber: 15, teamCode: 'MIA', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4429160', displayName: 'De\'Von Achane', shortName: 'DACHANE', uniformNumber: 28, teamCode: 'MIA', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4682745', displayName: 'Jaylen Wright', shortName: 'JWRIGHT', uniformNumber: 5, teamCode: 'MIA', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4711533', displayName: 'Ollie Gordon II', shortName: 'OGORDONII', uniformNumber: 0, teamCode: 'MIA', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4569603', displayName: 'Malik Washington', shortName: 'MWASHINGTON', uniformNumber: 6, teamCode: 'MIA', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4685307', displayName: 'Kevin Coleman Jr.', shortName: 'KCOLEMANJR', uniformNumber: 83, teamCode: 'MIA', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4869645', displayName: 'Caleb Douglas', shortName: 'CDOUGLAS', uniformNumber: 7, teamCode: 'MIA', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4249417', displayName: 'Jalen Tolbert', shortName: 'JTOLBERT', uniformNumber: 1, teamCode: 'MIA', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4367209', displayName: 'Greg Dulcich', shortName: 'GDULCICH', uniformNumber: 85, teamCode: 'MIA', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4880236', displayName: 'Will Kacmarek', shortName: 'WKACMAREK', uniformNumber: 89, teamCode: 'MIA', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  MIN: [
    { athleteId: '3917315', displayName: 'Kyler Murray', shortName: 'KMURRAY', uniformNumber: 1, teamCode: 'MIN', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '2573079', displayName: 'Carson Wentz', shortName: 'CWENTZ', uniformNumber: 11, teamCode: 'MIN', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4433970', displayName: 'J.J. McCarthy', shortName: 'JJMCCARTHY', uniformNumber: 9, teamCode: 'MIN', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '3042519', displayName: 'Aaron Jones Sr.', shortName: 'AJONESSR', uniformNumber: 33, teamCode: 'MIN', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4240631', displayName: 'DeeJay Dallas', shortName: 'DDALLAS', uniformNumber: 31, teamCode: 'MIN', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4832846', displayName: 'Demond Claiborne', shortName: 'DCLAIBORNE', uniformNumber: 21, teamCode: 'MIN', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4262921', displayName: 'Justin Jefferson', shortName: 'JJEFFERSON', uniformNumber: 18, teamCode: 'MIN', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4565185', displayName: 'Tai Felton', shortName: 'TFELTON', uniformNumber: 13, teamCode: 'MIN', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4429205', displayName: 'Jordan Addison', shortName: 'JADDISON', uniformNumber: 3, teamCode: 'MIN', position: 'WR', skinTone: '#523318', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4430656', displayName: 'Myles Price', shortName: 'MPRICE', uniformNumber: 4, teamCode: 'MIN', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4036133', displayName: 'T.J. Hockenson', shortName: 'TJHOCKENSON', uniformNumber: 87, teamCode: 'MIN', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '3921690', displayName: 'Josh Oliver', shortName: 'JOLIVER', uniformNumber: 84, teamCode: 'MIN', position: 'TE', skinTone: '#8d5524', depthRank: 2, depthOrder: 'TE2' },
  ],
  NE: [
    { athleteId: '4431452', displayName: 'Drake Maye', shortName: 'DMAYE', uniformNumber: 10, teamCode: 'NE', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4240391', displayName: 'Tommy DeVito', shortName: 'TDEVITO', uniformNumber: 16, teamCode: 'NE', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4431465', displayName: 'Behren Morton', shortName: 'BMORTON', uniformNumber: 15, teamCode: 'NE', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4569173', displayName: 'Rhamondre Stevenson', shortName: 'RSTEVENSON', uniformNumber: 38, teamCode: 'NE', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4432710', displayName: 'TreVeyon Henderson', shortName: 'THENDERSON', uniformNumber: 32, teamCode: 'NE', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4431431', displayName: 'Corey Kiner', shortName: 'CKINER', uniformNumber: 9, teamCode: 'NE', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4361432', displayName: 'Romeo Doubs', shortName: 'RDOUBS', uniformNumber: 87, teamCode: 'NE', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4613202', displayName: 'Kyle Williams', shortName: 'KWILLIAMS', uniformNumber: 18, teamCode: 'NE', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4572655', displayName: 'Jeremiah Webb', shortName: 'JWEBB', uniformNumber: 29, teamCode: 'NE', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4427095', displayName: 'DeMario Douglas', shortName: 'DDOUGLAS', uniformNumber: 3, teamCode: 'NE', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '3046439', displayName: 'Hunter Henry', shortName: 'HHENRY', uniformNumber: 85, teamCode: 'NE', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4831959', displayName: 'Eli Raridon', shortName: 'ERARIDON', uniformNumber: 82, teamCode: 'NE', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  NO: [
    { athleteId: '16757', displayName: 'Derek Carr', shortName: 'DCARR', uniformNumber: 4, teamCode: 'NO', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4360689', displayName: 'Tyler Shough', shortName: 'TSHOUGH', uniformNumber: 6, teamCode: 'NO', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4426339', displayName: 'Spencer Rattler', shortName: 'SRATTLER', uniformNumber: 2, teamCode: 'NO', position: 'QB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4239996', displayName: 'Travis Etienne Jr.', shortName: 'TETIENNEJR', uniformNumber: 3, teamCode: 'NO', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '3054850', displayName: 'Alvin Kamara', shortName: 'AKAMARA', uniformNumber: 41, teamCode: 'NO', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4599739', displayName: 'Kendre Miller', shortName: 'KMILLER', uniformNumber: 5, teamCode: 'NO', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4361370', displayName: 'Chris Olave', shortName: 'COLAVE', uniformNumber: 12, teamCode: 'NO', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4698597', displayName: 'Barion Brown', shortName: 'BBROWN', uniformNumber: 19, teamCode: 'NO', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4569559', displayName: 'Devaughn Vele', shortName: 'DVELE', uniformNumber: 14, teamCode: 'NO', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4880281', displayName: 'Jordyn Tyson', shortName: 'JTYSON', uniformNumber: 0, teamCode: 'NO', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '3929645', displayName: 'Juwan Johnson', shortName: 'JJOHNSON', uniformNumber: 83, teamCode: 'NO', position: 'TE', skinTone: '#8d5524', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4036131', displayName: 'Noah Fant', shortName: 'NFANT', uniformNumber: 87, teamCode: 'NO', position: 'TE', skinTone: '#8d5524', depthRank: 2, depthOrder: 'TE2' },
  ],
  NYG: [
    { athleteId: '2969939', displayName: 'Jameis Winston', shortName: 'JWINSTON', uniformNumber: 19, teamCode: 'NYG', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4689114', displayName: 'Jaxson Dart', shortName: 'JDART', uniformNumber: 6, teamCode: 'NYG', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4243322', displayName: 'Jake Haener', shortName: 'JHAENER', uniformNumber: 2, teamCode: 'NYG', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4696981', displayName: 'Cam Skattebo', shortName: 'CSKATTEBO', uniformNumber: 44, teamCode: 'NYG', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4040761', displayName: 'Devin Singletary', shortName: 'DSINGLETARY', uniformNumber: 26, teamCode: 'NYG', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4241457', displayName: 'Najee Harris', shortName: 'NHARRIS', uniformNumber: 23, teamCode: 'NYG', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4595348', displayName: 'Malik Nabers', shortName: 'MNABERS', uniformNumber: 1, teamCode: 'NYG', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '16733', displayName: 'Odell Beckham Jr.', shortName: 'OBECKHAMJR', uniformNumber: 13, teamCode: 'NYG', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4682648', displayName: 'Malachi Fields', shortName: 'MFIELDS', uniformNumber: 88, teamCode: 'NYG', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4243389', displayName: 'Calvin Austin III', shortName: 'CAUSTINIII', uniformNumber: 82, teamCode: 'NYG', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4361050', displayName: 'Isaiah Likely', shortName: 'ILIKELY', uniformNumber: 9, teamCode: 'NYG', position: 'TE', skinTone: '#8d5524', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4429148', displayName: 'Theo Johnson', shortName: 'TJOHNSON', uniformNumber: 84, teamCode: 'NYG', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  NYJ: [
    { athleteId: '15864', displayName: 'Geno Smith', shortName: 'GSMITH', uniformNumber: 7, teamCode: 'NYJ', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4685413', displayName: 'Cade Klubnik', shortName: 'CKLUBNIK', uniformNumber: 10, teamCode: 'NYJ', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4361418', displayName: 'Will Levis', shortName: 'WLEVIS', uniformNumber: 12, teamCode: 'NYJ', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4427366', displayName: 'Breece Hall', shortName: 'BHALL', uniformNumber: 20, teamCode: 'NYJ', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4685247', displayName: 'Braelon Allen', shortName: 'BALLEN', uniformNumber: 0, teamCode: 'NYJ', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4695404', displayName: 'Isaiah Davis', shortName: 'IDAVIS', uniformNumber: 32, teamCode: 'NYJ', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4569618', displayName: 'Garrett Wilson', shortName: 'GWILSON', uniformNumber: 5, teamCode: 'NYJ', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4682509', displayName: 'Malik McClain', shortName: 'MMCCLAIN', uniformNumber: 84, teamCode: 'NYJ', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4429105', displayName: 'Arian Smith', shortName: 'ASMITH', uniformNumber: 82, teamCode: 'NYJ', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4597500', displayName: 'Adonai Mitchell', shortName: 'AMITCHELL', uniformNumber: 15, teamCode: 'NYJ', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '5083315', displayName: 'Kenyon Sadiq', shortName: 'KSADIQ', uniformNumber: 16, teamCode: 'NYJ', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4808766', displayName: 'Mason Taylor', shortName: 'MTAYLOR', uniformNumber: 85, teamCode: 'NYJ', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  PHI: [
    { athleteId: '4040715', displayName: 'Jalen Hurts', shortName: 'JHURTS', uniformNumber: 1, teamCode: 'PHI', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '14012', displayName: 'Andy Dalton', shortName: 'ADALTON', uniformNumber: 14, teamCode: 'PHI', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4685201', displayName: 'Tanner McKee', shortName: 'TMCKEE', uniformNumber: 16, teamCode: 'PHI', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '3929630', displayName: 'Saquon Barkley', shortName: 'SBARKLEY', uniformNumber: 26, teamCode: 'PHI', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4429013', displayName: 'Tank Bigsby', shortName: 'TBIGSBY', uniformNumber: 8, teamCode: 'PHI', position: 'RB', skinTone: '#523318', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4431545', displayName: 'Will Shipley', shortName: 'WSHIPLEY', uniformNumber: 28, teamCode: 'PHI', position: 'RB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4241478', displayName: 'DeVonta Smith', shortName: 'DSMITH', uniformNumber: 6, teamCode: 'PHI', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4715355', displayName: 'Darius Cooper', shortName: 'DCOOPER', uniformNumber: 80, teamCode: 'PHI', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '3926231', displayName: 'Britain Covey', shortName: 'BCOVEY', uniformNumber: 85, teamCode: 'PHI', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4428850', displayName: 'Dontayvion Wicks', shortName: 'DWICKS', uniformNumber: 13, teamCode: 'PHI', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '3121023', displayName: 'Dallas Goedert', shortName: 'DGOEDERT', uniformNumber: 88, teamCode: 'PHI', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '15835', displayName: 'Zach Ertz', shortName: 'ZERTZ', uniformNumber: 81, teamCode: 'PHI', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  PIT: [
    { athleteId: '8439', displayName: 'Aaron Rodgers', shortName: 'ARODGERS', uniformNumber: 8, teamCode: 'PIT', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '3116407', displayName: 'Mason Rudolph', shortName: 'MRUDOLPH', uniformNumber: 2, teamCode: 'PIT', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4429955', displayName: 'Will Howard', shortName: 'WHOWARD', uniformNumber: 18, teamCode: 'PIT', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4569987', displayName: 'Jaylen Warren', shortName: 'JWARREN', uniformNumber: 30, teamCode: 'PIT', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4038815', displayName: 'Rico Dowdle', shortName: 'RDOWDLE', uniformNumber: 13, teamCode: 'PIT', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '5081508', displayName: 'Eli Heidenreich', shortName: 'EHEIDENREICH', uniformNumber: 29, teamCode: 'PIT', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4047650', displayName: 'DK Metcalf', shortName: 'DMETCALF', uniformNumber: 4, teamCode: 'PIT', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4685261', displayName: 'Germie Bernard', shortName: 'GBERNARD', uniformNumber: 17, teamCode: 'PIT', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '5192448', displayName: 'Cole Burgess', shortName: 'CBURGESS', uniformNumber: 85, teamCode: 'PIT', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4035687', displayName: 'Michael Pittman Jr.', shortName: 'MPITTMANJR', uniformNumber: 11, teamCode: 'PIT', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4361411', displayName: 'Pat Freiermuth', shortName: 'PFREIERMUTH', uniformNumber: 88, teamCode: 'PIT', position: 'TE', skinTone: '#8d5524', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4430802', displayName: 'Darnell Washington', shortName: 'DWASHINGTON', uniformNumber: 80, teamCode: 'PIT', position: 'TE', skinTone: '#8d5524', depthRank: 2, depthOrder: 'TE2' },
  ],
  SEA: [
    { athleteId: '3912547', displayName: 'Sam Darnold', shortName: 'SDARNOLD', uniformNumber: 14, teamCode: 'SEA', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '3924327', displayName: 'Drew Lock', shortName: 'DLOCK', uniformNumber: 2, teamCode: 'SEA', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4432734', displayName: 'Jalen Milroe', shortName: 'JMILROE', uniformNumber: 6, teamCode: 'SEA', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4685512', displayName: 'Jadarian Price', shortName: 'JPRICE', uniformNumber: 8, teamCode: 'SEA', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4887558', displayName: 'Emanuel Wilson', shortName: 'EWILSON', uniformNumber: 23, teamCode: 'SEA', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4429835', displayName: 'George Holani', shortName: 'GHOLANI', uniformNumber: 36, teamCode: 'SEA', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4430878', displayName: 'Jaxon Smith-Njigba', shortName: 'JSMITH-NJIGBA', uniformNumber: 11, teamCode: 'SEA', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4597703', displayName: 'Tory Horton', shortName: 'THORTON', uniformNumber: 15, teamCode: 'SEA', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4360405', displayName: 'Jake Bobo', shortName: 'JBOBO', uniformNumber: 19, teamCode: 'SEA', position: 'WR', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4032473', displayName: 'Rashid Shaheed', shortName: 'RSHAHEED', uniformNumber: 22, teamCode: 'SEA', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4576297', displayName: 'AJ Barner', shortName: 'ABARNER', uniformNumber: 88, teamCode: 'SEA', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '2975863', displayName: 'Eric Saubert', shortName: 'ESAUBERT', uniformNumber: 81, teamCode: 'SEA', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  SF: [
    { athleteId: '4361741', displayName: 'Brock Purdy', shortName: 'BPURDY', uniformNumber: 13, teamCode: 'SF', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4241464', displayName: 'Mac Jones', shortName: 'MJONES', uniformNumber: 10, teamCode: 'SF', position: 'QB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4430431', displayName: 'Kurtis Rourke', shortName: 'KROURKE', uniformNumber: 14, teamCode: 'SF', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '3117251', displayName: 'Christian McCaffrey', shortName: 'CMCCAFFREY', uniformNumber: 23, teamCode: 'SF', position: 'RB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4696044', displayName: 'Kaelon Black', shortName: 'KBLACK', uniformNumber: 26, teamCode: 'SF', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4685397', displayName: 'Jordan James', shortName: 'JJAMES', uniformNumber: 29, teamCode: 'SF', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '16737', displayName: 'Mike Evans', shortName: 'MEVANS', uniformNumber: 5, teamCode: 'SF', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4575665', displayName: 'Jacob Cowing', shortName: 'JCOWING', uniformNumber: 4, teamCode: 'SF', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '3895856', displayName: 'Christian Kirk', shortName: 'CKIRK', uniformNumber: 3, teamCode: 'SF', position: 'WR', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4360438', displayName: 'Brandon Aiyuk', shortName: 'BAIYUK', uniformNumber: 11, teamCode: 'SF', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '3040151', displayName: 'George Kittle', shortName: 'GKITTLE', uniformNumber: 85, teamCode: 'SF', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4040612', displayName: 'Luke Farrell', shortName: 'LFARRELL', uniformNumber: 89, teamCode: 'SF', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  TB: [
    { athleteId: '3052587', displayName: 'Baker Mayfield', shortName: 'BMAYFIELD', uniformNumber: 6, teamCode: 'TB', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '4596472', displayName: 'Jalon Daniels', shortName: 'JDANIELS', uniformNumber: 10, teamCode: 'TB', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '3120590', displayName: 'Easton Stick', shortName: 'ESTICK', uniformNumber: 12, teamCode: 'TB', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4596448', displayName: 'Bucky Irving', shortName: 'BIRVING', uniformNumber: 7, teamCode: 'TB', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4371733', displayName: 'Kenny Gainwell', shortName: 'KGAINWELL', uniformNumber: 1, teamCode: 'TB', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4430871', displayName: 'Sean Tucker', shortName: 'STUCKER', uniformNumber: 44, teamCode: 'TB', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4567750', displayName: 'Emeka Egbuka', shortName: 'EEGBUKA', uniformNumber: 2, teamCode: 'TB', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '5220680', displayName: 'Ted Hurst III', shortName: 'THURSTIII', uniformNumber: 17, teamCode: 'TB', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '3871102', displayName: 'David Sills V', shortName: 'DSILLSV', uniformNumber: 80, teamCode: 'TB', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '3116165', displayName: 'Chris Godwin Jr.', shortName: 'CGODWINJR', uniformNumber: 14, teamCode: 'TB', position: 'WR', skinTone: '#523318', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4243331', displayName: 'Cade Otton', shortName: 'COTTON', uniformNumber: 88, teamCode: 'TB', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4372505', displayName: 'Payne Durham', shortName: 'PDURHAM', uniformNumber: 87, teamCode: 'TB', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
  TEN: [
    { athleteId: '4688380', displayName: 'Cam Ward', shortName: 'CWARD', uniformNumber: 1, teamCode: 'TEN', position: 'QB', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '3039707', displayName: 'Mitchell Trubisky', shortName: 'MTRUBISKY', uniformNumber: 10, teamCode: 'TEN', position: 'QB', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4240858', displayName: 'Hendon Hooker', shortName: 'HHOOKER', uniformNumber: 16, teamCode: 'TEN', position: 'QB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '3916148', displayName: 'Tony Pollard', shortName: 'TPOLLARD', uniformNumber: 20, teamCode: 'TEN', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4428557', displayName: 'Tyjae Spears', shortName: 'TSPEARS', uniformNumber: 2, teamCode: 'TEN', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4367567', displayName: 'Julius Chestnut', shortName: 'JCHESTNUT', uniformNumber: 36, teamCode: 'TEN', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '4871023', displayName: 'Carnell Tate', shortName: 'CTATE', uniformNumber: 14, teamCode: 'TEN', position: 'WR', skinTone: '#8d5524', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4883647', displayName: 'Elic Ayomanor', shortName: 'EAYOMANOR', uniformNumber: 5, teamCode: 'TEN', position: 'WR', skinTone: '#8d5524', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4569587', displayName: 'Wan\'Dale Robinson', shortName: 'WROBINSON', uniformNumber: 4, teamCode: 'TEN', position: 'WR', skinTone: '#8d5524', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '4431268', displayName: 'Chimere Dike', shortName: 'CDIKE', uniformNumber: 17, teamCode: 'TEN', position: 'WR', skinTone: '#8d5524', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4686728', displayName: 'Gunnar Helm', shortName: 'GHELM', uniformNumber: 84, teamCode: 'TEN', position: 'TE', skinTone: '#f8d9b6', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4361516', displayName: 'Daniel Bellinger', shortName: 'DBELLINGER', uniformNumber: 82, teamCode: 'TEN', position: 'TE', skinTone: '#8d5524', depthRank: 2, depthOrder: 'TE2' },
  ],
  WSH: [
    { athleteId: '4426348', displayName: 'Jayden Daniels', shortName: 'JDANIELS', uniformNumber: 5, teamCode: 'WSH', position: 'QB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'QB1' },
    { athleteId: '2576980', displayName: 'Marcus Mariota', shortName: 'MMARIOTA', uniformNumber: 8, teamCode: 'WSH', position: 'QB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'QB2' },
    { athleteId: '4432722', displayName: 'Athan Kaliakmanis', shortName: 'AKALIAKMANIS', uniformNumber: 16, teamCode: 'WSH', position: 'QB', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'QB3' },
    { athleteId: '4575131', displayName: 'Jacory Croskey-Merritt', shortName: 'JCROSKEY-MERRITT', uniformNumber: 22, teamCode: 'WSH', position: 'RB', skinTone: '#8d5524', depthRank: 1, depthOrder: 'RB1' },
    { athleteId: '4697815', displayName: 'Rachaad White', shortName: 'RWHITE', uniformNumber: 1, teamCode: 'WSH', position: 'RB', skinTone: '#8d5524', depthRank: 2, depthOrder: 'RB2' },
    { athleteId: '4685246', displayName: 'Kaytron Allen', shortName: 'KALLEN', uniformNumber: 31, teamCode: 'WSH', position: 'RB', skinTone: '#8d5524', depthRank: 3, depthOrder: 'RB3' },
    { athleteId: '3121422', displayName: 'Terry McLaurin', shortName: 'TMCLAURIN', uniformNumber: 17, teamCode: 'WSH', position: 'WR', skinTone: '#523318', depthRank: 1, depthOrder: 'WR1' },
    { athleteId: '4361577', displayName: 'Dyami Brown', shortName: 'DBROWN', uniformNumber: 6, teamCode: 'WSH', position: 'WR', skinTone: '#523318', depthRank: 2, depthOrder: 'WR2' },
    { athleteId: '4426948', displayName: 'Luke McCaffrey', shortName: 'LMCCAFFREY', uniformNumber: 11, teamCode: 'WSH', position: 'WR', skinTone: '#f8d9b6', depthRank: 3, depthOrder: 'WR3' },
    { athleteId: '2976212', displayName: 'Stefon Diggs', shortName: 'SDIGGS', uniformNumber: 3, teamCode: 'WSH', position: 'WR', skinTone: '#f8d9b6', depthRank: 4, depthOrder: 'WR4' },
    { athleteId: '4360635', displayName: 'Chig Okonkwo', shortName: 'COKONKWO', uniformNumber: 85, teamCode: 'WSH', position: 'TE', skinTone: '#8d5524', depthRank: 1, depthOrder: 'TE1' },
    { athleteId: '4690923', displayName: 'Ben Sinnott', shortName: 'BSINNOTT', uniformNumber: 82, teamCode: 'WSH', position: 'TE', skinTone: '#f8d9b6', depthRank: 2, depthOrder: 'TE2' },
  ],
};

export function validateTeamRoster(teamCodeOrRoster: string | any[], roster?: any[]): boolean {
  const list = Array.isArray(teamCodeOrRoster) ? teamCodeOrRoster : roster || [];
  if (!Array.isArray(list)) return false;
  const qbs = list.filter((r) => r.position === 'QB').length;
  const rbs = list.filter((r) => r.position === 'RB').length;
  const wrtes = list.filter((r) => r.position === 'WR' || r.position === 'TE').length;
  return qbs >= 3 && rbs >= 3 && wrtes >= 6;
}

export const ROSTER_CACHE_VERSION = 'v2026_live_stats_v5';

export const RETIRED_NFL_PLAYERS = new Set<string>([
  'russell wilson',
  'tom brady',
  'matt ryan',
  'philip rivers',
  'drew brees',
  'ben roethlisberger',
  'eli manning',
  'cam newton',
  'ryan fitzpatrick',
  'andrew luck',
  'adrian peterson',
  'antonio brown',
  'rob gronkowski',
]);

export function isRetiredPlayer(name?: string): boolean {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  if (RETIRED_NFL_PLAYERS.has(clean)) return true;
  for (const retired of RETIRED_NFL_PLAYERS) {
    if (clean.includes(retired)) return true;
  }
  return false;
}

// Pre-computed Depth Chart Rank and Order mapping for all NFL manifest athletes
export const MANIFEST_DEPTH_MAP = new Map<string, { depthRank: number; depthOrder: string }>();

for (const [teamCode, athletes] of Object.entries(NFL_ROSTER_MANIFEST)) {
  const posCounts: Record<string, number> = {};
  for (const ath of athletes) {
    posCounts[ath.position] = (posCounts[ath.position] || 0) + 1;
    const computedRank = posCounts[ath.position];
    const depthRank = ath.depthRank || computedRank;
    const depthOrder = ath.depthOrder || `${ath.position}${depthRank}`;

    const normName = ath.displayName.trim().toLowerCase();
    const normShort = ath.shortName.trim().toLowerCase();
    const normTeam = teamCode.trim().toUpperCase();

    MANIFEST_DEPTH_MAP.set(`${normName}__${normTeam}`, { depthRank, depthOrder });
    MANIFEST_DEPTH_MAP.set(`${normShort}__${normTeam}`, { depthRank, depthOrder });
    if (ath.athleteId) {
      MANIFEST_DEPTH_MAP.set(ath.athleteId, { depthRank, depthOrder });
    }
  }
}

export function getStarterManifestDepth(
  playerName?: string,
  teamCode?: string,
  athleteId?: string
): { depthRank: number; depthOrder: string } | null {
  if (athleteId) {
    const cleanId = String(athleteId).replace(/^nfl_/, '');
    const byId = MANIFEST_DEPTH_MAP.get(cleanId);
    if (byId) return byId;
  }

  if (playerName && teamCode) {
    const key = `${playerName.trim().toLowerCase()}__${teamCode.trim().toUpperCase()}`;
    const byKey = MANIFEST_DEPTH_MAP.get(key);
    if (byKey) return byKey;
  }

  if (playerName) {
    const normName = playerName.trim().toLowerCase();
    for (const [key, val] of MANIFEST_DEPTH_MAP.entries()) {
      if (key.startsWith(`${normName}__`)) {
        return val;
      }
    }
  }

  return null;
}
