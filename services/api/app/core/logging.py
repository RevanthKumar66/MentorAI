import json
import logging
from typing import Any

class StructuredJSONFormatter(logging.Formatter):
    """Structured JSON logging formatter for production monitoring."""
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Include extra attributes if passed in the log call
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

def get_logger(name: str) -> logging.Logger:
    """Returns a structured logger instance."""
    logger = logging.getLogger(name)
    # Check if a StreamHandler with StructuredJSONFormatter is already present
    has_structured_handler = any(
        isinstance(h.formatter, StructuredJSONFormatter) for h in logger.handlers
    )
    if not has_structured_handler:
        handler = logging.StreamHandler()
        formatter = StructuredJSONFormatter()
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        # Avoid double logging to root standard handlers if parent handlers aren't structured
        logger.propagate = False
    logger.setLevel(logging.INFO)
    return logger

def log_event(logger: logging.Logger, event: str, **kwargs: Any) -> None:
    """Helper function to log structured JSON event records."""
    extra_data = {"extra_fields": {"event": event, **kwargs}}
    logger.info(event, extra=extra_data)
