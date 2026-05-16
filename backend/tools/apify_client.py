import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

class ApifyClient:
    def __init__(self):
        self.api_token = os.getenv("APIFY_API_TOKEN")
        self.actor_id = "harvestapi~linkedin-post-search"

    def _map_item(self, item: dict, keyword: str) -> dict:
        author = item.get("author") or {}
        name = author.get("name", "Unknown")
        info = author.get("info") or ""
        author_url = author.get("linkedinUrl") or ""
        avatar_data = author.get("avatar") or {}
        avatar = avatar_data.get("url", "")

        # Parse role and company from info field
        role = info
        company = keyword
        if " at " in info:
            role = info.split(" at ")[0].strip()
            company = info.split(" at ")[1].strip()
        elif " | " in info:
            role = info.split(" | ")[0].strip()

        # Get engagement
        engagement = item.get("engagement") or {}
        likes = engagement.get("likes") or 0
        comments = engagement.get("comments") or 0

        # Intent score based on engagement
        intent_score = min(100, 40 + (likes // 5) + (comments * 3))

        post_text = item.get("content") or ""
        signal = post_text[:200].replace("\n", " ").strip() + "..." if post_text else f"Active on LinkedIn discussing {keyword}"

        posted_at = item.get("postedAt") or {}

        return {
            "prospect_name": name,
            "company": company,
            "role": role,
            "intent_score": intent_score,
            "signal": signal,
            "post_url": item.get("linkedinUrl") or "https://linkedin.com",
            "post_text": post_text,
            "author_linkedin_url": author_url,
            "author_avatar": avatar,
            "likes_count": likes,
            "comments_count": comments,
            "posted_at": posted_at.get("postedAgoText") or "",
        }

    async def search_leads(self, keyword: str) -> list:
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                run_url = f"https://api.apify.com/v2/acts/{self.actor_id}/runs"
                headers = {"Authorization": f"Bearer {self.api_token}"}
                payload = {
                    "searchQueries": [keyword],
                    "maxPosts": 5,
                    "scrapeComments": False,
                    "scrapeReactions": False,
                    "postNestedComments": False,
                    "postNestedReactions": False
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

    def _get_mock_leads(self, keyword: str) -> list:
        return [
            {
                "prospect_name": "Sarah Jenkins",
                "company": "HealthTech Solutions",
                "role": "VP of Sales",
                "intent_score": 85,
                "signal": f"Just published a detailed guide on navigating {keyword} in 2024...",
                "post_url": "https://linkedin.com",
                "post_text": f"Just published a detailed guide on navigating {keyword} in 2024. The landscape is shifting rapidly.",
                "author_linkedin_url": "https://linkedin.com",
                "likes_count": 150,
                "comments_count": 22,
                "posted_at": "2024-05-15T10:00:00Z"
            },
            {
                "prospect_name": "Michael Chen",
                "company": "FinServe Innovators",
                "role": "Chief Technology Officer",
                "intent_score": 72,
                "signal": f"Exploring new tools for {keyword}. Anyone have recommendations?",
                "post_url": "https://linkedin.com",
                "post_text": f"Exploring new tools for {keyword}. Anyone have recommendations? We need to scale fast.",
                "author_linkedin_url": "https://linkedin.com",
                "likes_count": 45,
                "comments_count": 12,
                "posted_at": "2024-05-14T14:30:00Z"
            }
        ]