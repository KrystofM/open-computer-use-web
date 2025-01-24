import asyncio
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from os_computer_use.sandbox_agent import SandboxAgent
from os_computer_use.streaming import Sandbox
import uvicorn
import json

app = FastAPI()

# Global flag to indicate when a run should stop
should_stop = False
sandbox = None
agent = None


class InstructionRequest(BaseModel):
    instruction: str


async def stream_agent_output(instruction):
    global should_stop, sandbox, agent

    if sandbox is None or agent is None:
        sandbox = Sandbox()
        agent = SandboxAgent(sandbox)
        sandbox.start_stream()

        yield json.dumps({"type": "stream_started", "data": "stream started"}) + "\n"
        await asyncio.sleep(12)
        yield json.dumps({"type": "stream_awaited", "data": "stream awaited"}) + "\n"

    try:
        async for output in agent.run(instruction):
            if should_stop:
                yield json.dumps({"type": "complete", "status": "stopped"}) + "\n"
                break
            yield json.dumps({"type": "agent_output", "data": output}) + "\n"

        else:
            yield json.dumps({"type": "complete", "status": "success"}) + "\n"

    except Exception as e:
        yield json.dumps({"type": "error", "error": str(e)}) + "\n"
        raise


@app.post("/run")
async def run_instruction(request: InstructionRequest):
    global should_stop, sandbox, agent
    should_stop = False

    try:
        return StreamingResponse(
            stream_agent_output(request.instruction),
            media_type="application/x-ndjson",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stop")
async def stop_run():
    global should_stop
    should_stop = True
    return {"detail": "Stop has been requested."}


def main():
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
