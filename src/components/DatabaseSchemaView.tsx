import React, { useState } from 'react';
import {
  UNIVERSAL_POSTGRES_SCHEMA,
  PYTHON_INGESTOR_CODE,
  SUPABASE_CONFIG,
  DUMMY_SEED_SQL,
  NEXTJS_ENV_SETUP,
  NEXTJS_PAGE_CODE,
  NEXTJS_HOOK_CODE,
  NEXTJS_SUPABASE_CLIENT_CODE,
  NEXTJS_SUPABASE_SERVER_CODE,
  NEXTJS_REALTIME_HOOK_CODE,
  GITHUB_ACTION_WORKFLOW_CODE,
  DOCKER_WORKER_CODE,
  SYSTEMD_SERVICE_CODE,
} from '../data/schemaSql';
import { supabase } from '../lib/supabaseClient';
import {
  Copy,
  Check,
  Database,
  Code2,
  ShieldCheck,
  Sparkles,
  Layers,
  Terminal,
  KeyRound,
  Play,
  Server,
  FileCode,
  Radio,
  Clock,
  Cpu,
} from 'lucide-react';

export const DatabaseSchemaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'nextjs' | 'dummy_seed' | 'env_security' | 'sql' | 'tables' | 'python' | 'live_test'
  >('nextjs');
  const [nextSubTab, setNextSubTab] = useState<'page' | 'hook' | 'lib'>('page');
  const [pythonSubTab, setPythonSubTab] = useState<'script' | 'realtime' | 'github' | 'docker' | 'systemd'>('script');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live test state
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'simulated'>('idle');
  const [testResult, setTestResult] = useState<any>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRunLiveTest = async () => {
    setTestStatus('loading');
    try {
      // Attempt real query to Supabase
      const { data, error } = await supabase
        .from('rosters')
        .select(`
          id,
          user_id,
          sport_id,
          period_code,
          competitor_slot_1,
          competitor_slot_2,
          competitor_slot_3,
          total_points
        `)
        .limit(1);

      if (error || !data || data.length === 0) {
        // Provide clear simulated response representing the seeded dummy row
        setTimeout(() => {
          setTestStatus('simulated');
          setTestResult({
            note: 'Simulated preview using the 3-player dummy seed (Slot 1: JOSH #17, Slot 2: MAHOMES #15, Slot 3: JEERICE #88)',
            table: 'rosters',
            user_id: 'd0e5b720-3021-4d7a-8b1b-9f939e081111',
            sport_id: 'nfl',
            period_code: 'WEEK_CURRENT',
            lineup_slots: [
              { slot: 1, competitor_id: '11111111-1111-1111-1111-111111111111', name: 'JOSH ALLEN', number: 17, team: 'BUF', rating: 85 },
              { slot: 2, competitor_id: '22222222-2222-2222-2222-222222222222', name: 'PATRICK MAHOMES', number: 15, team: 'KC', rating: 85 },
              { slot: 3, competitor_id: '66666666-6666-6666-6666-666666666666', name: 'JEERICE HENRY', number: 88, team: 'RET', rating: 88 }
            ],
            total_points: 1852
          });
        }, 500);
      } else {
        setTestStatus('success');
        setTestResult({
          source: 'Live Supabase Cloud Project',
          data,
        });
      }
    } catch (e: any) {
      setTestStatus('simulated');
      setTestResult({
        note: 'Fallback to verified dummy roster data',
        slots: ['JOSH ALLEN (#17)', 'PATRICK MAHOMES (#15)', 'JEERICE HENRY (#88)'],
      });
    }
  };

  const tables = [
    {
      name: 'sports',
      purpose: 'Sport-Agnostic Registry',
      columns: 'id (PK), name, icon_name, season_label, is_active',
      desc: 'Allows instant expansion into NFL, NBA, Soccer, Baseball, Golf, and Tennis without altering game mechanics.',
    },
    {
      name: 'competitors',
      purpose: 'Universal Athletes / Players',
      columns: 'id (UUID), sport_id (FK), external_provider_id, display_name, short_name, uniform_number, rating, avatar_config (JSONB)',
      desc: 'Stores any athlete from any league with standard ratings and 8-bit pixel avatar parameters.',
    },
    {
      name: 'rosters',
      purpose: 'Weekly 3-Player Fantasy Selection',
      columns: 'id (UUID), user_id (FK), sport_id (FK), period_code, competitor_slot_1 (FK), competitor_slot_2 (FK), competitor_slot_3 (FK), total_points',
      desc: 'Directly powers the "Select 3 Players for This Week" slots displayed in the My Team interface.',
    },
    {
      name: 'user_rosters',
      purpose: 'Multi-Device Shared Family Rosters (Room Code System)',
      columns: 'id (UUID), room_code (TEXT), user_name (TEXT), star_1_id (TEXT), star_2_id (TEXT), star_3_id (TEXT), updated_at',
      desc: 'Powers real-time household rosters across multiple phones, iPads, and computers linked to a shared room code.',
    },
    {
      name: 'user_profiles',
      purpose: 'Family Player Profiles',
      columns: 'id (UUID), username, total_score (INT), badges (JSONB), avatar_config (JSONB)',
      desc: 'Holds total score, earned gem badges, and custom pixel helmet gear.',
    },
    {
      name: 'scoring_rules',
      purpose: 'Family-Friendly Whole-Number Engine',
      columns: 'id (UUID), sport_id (FK), event_type, display_name, points_value (INTEGER), description',
      desc: 'All fantasy math is integer-only! Touchdown = 6, Soccer Goal = 1, 3-Pointer = 3. Tweakable without code redeploys.',
    },
    {
      name: 'matches',
      purpose: 'Live Games / Fixtures',
      columns: 'id (UUID), sport_id (FK), home_competitor_name, away_competitor_name, scheduled_at, status, period_label, home_score, away_score',
      desc: 'Sport-agnostic match tracking. Works for 4 quarters (football/basketball), 2 halves (soccer), or innings (baseball).',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="pixel-box-cream p-5 rounded-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#d4a86a] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#12579b] border-2 border-[#0a2d52] flex items-center justify-center text-[#fae5b8]">
              <Database size={22} />
            </div>
            <div>
              <h1 className="font-pixel text-base sm:text-lg text-[#5c3509]">
                SUPABASE & NEXT.JS (VERCEL) INTEGRATION
              </h1>
              <p className="font-retro text-xs text-[#784610] mt-0.5">
                Fetching User Rosters, 3 Lineup Slots, and Secure Environment Variables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-[#fae9c8] border border-[#c99a57] rounded text-[10px] font-retro text-[#5c3509] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Project: {SUPABASE_CONFIG.projectId}
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'nextjs', label: '1. NEXT.JS CODE (MY TEAM SLOTS)', icon: FileCode },
            { id: 'env_security', label: '2. SECURE ENV & VERCEL SETUP', icon: KeyRound },
            { id: 'dummy_seed', label: '3. DUMMY DATA SEED (SQL)', icon: Database },
            { id: 'live_test', label: '4. LIVE SUPABASE TESTER', icon: Play },
            { id: 'sql', label: '5. FULL POSTGRES SCHEMA', icon: Code2 },
            { id: 'tables', label: '6. TABLE SCHEMAS', icon: Layers },
            { id: 'python', label: '7. PYTHON POLLER & DEPLOYMENT', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 font-pixel text-xs border-2 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30]'
                    : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: NEXT.JS CODE (SERVER COMPONENT & CLIENT HOOK) */}
      {activeTab === 'nextjs' && (
        <div className="space-y-4">
          <div className="pixel-box-cream p-5 rounded-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d4a86a] pb-3 mb-4">
              <div>
                <h2 className="font-pixel text-sm text-[#5c3509]">
                  FETCHING THE 3 'MY TEAM' SLOTS IN NEXT.JS
                </h2>
                <p className="font-retro text-xs text-[#784610] mt-0.5">
                  Choose between Server Component SSR (recommended for Vercel) or Client Hook (with optimistic slot updating)
                </p>
              </div>

              {/* Subtabs */}
              <div className="flex gap-2">
                {[
                  { id: 'page', label: 'app/my-team/page.tsx (Server)' },
                  { id: 'hook', label: 'hooks/useSupabaseRoster.ts (Client)' },
                  { id: 'lib', label: 'lib/supabase.ts (Clients)' },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setNextSubTab(sub.id as any)}
                    className={`px-2.5 py-1 font-pixel text-[10px] border-2 cursor-pointer ${
                      nextSubTab === sub.id
                        ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                        : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57]'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Display Area */}
            {nextSubTab === 'page' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-retro text-xs text-[#12579b] font-bold">
                    // Next.js App Router Server Component - fetches roster directly on Vercel Edge/Node server
                  </span>
                  <button
                    onClick={() => handleCopy(NEXTJS_PAGE_CODE, 'next_page')}
                    className="flex items-center gap-1 text-xs font-retro text-[#12579b] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'next_page' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'next_page' ? 'Copied!' : 'Copy File'}</span>
                  </button>
                </div>
                <div className="bg-[#0d1321] text-[#9cdcfe] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[440px]">
                  <pre className="whitespace-pre">{NEXTJS_PAGE_CODE}</pre>
                </div>
              </div>
            )}

            {nextSubTab === 'hook' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-retro text-xs text-[#12579b] font-bold">
                    // React Hook: Interactive clicking to swap & update players in the 3 slots with live Supabase upsert
                  </span>
                  <button
                    onClick={() => handleCopy(NEXTJS_HOOK_CODE, 'next_hook')}
                    className="flex items-center gap-1 text-xs font-retro text-[#12579b] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'next_hook' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'next_hook' ? 'Copied!' : 'Copy Hook'}</span>
                  </button>
                </div>
                <div className="bg-[#0d1321] text-[#7dd3fc] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[440px]">
                  <pre className="whitespace-pre">{NEXTJS_HOOK_CODE}</pre>
                </div>
              </div>
            )}

            {nextSubTab === 'lib' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#5c3509]">
                      lib/supabase/client.ts (Browser Client)
                    </span>
                    <button
                      onClick={() => handleCopy(NEXTJS_SUPABASE_CLIENT_CODE, 'lib_client')}
                      className="text-xs font-retro text-[#12579b] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'lib_client' ? <Check size={13} /> : <Copy size={13} />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="bg-[#0d1321] text-[#9cdcfe] p-3 rounded border font-mono text-xs overflow-x-auto">
                    <pre>{NEXTJS_SUPABASE_CLIENT_CODE}</pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#5c3509]">
                      lib/supabase/server.ts (Server Component Client)
                    </span>
                    <button
                      onClick={() => handleCopy(NEXTJS_SUPABASE_SERVER_CODE, 'lib_server')}
                      className="text-xs font-retro text-[#12579b] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'lib_server' ? <Check size={13} /> : <Copy size={13} />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="bg-[#0d1321] text-[#9cdcfe] p-3 rounded border font-mono text-xs overflow-x-auto">
                    <pre>{NEXTJS_SUPABASE_SERVER_CODE}</pre>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-[#e8f5e9] border border-[#81c784] text-[#1b5e20] text-xs font-retro rounded">
              <strong>How it connects to your 'My Team' UI:</strong> The query reads the active row from <code className="bg-[#c8e6c9] px-1 rounded">rosters</code>, pulls <code className="bg-[#c8e6c9] px-1 rounded">competitor_slot_1</code>, <code className="bg-[#c8e6c9] px-1 rounded">competitor_slot_2</code>, and <code className="bg-[#c8e6c9] px-1 rounded">competitor_slot_3</code>, and passes them as the array <code className="bg-[#c8e6c9] px-1 rounded">selectedPlayers</code> to <code className="bg-[#c8e6c9] px-1 rounded">&lt;MyTeamView&gt;</code>!
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SECURE ENV & VERCEL SETUP */}
      {activeTab === 'env_security' && (
        <div className="space-y-4">
          <div className="pixel-box-cream p-5 rounded-xs">
            <div className="flex items-center justify-between border-b border-[#d4a86a] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#15803d]" size={20} />
                <h2 className="font-pixel text-sm text-[#5c3509]">
                  ENVIRONMENT VARIABLES & KEY SECURITY GUIDE
                </h2>
              </div>
              <button
                onClick={() => handleCopy(NEXTJS_ENV_SETUP, 'env_setup')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-xs border-2 border-[#0a2d52] cursor-pointer"
              >
                {copiedKey === 'env_setup' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedKey === 'env_setup' ? 'COPIED .ENV' : 'COPY .ENV'}</span>
              </button>
            </div>

            {/* Architecture Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-[#fae9c8] p-4 border-2 border-[#c99a57] rounded">
                <div className="flex items-center gap-2 font-pixel text-xs text-[#12579b] mb-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY (SAFE FOR BROWSER)
                </div>
                <p className="font-retro text-xs text-[#5c3509] leading-relaxed mb-2">
                  Prefixed with <code className="bg-[#ebd2a4] px-1 rounded font-bold">NEXT_PUBLIC_</code> in Next.js. This key is intended to be public because security is enforced at the database layer via <strong>PostgreSQL Row Level Security (RLS)</strong>.
                </p>
                <div className="text-[11px] font-retro text-[#784610] bg-[#ebd2a4] p-2 rounded">
                  🛡️ Even if a user inspects browser network traffic, our RLS policies strictly forbid them from altering someone else's lineup or forging points.
                </div>
              </div>

              <div className="bg-[#fee2e2] p-4 border-2 border-[#f87171] rounded">
                <div className="flex items-center gap-2 font-pixel text-xs text-[#b91c1c] mb-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  SUPABASE_SERVICE_ROLE_KEY (STRICTLY SERVER-ONLY)
                </div>
                <p className="font-retro text-xs text-[#7f1d1d] leading-relaxed mb-2">
                  <strong>NEVER</strong> add <code className="bg-[#fecaca] px-1 rounded font-bold">NEXT_PUBLIC_</code> or expose this in frontend code! This key bypasses Row Level Security and has root privileges.
                </p>
                <div className="text-[11px] font-retro text-[#991b1b] bg-[#fecaca] p-2 rounded">
                  🔒 Store this exclusively in <strong>Vercel Project Settings &gt; Environment Variables</strong> or your server-side Python ingestor worker.
                </div>
              </div>
            </div>

            {/* .env.local Code Block */}
            <div className="mb-4">
              <span className="font-pixel text-xs text-[#5c3509] block mb-2">
                .env.local (LOCAL FILE) & VERCEL DASHBOARD CONFIGURATION
              </span>
              <div className="bg-[#0d1321] text-[#4ade80] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto">
                <pre>{NEXTJS_ENV_SETUP}</pre>
              </div>
            </div>

            {/* Vercel 3-step guide */}
            <div className="bg-[#e0f2fe] p-4 border border-[#38bdf8] rounded-xs text-[#0369a1] text-xs font-retro">
              <strong className="block font-pixel text-[11px] text-[#0284c7] mb-1">
                STEPS TO LINK IN VERCEL DASHBOARD:
              </strong>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Log in to <code className="bg-[#bae6fd] px-1 rounded">vercel.com</code> and open your project.</li>
                <li>Go to <strong>Settings &gt; Environment Variables</strong>.</li>
                <li>Add <code className="bg-[#bae6fd] px-1 rounded font-bold">NEXT_PUBLIC_SUPABASE_URL</code> = <code className="bg-[#bae6fd] px-1 rounded">{SUPABASE_CONFIG.url}</code></li>
                <li>Add <code className="bg-[#bae6fd] px-1 rounded font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> = your anon key from Supabase API settings.</li>
                <li>(Optional for backend functions): Add <code className="bg-[#bae6fd] px-1 rounded font-bold">SUPABASE_SERVICE_ROLE_KEY</code> = your secret service role key.</li>
                <li>Trigger a redeploy or push to git. Next.js will automatically inject the variables!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: DUMMY DATA SEED */}
      {activeTab === 'dummy_seed' && (
        <div className="pixel-box-cream p-5 rounded-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d4a86a] pb-3">
            <div>
              <h2 className="font-pixel text-sm text-[#5c3509]">
                DUMMY SEED SCRIPT (SQL)
              </h2>
              <p className="font-retro text-xs text-[#784610] mt-0.5">
                Pre-populates 6 competitors, demo user PLAYER123, and their 3-player lineup in the Supabase database
              </p>
            </div>
            <button
              onClick={() => handleCopy(DUMMY_SEED_SQL, 'dummy_sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-xs border-2 border-[#0a2d52] cursor-pointer"
            >
              {copiedKey === 'dummy_sql' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedKey === 'dummy_sql' ? 'COPIED SEED' : 'COPY DUMMY SEED'}</span>
            </button>
          </div>

          <div className="bg-[#0d1321] text-[#fcd34d] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre className="whitespace-pre">{DUMMY_SEED_SQL}</pre>
          </div>

          <div className="p-3 bg-[#fae9c8] border border-[#c99a57] text-[#5c3509] text-xs font-retro rounded">
            <strong>How to Run:</strong> In your Supabase dashboard (<code className="bg-[#ebd2a4] px-1 rounded">{SUPABASE_CONFIG.url}</code>), click <strong>SQL Editor</strong> on the left sidebar, click <strong>New Query</strong>, paste this snippet, and click <strong>Run</strong>. The 3 active lineup slots will be instantly wired to Josh Allen, Patrick Mahomes, and Jeerice Henry!
          </div>
        </div>
      )}

      {/* Tab 4: LIVE SUPABASE TESTER */}
      {activeTab === 'live_test' && (
        <div className="pixel-box-cream p-5 rounded-xs space-y-4">
          <div className="border-b border-[#d4a86a] pb-3">
            <h2 className="font-pixel text-sm text-[#5c3509]">
              TEST SUPABASE ROSTER QUERY
            </h2>
            <p className="font-retro text-xs text-[#784610] mt-0.5">
              Verify how the frontend queries the user's 3-player lineup and inspect the exact JSON response.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunLiveTest}
              disabled={testStatus === 'loading'}
              className="flex items-center gap-2 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white font-pixel text-xs border-2 border-[#14532d] cursor-pointer shadow-[0_2px_0_0_#052e16] active:translate-y-1 active:shadow-none"
            >
              <Play size={14} />
              <span>{testStatus === 'loading' ? 'FETCHING...' : 'RUN ROSTER FETCH TEST'}</span>
            </button>
            <span className="font-retro text-xs text-[#784610]">
              Target: <code className="bg-[#ebd2a4] px-1.5 py-0.5 rounded text-[#5c3509]">table("rosters").select("*")</code>
            </span>
          </div>

          {testResult && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-pixel text-xs text-[#12579b]">
                <Server size={14} />
                <span>QUERY RESULT PAYLOAD</span>
                <span className="px-2 py-0.5 bg-[#e0f2fe] text-[#0369a1] text-[10px] rounded">
                  {testStatus === 'simulated' ? 'Preview Representation' : 'Supabase Live'}
                </span>
              </div>
              <div className="bg-[#0d1321] text-[#38bdf8] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: FULL POSTGRES SCHEMA */}
      {activeTab === 'sql' && (
        <div className="pixel-box-cream p-5 rounded-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-pixel text-xs text-[#5c3509]">
              SUPABASE SQL MIGRATION (COPY & PASTE INTO SQL EDITOR)
            </span>
            <button
              onClick={() => handleCopy(UNIVERSAL_POSTGRES_SCHEMA, 'full_sql')}
              className="text-xs font-retro text-[#12579b] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Copy size={12} /> Click to Copy All SQL
            </button>
          </div>
          <div className="bg-[#0d1321] text-[#9cdcfe] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre className="whitespace-pre">{UNIVERSAL_POSTGRES_SCHEMA}</pre>
          </div>
        </div>
      )}

      {/* Tab 6: TABLE SCHEMAS */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map(table => (
            <div key={table.name} className="pixel-box-cream p-4 rounded-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#d4a86a] pb-2 mb-2">
                  <span className="font-pixel text-sm text-[#12579b]">public.{table.name}</span>
                  <span className="text-[10px] font-retro bg-[#ebd2a4] px-2 py-0.5 border border-[#c99a57] text-[#5c3509]">
                    {table.purpose}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#784610] bg-[#fae9c8] p-2 rounded mb-2 border border-[#ebd2a4]">
                  {table.columns}
                </div>
                <p className="font-retro text-xs text-[#5c3509] leading-relaxed">
                  {table.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 7: PYTHON POLLER & DEPLOYMENT RUNNERS */}
      {activeTab === 'python' && (
        <div className="space-y-4">
          <div className="pixel-box-cream p-5 rounded-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d4a86a] pb-3 mb-4">
              <div>
                <h2 className="font-pixel text-sm text-[#5c3509]">
                  LIGHTWEIGHT BACKGROUND POLLER & REALTIME WIRE
                </h2>
                <p className="font-retro text-xs text-[#784610] mt-0.5">
                  Polls live stats every 30-60s, calculates whole-number points (TD: +6, FG: +3, Def: +2, 50Yds: +1), and pushes to Supabase.
                </p>
              </div>

              {/* Subtabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'script', label: '1. scripts/poller.py', icon: Sparkles },
                  { id: 'realtime', label: '2. Next.js Realtime Wire', icon: Radio },
                  { id: 'github', label: '3. GitHub Actions (Cron)', icon: Clock },
                  { id: 'docker', label: '4. Docker / $5 Droplet', icon: Server },
                  { id: 'systemd', label: '5. systemd Service', icon: Cpu },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setPythonSubTab(sub.id as any)}
                    className={`px-2 py-1 font-pixel text-[10px] border-2 cursor-pointer transition-all flex items-center gap-1 ${
                      pythonSubTab === sub.id
                        ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                        : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
                    }`}
                  >
                    <sub.icon size={11} />
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subtab 1: poller.py */}
            {pythonSubTab === 'script' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-retro text-xs text-[#12579b] font-bold">
                    // Lightweight background poller script (calculates whole-number points & pushes to Supabase)
                  </span>
                  <button
                    onClick={() => handleCopy(PYTHON_INGESTOR_CODE, 'py_script')}
                    className="flex items-center gap-1 text-xs font-retro text-[#12579b] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'py_script' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>Copy poller.py</span>
                  </button>
                </div>
                <div className="bg-[#0d1321] text-[#7dd3fc] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre className="whitespace-pre">{PYTHON_INGESTOR_CODE}</pre>
                </div>
              </div>
            )}

            {/* Subtab 2: Next.js Realtime Hook */}
            {pythonSubTab === 'realtime' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-retro text-xs text-[#12579b] font-bold">
                    // hooks/useSupabaseRealtime.ts — zero polling on frontend, scores flip instantly on write
                  </span>
                  <button
                    onClick={() => handleCopy(NEXTJS_REALTIME_HOOK_CODE, 'realtime_hook')}
                    className="flex items-center gap-1 text-xs font-retro text-[#12579b] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'realtime_hook' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>Copy Realtime Hook</span>
                  </button>
                </div>
                <div className="bg-[#0d1321] text-[#7dd3fc] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre className="whitespace-pre">{NEXTJS_REALTIME_HOOK_CODE}</pre>
                </div>
              </div>
            )}

            {/* Subtab 3: GitHub Action */}
            {pythonSubTab === 'github' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-retro text-xs text-[#12579b] font-bold">
                    // .github/workflows/live_poller.yml — free scheduled background worker on GitHub
                  </span>
                  <button
                    onClick={() => handleCopy(GITHUB_ACTION_WORKFLOW_CODE, 'gh_workflow')}
                    className="flex items-center gap-1 text-xs font-retro text-[#12579b] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'gh_workflow' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>Copy Workflow YAML</span>
                  </button>
                </div>
                <div className="bg-[#0d1321] text-[#7dd3fc] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre className="whitespace-pre">{GITHUB_ACTION_WORKFLOW_CODE}</pre>
                </div>
              </div>
            )}

            {/* Subtab 4: Docker */}
            {pythonSubTab === 'docker' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-retro text-xs text-[#12579b] font-bold">
                    // Dockerfile.worker & docker-compose.worker.yml — run on any $5 droplet / VPS / Fly.io
                  </span>
                  <button
                    onClick={() => handleCopy(DOCKER_WORKER_CODE, 'docker_code')}
                    className="flex items-center gap-1 text-xs font-retro text-[#12579b] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'docker_code' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>Copy Docker Configs</span>
                  </button>
                </div>
                <div className="bg-[#0d1321] text-[#7dd3fc] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre className="whitespace-pre">{DOCKER_WORKER_CODE}</pre>
                </div>
              </div>
            )}

            {/* Subtab 5: Systemd */}
            {pythonSubTab === 'systemd' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-retro text-xs text-[#12579b] font-bold">
                    // systemd service unit — run as persistent background daemon on Ubuntu / Debian VPS
                  </span>
                  <button
                    onClick={() => handleCopy(SYSTEMD_SERVICE_CODE, 'systemd_code')}
                    className="flex items-center gap-1 text-xs font-retro text-[#12579b] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'systemd_code' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>Copy systemd Service</span>
                  </button>
                </div>
                <div className="bg-[#0d1321] text-[#7dd3fc] p-4 rounded border-2 border-[#1a2238] font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre className="whitespace-pre">{SYSTEMD_SERVICE_CODE}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
