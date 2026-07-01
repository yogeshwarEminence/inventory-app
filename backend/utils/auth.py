"""
utils/auth.py
---------------
JWT-based authentication helpers: token creation/verification, and
Flask decorators for protecting routes (login_required, admin_required).
"""
import functools
from datetime import datetime, timezone

import jwt
from flask import request, jsonify, g

from config import Config
from utils.logger import get_logger

logger = get_logger(__name__)


def create_access_token(user: dict) -> str:
    """Create a signed JWT for the given user record."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "iat": now,
        "exp": now + Config.JWT_ACCESS_TOKEN_EXPIRES,
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALGORITHM])


def _extract_token():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def login_required(fn):
    """Decorator that requires a valid JWT bearer token."""
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return jsonify({"error": "Missing authentication token"}), 401
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            logger.warning("Invalid token presented")
            return jsonify({"error": "Invalid authentication token"}), 401

        g.current_user = {
            "id": payload["sub"],
            "email": payload["email"],
            "role": payload["role"],
        }
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    """Decorator that requires the authenticated user to have role=admin."""
    @functools.wraps(fn)
    @login_required
    def wrapper(*args, **kwargs):
        if g.current_user.get("role") != "admin":
            return jsonify({"error": "Admin privileges required"}), 403
        return fn(*args, **kwargs)
    return wrapper
