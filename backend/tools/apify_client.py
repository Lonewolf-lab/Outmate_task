import os
import asyncio
import httpx
import random
from dotenv import load_dotenv

load_dotenv()

class ApifyClient:
    def __init__(self):
        self.api_token = os.getenv("APIFY_API_TOKEN")
        self.actor_id = "harvestapi~linkedin-profile-search"

    def _map_item(self, item: dict, keyword: str) -> dict:
        first = item.get("firstName", "")
        last = item.get("lastName", "")
        name = f"{first} {last}".strip() or "Unknown"

        positions = item.get("currentPositions", [])
        role = "Professional"
        company = keyword

        if positions:
            role = positions[0].get("title", "Professional")
            company = positions[0].get("companyName", keyword)

        summary = item.get("summary", "")
        signal = f"Active LinkedIn professional in {keyword} space"
        if summary:
            signal = summary[:120].replace("\n", " ").strip() + "..."

        return {
            "prospect_name": name,
            "company": company,
            "role": role,
            "intent_score": random.randint(40, 95),
            "signal": signal,
            "post_url": item.get("linkedinUrl", "https://linkedin.com"),
        }

    async def search_leads(self, keyword: str) -> list:
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                run_url = f"https://api.apify.com/v2/acts/{self.actor_id}/runs"
                headers = {"Authorization": f"Bearer {self.api_token}"}
                payload = {
                    "searchQuery": keyword,
                    "profileScraperMode": "Short",
                    "maxItems": 5,
                    "startPage": 1,
                    "autoQuerySegmentation": False,
                    "recentlyChangedJobs": False,
                    "recentlyPostedOnLinkedIn": False
                }

                run_response = await client.post(run_url, headers=headers, json=payload)
                print(f"APIFY RUN STATUS: {run_response.status_code}")
                print(f"APIFY RUN BODY: {run_response.text[:500]}")
                run_response.raise_for_status()
                run_data = run_response.json()

                run_id = run_data["data"]["id"]
                default_dataset_id = run_data["data"]["defaultDatasetId"]

                status_url = f"https://api.apify.com/v2/actor-runs/{run_id}"
                max_time = 90
                poll_interval = 3
                elapsed = 0

                while elapsed < max_time:
                    await asyncio.sleep(poll_interval)
                    elapsed += poll_interval

                    status_response = await client.get(status_url, headers=headers)
                    status_response.raise_for_status()
                    status = status_response.json()["data"]["status"]
                    print(f"APIFY POLL STATUS: {status} ({elapsed}s)")

                    if status == "SUCCEEDED":
                        break
                    if status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                        print(f"APIFY RUN FAILED with status: {status}")
                        return []

                if elapsed >= max_time:
                    print("APIFY TIMEOUT: run did not complete in time")
                    return []

                dataset_url = f"https://api.apify.com/v2/datasets/{default_dataset_id}/items?limit=5"
                dataset_response = await client.get(dataset_url, headers=headers)
                dataset_response.raise_for_status()
                items = dataset_response.json()

                print(f"APIFY RESULTS COUNT: {len(items)}")

                if not items:
                    return []

                return [self._map_item(item, keyword) for item in items[:5]]

        except Exception as e:
            print(f"APIFY ERROR: {type(e).__name__}: {str(e)}")
            return []