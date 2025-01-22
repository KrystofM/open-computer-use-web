from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from os_computer_use.sandbox_agent import SandboxAgent
from os_computer_use.streaming import Sandbox, DisplayClient
import uvicorn
import json

app = FastAPI()

# Global flag to indicate when a run should stop
should_stop = False


@app.on_event("startup")
async def startup_event():
    # Initialize any necessary components here
    pass


@app.on_event("shutdown")
async def shutdown_event():
    # Clean up resources here
    pass


class InstructionRequest(BaseModel):
    instruction: str


async def stream_agent_output(agent, instruction):
    global should_stop
    try:
        async for output in agent.run(instruction):
            if should_stop:
                # Notify that we are stopping and break out
                yield json.dumps({"type": "complete", "status": "stopped"}) + "\n"
                break
            yield json.dumps({"type": "agent_output", "data": output}) + "\n"

        else:
            # If we never broke early due to stop, mark normal completion
            yield json.dumps({"type": "complete", "status": "success"}) + "\n"

    except Exception as e:
        yield json.dumps({"type": "error", "error": str(e)}) + "\n"
        raise


@app.post("/run")
async def run_instruction(request: InstructionRequest):
    global should_stop
    # Reset the stop flag each time we run a new instruction
    should_stop = False

    try:
        sandbox = Sandbox(video_stream=True)
        agent = SandboxAgent(sandbox)

        return StreamingResponse(
            stream_agent_output(agent, request.instruction),
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
