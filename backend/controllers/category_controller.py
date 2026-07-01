"""controllers/category_controller.py - REST endpoints for categories."""
from flask import Blueprint, request, jsonify

from services import category_service
from services.category_service import ServiceError
from utils.validators import validate_category
from utils.auth import login_required, admin_required
from utils.logger import get_logger
from models.product import serialize_category

logger = get_logger(__name__)
category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@category_bp.get("")
@login_required
def list_categories():
    categories = category_service.get_all()
    return jsonify({"items": [serialize_category(c) for c in categories]}), 200


@category_bp.get("/<int:category_id>")
@login_required
def get_category(category_id):
    try:
        category = category_service.get_one(category_id)
        return jsonify(serialize_category(category)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@category_bp.post("")
@admin_required
def create_category():
    data = request.get_json(silent=True) or {}
    errors = validate_category(data)
    if errors:
        return jsonify({"errors": errors}), 422
    try:
        category = category_service.create(data)
        return jsonify(serialize_category(category)), 201
    except Exception:
        logger.exception("Error creating category")
        return jsonify({"error": "Internal server error"}), 500


@category_bp.put("/<int:category_id>")
@admin_required
def update_category(category_id):
    data = request.get_json(silent=True) or {}
    try:
        category = category_service.update(category_id, data)
        return jsonify(serialize_category(category)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@category_bp.delete("/<int:category_id>")
@admin_required
def delete_category(category_id):
    try:
        category_service.delete(category_id)
        return jsonify({"message": "Category deleted"}), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code
