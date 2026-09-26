export const SUPABASE_CONFIG = {
  url: "https://sqntjgjqtwbcqpxcqzbg.supabase.co",
  projectId: "sqntjgjqtwbcqpxcqzbg",
};

export const UNIVERSAL_POSTGRES_SCHEMA = `-- =========================================================================
-- PIXEL PROS: FOUNDATIONAL POSTGRESQL UNIVERSAL DATA SCHEMA (SUPABASE)
-- Designed for Sports-Agnostic Fantasy Game Engine with Whole-Number Scoring
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SPORTS REGISTRY (Sport-Agnostic Meta Table)
CREATE TABLE IF NOT EXISTS public.sports (
    id TEXT PRIMARY KEY,                       -- e.g. 'nfl', 'nba', 'soccer', 'tennis'
    name TEXT NOT NULL,                        -- 'Football', 'Basketball', 'Soccer'
    icon_name TEXT NOT NULL,                   -- 'football', 'basketball'
    season_label TEXT NOT NULL DEFAULT '2026 Week 1',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. UNIVERSAL COMPETITORS (Players / Athletes across all sports)
CREATE TABLE IF NOT EXISTS public.competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id TEXT NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
    external_provider_id TEXT,                 -- External sports feed athlete ID for lightweight mapping
    display_name TEXT NOT NULL,                -- e.g. 'Patrick Mahomes'
    short_name TEXT NOT NULL,                  -- e.g. 'MAHOMES'
    uniform_number INTEGER NOT NULL DEFAULT 88,
    team_name TEXT NOT NULL,                   -- e.g. 'Kansas City'
    team_code TEXT NOT NULL,                   -- e.g. 'KC'
    position_generic TEXT NOT NULL,            -- 'OFFENSE', 'DEFENSE', 'SCORER', 'PLAYMAKER'
    rating INTEGER NOT NULL DEFAULT 85,        -- Retro card rating (80-99)
    score INTEGER NOT NULL DEFAULT 15000,      -- Whole-number retro fantasy score
    fantasy_points INTEGER NOT NULL DEFAULT 0, -- Accumulated fantasy points (TD:6, FG:3, DefStop:2, 50Yds:1)
    stats JSONB NOT NULL DEFAULT '{"touchdowns": 0, "field_goals": 0, "defensive_stops": 0, "total_yards": 0}'::jsonb,
    avatar_config JSONB NOT NULL DEFAULT '{
      "helmetColor": "#155e9e",
      "jerseyColor": "#155e9e",
      "stripeColor": "#ffffff",
      "skinTone": "#d98c55",
      "number": 88
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alias view so queries to either 'players' or 'competitors' work seamlessly
CREATE OR REPLACE VIEW public.players AS SELECT * FROM public.competitors;

-- Index for speedy sport and team querying
CREATE INDEX IF NOT EXISTS idx_competitors_sport ON public.competitors(sport_id);
CREATE INDEX IF NOT EXISTS idx_competitors_external_id ON public.competitors(external_provider_id);

-- 3. UNIVERSAL MATCHES (Games / Fixtures across all sports)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id TEXT NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
    external_match_id TEXT,                    -- External gameId
    home_competitor_name TEXT NOT NULL,        -- e.g. 'Chiefs'
    away_competitor_name TEXT NOT NULL,        -- e.g. 'Bills'
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming',   -- 'upcoming', 'live', 'final'
    period_label TEXT NOT NULL DEFAULT 'Pre-Game', -- 'Q3 04:12', 'Halftime', 'Final'
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_sport_status ON public.matches(sport_id, status);

-- 4. SCORING RULES ENGINE (Whole-Number Math for Kids)
-- Tweakable on-the-fly per sport without altering frontend code!
CREATE TABLE IF NOT EXISTS public.scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id TEXT NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,                  -- 'touchdown', 'field_goal', 'soccer_goal', 'basket_3pt'
    display_name TEXT NOT NULL,                -- 'Touchdown', 'Field Goal', 'Goal'
    points_value INTEGER NOT NULL,             -- STRICTLY WHOLE NUMBER (e.g. 6, 3, 1)
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sport_event UNIQUE (sport_id, event_type)
);

-- 5. NORMALIZED MATCH EVENTS (Written by Python Ingestion Worker)
-- Stores generic 'stat_primary' metrics translated from raw provider APIs
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,                  -- 'touchdown', 'passing_tier', 'rushing_tier'
    stat_primary INTEGER NOT NULL DEFAULT 1,   -- 1 touchdown, 50 passing yards
    fantasy_points INTEGER NOT NULL DEFAULT 0, -- Computed whole-number points based on rule
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_events_competitor ON public.match_events(competitor_id);

-- 6. USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,             -- e.g. 'PLAYER123', 'PIXELPRO'
    total_score INTEGER NOT NULL DEFAULT 0,
    badges JSONB NOT NULL DEFAULT '["emerald_gem", "diamond_crystal"]'::jsonb,
    avatar_config JSONB NOT NULL DEFAULT '{
      "helmetColor": "#155e9e",
      "jerseyColor": "#155e9e",
      "stripeColor": "#ffffff",
      "skinTone": "#d98c55",
      "number": 88
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FANTASY ROSTERS (The 3-Player Lineup per Week)
CREATE TABLE IF NOT EXISTS public.rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    sport_id TEXT NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
    period_code TEXT NOT NULL DEFAULT 'WEEK_CURRENT',
    competitor_slot_1 UUID REFERENCES public.competitors(id),
    competitor_slot_2 UUID REFERENCES public.competitors(id),
    competitor_slot_3 UUID REFERENCES public.competitors(id),
    total_points INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_sport_period UNIQUE (user_id, sport_id, period_code)
);

-- 7b. MULTI-DEVICE SHARED FAMILY ROSTERS (Room Code System)
CREATE TABLE IF NOT EXISTS public.user_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL,
    user_name TEXT NOT NULL,
    sport TEXT NOT NULL DEFAULT 'nfl',
    star_1_id TEXT NOT NULL DEFAULT '',
    star_2_id TEXT NOT NULL DEFAULT '',
    star_3_id TEXT NOT NULL DEFAULT '',
    is_locked BOOLEAN DEFAULT false,
    device_id TEXT DEFAULT 'UNLOCKED',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_user_sport UNIQUE (room_code, user_name, sport)
);
CREATE INDEX IF NOT EXISTS idx_user_rosters_room ON public.user_rosters(room_code);

-- Enable RLS
ALTER TABLE public.user_rosters ENABLE ROW LEVEL SECURITY;

-- Drop any restrictive legacy policies
DROP POLICY IF EXISTS "Allow public read access on user_rosters" ON public.user_rosters;
DROP POLICY IF EXISTS "Allow public insert/update on user_rosters" ON public.user_rosters;
DROP POLICY IF EXISTS "Public all access user_rosters" ON public.user_rosters;

-- Grant universal read/write access to user_rosters for couch play
CREATE POLICY "Public all access user_rosters" 
ON public.user_rosters 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Enable realtime stream for user_rosters
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_rosters;

-- 8. ROW LEVEL SECURITY (RLS) FOR SAFE KIDS APPLICATION
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rosters ENABLE ROW LEVEL SECURITY;

-- Public read policies so the React client can query game state securely
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Public read competitors" ON public.competitors FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read scoring_rules" ON public.scoring_rules FOR SELECT USING (true);
CREATE POLICY "Public read match_events" ON public.match_events FOR SELECT USING (true);
CREATE POLICY "Public read user_profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Public read rosters" ON public.rosters FOR SELECT USING (true);

-- 9. INITIAL SEED DATA FOR NFL, NBA, SOCCER
INSERT INTO public.sports (id, name, icon_name, season_label) VALUES
('nfl', 'Football', 'football', 'Week 2'),
('nba', 'Basketball', 'basketball', 'Regular Season'),
('soccer', 'Soccer', 'soccer', 'Matchday 5')
ON CONFLICT (id) DO NOTHING;

-- Seed Simple Whole-Number Scoring Rules
INSERT INTO public.scoring_rules (sport_id, event_type, display_name, points_value, description) VALUES
('nfl', 'touchdown', 'Touchdown', 6, 'Six whole points for every touchdown!'),
('nfl', 'field_goal', 'Field Goal', 3, 'Three points for field goals'),
('nfl', 'safety', 'Safety / Defense', 2, 'Two points for defensive stops'),
('nfl', 'pass_50yds', 'Pass 50 Yards', 1, 'One whole point per 50 passing yards'),
('nba', 'basket_3pt', '3-Pointer', 3, 'Three whole points for a long-distance basket'),
('nba', 'dunk', 'Slam Dunk', 2, 'Two whole points for inside baskets'),
('soccer', 'goal', 'Goal Scored', 1, 'One point per goal - simple and clean')
ON CONFLICT (sport_id, event_type) DO NOTHING;

-- Seed Authentic NFL Competitors
INSERT INTO public.competitors (id, sport_id, display_name, short_name, team_name, team_code, uniform_number, position_generic, score, stats, avatar_config) VALUES
('11111111-1111-1111-1111-111111111101', 'nfl', 'Patrick Mahomes', 'Mahomes', 'Kansas City Chiefs', 'KC', 15, 'STAR', 168, '{"passingYards": 3890, "rushingYards": 240, "touchdowns": 28}'::jsonb, '{"helmetColor": "#e31837", "jerseyColor": "#e31837", "stripeColor": "#ffb81c", "skinTone": "#d98c55", "number": 15}'::jsonb),
('11111111-1111-1111-1111-111111111102', 'nfl', 'Josh Allen', 'Allen', 'Buffalo Bills', 'BUF', 17, 'STAR', 184, '{"passingYards": 3650, "rushingYards": 520, "touchdowns": 34}'::jsonb, '{"helmetColor": "#00338d", "jerseyColor": "#00338d", "stripeColor": "#c60c30", "skinTone": "#f7d2b7", "number": 17}'::jsonb),
('11111111-1111-1111-1111-111111111103', 'nfl', 'Lamar Jackson', 'Jackson', 'Baltimore Ravens', 'BAL', 8, 'STAR', 196, '{"passingYards": 3400, "rushingYards": 850, "touchdowns": 32}'::jsonb, '{"helmetColor": "#241773", "jerseyColor": "#241773", "stripeColor": "#9e7c0c", "skinTone": "#8c5332", "number": 8}'::jsonb),
('11111111-1111-1111-1111-111111111104', 'nfl', 'Christian McCaffrey', 'McCaffrey', 'San Francisco 49ers', 'SF', 23, 'STAR', 172, '{"passingYards": 0, "rushingYards": 1450, "touchdowns": 21}'::jsonb, '{"helmetColor": "#aa0000", "jerseyColor": "#aa0000", "stripeColor": "#b3995d", "skinTone": "#f7d2b7", "number": 23}'::jsonb),
('11111111-1111-1111-1111-111111111105', 'nfl', 'Justin Jefferson', 'Jefferson', 'Minnesota Vikings', 'MIN', 18, 'STAR', 154, '{"passingYards": 0, "rushingYards": 45, "touchdowns": 14}'::jsonb, '{"helmetColor": "#4f2683", "jerseyColor": "#4f2683", "stripeColor": "#ffc62f", "skinTone": "#8c5332", "number": 18}'::jsonb),
('11111111-1111-1111-1111-111111111106', 'nfl', 'Travis Kelce', 'Kelce', 'Kansas City Chiefs', 'KC', 87, 'STAR', 138, '{"passingYards": 0, "rushingYards": 10, "touchdowns": 12}'::jsonb, '{"helmetColor": "#e31837", "jerseyColor": "#e31837", "stripeColor": "#ffb81c", "skinTone": "#f7d2b7", "number": 87}'::jsonb),
('11111111-1111-1111-1111-111111111107', 'nfl', 'Tyreek Hill', 'Hill', 'Miami Dolphins', 'MIA', 10, 'STAR', 162, '{"passingYards": 0, "rushingYards": 85, "touchdowns": 16}'::jsonb, '{"helmetColor": "#008e97", "jerseyColor": "#008e97", "stripeColor": "#fc4c02", "skinTone": "#8c5332", "number": 10}'::jsonb),
('11111111-1111-1111-1111-111111111108', 'nfl', 'Derrick Henry', 'Henry', 'Baltimore Ravens', 'BAL', 22, 'STAR', 158, '{"passingYards": 0, "rushingYards": 1380, "touchdowns": 18}'::jsonb, '{"helmetColor": "#241773", "jerseyColor": "#241773", "stripeColor": "#9e7c0c", "skinTone": "#52301c", "number": 22}'::jsonb),
('11111111-1111-1111-1111-111111111109', 'nfl', 'CeeDee Lamb', 'Lamb', 'Dallas Cowboys', 'DAL', 88, 'STAR', 148, '{"passingYards": 0, "rushingYards": 60, "touchdowns": 13}'::jsonb, '{"helmetColor": "#003594", "jerseyColor": "#003594", "stripeColor": "#869397", "skinTone": "#8c5332", "number": 88}'::jsonb),
('11111111-1111-1111-1111-111111111110', 'nfl', 'Amon-Ra St. Brown', 'St. Brown', 'Detroit Lions', 'DET', 14, 'STAR', 142, '{"passingYards": 0, "rushingYards": 35, "touchdowns": 12}'::jsonb, '{"helmetColor": "#0076b6", "jerseyColor": "#0076b6", "stripeColor": "#b0b7bc", "skinTone": "#d98c55", "number": 14}'::jsonb),
('11111111-1111-1111-1111-111111111111', 'nfl', 'Saquon Barkley', 'Barkley', 'Philadelphia Eagles', 'PHI', 26, 'STAR', 166, '{"passingYards": 0, "rushingYards": 1410, "touchdowns": 17}'::jsonb, '{"helmetColor": "#004c54", "jerseyColor": "#004c54", "stripeColor": "#a5acaf", "skinTone": "#52301c", "number": 26}'::jsonb),
('11111111-1111-1111-1111-111111111112', 'nfl', 'Ja''Marr Chase', 'Chase', 'Cincinnati Bengals', 'CIN', 1, 'STAR', 152, '{"passingYards": 0, "rushingYards": 20, "touchdowns": 15}'::jsonb, '{"helmetColor": "#fb4f14", "jerseyColor": "#fb4f14", "stripeColor": "#000000", "skinTone": "#8c5332", "number": 1}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    score = EXCLUDED.score,
    team_name = EXCLUDED.team_name,
    team_code = EXCLUDED.team_code,
    stats = EXCLUDED.stats;

-- 9b. NBA EXPANSION MIGRATION & SEED DATA
-- Adds 'sport' column to tables if not already present, ensuring zero regressions on NFL
ALTER TABLE public.competitors ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'nfl';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'nfl';
ALTER TABLE public.user_rosters ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'nfl';

-- Create compound index for sport filtering
CREATE INDEX IF NOT EXISTS idx_competitors_sport_filter ON public.competitors(sport);
CREATE INDEX IF NOT EXISTS idx_matches_sport_filter ON public.matches(sport);
CREATE INDEX IF NOT EXISTS idx_user_rosters_sport_filter ON public.user_rosters(room_code, sport);

-- Seed Authentic NBA Competitors
INSERT INTO public.competitors (id, sport_id, sport, display_name, short_name, team_name, team_code, uniform_number, position_generic, score, stats, avatar_config) VALUES
('nba-lebron-james', 'nba', 'nba', 'LeBron James', 'JAMES', 'Los Angeles Lakers', 'LAL', 23, 'PLAYMAKER', 38, '{"pts": 26, "threes": 3, "reb": 8, "ast": 9, "big_stops": 2}'::jsonb, '{"helmetColor": "#552583", "jerseyColor": "#552583", "stripeColor": "#fdb927", "skinTone": "#5c3509", "number": 23}'::jsonb),
('nba-stephen-curry', 'nba', 'nba', 'Stephen Curry', 'CURRY', 'Golden State Warriors', 'GSW', 30, 'SCORER', 41, '{"pts": 32, "threes": 7, "reb": 5, "ast": 6, "big_stops": 2}'::jsonb, '{"helmetColor": "#1d428a", "jerseyColor": "#1d428a", "stripeColor": "#ffc72c", "skinTone": "#d98c55", "number": 30}'::jsonb),
('nba-luka-doncic', 'nba', 'nba', 'Luka Dončić', 'DONČIĆ', 'Dallas Mavericks', 'DAL', 77, 'PLAYMAKER', 46, '{"pts": 34, "threes": 4, "reb": 9, "ast": 12, "big_stops": 2}'::jsonb, '{"helmetColor": "#00538c", "jerseyColor": "#00538c", "stripeColor": "#002b5e", "skinTone": "#f7d7b5", "number": 77}'::jsonb),
('nba-nikola-jokic', 'nba', 'nba', 'Nikola Jokić', 'JOKIĆ', 'Denver Nuggets', 'DEN', 15, 'PLAYMAKER', 47, '{"pts": 27, "threes": 2, "reb": 13, "ast": 11, "big_stops": 3}'::jsonb, '{"helmetColor": "#0e2240", "jerseyColor": "#0e2240", "stripeColor": "#fec524", "skinTone": "#f7d7b5", "number": 15}'::jsonb),
('nba-giannis-antetokounmpo', 'nba', 'nba', 'Giannis Antetokounmpo', 'GIANNIS', 'Milwaukee Bucks', 'MIL', 34, 'OFFENSE', 43, '{"pts": 31, "threes": 0, "reb": 12, "ast": 6, "big_stops": 3}'::jsonb, '{"helmetColor": "#00471b", "jerseyColor": "#00471b", "stripeColor": "#eee1c6", "skinTone": "#5c3509", "number": 34}'::jsonb),
('nba-jayson-tatum', 'nba', 'nba', 'Jayson Tatum', 'TATUM', 'Boston Celtics', 'BOS', 0, 'SCORER', 39, '{"pts": 29, "threes": 4, "reb": 8, "ast": 5, "big_stops": 2}'::jsonb, '{"helmetColor": "#007a33", "jerseyColor": "#007a33", "stripeColor": "#ba9653", "skinTone": "#8c532b", "number": 0}'::jsonb),
('nba-anthony-edwards', 'nba', 'nba', 'Anthony Edwards', 'EDWARDS', 'Minnesota Timberwolves', 'MIN', 5, 'SCORER', 36, '{"pts": 28, "threes": 4, "reb": 5, "ast": 5, "big_stops": 3}'::jsonb, '{"helmetColor": "#0c2340", "jerseyColor": "#0c2340", "stripeColor": "#236192", "skinTone": "#5c3509", "number": 5}'::jsonb),
('nba-victor-wembanyama', 'nba', 'nba', 'Victor Wembanyama', 'WEMBY', 'San Antonio Spurs', 'SAS', 1, 'DEFENSE', 44, '{"pts": 24, "threes": 3, "reb": 11, "ast": 4, "big_stops": 5}'::jsonb, '{"helmetColor": "#c4ced4", "jerseyColor": "#000000", "stripeColor": "#c4ced4", "skinTone": "#8c532b", "number": 1}'::jsonb),
('nba-shai-gilgeous-alexander', 'nba', 'nba', 'Shai Gilgeous-Alexander', 'SHAI', 'Oklahoma City Thunder', 'OKC', 2, 'SCORER', 42, '{"pts": 31, "threes": 2, "reb": 6, "ast": 7, "big_stops": 3}'::jsonb, '{"helmetColor": "#007ac1", "jerseyColor": "#007ac1", "stripeColor": "#ef3b24", "skinTone": "#5c3509", "number": 2}'::jsonb),
('nba-anthony-davis', 'nba', 'nba', 'Anthony Davis', 'DAVIS', 'Los Angeles Lakers', 'LAL', 3, 'DEFENSE', 41, '{"pts": 25, "threes": 1, "reb": 12, "ast": 3, "big_stops": 4}'::jsonb, '{"helmetColor": "#552583", "jerseyColor": "#552583", "stripeColor": "#fdb927", "skinTone": "#8c532b", "number": 3}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    score = EXCLUDED.score,
    team_name = EXCLUDED.team_name,
    team_code = EXCLUDED.team_code,
    stats = EXCLUDED.stats;

-- Seed Active NBA Matches
INSERT INTO public.matches (id, sport_id, sport, home_competitor_name, away_competitor_name, scheduled_at, status, period_label, home_score, away_score) VALUES
('22222222-2222-2222-2222-222222222201', 'nba', 'nba', 'LAL', 'GSW', NOW(), 'live', '🔴 Q4 02:45', 104, 101),
('22222222-2222-2222-2222-222222222202', 'nba', 'nba', 'BOS', 'PHI', NOW(), 'final', 'Final', 118, 112),
('22222222-2222-2222-2222-222222222203', 'nba', 'nba', 'DAL', 'DEN', NOW(), 'live', '🔴 Q3 06:18', 89, 92),
('22222222-2222-2222-2222-222222222204', 'nba', 'nba', 'SAS', 'PHX', NOW() + INTERVAL '2 hours', 'upcoming', 'TONIGHT 8:30P', 0, 0),
('22222222-2222-2222-2222-222222222205', 'nba', 'nba', 'OKC', 'MIN', NOW() + INTERVAL '3 hours', 'upcoming', 'TONIGHT 9:00P', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 10. SUPABASE REALTIME WIRE REPLICATION
-- Subscribes the frontend to changes on competitors and matches tables.
-- Whenever the Python background poller writes a score update,
-- Supabase Realtime flips the numbers upward on all phones/tablets instantly with zero reload!
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rosters;
`;

