import React from 'react';
import { SportId } from '../types';

interface SportSwitcherProps {
  currentSport: SportId;
  onSportChange: (sport: SportId) => void;
}

export const SportSwitcher: React.FC<SportSwitcherProps> = ({
  currentSport,
  onSportChange,
}) => {
  return (
    <div
      role="group"
      aria-label="Sport Selection"
      className="inline-flex items-center bg-[#070b16] p-0.5 sm:p-1 border-2 border-[#1e293b] rounded-xs shadow-[0_2px_0_0_#050912]"
    >
      {/* NFL Button */}
      <button
        type="button"
        onClick={() => onSportChange('nfl')}
        className={`touch-manipulation flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 font-pixel text-[10px] md:text-xs rounded-2xs cursor-pointer transition-all active:translate-y-0.5 select-none ${
          currentSport === 'nfl'
            ? 'bg-[#15803d] text-white border border-[#22c55e] shadow-[0_2px_0_0_#052e16] font-bold'
            : 'text-[#94a3b8] hover:text-[#fae5b8] hover:bg-[#15233d]/60 border border-transparent'
        }`}
        title="Switch to NFL Fantasy"
      >
        <span className="text-xs select-none">🏈</span>
        <span className="hidden md:inline">NFL</span>
      </button>

      {/* NBA Button */}
      <button
        type="button"
        onClick={() => onSportChange('nba')}
        className={`touch-manipulation flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 font-pixel text-[10px] md:text-xs rounded-2xs cursor-pointer transition-all active:translate-y-0.5 select-none ${
          currentSport === 'nba'
            ? 'bg-[#c2410c] text-[#fef08a] border border-[#f97316] shadow-[0_2px_0_0_#431407] font-bold animate-pulse'
            : 'text-[#94a3b8] hover:text-[#fae5b8] hover:bg-[#15233d]/60 border border-transparent'
        }`}
        title="Switch to NBA Fantasy"
      >
        <span className="text-xs select-none">🏀</span>
        <span className="hidden md:inline">NBA</span>
      </button>
    </div>
  );
};
