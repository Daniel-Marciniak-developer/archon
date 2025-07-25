import os
from enum import Enum
class Mode(str, Enum):
    DEV = "development"
    PROD = "production"
mode = Mode.PROD if os.environ.get("ARCHON_SERVICE_TYPE") == "production" else Mode.DEV
__all__ = [
    "Mode",
    "mode",
]
