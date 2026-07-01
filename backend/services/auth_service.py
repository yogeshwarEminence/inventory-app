"""
services/auth_service.py
--------------------------
Business logic for authentication: registration and login.
"""
from werkzeug.security import generate_password_hash, check_password_hash

from repositories import user_repository
from utils.auth import create_access_token
from utils.logger import get_logger

logger = get_logger(__name__)


class AuthError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def register(data: dict) -> dict:
    existing = user_repository.find_by_email(data["email"].lower().strip())
    if existing:
        raise AuthError("A user with this email already exists", 409)

    password_hash = generate_password_hash(data["password"])
    role = data.get("role") or "staff"
    user = user_repository.create_user(
        full_name=data["full_name"].strip(),
        email=data["email"].lower().strip(),
        password_hash=password_hash,
        role=role,
    )
    logger.info(f"New user registered: {user['email']} (role={role})")
    token = create_access_token(user)
    return {"token": token, "user": dict(user)}


def login(data: dict) -> dict:
    user = user_repository.find_by_email(data["email"].lower().strip())
    if not user or not check_password_hash(user["password_hash"], data["password"]):
        logger.warning(f"Failed login attempt for email={data.get('email')}")
        raise AuthError("Invalid email or password", 401)

    if not user["is_active"]:
        raise AuthError("This account has been deactivated", 403)

    token = create_access_token(user)
    logger.info(f"User logged in: {user['email']}")
    return {"token": token, "user": dict(user)}