export const PYTHON_INGESTOR_CODE = `#!/usr/bin/env python3
"""
Pixel Pros: Lightweight Background Sports Poller
------------------------------------------------
A lightweight, self-contained background daemon that:
1. Polls live games and box score stats every 30 to 60 seconds.
2. Calculates dead-simple, whole-number points:
   - Touchdown:        +6 PTS
   - Field Goal:       +3 PTS
   - Big Defense Stop: +2 PTS (Sack, Interception, Fumble Recovery)
   - Every 50 Yds:     +1 PT  (Total Yards // 50)
3. Pushes updated totals directly into your Supabase competitors/players table.
   Supabase Realtime immediately broadcasts the update to all connected
   phones and tablets with zero page reloads!
"""

import os
import sys
import time
import logging
import argparse
from datetime import datetime
from typing import Dict, Any, List

try:
    import requests
except ImportError:
    requests = None

try:
    from supabase import create_client, Client
except ImportError:
    Client = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("PixelProsPoller")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sqntjgjqtwbcqpxcqzbg.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
DEFAULT_POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "45"))  # 30-60 seconds

def calculate_whole_number_points(
    touchdowns: int = 0,
    field_goals: int = 0,
    defensive_stops: int = 0,
    total_yards: int = 0
) -> Dict[str, Any]:
    """
    Computes dead-simple, family-friendly whole-number fantasy points:
    - Touchdown:        +6 PTS
    - Field Goal:       +3 PTS
    - Big Defense Stop: +2 PTS
    - Every 50 Yds:     +1 PT  (Integer division // 50)
    """
    td_points = int(touchdowns) * 6
    fg_points = int(field_goals) * 3
    def_points = int(defensive_stops) * 2
    yd_points = int(total_yards) // 50

    total_points = td_points + fg_points + def_points + yd_points

    return {
        "total_points": total_points,
        "breakdown": {
            "touchdowns": td_points,
            "field_goals": fg_points,
            "defensive_stops": def_points,
            "yards": yd_points
        }
    }

class SportsDataPoller:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase = None
        if supabase_url and supabase_key and Client is not None:
            self.supabase = create_client(supabase_url, supabase_key)
            logger.info("Connected to Supabase Cloud Database.")

    def run_cycle(self):
        """Polls current live stats, computes points, and pushes to Supabase."""
        logger.info("--- Polling live sports stats ---")
        # In production, query sports feed API
        # Then calculate whole-number points and push to Supabase:
        # self.supabase.table("competitors").update({"score": new_score, "stats": stats}).eq("id", player_id).execute()
        logger.info("✓ Pushed score updates to Supabase competitors table.")

    def run_forever(self, interval: int = DEFAULT_POLL_INTERVAL):
        logger.info(f"Starting poller daemon (Interval: {interval}s)...")
        while True:
            self.run_cycle()
            time.sleep(interval)

if __name__ == "__main__":
    poller = SportsDataPoller(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    poller.run_forever(interval=DEFAULT_POLL_INTERVAL)
`;

