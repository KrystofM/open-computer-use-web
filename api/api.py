import asyncio
import json
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

from os_computer_use.sandbox_agent import SandboxAgent
from os_computer_use.streaming import Sandbox

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sandbox API", version="0.1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_sandbox(sandbox_id: str) -> Sandbox:
    """Dependency to get sandbox instance with error handling."""
    try:
        return await Sandbox.connect(sandbox_id)
    except Exception as e:
        logger.error(f"Sandbox connection failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sandbox not found or already terminated",
        )


async def stream_agent_output(
    instruction: str, agent: SandboxAgent
) -> AsyncGenerator[str, None]:
    """Generator for streaming agent output with proper error handling."""
    try:
        async for output in agent.run(instruction):
            yield json.dumps({"type": "agent_output", "data": output}) + "\n"
        yield json.dumps({"type": "complete", "status": "success"}) + "\n"
    except Exception as e:
        logger.error(f"Agent execution failed: {e}", exc_info=True)
        yield json.dumps({"type": "error", "error": str(e)}) + "\n"


@app.post(
    "/create_sandbox",
    response_model=SandboxResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new sandbox environment",
)
async def create_sandbox() -> SandboxResponse:
    """Create a new sandbox instance and start its stream."""
    try:
        sandbox = Sandbox()
        playback_id = await sandbox.start_stream()
        return SandboxResponse(sandbox_id=sandbox.sandbox_id, playback_id=playback_id)
    except Exception as e:
        logger.error(f"Sandbox creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create sandbox",
        )


@app.post("/run", summary="Execute an instruction in the specified sandbox")
async def run_instruction(request: InstructionRequest) -> StreamingResponse:
    """Execute instructions in a sandbox and stream the results."""
    logger.info(f"Processing instruction: {request.instruction[:50]}...")

    try:
        sandbox = await get_sandbox(request.sandbox_id)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )

    agent = SandboxAgent(sandbox)
    return StreamingResponse(
        stream_agent_output(request.instruction, agent),
        media_type="application/x-ndjson",
    )


@app.post(
    "/stop", status_code=status.HTTP_202_ACCEPTED, summary="Terminate a running sandbox"
)
async def stop_run(sandbox_id: str) -> dict:
    """Request termination of a sandbox environment."""
    logger.info(f"Requested termination for sandbox: {sandbox_id}")
    try:
        sandbox = await get_sandbox(sandbox_id)
        sandbox.kill()
        return {"detail": "Termination request received"}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Sandbox termination failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to terminate sandbox",
        )


def main() -> None:
    """Start the API server with production settings."""
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disabled for production
        log_level="info",
        timeout_keep_alive=30,
    )


if __name__ == "__main__":
    main()
