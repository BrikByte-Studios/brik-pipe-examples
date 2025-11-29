"""
Python FastAPI example service for BrikByteOS container-matrix testing.

This service exposes two endpoints:

    GET /       ->  {"message": "Python API Example — BrikByteOS pipelines OK"}
    GET /health ->  {"status": "ok"}

Used for:
- Kaniko CI image validation
- Smoke-test execution in PIPE-CONTAINER-TEST-STACKS-TEST-006
- Runtime consistency across Node / Go / .NET / Java services
"""

from fastapi import FastAPI

# Create FastAPI app instance
app = FastAPI(
    title="Python API Example",
    version="1.0.0",
    description="Minimal BrikByteOS Python service for CI container build + smoke tests",
)


@app.get("/")
def root() -> dict:
    """
    Root endpoint — mirrors Node API example for cross-stack parity.

    Useful for debugging, local manual tests, and CI readability.
    """
    return {"message": "Python API Example — BrikByteOS pipelines OK"}


@app.get("/health")
def health() -> dict:
    """
    Health-check endpoint required for CI matrix smoke testing.

    BrikByteOS pipelines expect HTTP 200 + JSON response.
    Used by Docker/Kaniko self-tests to determine container readiness.
    """
    return {"status": "ok"}
