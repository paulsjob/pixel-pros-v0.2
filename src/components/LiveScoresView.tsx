import React, { useState } from 'react';
import { Competitor, Match } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { Activity, Flame, ChevronDown, ChevronUp, Wrench, Trophy } from 'lucide-react';
import { formatPlayerInitialLastName, formatTeamPosSubtitle } from '../utils/formatters';
import { getCurrentNFLWeek } from '../lib/espnSync';
import { sortMatchesByKickoffAndStatus } from '../utils/teamData';

interface LiveScoresViewProps {
  matches: Match[];
  competitors: Competitor[];
  onSelectPlayer?: (player: Competitor) => void;
  onSimulatePlay?: (player: Competitor, eventName: string, points: number) => void;
}

// Utility to ensure standard 3-letter retro ticker abbreviation
export function getTeamAbbr(team: string): string {
  if (!team) return 'NFL';
  const clean = team.trim().toUpperCase();
  const knownMap: Record<string, string> = {
    'KANSAS CITY': 'KC',
    'KANSAS CITY CHIEFS': 'KC',
    'CHIEFS': 'KC',
    'KC': 'KC',
    'BUFFALO': 'BUF',
    'BUFFALO BILLS': 'BUF',
    'BILLS': 'BUF',
    'BUF': 'BUF',
    'BALTIMORE': 'BAL',
    'BALTIMORE RAVENS': 'BAL',
    'RAVENS': 'BAL',
    'BAL': 'BAL',
    'DALLAS': 'DAL',
    'DALLAS COWBOYS': 'DAL',
    'COWBOYS': 'DAL',
    'DAL': 'DAL',
    'SAN FRANCISCO': 'SF',
    'SAN FRANCISCO 49ERS': 'SF',
    '49ERS': 'SF',
    'SF': 'SF',
    'PHILADELPHIA': 'PHI',
    'PHILADELPHIA EAGLES': 'PHI',
    'EAGLES': 'PHI',
    'PHI': 'PHI',
    'SEATTLE': 'SEA',
    'SEATTLE SEAHAWKS': 'SEA',
    'SEAHAWKS': 'SEA',
    'SEA': 'SEA',
    'MIAMI': 'MIA',
    'MIAMI DOLPHINS': 'MIA',
    'DOLPHINS': 'MIA',
    'MIA': 'MIA',
    'MINNESOTA': 'MIN',
    'MINNESOTA VIKINGS': 'MIN',
    'VIKINGS': 'MIN',
    'MIN': 'MIN',
    'DETROIT': 'DET',
    'DETROIT LIONS': 'DET',
    'LIONS': 'DET',
    'DET': 'DET',
    'CINCINNATI': 'CIN',
    'CINCINNATI BENGALS': 'CIN',
    'BENGALS': 'CIN',
    'CIN': 'CIN',
    'LOS ANGELES RAMS': 'LAR',
    'RAMS': 'LAR',
    'LAR': 'LAR',
    'HOUSTON': 'HOU',
    'HOUSTON TEXANS': 'HOU',
    'TEXANS': 'HOU',
    'HOU': 'HOU',
    'PITTSBURGH': 'PIT',
    'PITTSBURGH STEELERS': 'PIT',
    'STEELERS': 'PIT',
    'PIT': 'PIT',
    'GREEN BAY': 'GB',
    'PACKERS': 'GB',
    'GB': 'GB',
  };
  if (knownMap[clean]) return knownMap[clean];
  if (clean.length <= 4) return clean;
  const words = clean.split(/\s+/);
  if (words.length > 1) {
    return words.map((w) => w[0]).join('').slice(0, 3);
  }
  return clean.slice(0, 3);
}

