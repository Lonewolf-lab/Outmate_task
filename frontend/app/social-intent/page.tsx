"use client";

import { useState } from "react";
import { runSearch, initiateCall } from "@/lib/api";
import { Lead, mapLeads } from "@/lib/mappers";
import { Clock, Search, User, Loader2, Phone, ExternalLink, TrendingUp, Minus, TrendingDown, ArrowRight, X, ThumbsUp, MessageSquare } from "lucide-react";

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
    setKeyword("");
    setSelectedLead(null);
    setCallStatus(null);
    setCallId(null);
    setSearches(prev => [searchKw, ...prev.filter(s => s !== searchKw)]);
    try {
      const response = await runSearch(searchKw);
      setLeads(mapLeads(response.leads));
    } catch (error) {
      console.error(error);
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
    if (score >= 70) return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <TrendingUp className="w-3 h-3" /> High
      </span>
    );
    if (score >= 40) return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Minus className="w-3 h-3" /> Medium
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <TrendingDown className="w-3 h-3" /> Low
      </span>
    );
  };

  const getSidebarIntentDisplay = (score: number) => {
    let styleClass = "";
    let Icon = TrendingDown;
    let label = "Low";

    if (score >= 70) {
      styleClass = "bg-green-50 text-green-700 border-green-200";
      Icon = TrendingUp;
      label = "High";
    } else if (score >= 40) {
      styleClass = "bg-amber-50 text-amber-700 border-amber-200";
      Icon = Minus;
      label = "Medium";
    } else {
      styleClass = "bg-slate-50 text-slate-600 border-slate-200";
      Icon = TrendingDown;
      label = "Low";
    }

    return (
      <div className="mb-5">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 ${styleClass}`}>
          <Icon className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{label}</span>
        </div>
        {/* Intent Score Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Intent Score</span>
            <span className="text-sm font-bold text-slate-900">{score}/100</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${score}%`,
                backgroundColor: '#3E2522'
              }}
            />
          </div>
        </div>
      </div>
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

  const getInitials = (name: string) => {
    const p = name.split(" ");
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return name ? name[0].toUpperCase() : "U";
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
          Find prospects actively discussing your keywords on LinkedIn and initiate AI-powered outreach instantly.
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
      <div className="w-64 overflow-y-auto flex flex-col shrink-0" style={{ borderRight: '1px solid #E8C9A0', background: '#FFF8EF' }}>
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #F0D8B8' }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>
            <Clock className="w-4 h-4" style={{ color: '#D3A376' }} /> Search History
          </h2>
        </div>
        <div className="p-4 flex-1">
          {searches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
               <Search className="w-8 h-8 mb-2" style={{ color: '#D3A376' }} />
               <p className="text-xs" style={{ fontFamily: 'var(--font-geist-mono)', color: '#B09080' }}>No search history</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {searches.map((s, idx) => (
                <button key={idx} onClick={() => handleSearchSubmit(s)}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all"
                  style={{ color: '#8C6E63', background: 'rgba(211,163,118,0.05)', border: '1px solid rgba(211,163,118,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(211,163,118,0.15)'; e.currentTarget.style.color = '#3E2522'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(211,163,118,0.05)'; e.currentTarget.style.color = '#8C6E63'; }}
                >
                  <span style={{ color: '#D3A376', marginRight: 8 }}>›</span>{s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — Lead Feed */}
      <div className="flex-1 min-w-0 overflow-y-auto flex flex-col transition-all duration-300" style={{ background: '#FFF2DF' }}>

        <div className="px-8 pt-8 pb-6 sticky top-0 z-10" style={{ borderBottom: '1px solid #E8C9A0', background: 'rgba(255,242,223,0.97)', backdropFilter: 'blur(12px)' }}>
          <h1 className="text-2xl font-bold text-slate-900 mb-1" style={{ color: '#3E2522' }}>Social Intent</h1>
          <p className="text-sm text-slate-500 mb-6" style={{ color: '#8C6E63' }}>Find prospects actively discussing your keywords on LinkedIn</p>

          <div className="flex gap-3">
            <input
              type="text" value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearchSubmit(keyword)}
              placeholder="New search..."
              className="flex-1 px-5 py-3 rounded-xl text-base focus:outline-none transition-all"
              style={{ background: '#FFF8EF', border: '1px solid #E8C9A0', color: '#3E2522' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#D3A376')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E8C9A0')}
            />
            <button onClick={() => handleSearchSubmit(keyword)}
              disabled={loading || !keyword.trim()}
              className="px-6 py-3 rounded-xl flex items-center gap-2 text-base font-semibold transition-all disabled:opacity-40"
              style={{ background: '#3E2522', color: '#FFF2DF', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { if (!loading && keyword.trim()) e.currentTarget.style.background = '#5A2E28'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#3E2522'; }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search
            </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="px-8 py-6 flex-1 max-w-4xl w-full mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl p-5 animate-pulse flex gap-4" style={{ background: '#FFEBD0', border: '1px solid #E8C9A0' }}>
                  <div className="w-12 h-12 rounded-full" style={{ background: '#F0D8B8' }} />
                  <div className="flex-1">
                    <div className="h-5 rounded w-48 mb-2" style={{ background: '#F0D8B8' }}></div>
                    <div className="h-4 rounded w-32 mb-4" style={{ background: '#E8C9A0' }}></div>
                    <div className="h-4 rounded w-full mb-2" style={{ background: '#E8C9A0' }}></div>
                    <div className="h-4 rounded w-3/4" style={{ background: '#F0D8B8' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <Search className="w-12 h-12 mb-4 opacity-20" style={{ color: '#D3A376' }} />
              <p className="text-sm" style={{ fontFamily: 'var(--font-geist-mono)', color: '#B09080' }}>No leads found — try a different keyword</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {leads.map((lead, idx) => (
                <div key={idx} onClick={() => setSelectedLead(lead)}
                  className="rounded-xl p-5 cursor-pointer transition-all flex gap-4"
                  style={{
                    background: '#FFF8EF',
                    border: '1px solid #E8C9A0',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#D3A376'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(211,163,118,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8C9A0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="shrink-0">
                    {lead.authorAvatar ? (
                      <img src={lead.authorAvatar} alt={lead.prospectName} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(211,163,118,0.2)', color: '#3E2522' }}>
                        {getInitials(lead.prospectName)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start gap-2">
                       <div className="min-w-0 flex-1">
                         <h3 className="text-base font-bold text-slate-900 truncate overflow-hidden">{lead.prospectName}</h3>
                         <p className="text-sm text-slate-500 truncate overflow-hidden" style={{ color: '#8C6E63' }}>{lead.role}</p>
                       </div>
                       <div className="shrink-0">{getIntentBadge(lead.intentScore)}</div>
                     </div>
                     <p className="text-[14px] font-medium mt-2 line-clamp-2" style={{ color: '#1F1211' }}>{lead.postText || lead.signal}</p>
                     
                     <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-500" style={{ color: '#B09080' }}>
                       <span className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5" /> {lead.likesCount}</span>
                       <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {lead.commentsCount}</span>
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {lead.postedAt?.split(' • ')[0] || ''}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-in Sidebar (Push layout) */}
      <div className={`flex-shrink-0 overflow-y-auto transition-all duration-300 ease-in-out ${
        selectedLead ? 'w-[420px]' : 'w-0'
      }`} style={{ background: '#FFF8EF', borderLeft: selectedLead ? '1px solid #E8C9A0' : 'none' }}>
        {selectedLead && (
          <div className="w-[420px] p-6 relative">
              <button onClick={() => setSelectedLead(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors">
                <X className="w-5 h-5" style={{ color: '#8C6E63' }} />
              </button>

              <div className="flex items-center gap-5 mt-2 mb-6">
                {selectedLead.authorAvatar ? (
                  <img src={selectedLead.authorAvatar} alt={selectedLead.prospectName} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-sm" style={{ background: 'rgba(211,163,118,0.2)', color: '#3E2522' }}>
                    {getInitials(selectedLead.prospectName)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#3E2522' }}>{selectedLead.prospectName}</h2>
                  <p className="text-sm text-slate-500" style={{ color: '#8C6E63' }}>{selectedLead.role}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F0D8B8', margin: '24px 0' }} />

              <div>
                {getSidebarIntentDisplay(selectedLead.intentScore)}
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{ color: '#3E2522', fontFamily: 'var(--font-geist-mono)' }}>LINKEDIN POST</h3>
                <div className="max-h-48 overflow-y-auto rounded-lg p-4 text-[15px] font-medium whitespace-pre-wrap leading-relaxed shadow-inner" style={{ background: '#FFEBD0', color: '#1F1211', border: '1px solid #E8C9A0' }}>
                  {selectedLead.postText || selectedLead.signal}
                </div>
                <a href={selectedLead.postUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-4 w-full py-2.5 rounded-lg flex justify-center items-center gap-2 text-sm font-semibold transition-all"
                  style={{ border: '1px solid #3E2522', color: '#3E2522', background: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#3E2522'; e.currentTarget.style.color = '#FFF2DF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3E2522'; }}
                >
                  <ExternalLink className="w-4 h-4" /> View Full Post
                </a>
              </div>

              <div style={{ borderTop: '1px solid #F0D8B8', margin: '24px 0' }} />

              <div className="flex justify-between items-center text-sm font-medium px-4" style={{ color: '#3E2522' }}>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-[14px] h-[14px]" style={{ color: '#3E2522' }} />
                  <span className="whitespace-nowrap">{selectedLead.likesCount} Likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-[14px] h-[14px]" style={{ color: '#3E2522' }} />
                  <span className="whitespace-nowrap">{selectedLead.commentsCount} Comments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-[14px] h-[14px]" style={{ color: '#3E2522' }} />
                  <span className="whitespace-nowrap">{selectedLead.postedAt?.split(' • ')[0] || ''}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F0D8B8', margin: '24px 0' }} />

              <div>
                <a href={selectedLead.authorLinkedinUrl || selectedLead.postUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl flex justify-center items-center gap-2 text-sm font-semibold transition-all"
                  style={{ background: '#3E2522', color: '#FFF2DF' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#5A2E28'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#3E2522'; }}
                >
                  View LinkedIn Profile
                </a>
              </div>



            </div>
        )}
      </div>

    </div>
  );
}
