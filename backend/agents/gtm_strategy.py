import json
from tools.groq_client import GroqClient
from agents.base_agent import BaseAgent

class GTMStrategyAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "GTMStrategyAgent"

    async def run(self, context: dict) -> dict:
        system_prompt = """You are a GTM Strategy Agent. Given validated enriched company data and the original query, generate a full GTM strategy.
Respond only in valid JSON with this exact schema:
{
  "hooks": ["array of personalized outreach hook strings"],
  "angles": ["array of sales angle strings"],
  "email_snippets": [
    {
      "company": "string",
      "subject": "string",
      "body": "string (2-3 sentences)"
    }
  ],
  "icp_insights": {
    "ideal_title": "string",
    "ideal_stage": "string",
    "ideal_industry": "string",
    "pain_points": ["array of strings"]
  },
  "buying_signals": ["array of signal strings observed across companies"],
  "persona_strategies": {
    "ceo": "string outreach strategy",
    "vp_sales": "string outreach strategy",
    "cto": "string outreach strategy"
  }
}"""

        query = context.get("query", "")
        enriched_companies = context.get("enriched_companies", [])
        plan = context.get("plan", {})
        
        user_prompt = f"Original Query: {query}\nPlan: {json.dumps(plan)}\nValidated Enriched Companies: {json.dumps(enriched_companies)}"

        try:
            output = await self.groq_client.complete(system_prompt, user_prompt)
            if "error" in output:
                status = "failed"
                result = {"error": True, "raw": output.get("raw", "")}
            else:
                status = "success"
                if not all(k in output for k in ["hooks", "angles", "email_snippets", "icp_insights", "buying_signals", "persona_strategies"]):
                    status = "partial"
                result = output
        except Exception as e:
            status = "failed"
            result = {"error": True, "message": str(e)}

        result["trace_entry"] = self.build_trace_entry(status, result)
        return result