export const LiveScoresView: React.FC<LiveScoresViewProps> = ({
  matches = [],
  competitors = [],
  onSelectPlayer,
  onSimulatePlay,
}) => {
  const [showDevTools, setShowDevTools] = useState(false);

  // Automatically sort competitors descending by SCORE limit 20
  const safeCompetitors = Array.isArray(competitors) ? [...competitors] : [];
  const seenCompetitorIds = new Set<string>();
  const dedupedCompetitors = safeCompetitors.filter((c) => {
    if (!c || !c.id) return false;
    if (seenCompetitorIds.has(c.id)) return false;
    seenCompetitorIds.add(c.id);
    return true;
  });
  const sortedCompetitors = dedupedCompetitors
    .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
    .slice(0, 20);
  const currentNFLWeek = getCurrentNFLWeek();
  const safeMatches = sortMatchesByKickoffAndStatus(
    (Array.isArray(matches) ? matches : []).filter((m) => {
      // STRICT FILTER: No games apart from the week that we are on (no past weeks, no future weeks)
      if (m.sportId === 'nfl' && m.week && m.week !== currentNFLWeek) return false;
      return true;
    })
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 box-border space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header matching Leaderboard view */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <Activity size={28} className="text-[#38bdf8] shrink-0 sm:w-8 sm:h-8" />
        <h1 className="font-pixel text-xl sm:text-3xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a] text-center">
          LIVE MATCHES & STATS
        </h1>
      </div>

      {/* Unified Retro Double-Border Cardboard Panel with zero edge overflow */}
      <div className="pixel-box-cream p-3 sm:p-6 rounded-xs space-y-4 sm:space-y-6 box-border w-full overflow-hidden">
        
        {/* Header Banner matching Leaderboard */}
        <div className="text-center pb-2.5 sm:pb-3 border-b-2 border-[#d4a86a]">
          <h2 className="font-pixel text-base sm:text-xl text-[#5c3509] tracking-wider uppercase">
            LIVE MATCHES & STATS
          </h2>
          <div className="font-pixel text-[10px] sm:text-xs text-[#12579b] mt-1 tracking-widest uppercase">
            WEEK {currentNFLWeek} ONLY • LIVE ARCADE WIRE
          </div>
        </div>

        {/* 1. Live Games Section: Connected 100% to Live Matches */}
        <div className="w-full box-border">
          <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-[#b91c1c] rounded-full animate-ping" />
              <h3 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
                ACTIVE GAMES
              </h3>
            </div>
            <span className="font-retro text-[10px] sm:text-[11px] text-[#784610] bg-[#fae9c8] px-2 sm:px-2.5 py-0.5 border border-[#d4a86a] rounded-xs font-semibold">
              LIVE SYNC ACTIVE
            </span>
          </div>

          {safeMatches.length === 0 ? (
            <div className="w-full p-4 sm:p-6 bg-[#ebd2a4] border-3 border-[#c99a57] rounded-xs text-center space-y-1">
              <div className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
                NO LIVE GAMES IN PROGRESS
              </div>
              <div className="font-retro text-[11px] sm:text-xs text-[#784610]">
                Upcoming NFL games will appear dynamically as they kick off.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full box-border">
              {safeMatches.map((match) => {
                const isLive = match.status === 'live';
                const isScheduled = match.status === 'upcoming';
                const homeCode = match.homeTeamCode || getTeamAbbr(match.homeTeam);
                const awayCode = match.awayTeamCode || getTeamAbbr(match.awayTeam);

                return (
                  <div
                    key={match.id}
                    className={`w-full box-border p-3 sm:p-4 rounded-xs flex flex-col justify-between transition-all ${
                      isLive
                        ? 'bg-[#fff7ed] border-4 border-[#b91c1c] shadow-[0_4px_12px_rgba(185,28,28,0.25)] ring-2 ring-red-400/40'
                        : 'bg-[#ebd2a4] border-3 border-[#c99a57] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'
                    }`}
                  >
                    {/* Status Header */}
                    <div className="flex items-center justify-between font-retro text-xs text-[#784610] mb-2">
                      <span className={`flex items-center gap-1.5 font-pixel text-[10px] font-bold ${
                        isLive ? 'text-[#b91c1c]' : 'text-[#12579b]'
                      }`}>
                        {isLive && <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c] inline-block animate-ping" />}
                        {isLive ? '🔴 LIVE NOW' : isScheduled ? 'UPCOMING' : match.status.toUpperCase()}
                      </span>
                      <span className={`font-pixel text-[10px] px-2 py-0.5 border rounded-xs ${
                        isLive ? 'bg-[#fee2e2] text-[#991b1b] border-[#f87171] font-bold' : 'bg-[#fae9c8] text-[#5c3509] border-[#d4a86a]'
                      }`}>
                        {match.periodLabel || (isLive ? 'LIVE' : 'WEEK 2')}
                      </span>
                    </div>

                    {/* Away @ Home Scoreboard */}
                    <div className="flex items-center justify-between gap-2 py-2 px-1 w-full box-border">
                      {/* Away Team (e.g. DET) */}
                      <div className="w-16 sm:w-20 text-center shrink-0">
                        <div className="font-retro text-[9px] text-[#784610] uppercase tracking-wider">AWAY</div>
                        <span className="font-pixel text-base sm:text-xl text-[#5c3509] tracking-wider font-bold">
                          {awayCode}
                        </span>
                        {isLive || match.status === 'final' ? (
                          <div className="font-pixel text-sm sm:text-base text-[#12579b] font-bold">
                            {match.awayScore ?? 0}
                          </div>
                        ) : null}
                      </div>

                      {/* Centered Display: Kickoff time or @ indicator */}
                      <div className="flex-1 flex flex-col justify-center items-center px-1">
                        <span className="font-pixel text-xs sm:text-sm text-[#784610] opacity-80 font-bold mb-0.5">
                          @
                        </span>
                        {isScheduled ? (
                          <div className="px-2 sm:px-3 py-1 bg-[#fae9c8] border border-[#c99a57] rounded-xs font-pixel text-[10px] text-[#5c3509] tracking-wider font-bold whitespace-nowrap shadow-xs">
                            {match.periodLabel || '1:00 PM'}
                          </div>
                        ) : (
                          <div className="px-2.5 sm:px-3.5 py-1 bg-[#fee2e2] border border-[#b91c1c] rounded-xs font-pixel text-[10px] sm:text-xs text-[#b91c1c] tracking-widest font-bold whitespace-nowrap animate-pulse">
                            {match.periodLabel || 'IN PROGRESS'}
                          </div>
                        )}
                      </div>

                      {/* Home Team (e.g. BUF) */}
                      <div className="w-16 sm:w-20 text-center shrink-0">
                        <div className="font-retro text-[9px] text-[#784610] uppercase tracking-wider">HOME</div>
                        <span className="font-pixel text-base sm:text-xl text-[#5c3509] tracking-wider font-bold">
                          {homeCode}
                        </span>
                        {isLive || match.status === 'final' ? (
                          <div className="font-pixel text-sm sm:text-base text-[#12579b] font-bold">
                            {match.homeScore ?? 0}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Live Play Event */}
                    {match.recentEvent && (
                      <div className="mt-2.5 text-xs font-retro text-[#78350f] bg-[#fae9c8] p-2 border border-[#d4a86a] rounded-xs flex items-center gap-2">
                        <Flame size={14} className="text-[#d97706] shrink-0" />
                        <span className="leading-tight text-[11px] sm:text-xs truncate">{match.recentEvent}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Standings Section: Strictly single-line header on any mobile screen */}
        <div className="w-full box-border">
          <div className="flex items-center justify-between w-full pb-2 mb-2 sm:mb-3 border-t-2 border-[#d4a86a] pt-3 sm:pt-4">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Trophy size={16} className="text-[#b45309] sm:w-[18px] sm:h-[18px] shrink-0" />
              <h3 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase whitespace-nowrap">
                <span className="hidden sm:inline">PLAYER </span>STANDINGS
              </h3>
            </div>
            <span className="font-pixel text-[10px] sm:text-xs text-[#784610] bg-[#fae9c8] px-2 sm:px-2.5 py-0.5 border border-[#d4a86a] rounded-xs whitespace-nowrap shrink-0">
              TOP 20 SCORES
            </span>
          </div>

          {/* Clean 2-Column Table: Zero horizontal scrollbar on mobile or desktop */}
          <div className="w-full box-border border-3 border-[#c99a57] rounded-xs overflow-hidden bg-[#ebd2a4]">
            <table className="w-full text-left font-retro text-xs sm:text-sm border-collapse table-fixed">
              <thead className="bg-[#dfbe89] font-pixel text-[10px] sm:text-xs text-[#5c3509] border-b-2 border-[#c99a57]">
                <tr>
                  <th className="py-2.5 px-2 sm:px-3 text-left">PLAYER</th>
                  <th className="py-2.5 px-2 sm:px-3 text-right w-28 sm:w-36 shrink-0 whitespace-nowrap">SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4a86a]">
                {sortedCompetitors.map((player, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  const teamAbbr = player.teamCode || getTeamAbbr(player.teamName);
                  const formattedName = formatPlayerInitialLastName(player.displayName);
                  const teamPosSubtitle = formatTeamPosSubtitle(teamAbbr, player.position || player.positionGeneric);

                  return (
                    <tr
                      key={player.id || `${player.displayName}_${index}`}
                      onClick={() => onSelectPlayer && onSelectPlayer(player)}
                      className="hover:bg-[#fae9c8] cursor-pointer transition-colors"
                    >
                      {/* Column 1: PLAYER (Takes remaining space, flex-1 min-w-0 pr-2, truncate player name) */}
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                          {/* Rank Badge */}
                          <span
                            className={`shrink-0 font-pixel text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-xs border text-center min-w-[24px] sm:min-w-[26px] ${
                              rank === 1
                                ? 'bg-[#fbbf24] text-[#78350f] border-[#b45309] font-bold shadow-xs'
                                : rank === 2
                                ? 'bg-[#e2e8f0] text-[#334155] border-[#94a3b8] font-bold'
                                : rank === 3
                                ? 'bg-[#fed7aa] text-[#7c2d12] border-[#ea580c] font-bold'
                                : 'text-[#784610] border-transparent font-pixel'
                            }`}
                          >
                            #{rank}
                          </span>

                          {/* Pixel Avatar Sprite */}
                          <div className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center bg-[#fae9c8] border border-[#c99a57] rounded-xs overflow-hidden">
                            <PixelPlayerSprite
                              avatar={player.avatar}
                              number={player.uniformNumber}
                              size={22}
                            />
                          </div>

                          {/* Player Name ("P. Mahomes") + Subtitle ("[TEAM] · [POS]") */}
                          <div className="min-w-0 flex-1">
                            <span className="font-pixel text-[11px] sm:text-xs text-[#5c3509] block leading-tight truncate">
                              {formattedName}
                            </span>
                            <span className="text-[10px] text-[#784610] font-retro block leading-tight truncate mt-0.5">
                              {teamPosSubtitle} • #{player.uniformNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: SCORE (flex-shrink-0 whitespace-nowrap, solid comfortable fit, right-aligned) */}
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right shrink-0 whitespace-nowrap w-28 sm:w-36">
                        <span
                          className={`inline-block font-pixel text-xs sm:text-sm px-2 sm:px-2.5 py-1 border-2 rounded-xs shadow-xs whitespace-nowrap shrink-0 ${
                            isTopThree
                              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] font-bold'
                              : 'bg-[#fae9c8] text-[#12579b] border-[#c99a57] font-bold'
                          }`}
                        >
                          {(player.score ?? 0).toLocaleString()} PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Developer Sandbox Drawer for Simulating Scoring Plays */}
        {onSimulatePlay && (
          <div className="pt-2 border-t border-[#d4a86a]/60">
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className="touch-manipulation text-[11px] font-pixel text-[#784610] hover:text-[#5c3509] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench size={13} />
              <span>TEST LIVE SCORING TRIGGERS</span>
              {showDevTools ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showDevTools && (
              <div className="mt-3 p-3 bg-[#ebd2a4] border-2 border-[#c99a57] rounded-xs space-y-2">
                <div className="text-[10px] font-retro text-[#784610]">
                  Tap a trigger to simulate a real-time event write:
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const p = sortedCompetitors[0] || competitors[0];
                      if (p) onSimulatePlay(p, 'TOUCHDOWN PASS (+6 PTS)', 6);
                    }}
                    className="touch-manipulation px-2.5 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-pixel text-[10px] rounded-xs border border-[#14532d] cursor-pointer active:translate-y-0.5"
                  >
                    +6 TD PLAY
                  </button>
                  <button
                    onClick={() => {
                      const p = sortedCompetitors[1] || competitors[0];
                      if (p) onSimulatePlay(p, '50+ YARDS DRIVE (+1 PT)', 1);
                    }}
                    className="touch-manipulation px-2.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-pixel text-[10px] rounded-xs border border-[#1e40af] cursor-pointer active:translate-y-0.5"
                  >
                    +1 50-YD PLAY
                  </button>
                  <button
                    onClick={() => {
                      const p = sortedCompetitors[2] || competitors[0];
                      if (p) onSimulatePlay(p, '48 YD FIELD GOAL (+3 PTS)', 3);
                    }}
                    className="touch-manipulation px-2.5 py-1.5 bg-[#ca8a04] hover:bg-[#a16207] text-white font-pixel text-[10px] rounded-xs border border-[#713f12] cursor-pointer active:translate-y-0.5"
                  >
                    +3 FIELD GOAL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
