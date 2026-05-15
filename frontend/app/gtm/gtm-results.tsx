"use client";
import { GTMResponse } from "@/lib/mappers";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, BarChart2, Building2, List, Mail } from "lucide-react";

const mono = 'var(--font-geist-mono)';
const C = { bg:'#FFF2DF', surface:'#FFF8EF', s2:'#FFE0B2', card:'#FFEBD0', border:'#E8C9A0', bs:'#F0D8B8', accent:'#D3A376', teal:'#8C6E63', muted:'#B09080', warm:'#8C6E63', linen:'#3E2522', hot:'#C0614A', success:'#4A8C6A', input:'#FFF8EF', logBg:'#FFF8EF', lineBg:'#E8C9A0' };

function sLabel(text: string) {
  return <span style={{ display:'block', fontFamily:mono, fontSize:10, letterSpacing:2, textTransform:'uppercase' as const, color:C.muted, fontWeight:600, marginBottom:12 }}>{text}</span>;
}

export function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  const base = { display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:5, fontFamily:mono, fontSize:9, letterSpacing:1, fontWeight:600 } as const;
  if (s === "success") return <span style={{ ...base, background:'rgba(74,140,106,0.08)', border:'1px solid #4A8C6A', color:C.success }}><CheckCircle2 style={{width:11,height:11}}/> Success</span>;
  if (s === "failed") return <span style={{ ...base, background:'rgba(192,97,74,0.08)', border:'1px solid #C0614A', color:C.hot }}><XCircle style={{width:11,height:11}}/> Failed</span>;
  if (s === "partial") return <span style={{ ...base, background:'rgba(181,136,99,0.08)', border:'1px solid #B58863', color:C.accent }}><AlertCircle style={{width:11,height:11}}/> Partial</span>;
  if (s === "retrying") return <span style={{ ...base, background:'rgba(181,136,99,0.08)', border:'1px solid #B58863', color:C.accent }}><RefreshCw className="animate-spin" style={{width:11,height:11}}/> Retrying</span>;
  return <span style={{ ...base, background:'transparent', border:'1px solid #2A3540', color:C.muted }}>{status}</span>;
}

export function getConfidenceColor(score: number) {
  if (score > 0.7) return C.success;
  if (score > 0.4) return C.accent;
  return C.hot;
}

function confGrad(score: number) {
  if (score > 0.7) return 'linear-gradient(90deg, #4A8C6A, #6aad8a)';
  if (score > 0.4) return 'linear-gradient(90deg, #D3A376, #C49060)';
  return 'linear-gradient(90deg, #C0614A, #d4795e)';
}

interface Props { result: GTMResponse; activeTab: string; }

