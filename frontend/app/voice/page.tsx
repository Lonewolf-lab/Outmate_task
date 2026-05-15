"use client";

import { useState, useEffect } from "react";
import { RetellWebClient } from "retell-client-js-sdk";
import { initiateCall } from "@/lib/api";
import { Phone, PhoneCall, PhoneForwarded, PhoneMissed, PhoneOff, Loader2 } from "lucide-react";

// RetellWebClient instantiated outside component to avoid re-renders
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
  
  // Set up Retell event listeners
  useEffect(() => {
    const handleCallStarted = () => {
      setIsCallActive(true);
      setCallStatus("initiated");
    };
    
    const handleCallEnded = () => {
      setIsCallActive(false);
    };
    
    const handleError = (error: any) => {
      console.error("Retell error:", error);
      setCallStatus("failed");
      setIsCallActive(false);
    };

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
        // Start Retell web call
        await retellClient.startCall({ accessToken: response.access_token });
      }
      
      const isInitiated = response.call_status === "initiated" || response.call_status === "registered";
      setCallStatus(isInitiated ? "initiated" : "failed");
      
      // Add to logs
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

  const handleEndCall = () => {
    retellClient.stopCall();
    setIsCallActive(false);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "connected" || s === "initiated" || s === "registered") {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 capitalize">Connected</span>;
    }
    if (s === "failed") {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 capitalize">Failed</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize">{status}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 h-[calc(100vh-64px)] flex gap-8">
      
      {/* Left Column — Call Initiation */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto pr-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Voice AI Agent</h1>
          <p className="text-slate-500">Initiate AI-powered outreach calls to prospects</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prospect Name *</label>
              <input
                type="text"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number *</label>
              <input
                type="tel"
                value={prospectPhone}
                onChange={(e) => setProspectPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Context</label>
              <textarea
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. VP of Sales at a fintech startup, interested in CRM switching"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 resize-none"
              />
            </div>

            <button
              onClick={handleCall}
              disabled={callStatus === "initiating" || callStatus === "initiated" || !prospectName.trim() || !prospectPhone.trim()}
              className={`w-full py-3.5 rounded-xl flex justify-center items-center gap-2 text-base font-semibold transition-colors shadow-sm ${
                callStatus === "initiated" 
                  ? "bg-green-500 text-white cursor-not-allowed opacity-90"
                  : callStatus === "failed"
                  ? "bg-white text-red-600 border-2 border-red-500 hover:bg-red-50"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {callStatus === "initiating" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initiating Call...
                </>
              ) : callStatus === "initiated" ? (
                <>
                  <Phone className="w-5 h-5" />
                  Call Initiated
                </>
              ) : callStatus === "failed" ? (
                <>
                  <PhoneOff className="w-5 h-5" />
                  Retry Call
                </>
              ) : (
                <>
                  <PhoneCall className="w-5 h-5" />
                  Initiate Call
                </>
              )}
            </button>
          </div>
        </div>

        {callStatus !== "idle" && callStatus !== "initiating" && (
          <div className={`p-5 rounded-xl border shadow-sm ${callStatus === "failed" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <h3 className={`text-sm font-bold mb-3 uppercase tracking-wider ${callStatus === "failed" ? "text-red-800" : "text-green-800"}`}>Call Status</h3>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-black/5">
              <span className={`text-sm font-medium ${callStatus === "failed" ? "text-red-700" : "text-green-700"}`}>Message</span>
              {callStatus === "failed" ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase">Failed</span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 uppercase">Connected</span>
              )}
            </div>
            {callId && (
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${callStatus === "failed" ? "text-red-700" : "text-green-700"}`}>Call ID</span>
                <span className="text-xs font-mono bg-white/60 px-2 py-1 rounded border border-black/10 text-slate-800">{callId}</span>
              </div>
            )}
          </div>
        )}

        {isCallActive && (
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="relative flex h-6 w-6 mb-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500"></span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Call Active</h3>
            <p className="text-sm text-slate-600 mb-6 font-medium">AI Agent Speaking</p>
            <button
              onClick={handleEndCall}
              className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold transition-colors flex items-center gap-2 shadow-sm"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </button>
          </div>
        )}

      </div>

      {/* Right Column — Call Logs */}
      <div className="w-96 flex flex-col h-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shrink-0 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <PhoneForwarded className="w-4 h-4 text-indigo-600" />
            Call History
          </h2>
          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
            {callLogs.length} Total
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5">
          {callLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <PhoneMissed className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No calls made yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {callLogs.map((log, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm">{log.prospectName}</span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-slate-600 line-clamp-1">{log.context || "No context provided"}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mt-auto">
                    <span className="font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      ID: {log.callId.slice(0, 8)}...
                    </span>
                    <span className="font-medium">
                      {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '}
                      {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
