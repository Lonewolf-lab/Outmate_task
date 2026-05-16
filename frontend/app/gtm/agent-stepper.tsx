"use client";

import { useState, useEffect, useRef } from "react";
import { GTMResponse, TraceEntry } from "@/lib/mappers";
import { Loader2, CheckCircle2, XCircle, RefreshCw, List } from "lucide-react";

const STEPS: { key: string[]; label: string; short: string; emoji: string }[] = [
  { key: ["planneragent", "planner"],                   label: "Planner",      short: "Plan",     emoji: "🗺️" },
  { key: ["retrievalagent", "retrieval"],               label: "Retrieval",    short: "Fetch",    emoji: "🔍" },
  { key: ["enrichmentagent", "enrichment"],             label: "Enrichment",   short: "Enrich",   emoji: "⚡" },
  { key: ["criticagent", "critic", "validator"],        label: "Critic",       short: "Validate", emoji: "🛡️" },
  { key: ["gtmstrategyagent", "gtm_strategy", "gtm"],  label: "GTM Strategy", short: "Strategy", emoji: "🎯" },
];

const P = {
  bg: '#FFF2DF', surface: '#FFF8EF', s2: '#FFE0B2', card: '#FFEBD0',
  border: '#E8C9A0', lineBg: '#E8C9A0',
  accent: '#D3A376', teal: '#92400e',
  muted: '#92400e', warm: '#3D1F00', linen: '#1c1917',
  hot: '#C0614A', success: '#4A8C6A',
  logBg: '#FFF8EF',
};

function agentToStepIndex(agentName: string): number {
  const normalized = agentName.toLowerCase().replace(/\s/g, "");
  return STEPS.findIndex(s => s.key.some(k => normalized.includes(k)));
}

type StepState = "idle" | "active" | "success" | "failed" | "retrying";
interface StepInfo { state: StepState; agentName: string; }

interface AgentStepperProps {
  loading: boolean;
  result: GTMResponse | null;
}

