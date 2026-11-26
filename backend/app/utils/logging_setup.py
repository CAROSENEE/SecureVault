import logging


def setup_logging():
    """Request bodies are never logged; uvicorn access logs only contain method/path/status."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