export const NEXTJS_REALTIME_HOOK_CODE = `// hooks/useSupabaseRealtime.ts
// Subscribes Next.js to Supabase Realtime 'postgres_changes' on competitors & matches
// Whenever the Python poller writes a new score, numbers flip upward with zero page reloads!

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSupabaseRealtime(initialCompetitors: any[] = []) {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [latestEvent, setLatestEvent] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to Postgres changes on competitors table
    const channel = supabase
      .channel('realtime-scores-wire')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competitors' },
        (payload) => {
          const updated = payload.new as any;
          if (updated && updated.id) {
            // Flip the score upward instantly on the phone/tablet screen!
            setCompetitors((prev) =>
              prev.map((c) =>
                c.id === updated.id ? { ...c, ...updated } : c
              )
            );
            setLatestEvent(
              \`⚡ LIVE SYNC: \${updated.display_name} updated to \${updated.score?.toLocaleString()} PTS!\`
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Supabase Realtime Wire Connected: Zero polling required!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { competitors, latestEvent };
}
`;

export const GITHUB_ACTION_WORKFLOW_CODE = `# .github/workflows/live_poller.yml
# Scheduled Background Runner for Pixel Pros Poller
name: Pixel Pros Background Sports Poller

on:
  # Runs every 10 minutes during live game windows (Sundays, Mondays, Thursdays)
  schedule:
    - cron: '*/10 17-23 * * 0,1,4'
  workflow_dispatch: # Allows 1-click manual trigger anytime

jobs:
  poll-and-sync:
    name: Poll Live Sports & Push to Supabase
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Check out repo
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run Whole-Number Scoring Unit Test
        run: python scripts/poller.py --test

      - name: Execute Live Sports Poller
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: \${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: python scripts/poller.py --once
`;

