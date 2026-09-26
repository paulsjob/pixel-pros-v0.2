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
  const nflTiles: ScoringTile[] = [
    {
      title: 'TOUCHDOWN',
      points: '+6 PTS',
      desc: 'Pass, rush, or catch into the endzone.',
      badgeColor: 'bg-[#15803d] text-white border-[#14532d]',
      icon: '🏈',
    },
    {
      title: 'FIELD GOAL',
      points: '+3 PTS',
      desc: 'Any successful field goal.',
      badgeColor: 'bg-[#1d4ed8] text-white border-[#1e3a8a]',
      icon: '🥅',
    },
    {
      title: 'BIG STOP',
      points: '+2 PTS',
      desc: 'Sack, turnover, or stop.',
      badgeColor: 'bg-[#b45309] text-white border-[#78350f]',
      icon: '🛡️',
    },
    {
      title: '10 YARDS',
      points: '+1 PT',
      desc: '+1 PT per 10 scrimmage yards.',
      badgeColor: 'bg-[#7c3aed] text-white border-[#581c87]',
      icon: '⚡',
    },
  ];

  const nbaTiles: ScoringTile[] = [
    {
      title: '3-POINTER',
      points: '+2 PTS',
      desc: 'Splash from beyond the arc.',
      badgeColor: 'bg-[#ea580c] text-white border-[#9a3412]',
      icon: '🎯',
    },
    {
      title: 'BIG STOP',
      points: '+3 PTS',
      desc: 'Steal or emphatic block.',
      badgeColor: 'bg-[#b45309] text-white border-[#78350f]',
      icon: '🛡️',
    },
    {
      title: 'REBOUND',
      points: '+1 PT',
      desc: 'Board off the glass or rim.',
      badgeColor: 'bg-[#15803d] text-white border-[#14532d]',
      icon: '🏀',
    },
    {
      title: 'ASSIST',
      points: '+1 PT',
      desc: 'Dish to a scoring teammate.',
      badgeColor: 'bg-[#1d4ed8] text-white border-[#1e3a8a]',
      icon: '👟',
    },
  ];

  const scoringTiles = sport === 'nba' ? nbaTiles : nflTiles;

  return (
    <div className="w-full space-y-2.5 sm:space-y-3 animate-in fade-in duration-150">
      <p className="text-center font-retro text-xs sm:text-sm text-[#fae5b8]/85">
        {sport === 'nba'
          ? 'Fast hardwood scoring! Plus +1 PT for every 3 real-world game points.'
          : 'Easy whole-number points. Simple math on your fingers!'}
      </p>

      {/* 2x2 Grid of Compact Non-Scrollable Retro Tiles */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {scoringTiles.map((tile) => (
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
      <div className="pixel-box-cream p-2 sm:p-2.5 rounded-xs border-2 border-[#c99a57] shadow-xs text-center">
        <p className="font-retro text-[11px] sm:text-xs text-[#5c3509] font-bold">
          {sport === 'nba'
            ? '💡 TIP: Zero position limits—pick any 3 superstars you want (e.g., 3 guards or 2 centers)!'
            : '💡 TIP: Pick any 3 stars. No salary caps or position limits!'}
        </p>
      </div>
    </div>
  );
};
