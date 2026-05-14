import os
import asyncio
import json
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

from orchestrator import run_gtm

load_dotenv()


# ── Pydantic request models ────────────────────────────────────────────────────

class GTMQuery(BaseModel):
    query: str

    @field_validator("query")
    @classmethod
    def query_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("query must not be empty")
        return v.strip()


class SearchRequest(BaseModel):
    keyword: str

    @field_validator("keyword")
    @classmethod
    def keyword_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("keyword must not be empty")
        return v.strip()


class CallRequest(BaseModel):
    prospect_name: str
    prospect_phone: str
    context: str


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    groq_key = os.getenv("GROQ_API_KEY", "")
    masked = groq_key[:8] if len(groq_key) >= 8 else "NOT SET"
    print("=" * 50)
    print("GTM Intelligence API running")
    print(f"GROQ_API_KEY loaded: {masked}...")
    print("=" * 50)
    yield


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="GTM Intelligence API",
    description="Multi-Agent Go-To-Market Intelligence System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok", "service": "GTM Intelligence API"}


@app.post("/run-gtm")
async def run_gtm_endpoint(body: GTMQuery) -> dict:
    try:
        result = await run_gtm(body.query)
        return result
    except Exception as e:
        return {
            "error": True,
            "message": str(e),
            "reasoning_trace": [],
        }


@app.get("/run-gtm/stream")
async def run_gtm_stream(query: str = Query(..., min_length=1)) -> EventSourceResponse:
    async def generator():
        sse_queue: asyncio.Queue = asyncio.Queue()

        async def stream_callback(agent_name: str, result: dict) -> None:
            event_data = {
                "agent": agent_name,
                "trace": result.get("trace_entry", {}),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await sse_queue.put(json.dumps(event_data))

        async def run_in_background():
            try:
                final_result = await run_gtm(query, stream_callback)
                done_event = {
                    "agent": "done",
                    "result": final_result,
                }
                await sse_queue.put(json.dumps(done_event))
            except Exception as e:
                error_event = {
                    "agent": "error",
                    "message": str(e),
                }
                await sse_queue.put(json.dumps(error_event))
            finally:
                await sse_queue.put(None)  # sentinel to signal completion

        task = asyncio.create_task(run_in_background())

        while True:
            item = await sse_queue.get()
            if item is None:
                break
            yield {"data": item}

        await task

    return EventSourceResponse(generator())


@app.post("/run-search")
async def run_search(body: SearchRequest) -> dict:
    """
    Social Intent Agent stub — returns mock LinkedIn-style leads.
    Will be expanded in Part 2.
    """
    await asyncio.sleep(3)

    mock_leads = [
        {
            "prospect_name": "Arjun Mehta",
            "company": "Velorix AI",
            "role": "Head of Revenue Operations",
            "intent_score": 88,
            "signal": f"Posted about pain points with {body.keyword} tooling 2 days ago",
            "post_url": "https://linkedin.com/posts/arjun-mehta-example-001",
        },
        {
            "prospect_name": "Sofia Lindqvist",
            "company": "Fintrek Solutions",
            "role": "VP of Sales",
            "intent_score": 65,
            "signal": f"Commented on a thread about scaling {body.keyword} outreach",
            "post_url": "https://linkedin.com/posts/sofia-lindqvist-example-002",
        },
        {
            "prospect_name": "Marcus Webb",
            "company": "Constructly",
            "role": "CRO",
            "intent_score": 71,
            "signal": f"Shared an article on modern {body.keyword} strategies",
            "post_url": "https://linkedin.com/posts/marcus-webb-example-003",
        },
        {
            "prospect_name": "Priya Nair",
            "company": "HealthBridge Labs",
            "role": "Founder & CEO",
            "intent_score": 42,
            "signal": "Active on LinkedIn but no recent relevant intent signals detected",
            "post_url": "https://linkedin.com/posts/priya-nair-example-004",
        },
        {
            "prospect_name": "Daniel Osei",
            "company": "Optiware HQ",
            "role": "Director of Business Development",
            "intent_score": 56,
            "signal": f"Liked 3 posts mentioning {body.keyword} automation in the last week",
            "post_url": "https://linkedin.com/posts/daniel-osei-example-005",
        },
    ]

    return {"keyword": body.keyword, "leads": mock_leads, "total": len(mock_leads)}


@app.post("/initiate-call")
async def initiate_call(body: CallRequest) -> dict:
    """
    Voice Agent stub — Retell integration coming in Part 2.
    """
    return {
        "call_status": "pending",
        "call_id": "mock-call-123",
        "message": "Retell integration coming soon",
    }
