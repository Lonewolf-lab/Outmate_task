"use client";

import { useState } from "react";
import { runGTM } from "@/lib/api";
import { GTMResponse } from "@/lib/mappers";
import { Loader2, Search, CheckCircle2, XCircle, AlertCircle, RefreshCw, BarChart2, Building2, List } from "lucide-react";

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
      if ((data as any).error) {
         setError((data as any).message || "An error occurred");
         if ((data as any).reasoning_trace) {
             setGTMResult(data);
         }
      } else {
         setGTMResult(data);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "success") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="w-3 h-3" /> Success
        </span>
      );
    }
    if (s === "failed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3" /> Failed
        </span>
      );
    }
    if (s === "partial") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3 h-3" /> Partial
        </span>
      );
    }
    if (s === "retrying") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <RefreshCw className="w-3 h-3" /> Retrying
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.7) return "bg-green-500";
    if (score > 0.4) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Section 1 — Query Input */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">GTM Intelligence</h1>
        <p className="text-slate-500 mb-6">AI-powered go-to-market research and strategy generation</p>
        
        <textarea
          rows={4}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Find high-growth AI SaaS companies in the US and generate personalized outbound hooks for their VP Sales"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white placeholder-slate-400 mb-4 shadow-sm resize-none text-sm"
        />
        
        <div className="flex flex-wrap gap-2 mb-6">
          {exampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(q)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleRun}
          disabled={loading || !query.trim()}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-base font-semibold transition-colors shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running agents...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Run GTM Analysis
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      )}

      {/* Section 2 — Agent Execution Timeline */}
      {(hasAttempted || loading) && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <List className="w-5 h-5 text-indigo-600" />
            Agent Execution Trace
          </h2>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {loading && (!result || !result.reasoning_trace || result.reasoning_trace.length === 0) ? (
              <div className="flex flex-col">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="px-5 py-4 border-b border-slate-100 last:border-0 flex items-center gap-4 animate-pulse">
                    <div className="h-5 bg-slate-200 rounded w-24"></div>
                    <div className="h-5 bg-slate-100 rounded-full w-20"></div>
                    <div className="flex-1 h-4 bg-slate-100 rounded"></div>
                    <div className="h-4 bg-slate-100 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {result?.reasoning_trace.map((trace, idx) => (
                  <div key={idx} className="px-5 py-4 border-b border-slate-100 last:border-0 flex items-center gap-4">
                    <div className="font-bold text-sm text-slate-900 capitalize w-28 shrink-0 truncate">
                      {trace.agent.replace(/Agent$/, '')}
                    </div>
                    <div className="shrink-0 w-28">
                      {getStatusBadge(trace.status)}
                    </div>
                    <div className="flex-1 text-sm text-slate-600 truncate" title={trace.output_summary}>
                      {trace.output_summary}
                    </div>
                    <div className="text-xs text-slate-400 shrink-0 font-mono">
                      {new Date(trace.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 3 — Results */}
      {result && !loading && (
        <div>
          <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab("strategy")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "strategy" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Strategy
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "results" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Companies
            </button>
            <button
              onClick={() => setActiveTab("trace")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "trace" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-4 h-4" />
              Trace
            </button>
          </div>

          {activeTab === "strategy" && result.gtm_strategy && (
            <div className="space-y-8">
              {/* Top Stats */}
              <div className="flex items-center gap-6 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Confidence Score</span>
                    <span className="text-xl font-bold text-slate-900">{(result.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(result.confidence)}`}
                      style={{ width: `${result.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-200"></div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5">Iterations</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {result.iterations_used}
                    </span>
                  </div>
                  {result.from_cache && (
                    <>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1.5">Source</span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Cached result
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Outreach Hooks */}
              {result.gtm_strategy.hooks && result.gtm_strategy.hooks.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">Outreach Hooks</h3>
                  <div className="grid gap-3">
                    {result.gtm_strategy.hooks.map((hook, idx) => (
                      <div key={idx} className="bg-white border-l-4 border-l-indigo-600 border border-slate-200 rounded-r-xl p-5 text-sm text-slate-700 shadow-sm">
                        {hook}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales Angles */}
              {result.gtm_strategy.angles && result.gtm_strategy.angles.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">Sales Angles</h3>
                  <ul className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
                    {result.gtm_strategy.angles.map((angle, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                        <span className="leading-relaxed">{angle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Persona Strategies */}
              {result.persona_strategies && Object.keys(result.persona_strategies).length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">Persona Strategies</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(result.persona_strategies).map(([persona, strategy], idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
                        <div className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3 pb-3 border-b border-slate-100">{persona.replace(/_/g, " ")}</div>
                        <p className="text-sm text-slate-600 flex-1 leading-relaxed">{String(strategy)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ICP Insights */}
              {result.icp_insights && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">ICP Insights</h3>
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="grid md:grid-cols-3 gap-6 mb-5 pb-5 border-b border-slate-100">
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ideal Title</span>
                        <span className="text-sm font-medium text-slate-800">{String((result.icp_insights as any).ideal_title || "-")}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ideal Stage</span>
                        <span className="text-sm font-medium text-slate-800">{String((result.icp_insights as any).ideal_stage || "-")}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ideal Industry</span>
                        <span className="text-sm font-medium text-slate-800">{String((result.icp_insights as any).ideal_industry || "-")}</span>
                      </div>
                    </div>
                    {Array.isArray((result.icp_insights as any).pain_points) && (
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pain Points</span>
                        <ul className="space-y-2">
                          {((result.icp_insights as any).pain_points).map((pt: string, idx: number) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-3">
                              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> 
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Email Snippets */}
              {result.gtm_strategy.email_snippets && result.gtm_strategy.email_snippets.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-3">Email Snippets</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.gtm_strategy.email_snippets.map((snippet: any, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">{snippet.company}</div>
                        <div className="font-medium text-sm text-slate-900 mb-3 pb-3 border-b border-slate-100">Subject: {snippet.subject}</div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{snippet.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "results" && result.results && (
            <div className="space-y-4">
              {result.results.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                  No companies found matching the criteria.
                </div>
              ) : (
                result.results.map((company: any, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-5 pb-5 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          {company.name}
                          {company.data_quality && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              company.data_quality === 'high' ? 'bg-green-100 text-green-700' :
                              company.data_quality === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {company.data_quality} Data
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                          {company.industry} • {company.region} • {company.size} employees
                          {company.funding_stage && ` • ${company.funding_stage}`}
                        </p>
                      </div>
                      {company.intent_score !== undefined && (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Intent</span>
                          <span className={`text-2xl font-bold ${getConfidenceColor((company.intent_score || 0) / 100).replace('bg-', 'text-')}`}>
                            {company.intent_score}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-5">
                      {company.hiring_signal && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hiring Signal</span>
                          <span className="text-sm text-slate-700">{company.hiring_signal}</span>
                        </div>
                      )}
                      {company.growth_signal && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Growth Signal</span>
                          <span className="text-sm text-slate-700">{company.growth_signal}</span>
                        </div>
                      )}
                    </div>
                    
                    {Array.isArray(company.tech_stack) && company.tech_stack.length > 0 && (
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tech Stack:</span>
                        <div className="inline-flex flex-wrap gap-1.5">
                          {company.tech_stack.map((tech: string, tidx: number) => (
                            <span key={tidx} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-xs font-medium">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "trace" && result.reasoning_trace && (
            <div className="space-y-4">
              {result.reasoning_trace.map((trace, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-slate-900 capitalize">{trace.agent.replace(/Agent$/, '')} Agent</span>
                      {getStatusBadge(trace.status)}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(trace.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono border border-slate-100">
                    {trace.output_summary}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
