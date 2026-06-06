import jwt
from app.core.config import settings
from app.common.exceptions import AuthException

# Initialize JWK client pointing to Supabase certs endpoint
jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
jwk_client = jwt.PyJWKClient(jwks_url)

def verify_supabase_jwt(token: str) -> dict:
    """Verifies a Supabase JWT token against the JWKS endpoint.
    
    Supports local mock bypass in development environments for rapid onboarding
    and offline test executions.
    """
    # Local mock bypass for development
    if settings.ENV == "development" and token.startswith("mock-token-"):
        uid = token.replace("mock-token-", "")
        # Extract email from token if formatted like mock-token-email-uid
        email = "test@mentorai.os"
        if "-" in uid:
            parts = uid.split("-", 1)
            email = f"{parts[0]}-{parts[1][:8]}@mentorai.os"
            uid = parts[1]
        return {
            "sub": uid,
            "email": email,
            "user_metadata": {
                "full_name": "Test User",
                "avatar_url": "https://avatar.vercel.sh/test"
            }
        }

    try:
        # Retrieve signing key dynamically from the JWKS list
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        
        # Decode and verify claims
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
            options={"verify_exp": True}
        )

        return payload
    except jwt.ExpiredSignatureError as e:
        raise AuthException("Token has expired.") from e
    except jwt.InvalidTokenError as e:
        raise AuthException(f"Invalid token: {str(e)}") from e
    except Exception as e:
        raise AuthException(f"Token verification failed: {str(e)}") from e
