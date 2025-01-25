import asyncio
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import StreamingResponse
from os_computer_use.sandbox_agent import SandboxAgent
from os_computer_use.streaming import Sandbox
import uvicorn
import json

app = FastAPI()


class InstructionRequest(BaseModel):
    instruction: str


def get_sandbox_and_agent():
    sandbox = Sandbox()
    agent = SandboxAgent(sandbox)
    return sandbox, agent


async def stream_agent_output(instruction, sandbox, agent):
    yield json.dumps({"type": "stream_started"}) + "\n"
    playback_id = await sandbox.start_stream()
    yield json.dumps({"type": "stream_awaited", "data": playback_id}) + "\n"
    try:
        async for output in agent.run(instruction):
            yield json.dumps({"type": "agent_output", "data": output}) + "\n"
        else:
            yield json.dumps({"type": "complete", "status": "success"}) + "\n"
    except Exception as e:
        yield json.dumps({"type": "error", "error": str(e)}) + "\n"
        raise


@app.post("/run")
async def run_instruction(
    request: InstructionRequest, sandbox_and_agent=Depends(get_sandbox_and_agent)
):
    sandbox, agent = sandbox_and_agent
    try:
        return StreamingResponse(
            stream_agent_output(request.instruction, sandbox, agent),
            media_type="application/x-ndjson",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stop")
async def stop_run(sandbox_and_agent=Depends(get_sandbox_and_agent)):
    sandbox, _ = sandbox_and_agent
    sandbox.kill()
    return {"detail": "Stop has been requested."}


def main():
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
