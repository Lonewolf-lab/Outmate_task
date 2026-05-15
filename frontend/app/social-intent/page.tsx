"use client";

import { useState } from "react";
import { runSearch, initiateCall } from "@/lib/api";
import { Lead, mapLeads } from "@/lib/mappers";
import { Clock, Search, User, Loader2, Phone, ExternalLink, Flame, Zap, Snowflake } from "lucide-react";

interface CallLog {
  callId: string;
  prospectName: string;
  status: string;
  timestamp: string;
}

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

  const handleSearchSubmit = async (searchKw: string) => {
    if (!searchKw.trim()) return;
    
    setLoading(true);
    setKeyword("");
    setSelectedLead(null);
    setCallStatus(null);
    setCallId(null);
    
    // Add to past searches if not present, keeping most recent at top
    setSearches(prev => {
        const filtered = prev.filter(s => s !== searchKw);
        return [searchKw, ...filtered];
    });

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
    if (score >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <Flame className="w-3 h-3" />
          Hot
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Zap className="w-3 h-3" />
          Warm
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <Snowflake className="w-3 h-3" />
        Cold
      </span>
    );
  };
  
  const getIntentScoreColor = (score: number) => {
    if (score >= 75) return "text-red-600";
    if (score >= 50) return "text-amber-500";
    return "text-slate-500";
  };

  const getCallStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "connected" || s === "initiated") {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 capitalize">{status}</span>;
    }
    if (s === "failed") {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 capitalize">{status}</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize">{status}</span>;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Left Column - Past Searches */}
      <div className="w-64 border-r border-slate-200 bg-white overflow-y-auto flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Past Searches
          </h2>
        </div>
        <div className="p-3 flex-1">
          {searches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <Search className="w-8 h-8 mb-2" />
              <p className="text-sm">No searches yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {searches.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearchSubmit(s)}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-sm font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Column - Live Lead Feed */}
      <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
        <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex gap-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(keyword)}
              placeholder="Search leads (e.g. Healthcare, Fintech)..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
            />
            <button
              onClick={() => handleSearchSubmit(keyword)}
              disabled={loading || !keyword.trim()}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 flex-1">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-slate-100 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-full w-20"></div>
                  </div>
                  <div className="h-10 bg-slate-50 rounded mt-2"></div>
                </div>
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Enter a keyword to find leads</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedLead(lead)}
                  className={`bg-white rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedLead?.prospectName === lead.prospectName
                      ? "border-indigo-500 shadow-md bg-indigo-50/30"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{lead.prospectName}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{lead.role} at {lead.company}</p>
                    </div>
                    {getIntentBadge(lead.intentScore)}
                  </div>
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                    {lead.signal}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Lead Detail */}
      <div className="w-96 border-l border-slate-200 bg-white overflow-y-auto relative shrink-0">
        {!selectedLead ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 p-6 text-center">
            <User className="w-12 h-12 mb-4" />
            <p className="text-sm font-medium">Select a lead to view details</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-full">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{selectedLead.prospectName}</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedLead.role} at {selectedLead.company}</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Intent Score</h4>
                  <div className={`text-3xl font-bold ${getIntentScoreColor(selectedLead.intentScore)}`}>
                    {selectedLead.intentScore}
                  </div>
                </div>
                {getIntentBadge(selectedLead.intentScore)}
              </div>
              
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Intent Signal</h4>
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 border border-slate-100">
                  {selectedLead.signal}
                </div>
              </div>
              
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Social Profile</h4>
                <a 
                  href={selectedLead.postUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  View LinkedIn Profile
                </a>
              </div>
              
              <div className="border-t border-slate-100 my-5"></div>
              
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Initiate Voice Call</h4>
                <div className="flex flex-col gap-3">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
                  />
                  <button
                    onClick={handleCall}
                    disabled={callLoading || !phone.trim()}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm font-semibold transition-colors"
                  >
                    {callLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Initiating call...
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        Call This Lead
                      </>
                    )}
                  </button>
                  
                  {callStatus && (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                      <div className="flex items-center gap-2">
                        {getCallStatusBadge(callStatus)}
                        {callId && <span className="text-[10px] text-slate-400 font-mono">ID: {callId.slice(0, 8)}...</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-slate-100 my-5"></div>
              
              <div className="flex-1 pb-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Voice Agent Log</h4>
                {callLogs.length === 0 ? (
                  <p className="text-sm text-slate-400">No calls made yet</p>
                ) : (
                  <div className="flex flex-col">
                    {callLogs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{log.prospectName}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            &nbsp;• ID: {log.callId.slice(0, 8)}...
                          </span>
                        </div>
                        {getCallStatusBadge(log.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
