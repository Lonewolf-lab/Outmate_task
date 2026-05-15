import { SearchResponse, CallResponse, GTMResponse } from './mappers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function runSearch(keyword: string): Promise<SearchResponse> {
  const response = await fetch(`${API_URL}/run-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword })
  })
  
  if (!response.ok) {
    let errMsg = 'Failed to run search'
    try {
      const errData = await response.json()
      errMsg = errData.detail || errData.message || errMsg
    } catch (e) {}
    throw new Error(errMsg)
  }
  
  return response.json()
}

export async function initiateCall(prospectName: string, prospectPhone: string, context: string): Promise<CallResponse> {
  const response = await fetch(`${API_URL}/initiate-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prospect_name: prospectName, prospect_phone: prospectPhone, context })
  })
  
  if (!response.ok) {
    throw new Error('Failed to initiate call')
  }
  
  return response.json()
}

export async function runGTM(query: string): Promise<GTMResponse> {
  const response = await fetch(`${API_URL}/run-gtm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  
  if (!response.ok) {
    throw new Error('Failed to run GTM')
  }
  
  return response.json()
}