export function GTMResults({ result, activeTab }: Props) {
  const personaColors = ['#D3A376', '#8C6E63', '#B09080'];

  return (
    <>
      {/* STRATEGY TAB */}
      {activeTab === "strategy" && result.gtm_strategy && (
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          {/* Confidence Card */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 24px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:24 }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:10 }}>
                <span style={{ fontFamily:mono, fontSize:10, letterSpacing:2.5, textTransform:'uppercase', color:C.muted, fontWeight:700 }}>Confidence Score</span>
                <span style={{ fontFamily:mono, fontSize:32, fontWeight:800, color: getConfidenceColor(result.confidence) }}>{(result.confidence*100).toFixed(0)}%</span>
              </div>
              <div style={{ width:'100%', background:C.s2, height:6, borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:6, borderRadius:99, transition:'width 1000ms', width:`${result.confidence*100}%`, background: confGrad(result.confidence) }}/>
              </div>
            </div>
            <div style={{ width:1, height:40, background:C.border }} className="hidden md:block"/>
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <div style={{ textAlign:'center' }}>
                <span style={{ display:'block', fontFamily:mono, fontSize:10, letterSpacing:2, textTransform:'uppercase', color:C.muted, fontWeight:700, marginBottom:6 }}>Iterations</span>
                <span style={{ display:'inline-flex', padding:'4px 12px', borderRadius:5, fontFamily:mono, fontSize:11, background:C.s2, border:`1px solid ${C.border}`, color:C.warm }}>{result.iterations_used} / 3</span>
              </div>
              {result.from_cache && (
                <div style={{ textAlign:'center' }}>
                  <span style={{ display:'block', fontFamily:mono, fontSize:10, letterSpacing:2, textTransform:'uppercase', color:C.muted, fontWeight:700, marginBottom:6 }}>Source</span>
                  <span style={{ display:'inline-flex', padding:'4px 12px', borderRadius:5, fontFamily:mono, fontSize:11, background:'rgba(17,98,100,0.08)', border:'1px solid rgba(17,98,100,0.3)', color:C.warm }}>Cached</span>
                </div>
              )}
            </div>
          </div>

          {/* Hooks */}
          {result.gtm_strategy.hooks?.length > 0 && (
            <div>{sLabel("Outreach Hooks")}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {result.gtm_strategy.hooks.map((hook, i) => (
                  <div key={i} style={{ background:C.input, borderLeft:'3px solid #B58863', border:'1px solid #1E2A30', borderLeftWidth:3, borderLeftColor:'#B58863', borderRadius:10, padding:'14px 16px', color:C.linen, fontSize:13, lineHeight:1.7 }}>{hook}</div>
                ))}
              </div>
            </div>
          )}

          {/* Angles */}
          {result.gtm_strategy.angles?.length > 0 && (
            <div>{sLabel("Sales Angles")}
              <ul style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 24px', display:'flex', flexDirection:'column', gap:14, listStyle:'none', margin:0 }}>
                {result.gtm_strategy.angles.map((a, i) => (
                  <li key={i} style={{ display:'flex', gap:10, fontSize:13, color:C.warm, alignItems:'flex-start' }}>
                    <span style={{ color:C.teal, marginTop:2, fontSize:10 }}>◆</span>
                    <span style={{ lineHeight:1.7 }}>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Personas */}
          {result.persona_strategies && Object.keys(result.persona_strategies).length > 0 && (
            <div>{sLabel("Persona Strategies")}
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(result.persona_strategies).map(([persona, strategy], idx) => (
                  <div key={idx} style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`4px solid ${personaColors[idx%3]}`, borderRadius:12, padding:'20px 18px', display:'flex', flexDirection:'column' }}>
                    <div style={{ fontFamily:mono, fontSize:10, letterSpacing:2, textTransform:'uppercase', color:C.muted, fontWeight:700, marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${C.bs}` }}>{persona.replace(/_/g," ")}</div>
                    <p style={{ fontSize:13, color:C.warm, lineHeight:1.7, flex:1 }}>{String(strategy)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ICP */}
          {result.icp_insights && (
            <div>{sLabel("ICP Insights")}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'24px 28px' }}>
                <div className="grid md:grid-cols-3 gap-6" style={{ marginBottom:20, paddingBottom:20, borderBottom:`1px solid ${C.lineBg}` }}>
                  {['ideal_title','ideal_stage','ideal_industry'].map(k => (
                    <div key={k}>
                      <span style={{ display:'block', fontFamily:mono, fontSize:10, letterSpacing:2, textTransform:'uppercase', color:C.muted, fontWeight:700, marginBottom:6 }}>{k.replace(/_/g,' ')}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:C.linen }}>{String((result.icp_insights as Record<string,unknown>)[k] || "-")}</span>
                    </div>
                  ))}
                </div>
                {Array.isArray((result.icp_insights as Record<string,unknown>).pain_points) && (
                  <div>
                    <span style={{ display:'block', fontFamily:mono, fontSize:10, letterSpacing:2, textTransform:'uppercase', color:C.muted, fontWeight:700, marginBottom:14 }}>Pain Points</span>
                    <ul className="grid md:grid-cols-2 gap-3" style={{ listStyle:'none', margin:0, padding:0 }}>
                      {((result.icp_insights as Record<string,unknown>).pain_points as string[]).map((pt,i) => (
                        <li key={i} style={{ display:'flex', gap:8, fontSize:13, color:C.warm, alignItems:'flex-start' }}>
                          <XCircle style={{ width:14, height:14, color:C.hot, flexShrink:0, marginTop:2 }}/> {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emails */}
          {result.gtm_strategy.email_snippets?.length > 0 && (
            <div>{sLabel("Email Snippets")}
              <div className="grid md:grid-cols-2 gap-4">
                {result.gtm_strategy.email_snippets.map((sn: {company:string;subject:string;body:string}, i) => (
                  <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 22px', display:'flex', flexDirection:'column' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${C.bs}` }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(17,98,100,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Mail style={{ width:14, height:14, color:C.accent }}/>
                      </div>
                      <div>
                        <div style={{ fontFamily:mono, fontSize:10, color:C.muted, letterSpacing:1.5 }}>{sn.company}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:C.linen }}>Subject: {sn.subject}</div>
                      </div>
                    </div>
                    <div style={{ background:C.input, border:`1px solid ${C.lineBg}`, borderRadius:8, padding:14, flex:1 }}>
                      <p style={{ fontFamily:mono, fontSize:11, color:C.warm, whiteSpace:'pre-wrap', lineHeight:1.8, margin:0 }}>{sn.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPANIES TAB */}
      {activeTab === "results" && result.results && (
        <>
          {result.results.length === 0 ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'48px 24px', textAlign:'center' }}>
              <Building2 style={{ width:48, height:48, color:'#2A3540', margin:'0 auto 16px' }}/>
              <h3 style={{ color:C.warm, fontWeight:600, fontSize:16, marginBottom:4 }}>No matches found</h3>
              <p style={{ color:C.muted, fontSize:13 }}>Try adjusting your query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.results.map((co: Record<string,unknown>, idx) => {
                const score = co.intent_score as number | undefined;
                const scoreColor = score !== undefined ? getConfidenceColor(score/100) : C.muted;
                const dqColor = co.data_quality === 'high' ? C.success : co.data_quality === 'medium' ? C.accent : C.hot;
                return (
                  <div key={idx} className="transition-all" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(181,136,99,0.3)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${C.lineBg}` }}>
                      <div>
                        <h3 style={{ color:C.linen, fontWeight:700, fontSize:15, marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
                          {String(co.name)}
                          {co.data_quality && <span style={{ fontFamily:mono, fontSize:9, letterSpacing:1, padding:'2px 6px', borderRadius:4, border:`1px solid ${dqColor}`, color:dqColor, background: dqColor === C.success ? 'rgba(74,140,106,0.08)' : dqColor === C.accent ? 'rgba(181,136,99,0.08)' : 'rgba(192,97,74,0.08)' }}>{String(co.data_quality).toUpperCase()}</span>}
                        </h3>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {['industry','region','size','funding_stage'].map(k => co[k] ? (
                            <span key={k} style={{ fontFamily:mono, fontSize:11, padding:'2px 8px', borderRadius:6, background:C.s2, border:`1px solid ${C.border}`, color:'#7A8A92' }}>{String(co[k])}</span>
                          ) : null)}
                        </div>
                      </div>
                      {score !== undefined && (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginLeft:12, flexShrink:0 }}>
                          <span style={{ fontFamily:mono, fontSize:9, letterSpacing:2, textTransform:'uppercase', color:C.muted, marginBottom:4 }}>INTENT</span>
                          <div style={{ position:'relative', width:52, height:52, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }} viewBox="0 0 36 36">
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1C2830" strokeWidth="3"/>
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scoreColor} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${score}, 100`}/>
                            </svg>
                            <span style={{ position:'absolute', fontFamily:mono, fontSize:14, fontWeight:800, color:scoreColor }}>{String(score)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3" style={{ marginBottom:12 }}>
                      {co.hiring_signal && (
                        <div style={{ background:'rgba(74,140,106,0.06)', border:'1px solid rgba(74,140,106,0.2)', borderRadius:8, padding:'10px 12px' }}>
                          <span style={{ display:'block', fontFamily:mono, fontSize:9, letterSpacing:1.5, color:C.success, marginBottom:4 }}>HIRING</span>
                          <span style={{ fontSize:12, color:C.warm }}>{String(co.hiring_signal)}</span>
                        </div>
                      )}
                      {co.growth_signal && (
                        <div style={{ background:'rgba(17,98,100,0.06)', border:'1px solid rgba(17,98,100,0.2)', borderRadius:8, padding:'10px 12px' }}>
                          <span style={{ display:'block', fontFamily:mono, fontSize:9, letterSpacing:1.5, color:C.teal, marginBottom:4 }}>GROWTH</span>
                          <span style={{ fontSize:12, color:C.warm }}>{String(co.growth_signal)}</span>
                        </div>
                      )}
                    </div>

                    {Array.isArray(co.tech_stack) && co.tech_stack.length > 0 && (
                      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6 }}>
                        <span style={{ fontFamily:mono, fontSize:9, color:C.muted, letterSpacing:1.5 }}>TECH</span>
                        {co.tech_stack.map((t: string, ti: number) => (
                          <span key={ti} style={{ fontFamily:mono, fontSize:9, letterSpacing:0.5, padding:'2px 8px', borderRadius:4, background:C.s2, border:`1px solid ${C.border}`, color:C.warm }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TRACE TAB */}
      {activeTab === "trace" && result.reasoning_trace && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {result.reasoning_trace.map((trace, idx) => (
            <div key={idx} style={{ background:C.logBg, border:`1px solid ${C.lineBg}`, borderRadius:10, padding:'16px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${C.lineBg}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:mono, fontSize:13, color:C.accent, fontWeight:700 }}>{'>'} {trace.agent.replace(/Agent$/, '')}_Agent</span>
                  {getStatusBadge(trace.status)}
                </div>
                <span style={{ fontFamily:mono, fontSize:10, color:'#3D4D55' }}>{new Date(trace.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
              </div>
              <pre style={{ fontFamily:mono, fontSize:11, color:'#7A8A92', whiteSpace:'pre-wrap', lineHeight:1.8, margin:0 }}>{trace.output_summary}</pre>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
