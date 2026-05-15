// Raw snake_case from backend
export interface LeadRaw {
  prospect_name: string
  company: string
  role: string
  intent_score: number
  signal: string
  post_url: string
}

// Mapped camelCase for frontend
export interface Lead {
  prospectName: string
  company: string
  role: string
  intentScore: number
  signal: string
  postUrl: string
}

export interface CallResponse {
  call_status: string
  call_id: string | null
  access_token?: string
  message: string
}

export interface SearchResponse {
  keyword: string
  leads: LeadRaw[]
  total: number
}

export interface TraceEntry {
  agent: string
  status: string
  output_summary: string
  timestamp: string
}

export interface GTMResponse {
  plan: Record<string, unknown>
  results: unknown[]
  signals: string[]
  gtm_strategy: {
    hooks: string[]
    angles: string[]
    email_snippets: unknown[]
  }
  confidence: number
  reasoning_trace: TraceEntry[]
  iterations_used: number
  from_cache: boolean
  icp_insights?: Record<string, unknown>
  persona_strategies?: Record<string, unknown>
}

// Mapping function
export function mapLead(raw: LeadRaw): Lead {
  return {
    prospectName: raw.prospect_name,
    company: raw.company,
    role: raw.role,
    intentScore: raw.intent_score,
    signal: raw.signal,
    postUrl: raw.post_url
  }
}

// Map array
export function mapLeads(raw: LeadRaw[]): Lead[] {
  return raw.map(mapLead)
}