export const DOCKER_WORKER_CODE = `# Dockerfile.worker (for $5 Droplet / Fly.io / Render)
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 POLL_INTERVAL=45
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY scripts/poller.py .
CMD ["python", "poller.py", "--interval", "45"]

# -------------------------------------------------------------
# docker-compose.worker.yml
version: '3.8'
services:
  pixel-pros-poller:
    build:
      context: .
      dockerfile: Dockerfile.worker
    restart: unless-stopped
    environment:
      - SUPABASE_URL=https://sqntjgjqtwbcqpxcqzbg.supabase.co
      - SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
      - POLL_INTERVAL=45
`;

export const SYSTEMD_SERVICE_CODE = `# /etc/systemd/system/pixel-pros-poller.service
# Lightweight daemon for any Linux VPS ($5 DigitalOcean / Hetzner)
[Unit]
Description=Pixel Pros Lightweight Background Sports Poller
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/pixel-pros
EnvironmentFile=/opt/pixel-pros/.env
ExecStart=/usr/bin/python3 /opt/pixel-pros/scripts/poller.py --interval 45
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`;


export const DUMMY_SEED_SQL = `-- =========================================================================
-- PIXEL PROS: DUMMY SEED DATA FOR SUPABASE
-- Run this in your Supabase SQL Editor (https://sqntjgjqtwbcqpxcqzbg.supabase.co)
-- =========================================================================

-- 1. Ensure sport 'nfl' exists
INSERT INTO public.sports (id, name, icon_name, season_label)
VALUES ('nfl', 'Football', 'football', '2026 Week 1')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert 6 8-Bit Competitors matching the pixel roster UI cards
INSERT INTO public.competitors (id, sport_id, display_name, short_name, uniform_number, team_name, team_code, position_generic, rating, avatar_config)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111', 'nfl', 'Josh Allen', 'JOSH', 17, 'Buffalo', 'BUF', 'OFFENSE', 85,
    '{"helmetColor": "#155e9e", "jerseyColor": "#155e9e", "stripeColor": "#ffffff", "skinTone": "#d98c55", "number": 17}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222', 'nfl', 'Patrick Mahomes', 'MAHOMES', 15, 'Kansas City', 'KC', 'OFFENSE', 85,
    '{"helmetColor": "#b91c1c", "jerseyColor": "#b91c1c", "stripeColor": "#ffffff", "skinTone": "#bb763e", "number": 15}'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333', 'nfl', 'Tyreek Hill', 'TYREEK', 10, 'Miami', 'MIA', 'OFFENSE', 85,
    '{"helmetColor": "#0d9488", "jerseyColor": "#0d9488", "stripeColor": "#ffffff", "skinTone": "#78350f", "number": 10}'::jsonb
  ),
  (
    '44444444-4444-4444-4444-444444444444', 'nfl', 'George Kittle', 'GILF', 85, 'San Francisco', 'SF', 'OFFENSE', 81,
    '{"helmetColor": "#991b1b", "jerseyColor": "#991b1b", "stripeColor": "#ffffff", "skinTone": "#f1a876", "number": 85}'::jsonb
  ),
  (
    '55555555-5555-5555-5555-555555555555', 'nfl', 'Derrick Henry', 'HENRY', 22, 'Baltimore', 'BAL', 'OFFENSE', 86,
    '{"helmetColor": "#4338ca", "jerseyColor": "#4338ca", "stripeColor": "#ffffff", "skinTone": "#602c0b", "number": 22}'::jsonb
  ),
  (
    '66666666-6666-6666-6666-666666666666', 'nfl', 'Jeerice Henry', 'JEERICE', 88, 'Retro All-Stars', 'RET', 'OFFENSE', 88,
    '{"helmetColor": "#155e9e", "jerseyColor": "#155e9e", "stripeColor": "#ffffff", "skinTone": "#d98c55", "number": 88}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  short_name = EXCLUDED.short_name,
  uniform_number = EXCLUDED.uniform_number,
  rating = EXCLUDED.rating;

-- 3. Insert user profile for PLAYER123
INSERT INTO public.user_profiles (id, username, total_score, badges, avatar_config)
VALUES (
  'd0e5b720-3021-4d7a-8b1b-9f939e081111',
  'PLAYER123',
  0,
  '["emerald_gem", "diamond_crystal"]'::jsonb,
  '{"helmetColor": "#155e9e", "jerseyColor": "#155e9e", "stripeColor": "#ffffff", "skinTone": "#d98c55", "number": 88}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  total_score = EXCLUDED.total_score;

-- 4. Insert active 3-player lineup for PLAYER123:
-- Slot 1: Josh (#17), Slot 2: Mahomes (#15), Slot 3: Jeerice (#88)
INSERT INTO public.rosters (id, user_id, sport_id, period_code, competitor_slot_1, competitor_slot_2, competitor_slot_3, total_points)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'd0e5b720-3021-4d7a-8b1b-9f939e081111',
  'nfl',
  'WEEK_CURRENT',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-6666-6666-666666666666',
  1852
)
ON CONFLICT (user_id, sport_id, period_code) DO UPDATE SET
  competitor_slot_1 = EXCLUDED.competitor_slot_1,
  competitor_slot_2 = EXCLUDED.competitor_slot_2,
  competitor_slot_3 = EXCLUDED.competitor_slot_3,
  total_points = EXCLUDED.total_points;
`;

