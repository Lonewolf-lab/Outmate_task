from datetime import datetime, timezone
from agents.planner import PlannerAgent
from agents.retrieval import RetrievalAgent
from agents.enrichment import EnrichmentAgent
from agents.critic import CriticAgent
from agents.gtm_strategy import GTMStrategyAgent
from tools.groq_client import GroqClient
from memory.session_memory import SessionMemory

class GTMOrchestrator:
    def __init__(self):
        self.groq_client = GroqClient()
        self.planner_agent = PlannerAgent(self.groq_client)
        self.retrieval_agent = RetrievalAgent(self.groq_client)
        self.enrichment_agent = EnrichmentAgent(self.groq_client)
        self.critic_agent = CriticAgent(self.groq_client)
        self.gtm_strategy_agent = GTMStrategyAgent(self.groq_client)
        self.session_memory = SessionMemory()
        self.max_iterations = 3

    async def run(self, query: str, stream_callback=None) -> dict:
        # Step 0 — Memory check
        cached_result = self.session_memory.get(query)
        if cached_result:
            cached_result["from_cache"] = True
            return cached_result

        reasoning_trace = []
        
        # Step 1 — Planner
        planner_result = await self.planner_agent.run({"query": query})
        
        if "trace_entry" in planner_result:
            reasoning_trace.append(planner_result["trace_entry"])
        
        if stream_callback:
            await stream_callback("planner", planner_result)
            
        if planner_result.get("error"):
            return {
                "error": True, 
                "message": "Planner failed.", 
                "reasoning_trace": reasoning_trace,
                "raw": planner_result.get("raw", "")
            }

        current_plan = planner_result
        final_companies = []
        critic_result = {}
        enriched_result = {}
        
        iteration_used = 0

        # Step 2 — Iterative loop (max 3 iterations)
        for iteration in range(self.max_iterations):
            iteration_used = iteration + 1
            
            # 2a. Retrieval
            retrieval_result = await self.retrieval_agent.run({"plan": current_plan})
            if "trace_entry" in retrieval_result:
                reasoning_trace.append(retrieval_result["trace_entry"])
            if stream_callback:
                await stream_callback("retrieval", retrieval_result)
            if retrieval_result.get("error"):
                break
                
            retrieved_companies = retrieval_result.get("companies", [])
                
            # 2b. Enrichment
            enrichment_result = await self.enrichment_agent.run({"companies": retrieved_companies})
            if "trace_entry" in enrichment_result:
                reasoning_trace.append(enrichment_result["trace_entry"])
            if stream_callback:
                await stream_callback("enrichment", enrichment_result)
            if enrichment_result.get("error"):
                break
                
            enriched_companies = enrichment_result.get("enriched_companies", [])
            enriched_result = enrichment_result

            # 2c. Critic
            critic_result = await self.critic_agent.run({
                "plan": current_plan, 
                "enriched_companies": enriched_companies, 
                "query": query
            })
            if "trace_entry" in critic_result:
                reasoning_trace.append(critic_result["trace_entry"])
            if stream_callback:
                await stream_callback("critic", critic_result)
            
            if critic_result.get("error"):
                break
                
            if critic_result.get("valid") is True:
                break
            else:
                retry_reason = critic_result.get("retry_reason", "No reason provided.")
                retry_plan_patch = critic_result.get("retry_plan_patch", {})
                
                # Apply retry_plan_patch to current_plan
                if "filters" not in current_plan:
                    current_plan["filters"] = {}
                
                if retry_plan_patch.get("relax_filters"):
                    for key in current_plan["filters"]:
                        current_plan["filters"][key] = None
                        
                if retry_plan_patch.get("expand_region"):
                    current_plan["filters"]["region"] = "Global"
                    
                if retry_plan_patch.get("change_strategy") is not None:
                    current_plan["strategy"] = retry_plan_patch["change_strategy"]
                
                reasoning_trace.append({
                  "agent": "orchestrator",
                  "status": "retrying",
                  "output_summary": f"Iteration {iteration+1} failed critic. Reason: {retry_reason}. Retrying...",
                  "timestamp": datetime.now(timezone.utc).isoformat()
                })

        # Process final companies (from last valid or invalid run if loop exits)
        if enriched_result and "enriched_companies" in enriched_result:
            rejected = critic_result.get("rejected_companies", [])
            final_companies = [c for c in enriched_result["enriched_companies"] if c.get("name") not in rejected]
        
        # Step 3 — GTM Strategy
        gtm_result = await self.gtm_strategy_agent.run({
            "query": query, 
            "enriched_companies": final_companies, 
            "plan": current_plan
        })
        if "trace_entry" in gtm_result:
            reasoning_trace.append(gtm_result["trace_entry"])
        if stream_callback:
            await stream_callback("gtm_strategy", gtm_result)

        if gtm_result.get("error"):
             return {
                 "error": True, 
                 "message": "GTM Strategy failed.", 
                 "reasoning_trace": reasoning_trace,
                 "raw": gtm_result.get("raw", "")
             }

        # Step 4 — Assemble final output
        final_output = {
          "plan": current_plan,
          "results": final_companies,
          "signals": [c.get("hiring_signal") for c in final_companies if c.get("hiring_signal") is not None],
          "gtm_strategy": {
            "hooks": gtm_result.get("hooks", []),
            "angles": gtm_result.get("angles", []),
            "email_snippets": gtm_result.get("email_snippets", [])
          },
          "confidence": critic_result.get("overall_confidence", 0.5),
          "reasoning_trace": reasoning_trace,
          "icp_insights": gtm_result.get("icp_insights", {}),
          "persona_strategies": gtm_result.get("persona_strategies", {}),
          "buying_signals": gtm_result.get("buying_signals", []),
          "iterations_used": iteration_used,
          "from_cache": False
        }
        
        # Step 5 — Cache the result
        self.session_memory.set(query, final_output)
        
        return final_output

async def run_gtm(query: str, stream_callback=None) -> dict:
    orchestrator = GTMOrchestrator()
    return await orchestrator.run(query, stream_callback)
