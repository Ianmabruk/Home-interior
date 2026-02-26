"""
Role-based authentication middleware
Protects routes based on user roles (admin, tenant)
"""
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from utils.jwt import decode_token

def get_current_user(request):
    """
    Extract and decode user information from JWT token
    Returns user data if token is valid
    """
    token = request.headers.get("Authorization")
    
    if not token:
        return None
    
    # Remove 'Bearer ' prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
    
    try:
        user_data = decode_token(token)
        return user_data
    except Exception as e:
        return None

def require_auth(fn):
    """
    Decorator to require authentication
    Any logged-in user can access
    """
    @wraps(fn)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        
        if not token:
            return jsonify({"error": "Token missing"}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        
        try:
            user_data = decode_token(token)
            request.current_user = user_data
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 401
    
    return decorated

def require_role(role):
    """
    Decorator to require specific role
    Usage: @require_role("admin") or @require_role("tenant")
    """
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            token = request.headers.get("Authorization")
            
            if not token:
                return jsonify({"error": "Token missing"}), 401
            
            # Remove 'Bearer ' prefix if present
            if token.startswith("Bearer "):
                token = token[7:]
            
            try:
                user_data = decode_token(token)

                user_role = str(user_data.get("role", "")).strip().lower()
                required_role = str(role).strip().lower()

                if user_role != required_role:
                    return jsonify({"error": f"Unauthorized - {role} role required"}), 403
                
                request.current_user = user_data
                return fn(*args, **kwargs)
                
            except Exception as e:
                return jsonify({"error": str(e)}), 401
        
        return decorated
    return wrapper

def require_any_role(*roles):
    """
    Decorator to require any of the specified roles
    Usage: @require_any_role("admin", "tenant")
    """
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            token = request.headers.get("Authorization")
            
            if not token:
                return jsonify({"error": "Token missing"}), 401
            
            # Remove 'Bearer ' prefix if present
            if token.startswith("Bearer "):
                token = token[7:]
            
            try:
                user_data = decode_token(token)

                user_role = str(user_data.get("role", "")).strip().lower()
                allowed_roles = {str(r).strip().lower() for r in roles}

                if user_role not in allowed_roles:
                    return jsonify({"error": f"Unauthorized - one of {roles} roles required"}), 403
                
                request.current_user = user_data
                return fn(*args, **kwargs)
                
            except Exception as e:
                return jsonify({"error": str(e)}), 401
        
        return decorated
    return wrapper