export function AgentStepper({ loading, result }: AgentStepperProps) {
  const steps: StepInfo[] = STEPS.map(s => ({ state: "idle" as StepState, agentName: s.label }));

  if (result?.reasoning_trace && result.reasoning_trace.length > 0) {
    result.reasoning_trace.forEach((trace: TraceEntry) => {
      const idx = agentToStepIndex(trace.agent);
      if (idx >= 0) {
        const s = trace.status.toLowerCase();
        let state: StepState = "idle";
        if (s === "success") state = "success";
        else if (s === "failed") state = "failed";
        else if (s === "retrying") state = "retrying";
        else state = "active";
        steps[idx] = { state, agentName: trace.agent };
      }
    });
  }

  const [animStep, setAnimStep] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading || (result?.reasoning_trace && result.reasoning_trace.length > 0)) {
      setAnimStep(-1);
      return;
    }
    const delays = [500, 2000, 4000, 6000, 8000];
    delays.forEach((delay, i) => {
      timerRef.current = setTimeout(() => setAnimStep(i), delay);
    });
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [loading]);

  const noTraceYet = !result?.reasoning_trace || result.reasoning_trace.length === 0;
  const activeAnimIndex = loading && noTraceYet ? animStep : -1;
  const lastTraceIndex = result?.reasoning_trace
    ? Math.max(...result.reasoning_trace.map(t => agentToStepIndex(t.agent)).filter(i => i >= 0))
    : -1;
  const activeStepForStatus = loading && !noTraceYet ? lastTraceIndex + 1 : -1;

  const renderCircle = (step: StepInfo, idx: number) => {
    const isAnimActive = activeAnimIndex === idx;
    const isTraceActive = !noTraceYet && loading && idx === activeStepForStatus;
    const isActive = isAnimActive || isTraceActive;

    if (loading && noTraceYet && idx > activeAnimIndex) {
      return (
        <div style={{ width:36, height:36, borderRadius:'50%', background:P.s2, border:`2px solid ${P.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-geist-mono)', fontSize:11, color:P.muted }}>
          {idx + 1}
        </div>
      );
    }
    if (isActive) {
      return (
        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(211,163,118,0.2)', border:`2px solid ${P.accent}`, boxShadow:`0 0 0 3px rgba(211,163,118,0.15)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Loader2 className="animate-spin" style={{ width:18, height:18, color:P.accent }} />
        </div>
      );
    }
    if (step.state === "success" || (loading && noTraceYet && idx < activeAnimIndex)) {
      return (
        <div style={{ width:36, height:36, borderRadius:'50%', background:P.accent, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 12px rgba(211,163,118,0.4)` }}>
          <CheckCircle2 style={{ width:18, height:18, color:'#FFF2DF' }} />
        </div>
      );
    }
    if (step.state === "failed") {
      return (
        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(192,97,74,0.12)', border:`2px solid ${P.hot}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <XCircle style={{ width:18, height:18, color:P.hot }} />
        </div>
      );
    }
    if (step.state === "retrying") {
      return (
        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(211,163,118,0.15)', border:`2px solid ${P.accent}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw className="animate-spin" style={{ width:18, height:18, color:P.accent }} />
        </div>
      );
    }
    return (
      <div style={{ width:36, height:36, borderRadius:'50%', background:P.s2, border:`2px solid ${P.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-geist-mono)', fontSize:11, color:P.muted }}>
        {idx + 1}
      </div>
    );
  };

  const lineIsFilled = (idx: number): boolean => {
    if (loading && noTraceYet) return idx < activeAnimIndex;
    return steps[idx]?.state === "success";
  };

  const activeStepLabel = loading && noTraceYet
    ? (activeAnimIndex >= 0 ? STEPS[activeAnimIndex]?.label : "Initializing")
    : loading && !noTraceYet
    ? (lastTraceIndex + 1 < STEPS.length ? STEPS[lastTraceIndex + 1]?.label : "Finishing")
    : null;
  const completedCount = loading && noTraceYet
    ? Math.max(0, activeAnimIndex)
    : steps.filter(s => s.state === "success").length;

  const getLabelColor = (step: StepInfo, idx: number) => {
    const isAnimActive = activeAnimIndex === idx;
    const isTraceActive = !noTraceYet && loading && idx === activeStepForStatus;
    if (step.state === "success" || (loading && noTraceYet && idx < activeAnimIndex)) return P.accent;
    if (isAnimActive || isTraceActive) return '#1c1917';
    if (step.state === "failed") return P.hot;
    return '#b45309';
  };

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <List style={{ width:14, height:14, color:P.muted }} />
        <span style={{ fontFamily:'var(--font-geist-mono)', fontSize:11, letterSpacing:3, color:P.muted, textTransform:'uppercase', fontWeight:600 }}>
          Agent Execution
        </span>
      </div>

      <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:'24px 28px' }}>
        {/* Stepper */}
        <div style={{ display:'flex', alignItems:'flex-start' }}>
          {STEPS.map((stepDef, idx) => {
            const step = steps[idx];
            const isLast = idx === STEPS.length - 1;
            const isAnimActive = activeAnimIndex === idx;
            const isTraceActive = !noTraceYet && loading && idx === activeStepForStatus;
            const isActive = isAnimActive || isTraceActive;
            return (
              <div key={idx} style={{ display:'flex', alignItems:'flex-start', flex:1, minWidth:0 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  {renderCircle(step, idx)}
                  <div style={{ marginTop:8, textAlign:'center' }}>
                    <span style={{ fontFamily:'var(--font-geist-mono)', fontSize:10, color: getLabelColor(step, idx), display:'flex', alignItems:'center', gap:3, justifyContent:'center' }}>
                      <span style={{ fontSize:12 }}>{stepDef.emoji}</span>
                      <span className="hidden sm:inline">{stepDef.label}</span>
                      <span className="sm:hidden">{stepDef.short}</span>
                    </span>
                    {isActive && (
                      <span style={{ display:'block', fontFamily:'var(--font-geist-mono)', fontSize:9, color:'#B58863', letterSpacing:1, marginTop:2 }}>Running...</span>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <div style={{ height:1, flex:1, margin:'18px 8px 0', borderRadius:1, transition:'background-color 700ms', background: lineIsFilled(idx) ? P.accent : P.lineBg }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Status strip */}
        <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${P.lineBg}`, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {loading ? (
            <span style={{ fontFamily:'var(--font-geist-mono)', fontSize:11, color:P.warm, display:'flex', alignItems:'center', gap:6 }}>
              <Loader2 className="animate-spin" style={{ width:14, height:14, color:P.accent }} />
              {activeStepLabel ? `${activeStepLabel} running` : "Starting up..."} · Step {completedCount + 1} / 5
            </span>
          ) : result ? (
            <>
              <span style={{
                display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:5,
                fontFamily:'var(--font-geist-mono)', fontSize:11, fontWeight:600,
                background: result.confidence > 0.7 ? 'rgba(74,140,106,0.12)' : result.confidence > 0.4 ? 'rgba(211,163,118,0.15)' : 'rgba(192,97,74,0.12)',
                border: `1px solid ${result.confidence > 0.7 ? '#4A8C6A' : result.confidence > 0.4 ? '#D3A376' : '#C0614A'}`,
                color: result.confidence > 0.7 ? '#4A8C6A' : result.confidence > 0.4 ? '#8C6E63' : '#C0614A',
              }}>
                <CheckCircle2 style={{ width:12, height:12 }} />
                {(result.confidence * 100).toFixed(0)}% confidence
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:5, fontFamily:'var(--font-geist-mono)', fontSize:10, background:P.s2, border:`1px solid ${P.border}`, color:P.warm }}>
                {result.iterations_used} iteration{result.iterations_used !== 1 ? "s" : ""}
              </span>
              {result.from_cache && (
                <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:5, fontFamily:'var(--font-geist-mono)', fontSize:10, background:'rgba(211,163,118,0.1)', border:`1px solid ${P.border}`, color:P.warm }}>
                  Cached result
                </span>
              )}
            </>
          ) : null}
        </div>

        {/* Live Execution Log */}
        {(loading || (result?.reasoning_trace && result.reasoning_trace.length > 0)) && (
          <div style={{ marginTop:12, background:P.logBg, border:`1px solid ${P.lineBg}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'8px 14px', borderBottom:`1px solid ${P.lineBg}`, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#C0614A', display:'block' }} />
                <span style={{ width:8, height:8, borderRadius:'50%', background:P.accent, display:'block' }} />
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#4A8C6A', display:'block' }} />
              </div>
              <span style={{ fontFamily:'var(--font-geist-mono)', fontSize:10, color:P.muted, letterSpacing:2 }}>EXECUTION LOG</span>
              {loading && <span style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:P.accent, display:'block', animation:'pulse 1s infinite' }} />}
            </div>
            <div style={{ maxHeight:120, overflowY:'auto', padding:'10px 14px', display:'flex', flexDirection:'column', gap:4 }}>
              {result?.reasoning_trace?.length ? (
                result.reasoning_trace.map((trace, idx) => (
                  <div key={idx} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ fontFamily:'var(--font-geist-mono)', fontSize:10, color:'#b45309', whiteSpace:'nowrap', marginTop:1 }}>
                      {new Date(trace.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                    <span style={{ fontFamily:'var(--font-geist-mono)', fontSize:10, color: trace.status === 'success' ? '#4A8C6A' : trace.status === 'failed' ? '#C0614A' : trace.status === 'retrying' ? P.accent : '#1c1917' }}>
                      [{trace.agent}]
                    </span>
                    <span style={{ fontFamily:'var(--font-geist-mono)', fontSize:10, color:P.teal, flex:1 }}>
                      {trace.output_summary}
                    </span>
                  </div>
                ))
              ) : loading ? (
                <span style={{ fontFamily:'var(--font-geist-mono)', fontSize:10, color:P.muted }}>{'›'} Initializing agents...</span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
