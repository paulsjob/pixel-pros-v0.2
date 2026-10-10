import React from 'react';
import { SportId } from '../types';

interface SportSwitcherProps {
  currentSport: SportId;
  onSportChange?: (sport: SportId) => void;
}

export const SportSwitcher: React.FC<SportSwitcherProps> = ({
  currentSport = 'nfl',
}) => {
  // NBA button removed per user request: "you can lose the NBA button for sure. we don't need that at the moment."
  return (
    <div
      role="status"
      aria-label="Active Sport: NFL Gridiron"
      className="inline-flex items-center gap-1 bg-[#052e16] px-2 py-0.5 md:py-1 border border-[#16a34a] rounded-xs font-pixel text-[9px] md:text-xs text-[#86efac] select-none shadow-[0_2px_0_0_#022c22] shrink-0"
      title="NFL Gridiron Fantasy"
    >
      <span className="text-xs select-none">🏈</span>
      <span className="font-bold tracking-wider">NFL</span>
    </div>
  );
};
