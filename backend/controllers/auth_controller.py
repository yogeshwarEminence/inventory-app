"""controllers/auth_controller.py - REST endpoints for authentication."""
from flask import Blueprint, request, jsonify, g

from services import auth_service
from services.auth_service import AuthError
from utils.validators import validate_user_registration, validate_login
from utils.auth import login_required
from utils.logger import get_logger
from models.user import serialize_user

logger = get_logger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    errors = validate_user_registration(data)
    if errors:
        return jsonify({"errors": errors}), 422
    try:
        result = auth_service.register(data)
        return jsonify({
            "token": result["token"],
            "user": serialize_user(result["user"]),
        }), 201
    except AuthError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception:
        logger.exception("Unexpected error during registration")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    errors = validate_login(data)
    if errors:
        return jsonify({"errors": errors}), 422
    try:
        result = auth_service.login(data)
        return jsonify({
            "token": result["token"],
            "user": serialize_user(result["user"]),
        }), 200
    except AuthError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception:
        logger.exception("Unexpected error during login")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.get("/me")
@login_required
def me():
    return jsonify({"user": g.current_user}), 200
