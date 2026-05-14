import asyncio


async def get_signals(company_names: list) -> list:
    """
    Simulates enrichment signal fetching via Trigify.
    Returns one signal dict per company name.
    """
    await asyncio.sleep(1)

    signal_templates = [
        {
            "hiring_signal": "Actively hiring 4 Account Executives on LinkedIn",
            "growth_signal": "Headcount grew 2x over the last 6 months",
            "tech_stack": ["Salesforce", "HubSpot", "Segment", "AWS"],
            "intent_score": 89,
        },
        {
            "hiring_signal": "Posted 2 VP of Sales roles in the past 30 days",
            "growth_signal": "Expanded to 3 new markets in Q1",
            "tech_stack": ["Stripe", "Intercom", "Postgres", "GCP"],
            "intent_score": 72,
        },
        {
            "hiring_signal": None,
            "growth_signal": "Series A announced — raised $8M led by Andreessen Horowitz",
            "tech_stack": ["Mixpanel", "Notion", "Vercel"],
            "intent_score": 61,
        },
        {
            "hiring_signal": "Hiring a Customer Success Manager and 2 SDRs",
            "growth_signal": None,
            "tech_stack": ["Zendesk", "Slack", "Azure", "Snowflake"],
            "intent_score": 45,
        },
        {
            "hiring_signal": "No active job postings detected",
            "growth_signal": "Leadership team added 2 new C-suite hires",
            "tech_stack": ["SAP", "Oracle", "Tableau"],
            "intent_score": 33,
        },
    ]

    results = []
    for i, company_name in enumerate(company_names):
        template = signal_templates[i % len(signal_templates)]
        results.append({
            "company": company_name,
            "hiring_signal": template["hiring_signal"],
            "growth_signal": template["growth_signal"],
            "tech_stack": template["tech_stack"],
            "intent_score": template["intent_score"],
        })

    return results