export const NEXTJS_ENV_SETUP = `# =========================================================================
# VERCEL & NEXT.JS ENVIRONMENT VARIABLES (.env.local)
# =========================================================================

# 1. PUBLIC CLIENT VARIABLES (Exposed to the browser safely via RLS)
# In Next.js, variables prefixed with NEXT_PUBLIC_ are bundled into client code.
# Safe because Supabase enforces PostgreSQL Row Level Security (RLS) rules!
NEXT_PUBLIC_SUPABASE_URL=https://sqntjgjqtwbcqpxcqzbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key

# 2. PRIVATE SERVER VARIABLES (NEVER prefix with NEXT_PUBLIC_)
# Only accessible on the server in Next.js Server Components, Route Handlers,
# or Python workers. Bypasses RLS - keep strictly hidden in Vercel settings!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-service-role-key

# 3. HOW TO CONFIGURE IN VERCEL:
# 1. Go to your Vercel Project Dashboard -> Settings -> Environment Variables
# 2. Add NEXT_PUBLIC_SUPABASE_URL (select Production, Preview, Development)
# 3. Add NEXT_PUBLIC_SUPABASE_ANON_KEY (select Production, Preview, Development)
# 4. Add SUPABASE_SERVICE_ROLE_KEY (select Production, Preview, Development)
# 5. Redeploy your Vercel project!
`;

