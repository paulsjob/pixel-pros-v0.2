import React from 'react';
import { Competitor, Match } from '../types';
import { LIVE_MATCHES } from '../data/mockData';
import { X, Trophy, Activity, Zap } from 'lucide-react';

interface StatsMatchesModalProps {
  roster: Competitor[];
  onClose: () => void;
  onSimulatePlay: (competitor: Competitor, eventName: string, points: number) => void;
}

export const StatsMatchesModal: React.FC<StatsMatchesModalProps> = ({
  roster,
  onClose,
  onSimulatePlay,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-md md:max-w-2xl bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-4 sm:p-6 rounded-xs text-[#5c3509] my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-[#e2ba7d] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={22} className="text-[#b45309]" />
            <h2 className="font-pixel text-sm sm:text-lg text-[#5c3509] tracking-wider">
              LIVE STATS & MATCHES
            </h2>
          </div>
          <button
            onClick={onClose}
            className="touch-manipulation w-8 h-8 bg-[#b91c1c] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5"
            title="Close"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Live Games Section: Guarantees single-line match score line */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-[#12579b]" />
            <span className="font-pixel text-xs text-[#12579b]">LIVE MATCHES FEED (LIVE SYNC)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LIVE_MATCHES.map((match) => (
              <div
                key={match.id}
                className="bg-[#ebd2a4] border-2 border-[#c99a57] p-3 rounded-xs"
              >
                <div className="flex items-center justify-between font-retro text-[10px] text-[#784610] mb-1.5">
                  <span className="flex items-center gap-1 font-pixel text-[9px] text-[#b91c1c] animate-pulse">
                    ● {match.status.toUpperCase()}
                  </span>
                  <span className="font-retro">{match.periodLabel}</span>
                </div>

                {/* Score Line: single horizontal row that never breaks */}
                <div className="flex items-center justify-between gap-1.5 font-pixel text-[11px] sm:text-xs text-[#5c3509] my-2 whitespace-nowrap">
                  <span className="truncate flex-1 text-left font-bold" title={match.homeTeam}>
                    {match.homeTeam}
                  </span>
                  <span className="text-xs sm:text-sm text-[#12579b] px-2 py-0.5 bg-[#fae9c8] border border-[#d4a86a] rounded-xs shrink-0 font-pixel tracking-wider shadow-xs">
                    {match.homeScore} - {match.awayScore}
                  </span>
                  <span className="truncate flex-1 text-right font-bold" title={match.awayTeam}>
                    {match.awayTeam}
                  </span>
                </div>

                {match.recentEvent && (
                  <div className="text-[10px] font-retro text-[#b45309] bg-[#fae9c8] p-1.5 border border-[#d4a86a] mt-1.5 rounded-xs">
                    ⚡ {match.recentEvent}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Play Simulator for Kids */}
        <div className="mb-5 p-3.5 sm:p-4 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={16} className="text-[#b45309]" />
            <span className="font-pixel text-[11px] sm:text-xs text-[#5c3509]">
              QUICK TEST: SIMULATE A LIVE PLAY (+6 PTS)
            </span>
          </div>
          <p className="font-retro text-xs text-[#784610] mb-3">
            Click to trigger a touchdown for any player and watch their whole-number fantasy points update in real-time!
          </p>
          <div className="flex flex-wrap gap-2">
            {roster.map((player, idx) => (
              <button
                key={player.id || `${player.displayName}_${idx}`}
                onClick={() => onSimulatePlay(player, 'Touchdown', 6)}
                className="touch-manipulation px-2.5 sm:px-3 py-1.5 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-[10px] border-2 border-[#0a2d52] cursor-pointer shadow-[0_2px_0_0_#051a30] active:translate-y-0.5 active:shadow-none transition-all"
              >
                +6 TD for {player.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Full Player Leaderboard Stats */}
        <div>
          <span className="font-pixel text-xs text-[#12579b] block mb-2">
            PLAYER STATS TABLE
          </span>
          <div className="border-2 border-[#c99a57] overflow-x-auto">
            <table className="w-full text-left font-retro text-xs whitespace-nowrap">
              <thead className="bg-[#ebd2a4] font-pixel text-[10px] text-[#5c3509] border-b-2 border-[#c99a57]">
                <tr>
                  <th className="p-2">PLAYER</th>
                  <th className="p-2">PASS YDS</th>
                  <th className="p-2">RUSH YDS</th>
                  <th className="p-2">TDS</th>
                  <th className="p-2 text-right">SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebd2a4]">
                {roster.map((player, idx) => (
                  <tr key={player.id || `${player.displayName}_${idx}`} className="hover:bg-[#fae9c8]">
                    <td className="p-2 font-pixel text-[10px] text-[#5c3509]">
                      {player.shortName} (#{player.uniformNumber})
                    </td>
                    <td className="p-2 text-[#784610]">{(player.stats?.passingYards ?? player.stats?.pass_yds ?? 0).toLocaleString()}</td>
                    <td className="p-2 text-[#784610]">{(player.stats?.rushingYards ?? player.stats?.rush_yds ?? 0).toLocaleString()}</td>
                    <td className="p-2 text-[#b45309] font-bold">{player.stats?.touchdowns ?? player.stats?.tds ?? 0}</td>
                    <td className="p-2 text-right font-pixel text-[10px] text-[#12579b]">
                      {player.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
