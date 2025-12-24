from fastapi.testclient import TestClient

from main import app


# Initialize a test client once per module
client = TestClient(app)

def test_root_returns_message() -> None:
    """
    / should respond with HTTP 200 and the expected JSON message.
    """
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Python API Example — BrikByteOS pipelines OK"
    }
