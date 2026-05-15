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
from tools.apify_client import ApifyClient
from tools.retell_client import RetellClient

apify_client = ApifyClient()
retell_client = RetellClient()

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
    print("=" * 50)
    print("GTM Intelligence API running")
    print(f"GROQ_API_KEY loaded successfully")
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
    allow_origins=[
        "http://localhost:3000",
        "https://outmate-task.vercel.app",
    ],
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
    Social Intent Agent — Uses Apify to scrape Google Search results.
    """
    try:
        leads = await apify_client.search_leads(body.keyword)
        return {"keyword": body.keyword, "leads": leads, "total": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/initiate-call")
async def initiate_call(body: CallRequest) -> dict:
    """
    Voice Agent — Creates a phone call via Retell AI.
    """
    try:
        result = await retell_client.initiate_call(
            prospect_name=body.prospect_name, 
            prospect_phone=body.prospect_phone, 
            context=body.context
        )
        return result
    except Exception as e:
        return {
            "call_status": "failed",
            "call_id": None,
            "message": str(e)
        }
