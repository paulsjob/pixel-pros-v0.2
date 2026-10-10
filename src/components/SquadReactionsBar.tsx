import React, { useState } from 'react';
import { ReactionEmoji, SquadReactionEntry, SportId } from '../types';
import { addSquadReaction } from '../lib/gamificationService';

interface SquadReactionsBarProps {
  roomCode: string;
  targetUser: string;
  currentUser: string;
  sport: SportId;
  reactions?: Record<string, SquadReactionEntry[]>;
  compact?: boolean;
}

const EMOJI_LIST: { emoji: ReactionEmoji; label: string; bg: string }[] = [
  { emoji: '👑', label: 'Crown / Leader', bg: 'hover:bg-[#fef08a]' },
  { emoji: '🔥', label: 'On Fire!', bg: 'hover:bg-[#fee2e2]' },
  { emoji: '🧊', label: 'Ice Cold', bg: 'hover:bg-[#e0f2fe]' },
  { emoji: '🎯', label: 'Bullseye!', bg: 'hover:bg-[#ffedd5]' },
  { emoji: '🚀', label: 'To The Moon', bg: 'hover:bg-[#f3e8ff]' },
  { emoji: '🍿', label: 'Watching Drama', bg: 'hover:bg-[#fef9c3]' },
  { emoji: '🧂', label: 'Salty Banter', bg: 'hover:bg-[#f1f5f9]' },
];

export const SquadReactionsBar: React.FC<SquadReactionsBarProps> = ({
  roomCode,
  targetUser,
  currentUser,
  sport,
  reactions = {},
  compact = false,
}) => {
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);

  const handleReact = async (emoji: ReactionEmoji) => {
    setAnimatingEmoji(emoji);
    setTimeout(() => setAnimatingEmoji(null), 600);
    await addSquadReaction(roomCode, targetUser, currentUser, emoji, sport);
  };

  return (
    <div className={`flex items-center flex-wrap gap-1 ${compact ? 'py-0.5' : 'py-1.5'}`}>
      {EMOJI_LIST.map(({ emoji, label, bg }) => {
        const entries = reactions[emoji] || [];
        const count = entries.length;
        const hasMyReaction = entries.some(
          (e) => (e.sender || '').trim().toUpperCase() === (currentUser || '').trim().toUpperCase()
        );
        const isPopping = animatingEmoji === emoji;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReact(emoji)}
            title={`${label} (${count} reaction${count === 1 ? '' : 's'})`}
            className={`touch-manipulation flex items-center gap-1 rounded-2xs transition-all cursor-pointer select-none active:scale-95 ${
              compact
                ? 'px-1.5 py-0.5 text-[11px]'
                : 'px-2 py-1 text-xs sm:text-sm'
            } ${
              hasMyReaction
                ? 'bg-[#12579b]/20 border border-[#38bdf8] text-white'
                : 'bg-[#1a2238]/60 hover:bg-[#283554] border border-[#273552] text-[#fae5b8]/80'
            } ${bg}`}
          >
            <span className={`inline-block transition-transform ${isPopping ? 'scale-150 animate-bounce' : ''}`}>
              {emoji}
            </span>
            {count > 0 && (
              <span className="font-pixel text-[9px] font-bold text-[#fae5b8]">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
