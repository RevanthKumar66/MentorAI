import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.modules.auth.dependencies import get_current_user

# Create standard TestClient
client = TestClient(app)

def test_roles_unauthenticated():
    """Verify that GET /roles without token returns 401/403 Unauthorized."""
    response = client.get("/api/v1/roles")
    assert response.status_code in (401, 403)
    assert not response.json().get("success")

def test_personas_unauthenticated():
    """Verify that GET /personas without token returns 401/403 Unauthorized."""
    response = client.get("/api/v1/personas")
    assert response.status_code in (401, 403)
    assert not response.json().get("success")

def test_authenticated_endpoints():
    """Verify that with mocked authentication, the endpoints return success."""
    mock_user = User(
        id=uuid.uuid4(),
        email="testuser@mentorai.os",
        supabase_user_id="dummy-uid"
    )
    
    # Override authentication dependency
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        response = client.get("/api/v1/roles")
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        response = client.get("/api/v1/personas")
        assert response.status_code == 200
        assert response.json()["success"] is True
    finally:
        # Clean up overrides
        app.dependency_overrides.clear()