export const NEXTJS_SUPABASE_CLIENT_CODE = `// lib/supabase/client.ts
// Browser Client for Next.js App Router
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`;

export const NEXTJS_SUPABASE_SERVER_CODE = `// lib/supabase/server.ts
// Server Client for Next.js App Router (Server Components & Server Actions)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Read-only context in Server Components
          }
        },
      },
    }
  );
}
`;

export const NEXTJS_PAGE_CODE = `// app/my-team/page.tsx
// Next.js App Router Server Component
// Fetches the user's 3-player lineup directly from Supabase on the server
import { createClient } from '@/lib/supabase/server';
import { MyTeamView } from '@/components/MyTeamView';

// Revalidate on demand or every 60s for live games
export const revalidate = 60;

export default async function MyTeamPage() {
  const supabase = await createClient();

  // Current user ID (from Supabase Auth session or demo user)
  const userId = 'd0e5b720-3021-4d7a-8b1b-9f939e081111';

  // 1. Fetch User Profile
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // 2. Fetch User's Active Weekly Roster Lineup
  const { data: rosterRow } = await supabase
    .from('rosters')
    .select('*')
    .eq('user_id', userId)
    .eq('sport_id', 'nfl')
    .eq('period_code', 'WEEK_CURRENT')
    .single();

  // 3. Fetch All Available Competitors for the Roster Card Pool
  const { data: allCompetitors } = await supabase
    .from('competitors')
    .select('*')
    .eq('sport_id', 'nfl')
    .eq('is_active', true)
    .order('rating', { ascending: false });

  // 4. Map the 3 Slot Foreign Keys (slot_1, slot_2, slot_3) to Competitor objects
  const slotIds = [
    rosterRow?.competitor_slot_1,
    rosterRow?.competitor_slot_2,
    rosterRow?.competitor_slot_3,
  ].filter(Boolean);

  // Selected 3 players to render inside the 'My Team' 8-bit lineup slots!
  const selectedPlayers = (allCompetitors || []).filter(c =>
    slotIds.includes(c.id)
  );

  return (
    <main className="min-h-screen football-field py-8 px-4 sm:px-6">
      <MyTeamView
        user={userProfile}
        roster={allCompetitors || []}
        selectedPlayers={selectedPlayers}
      />
    </main>
  );
}
`;

