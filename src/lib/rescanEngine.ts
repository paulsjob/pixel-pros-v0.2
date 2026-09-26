/**
 * Tuesday 4:00 AM EST Automated Rescan Engine
 * 
 * Synchronizes with the NFL schedule lifecycle:
 * NFL weeks conclude with Monday Night Football (wrapping late Monday night / early Tuesday).
 * Every Tuesday morning at 4:00 AM EST:
 * 1. Rescans ESPN scoreboard & advances active NFL week for upcoming slate.
 * 2. Scrapes all 32 dynamic depth charts (QB1, QB2, QB3, RB1, RB2, WR1, WR2, WR3, etc.).
 * 3. Scrapes all active NFL injury reports (marking red 'I' for Out/IR, 'Q' for Questionable).
 * 4. Clears previous game locks so users can immediately create new rooms and make fresh picks!
 */

import { SportId, Competitor, Match } from '../types';
import { runPureDynamicDepthChartSync } from './espnDepthChartSync';
import { getCurrentNFLWeek, setCurrentNFLWeek } from './espnSync';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export interface InjuryReportItem {
  athleteId?: string;
  name: string;
  team: string;
  status: 'I' | 'Q';
  rawStatus: string;
  detail: string;
}

export interface WeeklyRescanSummary {
  success: boolean;
  activeWeek: number;
  message: string;
  timestamp: string;
  competitorsUpdated: number;
  injuriesFound: number;
}

// -------------------------------------------------------------
// Eastern Time (EST/EDT) Boundary Calculations
// -------------------------------------------------------------

function getEasternParts(d = new Date()): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });
  return map;
}

function easternToDate(year: string, month: string, day: string, hour = '04', min = '00', sec = '00'): Date {
  const dateStr = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
  const estDate = new Date(new Date(dateStr + 'Z').toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const diff = new Date(dateStr + 'Z').getTime() - estDate.getTime();
  return new Date(new Date(dateStr + 'Z').getTime() + diff);
}

/**
 * Returns the exact Date of the most recent Tuesday 4:00 AM EST
 */
export function getLastTuesday4AMEST(now = new Date()): Date {
  const p = getEasternParts(now);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = dayNames.indexOf(p.weekday);
  const hour = parseInt(p.hour, 10);

  let daysSinceTuesday = (dayIndex - 2 + 7) % 7;
  if (daysSinceTuesday === 0 && hour < 4) {
    daysSinceTuesday = 7;
  }

  const targetDate = new Date(now.getTime() - daysSinceTuesday * 86400000);
  const tp = getEasternParts(targetDate);
  return easternToDate(tp.year, tp.month, tp.day, '04', '00', '00');
}

/**
 * Returns the exact Date of the upcoming Tuesday 4:00 AM EST
 */
export function getNextTuesday4AMEST(now = new Date()): Date {
  const last = getLastTuesday4AMEST(now);
  return new Date(last.getTime() + 7 * 86400000);
}

/**
 * Calculates remaining time until the next scheduled Tuesday 4:00 AM EST rescan
 */
export function getWeeklyRescanCountdown(now = new Date()): {
  formattedNext: string;
  countdown: string;
  hoursUntil: number;
  minutesUntil: number;
  nextDate: Date;
} {
  const nextDate = getNextTuesday4AMEST(now);
  const msUntil = Math.max(0, nextDate.getTime() - now.getTime());
  const hoursUntil = Math.floor(msUntil / (1000 * 60 * 60));
  const minutesUntil = Math.floor((msUntil % (1000 * 60 * 60)) / (1000 * 60));
  const daysUntil = Math.floor(hoursUntil / 24);
  const remHours = hoursUntil % 24;

  const countdown = daysUntil > 0
    ? `${daysUntil}d ${remHours}h ${minutesUntil}m`
    : `${hoursUntil}h ${minutesUntil}m`;

  const formattedNext = nextDate.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' EST';

  return { formattedNext, countdown, hoursUntil, minutesUntil, nextDate };
}

/**
 * Checks if a Tuesday 4:00 AM EST rescan is due based on local/cached state
 */
export function isWeeklyRescanDue(lastRescanIso?: string | null, now = new Date()): boolean {
  const lastTue = getLastTuesday4AMEST(now);
  if (!lastRescanIso) return true;
  try {
    const lastDate = new Date(lastRescanIso);
    return lastDate.getTime() < lastTue.getTime();
  } catch {
    return true;
  }
}

// -------------------------------------------------------------
// Live ESPN Injury Fetcher & Parser
// -------------------------------------------------------------

export async function fetchLiveNFLInjuries(): Promise<Map<string, InjuryReportItem>> {
  const injuryMap = new Map<string, InjuryReportItem>();

  try {
    let data: any = null;
    try {
      const res = await fetch('/api/espn/injuries');
      if (res.ok) data = await res.json();
    } catch {
      // ignore
    }

    if (!data) {
      try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries');
        if (res.ok) data = await res.json();
      } catch (err) {
        console.warn('[Injuries] Direct ESPN fetch failed:', err);
      }
    }

    if (!data || !Array.isArray(data.injuries)) {
      return injuryMap;
    }

    for (const team of data.injuries) {
      const teamName = team.displayName || '';
      for (const inj of (team.injuries || [])) {
        const displayName = inj.athlete?.displayName || '';
        const normName = displayName.trim().toLowerCase();
        if (!normName) continue;

        const status = (inj.status || '').toLowerCase();
        const typeAbbr = (inj.type?.abbreviation || '').toLowerCase();

        let code: 'I' | 'Q' | null = null;
        if (
          status.includes('out') ||
          status.includes('injured reserve') ||
          typeAbbr === 'o' ||
          typeAbbr === 'ir'
        ) {
          code = 'I';
        } else if (
          status.includes('questionable') ||
          status.includes('doubtful') ||
          typeAbbr === 'q' ||
          typeAbbr === 'd'
        ) {
          code = 'Q';
        }

        if (code) {
          const detail = inj.details?.type
            ? `${inj.details.type} - ${inj.status}`
            : (inj.status || (code === 'I' ? 'Out' : 'Questionable'));

          injuryMap.set(normName, {
            athleteId: inj.athlete?.id || inj.id,
            name: displayName,
            team: teamName,
            status: code,
            rawStatus: inj.status || '',
            detail: detail,
          });
        }
      }
    }

    // Cache locally for instant offline display
    const cacheObj: Record<string, any> = {};
    for (const [k, v] of injuryMap.entries()) {
      cacheObj[k] = v;
    }
    localStorage.setItem('pixel_pros_nfl_injuries', JSON.stringify(cacheObj));
  } catch (err) {
    console.warn('[Injuries] Failed to parse ESPN injury report:', err);
  }

  return injuryMap;
}

