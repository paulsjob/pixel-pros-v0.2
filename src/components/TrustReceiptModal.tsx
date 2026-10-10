import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Copy, Check, Share2, Lock, Flame } from 'lucide-react';
import { TrustReceipt } from '../types';

interface TrustReceiptModalProps {
  receipt: TrustReceipt;
  onClose: () => void;
}

export const TrustReceiptModal: React.FC<TrustReceiptModalProps> = ({ receipt, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyProof = async () => {
    const text = `🏆 PIXEL PROS LOCK RECEIPT
Squad: ${receipt.user_name}
Couch: ${receipt.room_code} | Slate: ${receipt.slate_id}
Locked: ${receipt.locked_at_display}
Status: ${receipt.is_on_time ? '✅ VERIFIED ON-TIME BEFORE KICKOFF' : '⚠️ LOCKED AFTER SCHEDULED KICKOFF'}
Stars: ${receipt.star_names.join(', ')}
Receipt ID: ${receipt.receipt_id}
Verification Hash: ${receipt.tamper_hash}
(Permanently recorded in Google Cloud Firestore)`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#faebd0] border-4 border-[#1a264a] text-[#2c1810] rounded-xs shadow-[0_12px_0_0_#060a14] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-[#12579b] text-[#fae5b8] px-3.5 py-2.5 border-b-3 border-[#0a2d52] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#38bdf8]" />
            <span className="font-pixel text-xs sm:text-sm font-bold tracking-wider">
              OFFICIAL LOCK RECEIPT
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs rounded-2xs flex items-center justify-center cursor-pointer border border-[#7f1d1d] active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        {/* Vintage Arcade Receipt Body */}
        <div className="p-4 sm:p-5 font-retro text-[#3b1d06]">
          {/* Retro Watermark / Receipt Stamp */}
          <div className="text-center pb-3 border-b-2 border-dashed border-[#b45309]/40">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#fef08a] border border-[#eab308] rounded-xs font-pixel text-[9px] sm:text-[10px] text-[#713f12] font-bold uppercase mb-1">
              <CheckCircle2 size={12} className="text-[#16a34a]" />
              <span>ANTI-TAMPER AUDIT CERTIFIED</span>
            </div>
            <h3 className="font-pixel text-base sm:text-lg text-[#1e293b] font-bold tracking-wide">
              PIXEL PROS {receipt.sport.toUpperCase()}
            </h3>
            <p className="text-xs text-[#78350f] font-bold font-retro">
              Permanent Central Ledger · Receipt #{receipt.receipt_id}
            </p>
          </div>

          {/* Details Grid */}
          <div className="py-3 space-y-2 border-b-2 border-dashed border-[#b45309]/40 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[#78350f] font-bold">SQUAD OWNER:</span>
              <span className="font-pixel text-xs text-[#0f172a] font-bold bg-[#fae5b8] px-2 py-0.5 border border-[#d4a86a] rounded-2xs">
                {receipt.user_name}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#78350f] font-bold">COUCH ROOM:</span>
              <span className="font-pixel text-xs text-[#1e293b] font-bold">
                🛋️ {receipt.room_code}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#78350f] font-bold">SLATE:</span>
              <span className="font-pixel text-[11px] text-[#12579b] font-bold">
                {receipt.slate_id === 'SUPERSTARS' ? '⭐ WEEKLY SUPERSTARS' : receipt.slate_id}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#78350f] font-bold">LOCKED TIME:</span>
              <span className="font-bold text-[#065f46] text-right">
                {receipt.locked_at_display}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#78350f] font-bold">TRUST STATUS:</span>
              <span
                className={`px-2 py-0.5 rounded-2xs font-pixel text-[9px] font-bold flex items-center gap-1 ${
                  receipt.is_on_time
                    ? 'bg-[#dcfce7] text-[#166534] border border-[#86efac]'
                    : 'bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]'
                }`}
              >
                <span>{receipt.is_on_time ? '✅ ON-TIME' : '⚠️ POST-KICKOFF'}</span>
              </span>
            </div>
          </div>

          {/* Locked Lineup Stars */}
          <div className="py-3 border-b-2 border-dashed border-[#b45309]/40">
            <div className="font-pixel text-[10px] text-[#78350f] font-bold uppercase mb-2 flex items-center gap-1.5">
              <Lock size={12} className="text-[#b45309]" />
              <span>3 VERIFIED STARS LOCKED:</span>
            </div>

            <div className="space-y-1.5">
              {receipt.star_names.map((name, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-[#fffbeb] border border-[#fde68a] rounded-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-[10px] w-4 text-[#d97706] font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-pixel text-xs text-[#1e293b] font-bold">
                      {name || 'Selected Star'}
                    </span>
                  </div>
                  {receipt.star_teams?.[idx] && (
                    <span className="font-pixel text-[9px] text-[#64748b] bg-[#e2e8f0] px-1.5 py-0.5 rounded-2xs">
                      {receipt.star_teams[idx]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tamper Hash Box */}
          <div className="pt-3">
            <div className="p-2 bg-[#f1f5f9] border border-[#cbd5e1] rounded-xs text-[10px] text-[#475569] font-mono break-all text-center">
              <div className="font-pixel text-[8px] text-[#64748b] mb-0.5">TAMPER HASH AUDIT:</div>
              <span className="font-bold text-[#0f172a]">{receipt.tamper_hash}</span>
            </div>
            <p className="text-[10px] text-[#94a3b8] text-center mt-1 leading-tight">
              Permanently synced to Google Cloud Firestore. This receipt guarantees zero post-kickoff edits.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#f6ebd4] border-t-2 border-[#1a264a] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyProof}
            className="flex-1 py-2 px-3 bg-[#047857] hover:bg-[#059669] text-white font-pixel text-[10px] sm:text-xs rounded-xs border-2 border-[#065f46] shadow-[0_2px_0_0_#022c22] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 font-bold"
          >
            {copied ? (
              <>
                <Check size={13} className="text-[#a7f3d0]" />
                <span>PROOF COPIED!</span>
              </>
            ) : (
              <>
                <Share2 size={13} />
                <span>SHARE PROOF WITH FAMILY</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3.5 bg-[#1e293b] hover:bg-[#334155] text-[#fae5b8] font-pixel text-[10px] sm:text-xs rounded-xs border border-[#0f172a] cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
