from pydantic import BaseModel


class InstructionRequest(BaseModel):
    instruction: str
    sandbox_id: str
    from enum import Enum

    class VisionModel(str, Enum):
        LLAMA3_2 = "llama3.2"
        LLAMA3_3 = "llama3.3"

    class ActionModel(str, Enum):
        LLAMA3_2 = "llama3.2"
        LLAMA3_3 = "llama3.3"

    class GroundingModel(str, Enum):
        OSATLAS = "osatlas"

    vision_model: VisionModel
    action_model: ActionModel
    grounding_model: GroundingModel