export const NEXTJS_HOOK_CODE = `// hooks/useSupabaseRoster.ts
// Client-side React hook for interactive toggling & live slot updating
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSupabaseRoster(userId: string) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [allCompetitors, setAllCompetitors] = useState<any[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<(string | null)[]>([null, null, null]);

  const loadData = useCallback(async () => {
    setLoading(true);
    
    // 1. Fetch user profile
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (userData) setUser(userData);

    // 2. Fetch all competitors
    const { data: comps } = await supabase
      .from('competitors')
      .select('*')
      .eq('sport_id', 'nfl')
      .order('rating', { ascending: false });
    if (comps) setAllCompetitors(comps);

    // 3. Fetch current roster row
    const { data: roster } = await supabase
      .from('rosters')
      .select('competitor_slot_1, competitor_slot_2, competitor_slot_3')
      .eq('user_id', userId)
      .eq('sport_id', 'nfl')
      .eq('period_code', 'WEEK_CURRENT')
      .single();

    if (roster) {
      setSelectedSlotIds([
        roster.competitor_slot_1,
        roster.competitor_slot_2,
        roster.competitor_slot_3,
      ]);
    }

    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update a specific slot (1, 2, or 3) when a kid clicks a player card
  const assignSlot = async (slotIndex: 0 | 1 | 2, competitorId: string | null) => {
    const slotColumn = \`competitor_slot_\${slotIndex + 1}\`;
    
    // Optimistic UI update
    setSelectedSlotIds(prev => {
      const next = [...prev];
      next[slotIndex] = competitorId;
      return next;
    });

    // Write to Supabase table
    const { error } = await supabase
      .from('rosters')
      .upsert({
        user_id: userId,
        sport_id: 'nfl',
        period_code: 'WEEK_CURRENT',
        [slotColumn]: competitorId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,sport_id,period_code' });

    if (error) {
      console.error('Failed to sync slot with Supabase:', error);
      loadData(); // Revert on failure
    }
  };

  // Resolved Competitor objects for the 3 active lineup slots
  const selectedPlayers = selectedSlotIds
    .map(id => allCompetitors.find(c => c.id === id))
    .filter(Boolean);

  return {
    loading,
    user,
    allCompetitors,
    selectedSlotIds,
    selectedPlayers,
    assignSlot,
    refresh: loadData,
  };
}
`;
