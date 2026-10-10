import React from 'react';
import { SportId } from '../types';

interface ScoringTile {
  title: string;
  points: string;
  desc: string;
  icon: string;
  badgeColor: string;
}

interface SimpleRulesViewProps {
  sport?: SportId;
}

export const SimpleRulesView: React.FC<SimpleRulesViewProps> = ({ sport = 'nfl' }) => {
  // Official Updated Rules: NO FIELD GOALS, NO BIG STOPS!
  // Pure whole-number offense finger math: Touchdowns (+6), Scrimmage Yards (+1/10yds), Passing Yards (+1/25yds), 2-Point Play (+2)
  const nflTiles: ScoringTile[] = [
    {
      title: 'TOUCHDOWN',
      points: '+6 PTS',
      desc: 'Pass, rush, or catch into the endzone.',
      badgeColor: 'bg-[#15803d] text-white border-[#14532d]',
      icon: '🏈',
    },
    {
      title: '10 RUSH/REC YDS',
      points: '+1 PT',
      desc: '+1 PT for every 10 rushing or receiving yards.',
      badgeColor: 'bg-[#1d4ed8] text-white border-[#1e3a8a]',
      icon: '🏃‍♂️',
    },
    {
      title: '25 PASSING YDS',
      points: '+1 PT',
      desc: '+1 PT for every 25 QB passing yards.',
      badgeColor: 'bg-[#7c3aed] text-white border-[#581c87]',
      icon: '🎯',
    },
    {
      title: '2-PT PLAY',
      points: '+2 PTS',
      desc: 'Bonus for a successful 2-point run or pass.',
      badgeColor: 'bg-[#b45309] text-white border-[#78350f]',
      icon: '⚡',
    },
  ];

  return (
    <div className="w-full space-y-2.5 sm:space-y-3 animate-in fade-in duration-150">
      <div className="text-center space-y-0.5">
        <p className="font-pixel text-[11px] sm:text-xs text-[#fde047] font-bold tracking-wide">
          OFFENSE HEROES ONLY · WHOLE NUMBERS ONLY
        </p>
        <p className="font-retro text-xs sm:text-sm text-[#fae5b8]/85">
          No field goals, no defense stops, no decimals! Easy math on your fingers.
        </p>
      </div>

      {/* 2x2 Grid of Compact Retro Tiles */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {nflTiles.map((tile) => (
          <div
            key={tile.title}
            className="pixel-box-cream p-2 sm:p-2.5 rounded-xs flex flex-col justify-between border-2 border-[#c99a57] shadow-[0_3px_0_0_#0a0f1d]"
          >
            <div>
              {/* Tile Header: Icon + Title */}
              <div className="flex items-center gap-1.5 border-b border-[#d4a86a] pb-1 mb-1">
                <span className="text-sm sm:text-base select-none" role="img" aria-label={tile.title}>
                  {tile.icon}
                </span>
                <h3 className="font-pixel text-[10px] sm:text-xs text-[#5c3509] font-bold tracking-wider uppercase truncate">
                  {tile.title}
                </h3>
              </div>

              {/* Big High-Contrast Points */}
              <div className="my-1">
                <span
                  className={`inline-block font-pixel text-xs sm:text-sm font-black px-2 py-0.5 border-2 rounded-xs shadow-xs tracking-tight ${tile.badgeColor}`}
                >
                  {tile.points}
                </span>
              </div>

              {/* Single Clear Description */}
              <p className="font-retro text-[10px] sm:text-[11px] text-[#5c3509] leading-tight">
                {tile.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Warm Retro Banner Across Bottom */}
      <div className="pixel-box-cream p-2 sm:p-2.5 rounded-xs border-2 border-[#c99a57] shadow-xs text-center space-y-1">
        <p className="font-pixel text-[10px] sm:text-[11px] text-[#15803d] font-bold">
          🚫 NO FIELD GOALS · 🚫 NO BIG STOPS
        </p>
        <p className="font-retro text-[11px] sm:text-xs text-[#5c3509]">
          💡 Pick 3 stars (1 QB, 1 RB, 1 WR/TE). Root for touchdowns & big yards!
        </p>
      </div>
    </div>
  );
};
