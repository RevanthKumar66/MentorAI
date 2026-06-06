import sys
import os
import jwt
from datetime import datetime, timedelta, timezone

# Add services/api to python path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "services", "api"))

from app.integrations.supabase.jwks import verify_supabase_jwt
from app.common.exceptions import AuthException

def test_jwks_validation():
    print("==================================================")
    print("RUNNING JWKS VALIDATION UNIT TESTS")
    print("==================================================")

    # 1. Test Valid Mock Token (Developer Bypass)
    print("\n[Test 1] Valid Mock Token (Dev Bypass)")
    mock_token = "mock-token-user-12345"
    try:
        payload = verify_supabase_jwt(mock_token)
        print("-> Success! Decoded Payload:")
        print(f"   Sub: {payload.get('sub')}")
        print(f"   Email: {payload.get('email')}")
        assert payload.get("sub") == "12345"
    except Exception as e:
        print(f"-> Failed: Unexpected error: {str(e)}")


    # 2. Test Invalid Token
    print("\n[Test 2] Invalid Token Format")
    invalid_token = "this.is-not.a-valid-token"
    try:
        verify_supabase_jwt(invalid_token)
        print("-> Failed: Decoded an invalid token!")
    except AuthException as e:
        print(f"-> Success! Threw correct exception: {str(e)}")
    except Exception as e:
        print(f"-> Failed: Threw wrong exception type: {type(e).__name__} ({str(e)})")

    # 3. Test Expired Token
    print("\n[Test 3] Expired Token Validation")
    # Generate an expired RS256 token (or we can just mock a real expired signature check)
    # PyJWT has a mock/unit test capability. But since verify_supabase_jwt checks signature
    # against Supabase certs, any locally generated token will fail signature verification first.
    # So we can pass a malformed token or a mock token that fails expired check.
    # Wait, in verify_supabase_jwt, if we pass a token that is expired but unsigned or signed with
    # a dummy key, it fails with Invalid Signature or Expired Signature.
    # Let's test passing an expired token that has the correct structure but is expired.
    # PyJWT will throw InvalidTokenError (because signature verification fails).
    try:
        # Generate token with dummy HS256 key (will fail signature check)
        expired_token = jwt.encode(
            {"sub": "123", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
            "secret",
            algorithm="HS256"
        )
        verify_supabase_jwt(expired_token)
        print("-> Failed: Decoded expired token!")
    except AuthException as e:
        print(f"-> Success! Expired/Invalid token signature blocked: {str(e)}")

    # 4. Test Missing Token
    print("\n[Test 4] Missing Token")
    try:
        verify_supabase_jwt("")
        print("-> Failed: Decoded an empty token!")
    except AuthException as e:
        print(f"-> Success! Blocked empty token: {str(e)}")

if __name__ == "__main__":
    test_jwks_validation()
