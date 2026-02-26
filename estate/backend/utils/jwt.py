"""
JWT utility functions for token generation and validation
"""
import jwt
import datetime
from flask import current_app

def create_token(user):
    """
    Create JWT token for authenticated user
    Token expires after 24 hours
    """
    normalized_role = (user.role or "tenant").strip().lower()

    payload = {
        "id": user.id,
        "email": user.email,
        "role": normalized_role,
        "house_id": user.house_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(
            hours=current_app.config.get("JWT_EXPIRATION_HOURS", 24)
        ),
        "iat": datetime.datetime.utcnow()
    }
    
    token = jwt.encode(
        payload,
        current_app.config["JWT_SECRET"],
        algorithm="HS256"
    )
    
    return token

def decode_token(token):
    """
    Decode and validate JWT token
    Returns payload if valid, raises exception if invalid
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config["JWT_SECRET"],
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")
