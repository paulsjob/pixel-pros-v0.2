import React, { useState } from 'react';
import { ScoringRule } from '../types';
import { SCORING_RULES } from '../data/mockData';
import { Sparkles, Trophy, Plus, RefreshCw } from 'lucide-react';

interface RulesScoringTesterProps {
  onScorePoints?: (points: number, eventName: string) => void;
}

export const RulesScoringTester: React.FC<RulesScoringTesterProps> = ({ onScorePoints }) => {
  const [rules, setRules] = useState<ScoringRule[]>(SCORING_RULES);
  const [simulatedLog, setSimulatedLog] = useState<Array<{ id: number; text: string; points: number }>>([]);
  const [demoTotal, setDemoTotal] = useState(0);

  const handleTriggerScore = (rule: ScoringRule) => {
    const points = rule.pointsValue;
    setDemoTotal(prev => prev + points);
    const newEntry = {
      id: Date.now(),
      text: `${rule.displayName} (+${points} pts)`,
      points,
    };
    setSimulatedLog(prev => [newEntry, ...prev.slice(0, 5)]);

    if (onScorePoints) {
      onScorePoints(points, rule.displayName);
    }
  };

  const handleReset = () => {
    setDemoTotal(0);
    setSimulatedLog([]);
  };

  return (
    <div className="pixel-box-cream p-5 rounded-xs w-full max-w-5xl mx-auto mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#d4a86a] pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-[#b45309]" />
            <h2 className="font-pixel text-sm sm:text-base text-[#5c3509]">
              FAMILY-FRIENDLY SCORING ENGINE
            </h2>
          </div>
          <p className="font-retro text-xs text-[#784610] mt-1">
            No complex decimals or fractions. Perfect for 1st, 5th, and 6th graders to follow along live!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-[#fae9c8] border-2 border-[#c99a57] text-center">
            <span className="block font-retro text-[9px] text-[#784610]">SIMULATOR SCORE</span>
            <span className="font-pixel text-base text-[#b45309]">+{demoTotal} PTS</span>
          </div>
          {demoTotal > 0 && (
            <button
              onClick={handleReset}
              className="p-2 bg-[#ebd2a4] hover:bg-[#fae9c8] border-2 border-[#c99a57] text-[#5c3509] cursor-pointer"
              title="Reset Simulator"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Rules buttons grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rules.map(rule => (
          <button
            key={rule.id}
            onClick={() => handleTriggerScore(rule)}
            className="p-3 bg-[#ebd2a4] hover:bg-[#fae9c8] border-2 border-[#c99a57] text-left cursor-pointer transition-all active:scale-98 shadow-[0_2px_0_0_#9a6c2e]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-pixel text-xs text-[#5c3509]">{rule.displayName}</span>
              <span className="font-pixel text-xs bg-[#12579b] text-[#fae5b8] px-1.5 py-0.5 rounded-xs">
                +{rule.pointsValue}
              </span>
            </div>
            <p className="font-retro text-[10px] text-[#784610] line-clamp-2">
              {rule.description}
            </p>
            <div className="mt-2 text-[9px] font-pixel text-[#12579b] flex items-center gap-1">
              <Plus size={10} /> TEST EVENT
            </div>
          </button>
        ))}
      </div>

      {/* Event Feed */}
      {simulatedLog.length > 0 && (
        <div className="mt-4 p-3 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs">
          <span className="font-pixel text-[10px] text-[#784610] block mb-2">
            LIVE SIMULATED INGESTION FEED:
          </span>
          <div className="flex flex-wrap gap-2">
            {simulatedLog.map(item => (
              <span
                key={item.id}
                className="px-2.5 py-1 bg-[#15803d] text-white font-retro text-xs border border-[#14532d] animate-in fade-in"
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
