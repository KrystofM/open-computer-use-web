from pydantic import BaseModel


class SandboxResponse(BaseModel):
    sandbox_id: str
    playback_id: str
