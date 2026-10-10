import React, { useState, useRef, useEffect } from 'react';
import { Users, Plus, Check, X, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

interface FamilySquadSwitcherProps {
  activeUserName: string;
  roomCode: string;
  squads: Array<{
    userName: string;
    isLocked?: boolean;
    starCount?: number;
    totalScore?: number;
  }>;
  onSelectSquad: (squadName: string) => void;
  onCreateSquad: (squadName: string) => void;
  onDeleteSquad?: (squadName: string) => void;
  onOpenRoomModal?: () => void;
  isAddDrawerOpen?: boolean;
  onOpenAddDrawer?: () => void;
  onCloseAddDrawer?: () => void;
}

export const FamilySquadSwitcher: React.FC<FamilySquadSwitcherProps> = ({
  activeUserName,
  roomCode,
  squads,
  onSelectSquad,
  onCreateSquad,
  onDeleteSquad,
  isAddDrawerOpen,
  onOpenAddDrawer,
  onCloseAddDrawer,
}) => {
  const [internalIsAdding, setInternalIsAdding] = useState(false);
  const isAdding = isAddDrawerOpen !== undefined ? isAddDrawerOpen : internalIsAdding;

  const [newSquadName, setNewSquadName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [squadToDrop, setSquadToDrop] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Normalize active user name for clean comparison
  const normalizedActive = (activeUserName || '').trim().toUpperCase();

  // Ensure current active user is included in the list of squads ONLY if non-empty
  const squadMap = new Map<string, { userName: string; isLocked?: boolean; starCount?: number; totalScore?: number }>();
  squads.forEach((s) => {
    const key = (s.userName || '').trim().toUpperCase();
    if (key) {
      squadMap.set(key, { ...s, userName: key });
    }
  });

  if (normalizedActive && !squadMap.has(normalizedActive)) {
    squadMap.set(normalizedActive, { userName: normalizedActive, isLocked: false, starCount: 0 });
  }

  const squadList = Array.from(squadMap.values());
  const maxScore = Math.max(0, ...squadList.map((s) => s.totalScore ?? 0));

  const quickFamilySuggestions = ['DAD', 'MOM', 'LEO', 'VIOLET', 'KID 1', 'KID 2'];

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = carouselRef.current;
    if (el) el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [squadList.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (carouselRef.current) {
        const activeEl = carouselRef.current.querySelector<HTMLElement>('[data-active="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
      checkScroll();
    }, 60);
    return () => clearTimeout(timer);
  }, [normalizedActive, squadList.length]);

  const handleNavigateSquad = (direction: 'left' | 'right') => {
    if (squadList.length <= 1) return;

    const currentIndex = squadList.findIndex((s) => s.userName === normalizedActive);
    let targetIndex = 0;
    if (direction === 'right') {
      targetIndex = currentIndex >= 0 && currentIndex < squadList.length - 1 ? currentIndex + 1 : 0;
    } else {
      targetIndex = currentIndex > 0 ? currentIndex - 1 : squadList.length - 1;
    }

    const targetSquad = squadList[targetIndex];
    if (targetSquad) {
      onSelectSquad(targetSquad.userName);
    }
  };

  const handleStartAdd = () => {
    if (onOpenAddDrawer) onOpenAddDrawer();
    setInternalIsAdding(true);
    setNewSquadName('');
    setErrorMsg(null);
  };

  const handleCancelAdd = () => {
    if (onCloseAddDrawer) onCloseAddDrawer();
    setInternalIsAdding(false);
    setNewSquadName('');
    setErrorMsg(null);
  };

  const handleCommitNewSquad = (nameToCommit?: string) => {
    const raw = nameToCommit || newSquadName;
    const clean = raw.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Please enter a squad name');
      return;
    }
    if (squadMap.has(clean)) {
      onSelectSquad(clean);
      if (onCloseAddDrawer) onCloseAddDrawer();
      setInternalIsAdding(false);
      setIsDropdownOpen(false);
      setNewSquadName('');
      return;
    }

    onCreateSquad(clean);
    if (onCloseAddDrawer) onCloseAddDrawer();
    setInternalIsAdding(false);
    setIsDropdownOpen(false);
    setNewSquadName('');
    setErrorMsg(null);
  };

  return (
    <>
      {/* Unified Responsive Family Squad Switcher Bar - Single Balanced Row */}
      <div className="w-full bg-[#080d1a] border-b-2 border-[#1a264a] box-border overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-1.5 sm:px-4 py-1 flex items-center justify-between gap-1.5 sm:gap-2.5 w-full box-border">
          
          {/* Household Label (Left) */}
          <div className="flex items-center shrink-0 select-none">
            <div className="flex items-center gap-1.5 px-1.5 md:px-2 py-0.5 md:py-1 text-[#38bdf8] font-pixel text-[9px] md:text-xs font-bold">
              <Users size={13} className="text-[#38bdf8] shrink-0" />
              <span className="tracking-wider text-[#93c5fd]">SQUADS:</span>
            </div>
          </div>

          {/* Squad Carousel (Center - takes remaining width) */}
          <div className="flex-1 min-w-0 flex items-center gap-1 sm:gap-1.5 overflow-hidden">
            {squadList.length > 1 && (
              <button
                type="button"
                onClick={() => handleNavigateSquad('left')}
                className="touch-manipulation shrink-0 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-xs font-pixel bg-[#15233d] hover:bg-[#20365c] active:bg-[#20365c] text-[#38bdf8] border border-[#38bdf8]/60 cursor-pointer shadow-xs active:scale-95 transition-all"
                title="Previous squad"
                aria-label="Previous squad"
              >
                <ChevronLeft size={13} strokeWidth={3} />
              </button>
            )}

            <div
              ref={carouselRef}
              className="snap-x snap-mandatory flex-1 min-w-0 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar touch-pan-x px-0.5 py-0.5 scroll-smooth"
            >
              {squadList.map((squad) => {
                const isActive = squad.userName === normalizedActive;
                const isLeader = maxScore > 0 && (squad.totalScore ?? 0) === maxScore;
                const scoreVal = squad.totalScore ?? 0;

                return (
                  <button
                    key={squad.userName}
                    type="button"
                    data-squad-item="true"
                    data-active={isActive ? 'true' : undefined}
                    onClick={(e) => {
                      onSelectSquad(squad.userName);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                    className={`snap-center touch-manipulation shrink-0 flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-0.5 md:py-1 font-pixel text-[10px] md:text-xs rounded-xs border-2 transition-all cursor-pointer select-none whitespace-nowrap active:translate-y-0.5 ${
                      isActive
                        ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-[0_2px_0_0_#051a30] font-bold ring-1 ring-[#38bdf8]/60'
                        : 'bg-[#1a2238] text-[#94a3b8] hover:text-[#fae5b8] active:text-[#fae5b8] border-[#273552] hover:border-[#38bdf8]/60 active:bg-[#232e4b]'
                    }`}
                    title={
                      isLeader
                        ? `👑 Room Leader! ${squad.userName} (${scoreVal} pts)`
                        : isActive
                        ? `Currently picking for ${squad.userName}`
                        : `Switch to ${squad.userName}`
                    }
                  >
                    {isLeader ? (
                      <span className="text-xs select-none">👑</span>
                    ) : scoreVal >= 30 ? (
                      <span className="text-xs select-none">🔥</span>
                    ) : isActive ? (
                      <span className="text-[#fde047]">★</span>
                    ) : null}
                    <span className="font-bold">{squad.userName}</span>
                    {squad.isLocked && <span className="text-[9px]" title="Locked">🔒</span>}
                    <span
                      className={`text-[8px] md:text-[9px] font-bold px-1 py-0.2 rounded-2xs shrink-0 ${
                        isActive
                          ? 'bg-[#0a2d52] text-[#fde047]'
                          : isLeader
                          ? 'bg-[#451a03] text-[#fde047]'
                          : 'bg-[#0f172a] text-[#94a3b8]'
                      }`}
                    >
                      {scoreVal}p
                    </span>
                    {isActive && !squad.isLocked && onDeleteSquad && squadList.length > 1 && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSquadToDrop(squad.userName);
                        }}
                        className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center text-[#fae5b8]/70 hover:text-white hover:bg-red-600 rounded-2xs cursor-pointer active:scale-90 transition-colors"
                        title={`Drop squad ${squad.userName}`}
                      >
                        <X size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}

              {/* If few squads exist, offer 1-click quick add chips right in the bar! */}
              {squadList.length < 3 && (
                quickFamilySuggestions
                  .filter((name) => !squadMap.has(name))
                  .slice(0, 2)
                  .map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleCommitNewSquad(suggested)}
                      className="touch-manipulation shrink-0 flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 font-pixel text-[9px] md:text-[10px] rounded-xs border border-dashed border-[#16a34a]/80 bg-[#14532d]/30 hover:bg-[#14532d] text-[#86efac] hover:text-white transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      title={`Quickly add ${suggested}'s squad to this couch`}
                    >
                      <Plus size={10} strokeWidth={3} />
                      <span>{suggested}</span>
                    </button>
                  ))
              )}
            </div>

            {squadList.length > 1 && (
              <button
                type="button"
                onClick={() => handleNavigateSquad('right')}
                className="touch-manipulation shrink-0 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-xs font-pixel bg-[#15233d] hover:bg-[#20365c] active:bg-[#20365c] text-[#38bdf8] border border-[#38bdf8]/60 cursor-pointer shadow-xs active:scale-95 transition-all"
                title="Next squad"
                aria-label="Next squad"
              >
                <ChevronRight size={13} strokeWidth={3} />
              </button>
            )}
          </div>

          {/* [+ SQUAD] Button (Right) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              id="squad-switcher-add-btn"
              onClick={handleStartAdd}
              className="touch-manipulation flex items-center gap-1 px-2 md:px-2.5 py-1 font-pixel text-[9px] md:text-xs rounded-xs border border-[#16a34a] bg-[#14532d] hover:bg-[#16a34a] active:bg-[#16a34a] text-[#86efac] hover:text-white font-bold whitespace-nowrap active:scale-95 cursor-pointer shadow-xs transition-all"
              title="Add family squad to this room"
            >
              <Plus size={11} strokeWidth={3} />
              <span>SQUAD</span>
            </button>
          </div>

        </div>
      </div>

      {/* Quick Switch Player / Squad Dropdown Modal */}
      {isDropdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-2xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm p-4 bg-[#0d1527] border-2 border-[#38bdf8] shadow-[0_10px_30px_rgba(0,0,0,0.9)] rounded-xs animate-in zoom-in-95 duration-150 box-border text-[#fae5b8]">
            <div className="flex items-center justify-between border-b border-[#1a264a] pb-2 mb-3">
              <div className="flex items-center gap-1.5 font-pixel text-xs text-[#38bdf8] font-bold">
                <Users size={14} />
                <span>SELECT FAMILY SQUAD</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white rounded-2xs cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="font-retro text-xs text-[#94a3b8] mb-2.5">
              Who is playing on couch <strong className="text-[#fde047] font-pixel">{roomCode}</strong>?
            </p>

            {/* List of active squads */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3 pr-1">
              {squadList.map((sq) => {
                const isSelected = sq.userName === normalizedActive;
                return (
                  <button
                    key={sq.userName}
                    type="button"
                    onClick={() => {
                      onSelectSquad(sq.userName);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xs font-pixel text-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#155e9e] text-white border-[#38bdf8] font-bold shadow-xs'
                        : 'bg-[#1a2238] text-[#94a3b8] hover:text-white border-[#273552] hover:border-[#38bdf8]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{isSelected ? '★' : '👤'}</span>
                      <span>{sq.userName}</span>
                      {sq.isLocked && <span className="text-[10px]">🔒</span>}
                    </div>
                    <div className="text-[10px] text-[#fde047]">
                      {sq.totalScore ?? 0} pts
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick 1-click presets */}
            <div className="border-t border-[#1a264a] pt-2.5">
              <span className="font-pixel text-[9px] text-[#64748b] block mb-1.5 uppercase">
                Quick 1-Click Family Presets:
              </span>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {quickFamilySuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleCommitNewSquad(sug)}
                    className="touch-manipulation font-pixel text-[10px] px-2 py-1 bg-[#1a2238] hover:bg-[#16a34a] hover:text-white text-[#86efac] border border-[#16a34a]/60 rounded-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleStartAdd();
                }}
                className="w-full py-1.5 bg-[#14532d] hover:bg-[#16a34a] text-[#86efac] hover:text-white font-pixel text-xs rounded-xs border border-[#16a34a] flex items-center justify-center gap-1.5 cursor-pointer font-bold shadow-xs active:translate-y-0.5"
              >
                <Plus size={13} strokeWidth={3} />
                <span>CREATE CUSTOM SQUAD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Squad Drawer (Bottom sheet on mobile, centered modal on desktop) */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={handleCancelAdd}
          />
          
          <div className="relative z-10 w-full sm:max-w-md p-4 sm:p-5 bg-[#0d1527] border-t-2 sm:border-2 border-[#38bdf8]/70 shadow-[0_-8px_20px_rgba(0,0,0,0.8)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.9)] rounded-t-lg sm:rounded-md animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 box-border">
            <div className="max-w-md mx-auto w-full">
              <form onSubmit={(e) => { e.preventDefault(); handleCommitNewSquad(); }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-pixel text-[11px] sm:text-xs text-[#38bdf8] font-bold tracking-wider">
                    NEW FAMILY SQUAD
                  </span>
                  <span className="font-pixel text-[9px] text-[#94a3b8]">
                    COUCH: {roomCode}
                  </span>
                </div>

                <input
                  id="new-squad-name-input"
                  type="text"
                  autoFocus
                  value={newSquadName}
                  onChange={(e) => {
                    setNewSquadName(e.target.value.toUpperCase());
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. DAD, MOM, LEO"
                  maxLength={14}
                  className="bg-[#1a2238] border-2 border-[#38bdf8] text-[#fae5b8] font-pixel text-xs px-3 py-2 rounded-xs focus:outline-none w-full uppercase placeholder:text-gray-500 mb-2 box-border"
                />

                {/* Quick family names row */}
                <div className="flex overflow-x-auto whitespace-nowrap gap-1.5 py-1 no-scrollbar mb-2 touch-pan-x">
                  <span className="font-pixel text-[9px] text-[#64748b] self-center shrink-0">QUICK:</span>
                  {quickFamilySuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewSquadName(sug)}
                      className="touch-manipulation font-pixel text-[9px] px-2 py-1 bg-[#1a2238] hover:bg-[#232e4b] text-[#94a3b8] hover:text-[#fae5b8] border border-[#273552] rounded-2xs cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                {/* Action Buttons: 2-column grid */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCancelAdd}
                    className="touch-manipulation py-2 bg-[#334155] hover:bg-[#475569] text-white border border-[#1e293b] font-pixel text-xs rounded-xs cursor-pointer active:translate-y-0.5 text-center"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="touch-manipulation py-2 bg-[#16a34a] hover:bg-[#22c55e] text-white border border-[#14532d] font-pixel text-xs rounded-xs cursor-pointer shadow-sm active:translate-y-0.5 font-bold flex items-center justify-center gap-1.5 text-center whitespace-nowrap"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>CREATE SQUAD</span>
                  </button>
                </div>
              </form>

              {errorMsg && (
                <div className="mt-2 flex items-center gap-1.5 text-[#f87171] font-retro text-xs">
                  <ShieldAlert size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Squad Confirmation Modal */}
      {squadToDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xs">
          <div className="pixel-box-cream p-4 sm:p-5 max-w-sm w-full border-4 border-[#1a2238] shadow-[0_6px_0_0_#0a0f1d] rounded-xs text-center">
            <div className="font-pixel text-xs sm:text-sm text-[#991b1b] mb-2 font-bold flex items-center justify-center gap-2">
              <span className="text-base">⚠️</span>
              <span>DELETE SQUAD?</span>
            </div>
            <p className="font-retro text-xs sm:text-sm text-[#5c3509] mb-4 leading-relaxed">
              Remove <strong className="font-pixel text-[#12579b]">{squadToDrop}</strong> from room <strong className="font-pixel text-[#f59e0b]">{roomCode}</strong>? All picks will be lost.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSquadToDrop(null)}
                className="touch-manipulation py-2 px-3 bg-[#475569] hover:bg-[#64748b] text-white font-pixel text-[11px] rounded-xs cursor-pointer active:translate-y-0.5 font-bold"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = squadToDrop;
                  setSquadToDrop(null);
                  onDeleteSquad?.(target);
                }}
                className="touch-manipulation py-2 px-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-pixel text-[11px] rounded-xs cursor-pointer font-bold active:translate-y-0.5 border border-[#7f1d1d] shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>🗑️</span>
                <span>DELETE SQUAD</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
