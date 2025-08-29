"""Structured logging configuration."""

import logging
import json
from typing import Any, Dict
from datetime import datetime

class StructuredLogger:
    """
    Provides structured JSON logging capabilities.
    """
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        self._setup_handlers()
        
    def _setup_handlers(self) -> None:
        """Configure JSON logging handlers."""
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        self.logger.addHandler(handler)
        
    def log(self, level: str, message: str, **kwargs: Any) -> None:
        """
        Log a message with structured data.
        
        Args:
            level: Log level (info, warning, error, etc.)
            message: Log message
            **kwargs: Additional structured data
        """
        log_func = getattr(self.logger, level.lower(), self.logger.info)
        log_func(message, extra=kwargs)


class JsonFormatter(logging.Formatter):
    """JSON log formatter."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        
        if hasattr(record, "extra"):
            log_data.update(record.extra)
            
        return json.dumps(log_data)
