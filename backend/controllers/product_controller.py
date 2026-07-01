"""controllers/product_controller.py - REST endpoints for products/inventory."""
from flask import Blueprint, request, jsonify

from services import product_service
from services.product_service import ServiceError
from utils.validators import validate_product
from utils.auth import login_required, admin_required
from utils.logger import get_logger
from models.product import serialize_product

logger = get_logger(__name__)
product_bp = Blueprint("products", __name__, url_prefix="/api/products")


@product_bp.get("")
@login_required
def list_products():
    page = request.args.get("page", 1)
    page_size = request.args.get("page_size")
    search = request.args.get("search")
    category_id = request.args.get("category_id", type=int)
    low_stock_only = request.args.get("low_stock", "false").lower() == "true"

    result = product_service.list_products(page, page_size, search, category_id, low_stock_only)
    return jsonify({
        "items": [serialize_product(p) for p in result["items"]],
        "page": result["page"], "page_size": result["page_size"],
        "total": result["total"], "total_pages": result["total_pages"],
    }), 200


@product_bp.get("/<int:product_id>")
@login_required
def get_product(product_id):
    try:
        product = product_service.get_one(product_id)
        return jsonify(serialize_product(product)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@product_bp.post("")
@admin_required
def create_product():
    data = request.get_json(silent=True) or {}
    errors = validate_product(data)
    if errors:
        return jsonify({"errors": errors}), 422
    try:
        product = product_service.create(data)
        return jsonify(serialize_product(product)), 201
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception:
        logger.exception("Error creating product")
        return jsonify({"error": "Internal server error"}), 500


@product_bp.put("/<int:product_id>")
@admin_required
def update_product(product_id):
    data = request.get_json(silent=True) or {}
    errors = validate_product(data, partial=True)
    if errors:
        return jsonify({"errors": errors}), 422
    try:
        product = product_service.update(product_id, data)
        return jsonify(serialize_product(product)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@product_bp.patch("/<int:product_id>/stock")
@login_required
def adjust_stock(product_id):
    data = request.get_json(silent=True) or {}
    if "delta" not in data:
        return jsonify({"errors": ["'delta' is required"]}), 422
    try:
        delta = int(data["delta"])
    except (TypeError, ValueError):
        return jsonify({"errors": ["'delta' must be an integer"]}), 422
    try:
        product = product_service.adjust_stock(product_id, delta)
        return jsonify(serialize_product(product)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@product_bp.delete("/<int:product_id>")
@admin_required
def delete_product(product_id):
    try:
        product_service.delete(product_id)
        return jsonify({"message": "Product deactivated"}), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code
