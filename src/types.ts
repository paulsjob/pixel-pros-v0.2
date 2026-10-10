export type SportId = 'nfl' | 'nba' | 'soccer' | 'baseball';

export interface Sport {
  id: SportId;
  name: string;
  category: string;
  seasonLabel: string;
  icon: string;
}

export interface AvatarConfig {
  helmetColor: string;
  jerseyColor: string;
  stripeColor: string;
  skinTone: string;
  number: number;
  pantsColor?: string;
  numberColor?: string;
}

export interface SeasonStats {
  pass_yds?: number;
  rush_yds?: number;
  rec_yds?: number;
  tds?: number;
  touchdowns?: number;
  total_yards?: number;
  primaryMetricValue?: number;
  primaryMetricLabel?: string;
  pts?: number;
  points?: number;
  three_pm?: number;
  threes?: number;
  reb?: number;
  ast?: number;
  games_played?: number;
  summary?: string;
  [key: string]: any;
}

export interface Competitor {
  id: string;
  athleteId?: string;
  athlete_id?: string;
  sportId: SportId;
  displayName: string;
  shortName: string;
  uniformNumber: number;
  teamName: string;
  teamCode: string;
  positionGeneric: 'OFFENSE' | 'DEFENSE' | 'SCORER' | 'PLAYMAKER' | string;
  position?: string;
  depthRank?: number;
  depthOrder?: string;
  injuryStatus?: 'I' | 'Q' | null;
  injuryDetail?: string;
  rating: number;
  stats: {
    pass_yds?: number;
    rush_yds?: number;
    rec_yds?: number;
    tds?: number;
    passingYards?: number;
    rushingYards?: number;
    touchdowns?: number;
    receptions?: number;
    receivingYards?: number;
    primaryMetricLabel?: string;
    primaryMetricValue?: number;
    [key: string]: any;
  };
  seasonStats?: SeasonStats;
  season_stats?: SeasonStats;
  badges: string[];
  score: number;
  currentScore?: number;
  current_score?: number;
  current_stats?: string;
  name?: string;
  last_game_score?: number;
  last_game_stats?: string;
  lastGameScore?: number;
  lastGameStats?: string;
  avatar: AvatarConfig;
}

export interface ScoringRule {
  id: string;
  sportId: SportId;
  eventType: string;
  displayName: string;
  pointsValue: number; // Strictly whole numbers for kids!
  description: string;
}

export interface Match {
  id: string;
  sportId: SportId;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode: string;
  awayTeamCode: string;
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  quarter_time?: string;
  quarterTime?: string;
  status: 'upcoming' | 'live' | 'final';
  periodLabel: string;
  homeScore: number;
  awayScore: number;
  recentEvent?: string;
  week?: number;
  weekLabel?: string;
  gameDate?: string;
}

export interface LeaderboardEntry {
  rank: number | string;
  username: string;
  score: number;
  isFriend: boolean;
  isYou: boolean;
  avatar: AvatarConfig;
  badges?: string[];
  rosterPlayerIds?: string[];
}

export interface UserProfile {
  username: string;
  totalScore: number;
  badges: string[];
  avatar: AvatarConfig;
  selectedPlayerIds: string[];
  isLocked?: boolean;
}

export type ActiveSlot = 'star1' | 'star2' | 'star3';

export interface SquadSlots {
  star1: Competitor | null;
  star2: Competitor | null;
  star3: Competitor | null;
}

export interface UserRoster {
  id?: string;
  room_code: string;
  user_name: string;
  sport?: SportId;
  device_id?: string;
  star_1_id: string;
  star_2_id: string;
  star_3_id: string;
  is_locked?: boolean;
  updated_at?: string;
}

export type ReactionEmoji = '👑' | '🔥' | '🧊' | '🎯' | '🚀' | '🍿' | '🧂';

export interface SquadReactionEntry {
  emoji: ReactionEmoji;
  sender: string;
  timestamp: string;
}

export interface TrustReceipt {
  id: string;
  receipt_id: string;
  room_code: string;
  user_name: string;
  sport: SportId;
  slate_id: string;
  locked_at: string;
  locked_at_display: string;
  is_on_time: boolean;
  is_classified: boolean;
  star_ids: string[];
  star_names: string[];
  star_teams?: string[];
  tamper_hash: string;
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
