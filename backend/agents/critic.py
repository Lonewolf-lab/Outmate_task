import json
from tools.groq_client import GroqClient
from agents.base_agent import BaseAgent

class CriticAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "CriticAgent"

    async def run(self, context: dict) -> dict:
        system_prompt = """You are a GTM Critic Agent. Your job is to evaluate the quality of retrieved and enriched company data against the original plan.
You must detect: hallucinated filters, invalid assumptions, low confidence records, contradictions between plan and results.
Respond only in valid JSON with this exact schema:
{
  "valid": boolean,
  "issues": ["array of issue description strings"],
  "rejected_companies": ["array of company names that should be removed"],
  "retry_reason": "string explaining why retry is needed, or null if valid",
  "retry_plan_patch": {
    "relax_filters": boolean,
    "expand_region": boolean,
    "change_strategy": "string or null"
  },
  "overall_confidence": float between 0 and 1
}
Be strict. If more than half the results have low data_quality or confidence below 0.5, mark valid as false."""

        plan = context.get("plan", {})
        enriched_companies = context.get("enriched_companies", [])
        query = context.get("query", "")
        
        user_prompt = f"Original Query: {query}\nPlan: {json.dumps(plan)}\nEnriched Companies: {json.dumps(enriched_companies)}"

        try:
            output = await self.groq_client.complete(system_prompt, user_prompt)
            if "error" in output:
                status = "failed"
                result = {"error": True, "raw": output.get("raw", "")}
            else:
                status = "success"
                if "valid" not in output or "issues" not in output:
                    status = "partial"
                result = output
        except Exception as e:
            status = "failed"
            result = {"error": True, "message": str(e)}

        result["trace_entry"] = self.build_trace_entry(status, result)
        return result
