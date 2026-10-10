import React, { useState } from 'react';
import {
  X,
  Trophy,
  ShieldCheck,
  Swords,
  Flame,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Share2,
} from 'lucide-react';
import {
  AchievementBadge,
  TrustReceipt,
  UserRoster,
  Competitor,
  Match,
  SportId,
} from '../types';
import { PixelShieldIcon } from './PixelBadges';
import { PixelPlayerSprite } from './PixelPlayerSprite';

interface GamificationTrophyModalProps {
  userName: string;
  roomCode: string;
  sport: SportId;
  badges: AchievementBadge[];
  receipts: TrustReceipt[];
  roomRosters: UserRoster[];
  allPlayers: Competitor[];
  matches: Match[];
  onOpenReceipt: (receipt: TrustReceipt) => void;
  onClose: () => void;
}

export const GamificationTrophyModal: React.FC<GamificationTrophyModalProps> = ({
  userName,
  roomCode,
  sport,
  badges,
  receipts,
  roomRosters,
  allPlayers,
  matches,
  onOpenReceipt,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'cabinet' | 'audit' | 'showdown'>('cabinet');

  // For Showdown tab: rival selection
  const normalizedUser = (userName || 'DAD').trim().toUpperCase();
  const availableRivals = Array.from(
    new Set(
      roomRosters
        .map((r) => (r.user_name || '').trim().toUpperCase())
        .filter((name) => name && name !== normalizedUser)
    )
  );

  const [selectedRival, setSelectedRival] = useState<string>(
    availableRivals[0] || (normalizedUser === 'DAD' ? 'MOM' : 'DAD')
  );

  const playerMap = new Map<string, Competitor>();
  allPlayers.forEach((p) => playerMap.set(String(p.id), p));

  // Find user's active superstars roster
  const myRoster = roomRosters.find(
    (r) =>
      (r.user_name || '').trim().toUpperCase() === normalizedUser &&
      (r.room_code || '').trim().toUpperCase() === roomCode.trim().toUpperCase()
  );

  // Find rival's active superstars roster
  const rivalRoster = roomRosters.find(
    (r) =>
      (r.user_name || '').trim().toUpperCase() === selectedRival &&
      (r.room_code || '').trim().toUpperCase() === roomCode.trim().toUpperCase()
  );

  const myStars = [
    myRoster?.star_1_id ? playerMap.get(myRoster.star_1_id) : null,
    myRoster?.star_2_id ? playerMap.get(myRoster.star_2_id) : null,
    myRoster?.star_3_id ? playerMap.get(myRoster.star_3_id) : null,
  ];

  const rivalStars = [
    rivalRoster?.star_1_id ? playerMap.get(rivalRoster.star_1_id) : null,
    rivalRoster?.star_2_id ? playerMap.get(rivalRoster.star_2_id) : null,
    rivalRoster?.star_3_id ? playerMap.get(rivalRoster.star_3_id) : null,
  ];

  const myTotal = myStars.reduce((sum, p) => sum + (p?.score ?? p?.current_score ?? p?.currentScore ?? 0), 0);
  const rivalTotal = rivalStars.reduce((sum, p) => sum + (p?.score ?? p?.current_score ?? p?.currentScore ?? 0), 0);
  const pointDiff = myTotal - rivalTotal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0b1021] border-4 border-[#1a264a] text-[#fae5b8] rounded-xs shadow-[0_12px_0_0_#050814] flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#080d1a] border-b-2 border-[#1a264a] px-3 sm:px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#facc15]" />
            <h2 className="font-pixel text-xs sm:text-sm font-bold tracking-wider text-[#fae5b8] uppercase">
              TROPHIES & SOCIAL TRUST HUB
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs rounded-2xs flex items-center justify-center cursor-pointer border border-[#7f1d1d] active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        {/* Segmented Navigation Bar */}
        <div className="grid grid-cols-3 bg-[#0f172a] border-b-2 border-[#1a264a] text-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cabinet')}
            className={`py-2 px-1 flex items-center justify-center gap-1.5 font-pixel text-[9px] sm:text-xs cursor-pointer transition-colors border-b-2 ${
              activeTab === 'cabinet'
                ? 'bg-[#12579b] text-[#fae5b8] border-[#38bdf8] font-bold'
                : 'text-[#94a3b8] hover:text-[#fae5b8] border-transparent'
            }`}
          >
            <Trophy size={12} className={activeTab === 'cabinet' ? 'text-[#facc15]' : ''} />
            <span>TROPHY CASE</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-1 flex items-center justify-center gap-1.5 font-pixel text-[9px] sm:text-xs cursor-pointer transition-colors border-b-2 ${
              activeTab === 'audit'
                ? 'bg-[#12579b] text-[#fae5b8] border-[#38bdf8] font-bold'
                : 'text-[#94a3b8] hover:text-[#fae5b8] border-transparent'
            }`}
          >
            <ShieldCheck size={12} className={activeTab === 'audit' ? 'text-[#34d399]' : ''} />
            <span>LOCK AUDIT ({receipts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('showdown')}
            className={`py-2 px-1 flex items-center justify-center gap-1.5 font-pixel text-[9px] sm:text-xs cursor-pointer transition-colors border-b-2 ${
              activeTab === 'showdown'
                ? 'bg-[#12579b] text-[#fae5b8] border-[#38bdf8] font-bold'
                : 'text-[#94a3b8] hover:text-[#fae5b8] border-transparent'
            }`}
          >
            <Swords size={12} className={activeTab === 'showdown' ? 'text-[#f87171]' : ''} />
            <span>RIVAL SHOWDOWN</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* TAB 1: TROPHY CABINET */}
          {activeTab === 'cabinet' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#1a264a]">
                <div className="font-pixel text-[10px] sm:text-xs text-[#38bdf8] font-bold">
                  SQUAD: <span className="text-[#fae5b8]">{userName}</span> (ROOM {roomCode})
                </div>
                <div className="font-retro text-xs text-[#34d399] font-bold">
                  {badges.filter((b) => b.unlocked).length}/{badges.length} UNLOCKED
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xs border-2 transition-all flex items-start gap-3 ${
                      badge.unlocked
                        ? 'bg-[#141e38] border-[#d4a86a] shadow-[0_2px_0_0_#92400e]'
                        : 'bg-[#0f172a]/60 border-[#1e293b] opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xs flex items-center justify-center text-xl shrink-0 border-2 ${
                        badge.unlocked
                          ? 'bg-[#fef08a] border-[#eab308] shadow-xs'
                          : 'bg-[#1e293b] border-[#334155]'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-pixel text-xs text-[#fae5b8] font-bold truncate">
                          {badge.title}
                        </h4>
                        <span
                          className={`font-pixel text-[8px] px-1.5 py-0.5 rounded-2xs font-bold uppercase shrink-0 ${
                            badge.unlocked
                              ? 'bg-[#065f46] text-[#6ee7b7] border border-[#059669]'
                              : 'bg-[#334155] text-[#94a3b8]'
                          }`}
                        >
                          {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                      </div>

                      <p className="font-retro text-[11px] text-[#cbd5e1] font-bold mt-0.5 leading-snug">
                        {badge.tagline}
                      </p>

                      <div className="mt-1.5 pt-1 border-t border-[#1a264a] flex items-center justify-between text-[10px] text-[#94a3b8] font-retro">
                        <span>{badge.criteria}</span>
                        {badge.progressText && (
                          <span className="font-pixel text-[9px] text-[#38bdf8] font-bold">
                            {badge.progressText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LOCK AUDIT & VERIFICATION LEDGER */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-[#064e3b]/30 border border-[#059669] rounded-xs text-xs text-[#a7f3d0] font-retro flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#34d399] shrink-0" />
                <span>
                  All picks are time-stamped and certified in central Firestore. Nobody can secretly change picks after kickoff!
                </span>
              </div>

              {receipts.length === 0 ? (
                <div className="p-8 text-center bg-[#080d1a] border-2 border-dashed border-[#1a264a] rounded-xs">
                  <ShieldCheck size={32} className="mx-auto text-[#64748b] mb-2" />
                  <p className="font-pixel text-xs text-[#94a3b8]">
                    NO OFFICIAL LOCK RECEIPTS YET
                  </p>
                  <p className="font-retro text-xs text-[#64748b] mt-1">
                    Lock in your 3 stars on any game slate to generate a permanent tamper-evident receipt!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {receipts.map((rc) => (
                    <div
                      key={rc.id}
                      className="p-3 bg-[#11192e] border-2 border-[#1a264a] hover:border-[#38bdf8] rounded-xs flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xs bg-[#1a264a] flex items-center justify-center text-sm shrink-0 border border-[#273552]">
                          📜
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-pixel text-xs text-[#fae5b8] font-bold">
                              {rc.user_name}
                            </span>
                            <span className="font-pixel text-[9px] bg-[#12579b] text-[#38bdf8] px-1.5 py-0.2 rounded-2xs font-bold">
                              {rc.slate_id === 'SUPERSTARS' ? 'SUPERSTARS' : rc.slate_id}
                            </span>
                            <span
                              className={`font-pixel text-[8px] px-1.5 py-0.2 rounded-2xs font-bold ${
                                rc.is_on_time
                                  ? 'bg-[#065f46] text-[#34d399]'
                                  : 'bg-[#7f1d1d] text-[#fca5a5]'
                              }`}
                            >
                              {rc.is_on_time ? 'ON-TIME' : 'LATE'}
                            </span>
                          </div>
                          <div className="font-retro text-xs text-[#94a3b8] mt-0.5 truncate">
                            Locked: {rc.locked_at_display} · Stars: {rc.star_names.join(', ')}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenReceipt(rc)}
                        className="touch-manipulation px-2.5 py-1.5 bg-[#1a264a] hover:bg-[#283554] text-[#38bdf8] border border-[#3b82f6]/60 rounded-xs font-pixel text-[9px] sm:text-[10px] cursor-pointer flex items-center gap-1 shrink-0 font-bold active:scale-95"
                      >
                        <span>VIEW RECEIPT</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RIVAL SHOWDOWN (VS MATRIX) */}
          {activeTab === 'showdown' && (
            <div className="space-y-4">
              {/* Rival Selector Bar */}
              <div className="flex items-center justify-between gap-2 p-2 bg-[#080d1a] border border-[#1a264a] rounded-xs">
                <span className="font-pixel text-[10px] text-[#94a3b8] uppercase font-bold">
                  CHOOSE FAMILY RIVAL:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableRivals.length === 0 ? (
                    <span className="font-retro text-xs text-[#64748b]">
                      No other family squads found in room {roomCode} yet
                    </span>
                  ) : (
                    availableRivals.map((rival) => (
                      <button
                        key={rival}
                        type="button"
                        onClick={() => setSelectedRival(rival)}
                        className={`touch-manipulation px-2.5 py-1 rounded-2xs font-pixel text-[10px] cursor-pointer transition-all ${
                          selectedRival === rival
                            ? 'bg-[#b91c1c] text-white border border-[#ef4444] font-bold shadow-xs'
                            : 'bg-[#1a2238] text-[#94a3b8] hover:text-[#fae5b8] border border-[#273552]'
                        }`}
                      >
                        {rival}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Head-to-Head Banner */}
              <div className="p-3 bg-[#11192e] border-2 border-[#1a264a] rounded-xs flex items-center justify-between">
                <div className="text-left">
                  <div className="font-pixel text-[10px] text-[#38bdf8] font-bold">YOUR SQUAD</div>
                  <div className="font-pixel text-sm sm:text-base text-[#fae5b8] font-bold">{userName}</div>
                  <div className="font-pixel text-xs text-[#34d399]">{myTotal} PTS</div>
                </div>

                <div className="text-center px-3">
                  <span className="font-pixel text-xs text-[#ef4444] font-bold">VS</span>
                  <div className="font-pixel text-[9px] text-[#facc15] mt-0.5">
                    {pointDiff > 0 ? `+${pointDiff} ADVANTAGE` : pointDiff < 0 ? `${pointDiff} BEHIND` : 'TIED'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-pixel text-[10px] text-[#f87171] font-bold">RIVAL SQUAD</div>
                  <div className="font-pixel text-sm sm:text-base text-[#fae5b8] font-bold">{selectedRival}</div>
                  <div className="font-pixel text-xs text-[#f87171]">{rivalTotal} PTS</div>
                </div>
              </div>

              {/* 3-Star Matchup Grid */}
              <div className="space-y-2">
                {[0, 1, 2].map((slotIdx) => {
                  const myStar = myStars[slotIdx];
                  const rivalStar = rivalStars[slotIdx];
                  const myPts = myStar?.score ?? myStar?.current_score ?? myStar?.currentScore ?? 0;
                  const rivalPts = rivalStar?.score ?? rivalStar?.current_score ?? rivalStar?.currentScore ?? 0;

                  return (
                    <div
                      key={slotIdx}
                      className="p-2.5 bg-[#0f172a] border border-[#1a264a] rounded-xs grid grid-cols-7 items-center gap-1.5 text-center font-retro"
                    >
                      {/* Left: My Star */}
                      <div className="col-span-3 text-left flex items-center gap-2 min-w-0">
                        <span className="font-pixel text-[9px] text-[#d97706] font-bold">
                          #{slotIdx + 1}
                        </span>
                        <div className="min-w-0 truncate">
                          <div className="font-pixel text-xs text-[#fae5b8] font-bold truncate">
                            {myStar?.displayName || myStar?.name || 'Empty Slot'}
                          </div>
                          <div className="text-[11px] text-[#94a3b8]">
                            {myStar ? `${myStar.teamCode} · ${myStar.position}` : 'No pick'}
                          </div>
                        </div>
                      </div>

                      {/* Center Score Comparison */}
                      <div className="col-span-1 text-center font-pixel text-xs">
                        <span className={myPts >= rivalPts ? 'text-[#34d399] font-bold' : 'text-[#94a3b8]'}>
                          {myPts}
                        </span>
                        <span className="text-[#64748b] mx-0.5">:</span>
                        <span className={rivalPts >= myPts ? 'text-[#f87171] font-bold' : 'text-[#94a3b8]'}>
                          {rivalPts}
                        </span>
                      </div>

                      {/* Right: Rival Star */}
                      <div className="col-span-3 text-right flex items-center justify-end gap-2 min-w-0">
                        <div className="min-w-0 truncate">
                          <div className="font-pixel text-xs text-[#fae5b8] font-bold truncate">
                            {rivalStar?.displayName || rivalStar?.name || 'Empty Slot'}
                          </div>
                          <div className="text-[11px] text-[#94a3b8]">
                            {rivalStar ? `${rivalStar.teamCode} · ${rivalStar.position}` : 'No pick'}
                          </div>
                        </div>
                        <span className="font-pixel text-[9px] text-[#f87171] font-bold">
                          #{slotIdx + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#080d1a] border-t-2 border-[#1a264a] flex items-center justify-between">
          <div className="font-retro text-xs text-[#94a3b8]">
            Pixel Pros Household Gamification · 🛋️ {roomCode}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3.5 bg-[#12579b] hover:bg-[#1e6cb8] text-[#fae5b8] font-pixel text-xs rounded-xs border border-[#38bdf8] cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
