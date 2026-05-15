"use client";

import { useState } from "react";
import { runGTM } from "@/lib/api";
import { GTMResponse } from "@/lib/mappers";
import { Loader2, Sparkles, AlertCircle, Search, BarChart2, Mail, Building2, List } from "lucide-react";
import { AgentStepper } from "./agent-stepper";
import { GTMResults, getStatusBadge } from "./gtm-results";

export default function GTMPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setGTMResult] = useState<GTMResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"strategy" | "results" | "trace">("strategy");
  const [hasAttempted, setHasAttempted] = useState(false);

  const exampleQueries = [
    "Find high-growth AI SaaS companies in the US",
    "Identify fintech startups hiring aggressively",
    "Find companies likely to churn competitors",
  ];

  const handleRun = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setGTMResult(null);
    setHasAttempted(true);
    try {
      const data = await runGTM(query);
      if ('error' in data && data.error) {
        setError((data as any).message || (data as any).error || "An error occurred");
        if (data.reasoning_trace) setGTMResult(data as GTMResponse);
      } else {
        setGTMResult(data as GTMResponse);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message || "An error occurred" : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const mono = 'var(--font-geist-mono)';

  const tabBtn = (key: "strategy" | "results" | "trace", icon: React.ReactNode, label: string) => {
    const active = activeTab === key;
    return (
      <button key={key} onClick={() => setActiveTab(key)}
        style={{
          fontFamily: mono, fontSize: 11, letterSpacing: 0.5, padding: '8px 16px',
          borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
          border: active ? '1px solid #E8C9A0' : '1px solid transparent',
          background: active ? '#FFF8EF' : 'transparent',
          color: active ? '#3E2522' : '#B09080',
          boxShadow: active ? '0 1px 4px rgba(140,110,99,0.15)' : 'none',
          cursor: 'pointer', transition: 'all 150ms',
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#8C6E63'; e.currentTarget.style.background = 'rgba(211,163,118,0.08)'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#B09080'; e.currentTarget.style.background = 'transparent'; } }}
      >
        <span style={{ color: active ? '#D3A376' : '#B09080', display: 'flex' }}>{icon}</span>
        {label}
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100%', paddingBottom: 80, background: '#FFF2DF' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes typing { from { width: 0 } to { width: 100% } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .typing-effect {
          display: inline-block; overflow: hidden; white-space: nowrap;
          border-right: 2px solid #D3A376;
          animation: typing 2s steps(40, end), blink-caret .75s step-end infinite;
          max-width: fit-content;
        }
        @keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: #D3A376; } }
        .shimmer-btn::after {
          content: ''; position: absolute; top: 0; left: 0; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,242,223,0.25), transparent);
          transform: translateX(-100%); animation: shimmer 2.5s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}} />

      {/* Hero & Query Input */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: mono, fontWeight: 800, fontSize: 42, letterSpacing: -2, color: '#3E2522', marginBottom: 16 }}>
          GTM Intelligence
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, height: 24 }}>
          <p className="typing-effect" style={{ color: '#8C6E63', fontSize: 14, fontWeight: 500 }}>
            AI-powered go-to-market research and strategy generation
          </p>
        </div>

        <div style={{ position: 'relative', textAlign: 'left' }}>
          {/* Warm glow */}
          <div style={{ position: 'absolute', width: 288, height: 288, background: 'radial-gradient(circle, rgba(211,163,118,0.1), transparent)', top: -20, left: -20, filter: 'blur(48px)', zIndex: 0, pointerEvents: 'none' }} />

          {/* Textarea wrapper with accent bar */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 16, width: 2, height: 32, background: '#D3A376', borderRadius: 1 }} />
            <textarea
              rows={4} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Find high-growth AI SaaS companies in the US and generate personalized outbound hooks for their VP Sales"
              style={{
                width: '100%', padding: '20px 24px', borderRadius: 16, fontSize: 15, lineHeight: 1.7,
                background: '#FFF8EF', border: '1px solid #E8C9A0', color: '#3E2522', resize: 'none',
                outline: 'none', transition: 'border-color 200ms, box-shadow 200ms',
                fontFamily: 'var(--font-geist-sans)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#D3A376'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,163,118,0.12)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E8C9A0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Example pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0 20px' }}>
            {exampleQueries.map((q, i) => (
              <button key={i} onClick={() => setQuery(q)}
                style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #E8C9A0', borderRadius: 100, fontSize: 11, letterSpacing: 0.2, color: '#8C6E63', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 200ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D3A376'; e.currentTarget.style.color = '#3E2522'; e.currentTarget.style.background = 'rgba(211,163,118,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8C9A0'; e.currentTarget.style.color = '#8C6E63'; e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: '#D3A376' }}>→</span> {q}
              </button>
            ))}
          </div>

          {/* Run button */}
          <button onClick={handleRun} disabled={loading || !query.trim()}
            className="shimmer-btn"
            style={{
              width: '100%', position: 'relative', overflow: 'hidden', padding: '16px 0',
              background: '#3E2522', color: '#FFF2DF', borderRadius: 12, fontSize: 14, fontWeight: 700,
              border: '1px solid rgba(62,37,34,0.8)', cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !query.trim() ? 0.5 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
              transition: 'all 200ms',
            }}
            onMouseEnter={e => { if (!loading && query.trim()) e.currentTarget.style.background = '#5A2E28'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3E2522'; }}
          >
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading ? <><Loader2 className="animate-spin" style={{ width: 20, height: 20, color: '#FFF2DF' }} /> Processing Intelligence...</>
                : <><Sparkles style={{ width: 20, height: 20, color: '#FFF2DF' }} /> Run GTM Analysis</>}
            </span>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        {/* Error */}
        {error && (
          <div style={{ marginBottom: 32, background: 'rgba(192,97,74,0.08)', border: '1px solid rgba(192,97,74,0.3)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle style={{ width: 18, height: 18, color: '#C0614A', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, color: '#3E2522', fontWeight: 500 }}>{error}</div>
          </div>
        )}

        {/* Stepper */}
        {(hasAttempted || loading) && (
          <AgentStepper loading={loading} result={result} />
        )}

        {/* Empty state */}
        {!hasAttempted && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px' }}>
            <div style={{ width: 72, height: 72, background: 'rgba(211,163,118,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Sparkles style={{ width: 36, height: 36, color: '#D3A376', opacity: 0.4 }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#B09080', marginBottom: 28, fontFamily: mono }}>Run your first GTM analysis</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              {[
                { icon: <Search style={{ width: 14, height: 14, color: '#D3A376' }} />, text: 'Find matching companies' },
                { icon: <BarChart2 style={{ width: 14, height: 14, color: '#D3A376' }} />, text: 'Generate Sales Angles' },
                { icon: <Mail style={{ width: 14, height: 14, color: '#D3A376' }} />, text: 'Draft Outreach Hooks' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#FFEBD0', border: '1px solid #E8C9A0', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#8C6E63', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.icon} {item.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div>
            {/* Tab bar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <div style={{ display: 'inline-flex', background: '#FFE0B2', borderRadius: 10, padding: 4, gap: 2 }}>
                {tabBtn("strategy", <BarChart2 style={{ width: 14, height: 14 }} />, "Strategy")}
                {tabBtn("results", <Building2 style={{ width: 14, height: 14 }} />, "Companies")}
                {tabBtn("trace", <List style={{ width: 14, height: 14 }} />, "Trace")}
              </div>
            </div>

            <GTMResults result={result} activeTab={activeTab} />
          </div>
        )}
      </div>
    </div>
  );
}
