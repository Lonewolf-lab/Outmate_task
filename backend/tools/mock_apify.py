import asyncio


async def search_companies(filters: dict) -> list:
    """
    Simulates a company search via Apify web scraping.
    Returns a list of realistic but fictional company records.
    """
    await asyncio.sleep(1)

    return [
        {
            "name": "Velorix AI",
            "industry": "SaaS / Artificial Intelligence",
            "region": "North America",
            "stage": "Series B",
            "size": "51-200",
            "website": "https://www.velorix-ai.example.com",
            "description": "Velorix AI builds autonomous workflow orchestration tools for enterprise revenue operations teams."
        },
        {
            "name": "Fintrek Solutions",
            "industry": "Fintech",
            "region": "Europe",
            "stage": "Series A",
            "size": "11-50",
            "website": "https://www.fintrek.example.com",
            "description": "Fintrek offers embedded lending infrastructure for neobanks and payment processors across the EU market."
        },
        {
            "name": "HealthBridge Labs",
            "industry": "HealthTech",
            "region": "Asia Pacific",
            "stage": "Seed",
            "size": "1-10",
            "website": "https://www.healthbridge-labs.example.com",
            "description": "HealthBridge Labs develops AI-powered diagnostic triage tools for rural primary care clinics in Southeast Asia."
        },
        {
            "name": "Constructly",
            "industry": "Construction Tech",
            "region": "North America",
            "stage": "Series A",
            "size": "51-200",
            "website": "https://www.constructly.example.com",
            "description": "Constructly provides field-to-cloud project management software for mid-market commercial contractors."
        },
        {
            "name": "Optiware HQ",
            "industry": "Supply Chain SaaS",
            "region": "EMEA",
            "stage": "Series C",
            "size": "201-500",
            "website": "https://www.optiware-hq.example.com",
            "description": "Optiware HQ delivers real-time supply chain visibility and predictive logistics analytics for global manufacturers."
        },
    ]