/**
 * Returns cached injury map synchronously for instant UI rendering
 */
export function getCachedNFLInjuries(): Map<string, InjuryReportItem> {
  const map = new Map<string, InjuryReportItem>();
  try {
    const raw = localStorage.getItem('pixel_pros_nfl_injuries');
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        map.set(k, v as InjuryReportItem);
      }
    }
  } catch {
    // ignore
  }
  return map;
}

// -------------------------------------------------------------
// Complete Weekly Rescan Execution
// -------------------------------------------------------------

export async function executeCompleteWeeklyRescan(
  onProgress?: (step: string) => void
): Promise<WeeklyRescanSummary> {
  onProgress?.('Contacting ESPN for upcoming NFL week schedule...');

  try {
    // 1. Trigger server-side weekly rescan endpoint if available
    try {
      await fetch('/api/espn/rescan-weekly', { method: 'POST' });
    } catch {
      // server-side rescan call is optional in client-only fallback
    }

    // 2. Fetch live scoreboard to identify active week
    let upcomingWeek = getCurrentNFLWeek();
    try {
      const scoreRes = await fetch('/api/espn/scoreboard?sport=nfl');
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        if (scoreData.week?.number) {
          upcomingWeek = scoreData.week.number;
          setCurrentNFLWeek(upcomingWeek);
        }
      }
    } catch (e) {
      console.warn('Could not query scoreboard for week:', e);
    }

    // 3. Fetch live injuries
    onProgress?.('Fetching live NFL injury reports across all 32 teams...');
    const injuryMap = await fetchLiveNFLInjuries();

    // 4. Scrape dynamic depth charts across all 32 teams
    onProgress?.(`Re-scanning all 32 NFL depth charts for Week ${upcomingWeek}...`);
    const depthResult = await runPureDynamicDepthChartSync(onProgress);

    // 5. Apply injury reports and depth labels to synced competitors
    const rawCompetitors = localStorage.getItem('pixel_pros_synced_competitors_nfl');
    let competitorsCount = 0;
    if (rawCompetitors) {
      try {
        const comps: Competitor[] = JSON.parse(rawCompetitors);
        for (const c of comps) {
          const norm = (c.displayName || c.shortName || '').trim().toLowerCase();
          if (injuryMap.has(norm)) {
            const inj = injuryMap.get(norm)!;
            c.injuryStatus = inj.status;
            c.injuryDetail = inj.detail;
          }
        }
        localStorage.setItem('pixel_pros_synced_competitors_nfl', JSON.stringify(comps));
        competitorsCount = comps.length;
      } catch {
        // ignore
      }
    }

    // 6. Record timestamp and broadcast client-side
    const nowIso = new Date().toISOString();
    localStorage.setItem('pixel_pros_last_tuesday_rescan', nowIso);

    // Notify window that rescan finished
    window.dispatchEvent(
      new CustomEvent('pixel_pros_weekly_rescan_completed', {
        detail: {
          week: upcomingWeek,
          timestamp: nowIso,
        },
      })
    );

    return {
      success: true,
      activeWeek: upcomingWeek,
      message: `Complete Tuesday 4:00 AM EST rescan complete for Week ${upcomingWeek}`,
      timestamp: nowIso,
      competitorsUpdated: competitorsCount || depthResult.totalCompetitors,
      injuriesFound: injuryMap.size,
    };
  } catch (err: any) {
    return {
      success: false,
      activeWeek: getCurrentNFLWeek(),
      message: err.message || 'Weekly rescan encountered an issue',
      timestamp: new Date().toISOString(),
      competitorsUpdated: 0,
      injuriesFound: 0,
    };
  }
}
