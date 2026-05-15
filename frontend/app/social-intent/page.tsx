"use client";

import { useState } from "react";
import { runSearch, initiateCall } from "@/lib/api";
import { Lead, mapLeads } from "@/lib/mappers";
import { Clock, Search, User, Loader2, Phone, ExternalLink, Flame, Zap, Snowflake, ArrowRight } from "lucide-react";

interface CallLog {
  callId: string;
  prospectName: string;
  status: string;
  timestamp: string;
}

const EXAMPLE_QUERIES = [
  "Healthcare SaaS VP Sales",
  "Fintech startup CTO",
  "AI tools decision makers",
  "Series B enterprise software",
];

export default function SocialIntentAgent() {
  const [searches, setSearches] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [phone, setPhone] = useState("");
  const [callLoading, setCallLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchSubmit = async (searchKw: string) => {
    if (!searchKw.trim()) return;
    setHasSearched(true);
    setLoading(true);
    setError(null);
    setKeyword("");
    setSelectedLead(null);
    setCallStatus(null);
    setCallId(null);
    setSearches(prev => [searchKw, ...prev.filter(s => s !== searchKw)]);
    try {
      const response = await runSearch(searchKw);
      setLeads(mapLeads(response.leads));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while fetching leads.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async () => {
    if (!selectedLead || !phone.trim()) return;
    setCallLoading(true);
    setCallStatus("pending");
    try {
      const response = await initiateCall(
        selectedLead.prospectName,
        phone,
        `${selectedLead.role} at ${selectedLead.company}. Signal: ${selectedLead.signal}`
      );
      setCallStatus(response.call_status);
      setCallId(response.call_id);
      setCallLogs(prev => [{
        callId: response.call_id ?? "unknown",
        prospectName: selectedLead.prospectName,
        status: response.call_status,
        timestamp: new Date().toISOString()
      }, ...prev]);
    } catch (error) {
      console.error(error);
      setCallStatus("failed");
    } finally {
      setCallLoading(false);
    }
  };

  const getIntentBadge = (score: number) => {
    if (score >= 75) return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(192,97,74,0.12)', border: '1px solid rgba(192,97,74,0.4)', color: '#C0614A' }}>
        <Flame className="w-3 h-3" /> Hot
      </span>
    );
    if (score >= 50) return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(211,163,118,0.15)', border: '1px solid rgba(211,163,118,0.5)', color: '#8C6E63' }}>
        <Zap className="w-3 h-3" /> Warm
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(176,144,128,0.15)', border: '1px solid rgba(176,144,128,0.4)', color: '#B09080' }}>
        <Snowflake className="w-3 h-3" /> Cold
      </span>
    );
  };

  const getCallStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "connected" || s === "initiated") return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(74,140,106,0.12)', border: '1px solid rgba(74,140,106,0.4)', color: '#4A8C6A' }}>Connected</span>
    );
    if (s === "failed") return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(192,97,74,0.1)', border: '1px solid rgba(192,97,74,0.35)', color: '#C0614A' }}>Failed</span>
    );
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(211,163,118,0.12)', border: '1px solid rgba(211,163,118,0.4)', color: '#8C6E63' }}>{status}</span>
    );
  };

  // ─── HERO / EMPTY STATE ────────────────────────────────────────────────────
  if (!hasSearched) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 112px)',
        background: '#FFF2DF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
      }}>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          .si-hero { animation: fadeUp 0.5s ease both; }
          .si-hero-2 { animation: fadeUp 0.5s 0.1s ease both; }
          .si-hero-3 { animation: fadeUp 0.5s 0.2s ease both; }
          .si-hero-4 { animation: fadeUp 0.5s 0.3s ease both; }
        `}} />

        {/* Icon */}
        <div className="si-hero" style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(211,163,118,0.15)', border: '1px solid rgba(211,163,118,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <Search style={{ width: 28, height: 28, color: '#D3A376' }} />
        </div>

        {/* Heading */}
        <h1 className="si-hero-2" style={{
          fontFamily: 'var(--font-geist-mono)', fontWeight: 800, fontSize: 40,
          letterSpacing: -2, color: '#3E2522', marginBottom: 12, textAlign: 'center',
        }}>
          Social Intent Agent
        </h1>
        <p className="si-hero-3" style={{
          color: '#8C6E63', fontSize: 15, marginBottom: 40, textAlign: 'center', maxWidth: 460,
        }}>
          Find high-intent prospects from LinkedIn signals and initiate AI-powered outreach instantly.
        </p>

        {/* Search bar */}
        <div className="si-hero-3" style={{ width: '100%', maxWidth: 580 }}>
          <div style={{ position: 'relative', display: 'flex', gap: 0 }}>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearchSubmit(keyword)}
              placeholder="e.g. Healthcare SaaS VP Sales, Fintech CTO..."
              autoFocus
              style={{
                flex: 1, padding: '16px 20px', fontSize: 15,
                background: '#FFF8EF', border: '1px solid #E8C9A0',
                borderRight: 'none',
                borderRadius: '12px 0 0 12px', color: '#3E2522',
                outline: 'none', transition: 'border-color 200ms, box-shadow 200ms',
                fontFamily: 'var(--font-geist-sans)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#D3A376'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,163,118,0.12)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E8C9A0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              onClick={() => handleSearchSubmit(keyword)}
              disabled={!keyword.trim()}
              style={{
                padding: '16px 24px', background: '#3E2522', color: '#FFF2DF',
                border: 'none', borderRadius: '0 12px 12px 0',
                fontSize: 14, fontWeight: 700, cursor: keyword.trim() ? 'pointer' : 'not-allowed',
                opacity: keyword.trim() ? 1 : 0.45,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 200ms',
              }}
              onMouseEnter={e => { if (keyword.trim()) e.currentTarget.style.background = '#5A2E28'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#3E2522'; }}
            >
              <Search style={{ width: 18, height: 18 }} /> Search
            </button>
          </div>

          {/* Example pills */}
          <div className="si-hero-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
            {EXAMPLE_QUERIES.map((q, i) => (
              <button key={i} onClick={() => handleSearchSubmit(q)}
                style={{
                  padding: '6px 14px', background: 'transparent',
                  border: '1px solid #E8C9A0', borderRadius: 100,
                  fontSize: 12, color: '#8C6E63', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 180ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D3A376'; e.currentTarget.style.color = '#3E2522'; e.currentTarget.style.background = 'rgba(211,163,118,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8C9A0'; e.currentTarget.style.color = '#8C6E63'; e.currentTarget.style.background = 'transparent'; }}
              >
                <ArrowRight style={{ width: 12, height: 12, color: '#D3A376' }} /> {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS STATE ─────────────────────────────────────────────────────────
  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 112px)', background: '#FFF2DF' }}>

      {/* Left — Past Searches */}
      <div className="w-60 overflow-y-auto flex flex-col shrink-0" style={{ borderRight: '1px solid #E8C9A0', background: '#FFF8EF' }}>
        <div className="px-4 py-4" style={{ borderBottom: '1px solid #F0D8B8' }}>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>
            <Clock className="w-3.5 h-3.5" style={{ color: '#D3A376' }} /> Searches
          </h2>
        </div>
        <div className="p-3 flex-1">
          <div className="flex flex-col gap-1">
            {searches.map((s, idx) => (
              <button key={idx} onClick={() => handleSearchSubmit(s)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ color: '#8C6E63' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(211,163,118,0.12)'; e.currentTarget.style.color = '#3E2522'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8C6E63'; }}
              >
                <span style={{ color: '#D3A376', marginRight: 6 }}>›</span>{s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle — Lead Feed */}
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ background: '#FFF2DF' }}>

        {/* Sticky compact search bar */}
        <div className="px-5 py-3 sticky top-0 z-10" style={{ borderBottom: '1px solid #E8C9A0', background: 'rgba(255,242,223,0.97)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: 2, color: '#B09080', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Social Intent
            </span>
            <div style={{ width: 1, height: 16, background: '#E8C9A0' }} />
            <div className="flex gap-2 flex-1">
              <input
                type="text" value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearchSubmit(keyword)}
                placeholder="New search..."
                className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none transition-all"
                style={{ background: '#FFF8EF', border: '1px solid #E8C9A0', color: '#3E2522' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#D3A376')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E8C9A0')}
              />
              <button onClick={() => handleSearchSubmit(keyword)}
                disabled={loading || !keyword.trim()}
                className="px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: '#3E2522', color: '#FFF2DF', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { if (!loading && keyword.trim()) e.currentTarget.style.background = '#5A2E28'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#3E2522'; }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="px-5 py-4 flex-1">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: '#FFEBD0', border: '1px solid #E8C9A0' }}>
                  <div className="h-5 rounded w-48 mb-2" style={{ background: '#F0D8B8' }}></div>
                  <div className="h-4 rounded w-32 mb-3" style={{ background: '#E8C9A0' }}></div>
                  <div className="h-8 rounded" style={{ background: '#F0D8B8' }}></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <div style={{ color: '#D3A376', marginBottom: 12 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#3E2522', marginBottom: 4 }}>Error fetching leads</p>
              <p className="text-xs" style={{ color: '#B09080', maxWidth: 300, textAlign: 'center' }}>{error}</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <Search className="w-12 h-12 mb-4 opacity-20" style={{ color: '#D3A376' }} />
              <p className="text-sm" style={{ fontFamily: 'var(--font-geist-mono)', color: '#B09080' }}>No leads found — try a different keyword</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead, idx) => (
                <div key={idx} onClick={() => setSelectedLead(lead)}
                  className="rounded-xl p-5 cursor-pointer transition-all"
                  style={{
                    background: selectedLead?.prospectName === lead.prospectName ? '#FFEBD0' : '#FFF8EF',
                    border: `1px solid ${selectedLead?.prospectName === lead.prospectName ? '#D3A376' : '#E8C9A0'}`,
                    boxShadow: selectedLead?.prospectName === lead.prospectName ? '0 2px 12px rgba(211,163,118,0.18)' : 'none',
                  }}
                  onMouseEnter={e => { if (selectedLead?.prospectName !== lead.prospectName) e.currentTarget.style.borderColor = '#D3A376'; }}
                  onMouseLeave={e => { if (selectedLead?.prospectName !== lead.prospectName) e.currentTarget.style.borderColor = '#E8C9A0'; }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: '#3E2522' }}>{lead.prospectName}</h3>
                      <p className="text-sm mt-0.5" style={{ color: '#8C6E63' }}>{lead.role} at {lead.company}</p>
                    </div>
                    {getIntentBadge(lead.intentScore)}
                  </div>
                  <p className="text-sm mt-3 line-clamp-2" style={{ color: '#B09080' }}>{lead.signal}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — Lead Detail */}
      <div className="w-96 overflow-y-auto shrink-0" style={{ borderLeft: '1px solid #E8C9A0', background: '#FFF8EF' }}>
        {!selectedLead ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <User className="w-10 h-10 mb-3 opacity-20" style={{ color: '#D3A376' }} />
            <p className="text-sm" style={{ fontFamily: 'var(--font-geist-mono)', color: '#B09080' }}>Select a lead to view details</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="px-6 py-5" style={{ borderBottom: '1px solid #F0D8B8' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#3E2522' }}>{selectedLead.prospectName}</h2>
                  <p className="text-sm mt-1" style={{ color: '#8C6E63' }}>{selectedLead.role} at {selectedLead.company}</p>
                </div>
                {getIntentBadge(selectedLead.intentScore)}
              </div>
              {/* Score bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Intent Score</span>
                  <span className="text-sm font-bold" style={{ color: selectedLead.intentScore >= 75 ? '#C0614A' : selectedLead.intentScore >= 50 ? '#D3A376' : '#B09080' }}>
                    {selectedLead.intentScore} / 100
                  </span>
                </div>
                <div style={{ height: 6, background: '#F0D8B8', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${selectedLead.intentScore}%`,
                    background: selectedLead.intentScore >= 75
                      ? 'linear-gradient(90deg, #C0614A, #D3A376)'
                      : selectedLead.intentScore >= 50
                      ? 'linear-gradient(90deg, #D3A376, #E8C9A0)'
                      : '#E8C9A0',
                    transition: 'width 600ms ease',
                  }} />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Signal */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Intent Signal</h4>
                <div className="rounded-lg p-4 text-sm leading-relaxed" style={{ background: '#FFEBD0', border: '1px solid #E8C9A0', color: '#8C6E63' }}>
                  {selectedLead.signal}
                </div>
              </div>

              {/* Profile link */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Social Profile</h4>
                <a href={selectedLead.postUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: '#D3A376' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#3E2522')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#D3A376')}
                >
                  <ExternalLink className="w-4 h-4" /> View LinkedIn Profile
                </a>
              </div>

              <div style={{ borderTop: '1px solid #F0D8B8' }} />

              {/* Call */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Initiate Voice Call</h4>
                <div className="flex flex-col gap-3">
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="px-4 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
                    style={{ background: '#FFEBD0', border: '1px solid #E8C9A0', color: '#3E2522' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#D3A376')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#E8C9A0')}
                  />
                  <button onClick={handleCall} disabled={callLoading || !phone.trim()}
                    className="w-full py-3 rounded-xl flex justify-center items-center gap-2 text-sm font-semibold transition-all disabled:opacity-40"
                    style={{ background: '#3E2522', color: '#FFF2DF' }}
                    onMouseEnter={e => { if (!callLoading && phone.trim()) e.currentTarget.style.background = '#5A2E28'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#3E2522'; }}
                  >
                    {callLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Initiating...</> : <><Phone className="w-4 h-4" /> Call This Lead</>}
                  </button>
                  {callStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Status</span>
                      <div className="flex items-center gap-2">
                        {getCallStatusBadge(callStatus)}
                        {callId && <span className="text-[10px] font-mono" style={{ color: '#B09080' }}>ID: {callId.slice(0, 8)}...</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {callLogs.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid #F0D8B8' }} />
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Voice Agent Log</h4>
                    <div className="flex flex-col">
                      {callLogs.map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F0D8B8' }}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium" style={{ color: '#3E2522' }}>{log.prospectName}</span>
                            <span className="text-[10px] font-mono" style={{ color: '#B09080' }}>
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.callId.slice(0, 8)}...
                            </span>
                          </div>
                          {getCallStatusBadge(log.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
