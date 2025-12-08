"""
Python FastAPI example service for BrikByteOS container-matrix testing.

This service exposes three endpoints:

    GET /        ->  {"message": "Python API Example — BrikByteOS pipelines OK"}
    GET /health  ->  {"status": "ok"}
    POST /payments -> {"status": "approved", "transactionId": "mock-tx-123"}

Used for:
- Kaniko CI image validation
- Smoke-test execution in PIPE-CONTAINER-TEST-STACKS-TEST-006
- Runtime consistency across Node / Go / .NET / Java / Python services
"""

import os
from pydantic import BaseModel
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


# ---------------------------------------------------------------------------
# Demo external payment integration endpoint
# ---------------------------------------------------------------------------

class PaymentRequest(BaseModel):
    amount: int
    currency: str


@app.post("/payments")
def create_payment(payload: PaymentRequest) -> dict:
    """
    Demo "external payment" endpoint.

    For the purposes of the BrikPipe examples and the integration test
    `tests/integration/test_external_payment.py`, this endpoint simply
    returns a fixed approved response that matches the mocked provider:

        {"status": "approved", "transactionId": "mock-tx-123"}

    This keeps the example deterministic and avoids real outbound HTTP calls,
    while still demonstrating the contract shape expected by other stacks.
    """
    # NOTE:
    # We *don't* actually call EXTERNAL_API_BASE_URL here. The integration
    # test just cares that POST /payments returns the approved shape.
    return {
        "status": "approved",
        "transactionId": "mock-tx-123",
    }
