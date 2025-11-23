"""
Simple FastAPI application used as a Python CI example for BrikByteOS.

This service exposes a single health-check endpoint:

    GET /health  ->  {"status": "ok"}

The goal is to provide:
- A tiny, realistic "API" surface.
- Something your GitHub Actions Python CI template can build & test.
"""

from fastapi import FastAPI

# Create FastAPI app instance
app = FastAPI(title="Python API Example", version="1.0.0")


@app.get("/health")
def health() -> dict:
    """
    Health-check endpoint.

    Returns a simple JSON payload indicating that the service is up.
    """
    return {"status": "ok"}
