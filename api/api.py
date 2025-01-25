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
    sandbox_id: str


def get_sandbox_and_agent():
    sandbox = Sandbox()
    agent = SandboxAgent(sandbox)
    return sandbox, agent


async def stream_agent_output(instruction, agent):
    try:
        async for output in agent.run(instruction):
            yield json.dumps({"type": "agent_output", "data": output}) + "\n"
        else:
            yield json.dumps({"type": "complete", "status": "success"}) + "\n"
    except Exception as e:
        yield json.dumps({"type": "error", "error": str(e)}) + "\n"
        raise


@app.post("/create_sandbox")
async def create_sandbox():
    sandbox = Sandbox()
    playback_id = await sandbox.start_stream()
    return {"sandbox_id": sandbox.sandbox_id, "playback_id": playback_id}


@app.post("/run")
async def run_instruction(request: InstructionRequest):
    print(request)
    try:
        sandbox = Sandbox.connect(request.sandbox_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    agent = SandboxAgent(sandbox)
    try:
        return StreamingResponse(
            stream_agent_output(request.instruction, agent),
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
