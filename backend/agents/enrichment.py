import json
from tools.groq_client import GroqClient
from agents.base_agent import BaseAgent

class EnrichmentAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "EnrichmentAgent"

    async def run(self, context: dict) -> dict:
        system_prompt = """You are a GTM Enrichment Agent. For each company provided, add enrichment signals.
You must simulate realistic scenarios including partial data, noisy data, and missing fields.
Respond only in valid JSON with this exact schema:
{
  "enriched_companies": [
    {
      "name": "string",
      "hiring_signal": "string or null (e.g. 'Hiring 3 AEs on LinkedIn')",
      "growth_signal": "string or null (e.g. '2x headcount in 6 months')",
      "tech_stack": ["array of strings or empty array"],
      "funding_stage": "string or null",
      "intent_score": integer between 0 and 100,
      "data_quality": "high | medium | low",
      "missing_fields": ["array of field names that could not be enriched"]
    }
  ],
  "enrichment_notes": "string"
}"""

        companies = context.get("companies", [])
        user_prompt = f"Companies to enrich: {json.dumps(companies)}"

        try:
            output = await self.groq_client.complete(system_prompt, user_prompt)
            if "error" in output:
                status = "failed"
                result = {"error": True, "raw": output.get("raw", "")}
            else:
                status = "success"
                if "enriched_companies" not in output or not isinstance(output.get("enriched_companies"), list) or len(output["enriched_companies"]) == 0:
                    status = "partial"
                result = output
        except Exception as e:
            status = "failed"
            result = {"error": True, "message": str(e)}

        result["trace_entry"] = self.build_trace_entry(status, result)
        return result
