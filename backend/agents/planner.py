import json
from tools.groq_client import GroqClient
from agents.base_agent import BaseAgent

class PlannerAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "PlannerAgent"

    async def run(self, context: dict) -> dict:
        system_prompt = """You are a GTM Planner Agent. Your job is to decompose a natural language GTM query into a structured execution plan.
You must respond only in valid JSON with this exact schema:
{
  "entity_type": "string (e.g. SaaS company, fintech startup)",
  "tasks": ["array of string task descriptions"],
  "strategy": "string describing overall GTM approach",
  "filters": {
    "industry": "string or null",
    "region": "string or null",
    "stage": "string or null",
    "size": "string or null"
  },
  "confidence": float between 0 and 1
}
Do not include any explanation outside the JSON."""

        query = context.get("query", "")
        user_prompt = f"Query: {query}"

        try:
            output = await self.groq_client.complete(system_prompt, user_prompt)
            if "error" in output:
                status = "failed"
                result = {"error": True, "raw": output.get("raw", "")}
            else:
                status = "success"
                # Check for missing keys indicating partial success
                if not all(k in output for k in ["entity_type", "tasks", "strategy", "filters", "confidence"]):
                    status = "partial"
                result = output
        except Exception as e:
            status = "failed"
            result = {"error": True, "message": str(e)}

        result["trace_entry"] = self.build_trace_entry(status, result)
        return result
