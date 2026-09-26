import { Competitor, LeaderboardEntry, Match, ScoringRule, Sport, UserProfile } from '../types';

export const INITIAL_SPORTS: Sport[] = [
  { id: 'nfl', name: 'Football', category: 'Gridiron', seasonLabel: 'Week 2', icon: '🏈' },
  { id: 'nba', name: 'Basketball', category: 'Hoops', seasonLabel: 'Season 2026', icon: '🏀' },
  { id: 'soccer', name: 'Soccer', category: 'Global Football', seasonLabel: 'Matchday 5', icon: '⚽' },
  { id: 'baseball', name: 'Baseball', category: 'Diamond', seasonLabel: 'Series 1', icon: '⚾' },
];

/**
 * Athletes and matches hydrate 100% live from the Supabase database.
 * No stale mock data or static fallbacks.
 */
export const INITIAL_COMPETITORS: Competitor[] = [];
export const LIVE_MATCHES: Match[] = [];

export const INITIAL_USER: UserProfile = {
  username: 'YOU',
  totalScore: 0,
  badges: ['diamond_crystal', 'shield_badge', 'gold_star'],
  avatar: {
    helmetColor: '#155e9e',
    jerseyColor: '#155e9e',
    stripeColor: '#ffffff',
    skinTone: '#d98c55',
    number: 88,
  },
  selectedPlayerIds: ['mahomes', 'henry', 'lamb'],
  isLocked: false,
};

/**
 * 2-Tier Family Leaderboard:
 * Each family member has 3 chosen stars in `rosterPlayerIds`.
 * The UI sums the actual points of each member's chosen 3 stars for whole-number totals.
 */
export const INITIAL_LEADERBOARD_FAMILY: LeaderboardEntry[] = [
  {
    rank: 1,
    username: 'YOU',
    score: 0,
    isFriend: true,
    isYou: true,
    avatar: { helmetColor: '#155e9e', jerseyColor: '#155e9e', stripeColor: '#ffffff', skinTone: '#d98c55', number: 88 },
    rosterPlayerIds: ['mahomes', 'henry', 'lamb'],
  },
  {
    rank: 2,
    username: "DAD'S TEAM",
    score: 0,
    isFriend: true,
    isYou: false,
    avatar: { helmetColor: '#b45309', jerseyColor: '#b45309', stripeColor: '#ffffff', skinTone: '#d98c55', number: 12 },
    rosterPlayerIds: ['jackson', 'henry', 'barkley'],
  },
  {
    rank: 3,
    username: "MOM'S CHAMPS",
    score: 0,
    isFriend: true,
    isYou: false,
    avatar: { helmetColor: '#059669', jerseyColor: '#059669', stripeColor: '#ffffff', skinTone: '#f7d7b5', number: 15 },
    rosterPlayerIds: ['mccaffrey', 'jefferson', 'stbrown'],
  },
  {
    rank: 4,
    username: 'KIDS ROCK',
    score: 0,
    isFriend: true,
    isYou: false,
    avatar: { helmetColor: '#7c3aed', jerseyColor: '#7c3aed', stripeColor: '#ffffff', skinTone: '#d98c55', number: 7 },
    rosterPlayerIds: ['stroud', 'hill', 'lamb'],
  },
  {
    rank: 5,
    username: 'COUCH COACH',
    score: 0,
    isFriend: true,
    isYou: false,
    avatar: { helmetColor: '#475569', jerseyColor: '#475569', stripeColor: '#ffffff', skinTone: '#e6ba8c', number: 50 },
    rosterPlayerIds: ['allen', 'lawrence', 'henry'],
  },
];

export const INITIAL_LEADERBOARD_FRIENDS = INITIAL_LEADERBOARD_FAMILY;
export const INITIAL_LEADERBOARD_GLOBAL = INITIAL_LEADERBOARD_FAMILY;

export const SCORING_RULES: ScoringRule[] = [
  {
    id: 'r1',
    sportId: 'nfl',
    eventType: 'touchdown',
    displayName: 'Touchdown',
    pointsValue: 6,
    description: 'Six whole points for every touchdown scored!',
  },
  {
    id: 'r2',
    sportId: 'nfl',
    eventType: 'field_goal',
    displayName: 'Field Goal',
    pointsValue: 3,
    description: 'Three whole points when your team splits the uprights!',
  },
  {
    id: 'r3',
    sportId: 'nfl',
    eventType: 'defense_stop',
    displayName: 'Big Defense Stop',
    pointsValue: 2,
    description: 'Two whole points for a quarterback sack, fumble recovery, or interception!',
  },
  {
    id: 'r4',
    sportId: 'nfl',
    eventType: 'yards_bonus',
    displayName: '10 Yards Play',
    pointsValue: 1,
    description: 'Every 10 total passing, rushing, or receiving yards.',
  },
];
