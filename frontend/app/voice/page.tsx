"use client";

import { useState, useEffect } from "react";
import { RetellWebClient } from "retell-client-js-sdk";
import { initiateCall } from "@/lib/api";
import { Phone, PhoneCall, PhoneForwarded, PhoneMissed, PhoneOff, Loader2 } from "lucide-react";

const retellClient = new RetellWebClient();

interface CallLog {
  callId: string;
  prospectName: string;
  status: string;
  timestamp: string;
  context: string;
}

export default function VoicePage() {
  const [prospectName, setProspectName] = useState("");
  const [prospectPhone, setProspectPhone] = useState("");
  const [context, setContext] = useState("");
  const [callStatus, setCallStatus] = useState<"idle" | "initiating" | "initiated" | "failed">("idle");
  const [callId, setCallId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    const handleCallStarted = () => { setIsCallActive(true); setCallStatus("initiated"); };
    const handleCallEnded = () => { setIsCallActive(false); };
    const handleError = (error: unknown) => { console.error("Retell error:", error); setCallStatus("failed"); setIsCallActive(false); };
    retellClient.on("call_started", handleCallStarted);
    retellClient.on("call_ended", handleCallEnded);
    retellClient.on("error", handleError);
    return () => {
      retellClient.off("call_started", handleCallStarted);
      retellClient.off("call_ended", handleCallEnded);
      retellClient.off("error", handleError);
    };
  }, []);

  const handleCall = async () => {
    setCallStatus("initiating");
    setCallId(null);
    setAccessToken(null);
    try {
      const response = await initiateCall(prospectName, prospectPhone, context);
      setCallId(response.call_id);
      if (response.access_token) {
        setAccessToken(response.access_token);
        await retellClient.startCall({ accessToken: response.access_token });
      }
      const isInitiated = response.call_status === "initiated" || response.call_status === "registered";
      setCallStatus(isInitiated ? "initiated" : "failed");
      setCallLogs(prev => [{
        callId: response.call_id ?? "unknown",
        prospectName,
        status: response.call_status,
        timestamp: new Date().toISOString(),
        context
      }, ...prev]);
    } catch (error) {
      console.error(error);
      setCallStatus("failed");
    }
  };

  const handleEndCall = () => { retellClient.stopCall(); setIsCallActive(false); };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "connected" || s === "initiated" || s === "registered") return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: 'rgba(74,140,106,0.12)', border: '1px solid rgba(74,140,106,0.4)', color: '#4A8C6A' }}>Connected</span>
    );
    if (s === "failed") return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(192,97,74,0.1)', border: '1px solid rgba(192,97,74,0.35)', color: '#C0614A' }}>Failed</span>
    );
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: 'rgba(211,163,118,0.12)', border: '1px solid rgba(211,163,118,0.4)', color: '#8C6E63' }}>{status}</span>
    );
  };

  const inputStyle = {
    background: '#FFF8EF',
    border: '1px solid #E8C9A0',
    color: '#3E2522',
    borderRadius: '0.6rem',
    fontSize: '0.875rem',
    width: '100%',
    padding: '10px 16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font-geist-sans)',
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8" style={{ height: 'calc(100vh - 112px)' }}>

      {/* Left — Call Initiation */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto pr-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#3E2522', fontFamily: 'var(--font-geist-mono)' }}>Voice AI Agent</h1>
          <p className="text-sm" style={{ color: '#B09080' }}>Initiate AI-powered outreach calls to prospects</p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl p-6 mb-6" style={{ background: '#FFF8EF', border: '1px solid #E8C9A0' }}>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Prospect Name *</label>
              <input type="text" value={prospectName} onChange={(e) => setProspectName(e.target.value)}
                placeholder="e.g. John Doe" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#D3A376')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E8C9A0')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Phone Number *</label>
              <input type="tel" value={prospectPhone} onChange={(e) => setProspectPhone(e.target.value)}
                placeholder="+1 (555) 000-0000" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#D3A376')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E8C9A0')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>Context</label>
              <textarea rows={3} value={context} onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. VP of Sales at a fintech startup, interested in CRM switching"
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#D3A376')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E8C9A0')}
              />
            </div>

            <button onClick={handleCall}
              disabled={callStatus === "initiating" || callStatus === "initiated" || !prospectName.trim() || !prospectPhone.trim()}
              className="w-full py-3.5 rounded-xl flex justify-center items-center gap-2 text-base font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: callStatus === "initiated" ? 'rgba(74,140,106,0.2)' : callStatus === "failed" ? 'rgba(192,97,74,0.1)' : '#D3A376',
                color: callStatus === "failed" ? '#C0614A' : '#FFF2DF',
                border: callStatus === "failed" ? '1px solid rgba(192,97,74,0.4)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (callStatus === "idle") e.currentTarget.style.background = '#C49060'; }}
              onMouseLeave={e => { if (callStatus === "idle") e.currentTarget.style.background = '#D3A376'; }}
            >
              {callStatus === "initiating" ? <><Loader2 className="w-5 h-5 animate-spin" /> Initiating Call...</>
                : callStatus === "initiated" ? <><Phone className="w-5 h-5" /> Call Initiated</>
                : callStatus === "failed" ? <><PhoneOff className="w-5 h-5" /> Retry Call</>
                : <><PhoneCall className="w-5 h-5" /> Initiate Call</>}
            </button>
          </div>
        </div>

        {/* Call Status Card */}
        {callStatus !== "idle" && callStatus !== "initiating" && (
          <div className="p-5 rounded-xl mb-6" style={{
            background: callStatus === "failed" ? 'rgba(192,97,74,0.06)' : 'rgba(211,163,118,0.1)',
            border: `1px solid ${callStatus === "failed" ? 'rgba(192,97,74,0.3)' : 'rgba(211,163,118,0.35)'}`,
          }}>
            <h3 className="text-[10px] font-bold mb-3 uppercase tracking-widest" style={{ color: callStatus === "failed" ? '#C0614A' : '#8C6E63', fontFamily: 'var(--font-geist-mono)' }}>Call Status</h3>
            <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: '1px solid rgba(140,110,99,0.12)' }}>
              <span className="text-sm font-medium" style={{ color: '#8C6E63' }}>Message</span>
              {callStatus === "failed"
                ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase" style={{ background: 'rgba(192,97,74,0.2)', color: '#C0614A' }}>Failed</span>
                : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase" style={{ background: 'rgba(74,140,106,0.2)', color: '#4A8C6A' }}>Connected</span>
              }
            </div>
            {callId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: '#8C6E63' }}>Call ID</span>
                <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'rgba(211,163,118,0.1)', border: '1px solid #E8C9A0', color: '#D3A376' }}>{callId}</span>
              </div>
            )}
          </div>
        )}

        {/* Active Call */}
        {isCallActive && (
          <div className="mt-2 rounded-xl p-8 flex flex-col items-center justify-center text-center" style={{ background: '#FFF8EF', border: '1px solid rgba(211,163,118,0.3)' }}>
            {/* Pulsing terracotta rings */}
            <div className="relative flex items-center justify-center w-16 h-16 mb-5">
              <span className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-15" style={{ background: '#D3A376' }}></span>
              <span className="absolute inline-flex w-12 h-12 rounded-full animate-ping opacity-25" style={{ background: '#D3A376', animationDelay: '0.3s' }}></span>
              <span className="relative inline-flex rounded-full w-8 h-8" style={{ background: '#D3A376' }}></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#D3A376', fontFamily: 'var(--font-geist-mono)' }}>LIVE</span>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#3E2522' }}>Call Active</h3>
            <p className="text-sm mb-6" style={{ color: '#B09080' }}>AI Agent Speaking</p>
            <button onClick={handleEndCall}
              className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
              style={{ background: 'rgba(192,97,74,0.2)', color: '#C0614A', border: '1px solid rgba(192,97,74,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,97,74,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,97,74,0.2)'; }}
            >
              <PhoneOff className="w-5 h-5" /> End Call
            </button>
          </div>
        )}
      </div>

      {/* Right — Call History */}
      <div className="w-96 flex flex-col h-full rounded-xl overflow-hidden shrink-0" style={{ background: '#FFF8EF', border: '1px solid #E8C9A0' }}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #F0D8B8' }}>
          <h2 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#B09080', fontFamily: 'var(--font-geist-mono)' }}>
            <PhoneForwarded className="w-3.5 h-3.5" style={{ color: '#D3A376' }} /> Call History
          </h2>
          <span className="inline-flex items-center justify-center text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(211,163,118,0.12)', border: '1px solid rgba(211,163,118,0.3)', color: '#8C6E63' }}>
            {callLogs.length} Total
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {callLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: '#D3B8A0' }}>
              <PhoneMissed className="w-12 h-12 mb-4 opacity-25" />
              <p className="text-sm" style={{ fontFamily: 'var(--font-geist-mono)', color: '#B09080' }}>No calls made yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {callLogs.map((log, idx) => (
                <div key={idx} className="rounded-xl p-5 flex flex-col transition-all"
                  style={{ background: '#FFEBD0', border: '1px solid #E8C9A0' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(211,163,118,0.6)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E8C9A0')}
                >
                  <div className="flex justify-between items-start mb-3 pb-3" style={{ borderBottom: '1px solid #F0D8B8' }}>
                    <span className="font-bold text-sm" style={{ color: '#3E2522' }}>{log.prospectName}</span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="mb-3">
                    <p className="text-sm line-clamp-1" style={{ color: '#B09080' }}>{log.context || "No context provided"}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-auto">
                    <span className="font-mono px-2 py-1 rounded" style={{ background: 'rgba(211,163,118,0.1)', border: '1px solid #E8C9A0', color: '#D3A376' }}>
                      {log.callId.slice(0, 8)}...
                    </span>
                    <span className="font-medium" style={{ color: '#B09080' }}>
                      {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
