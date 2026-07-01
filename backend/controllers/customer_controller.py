"""controllers/customer_controller.py - REST endpoints for customers."""
from flask import Blueprint, request, jsonify

from services import customer_service
from services.customer_service import ServiceError
from utils.validators import validate_customer
from utils.auth import login_required, admin_required
from utils.logger import get_logger
from models.order import serialize_customer

logger = get_logger(__name__)
customer_bp = Blueprint("customers", __name__, url_prefix="/api/customers")


@customer_bp.get("")
@login_required
def list_customers():
    page = request.args.get("page", 1)
    page_size = request.args.get("page_size")
    search = request.args.get("search")
    result = customer_service.list_customers(page, page_size, search)
    return jsonify({
        "items": [serialize_customer(c) for c in result["items"]],
        "page": result["page"], "page_size": result["page_size"],
        "total": result["total"], "total_pages": result["total_pages"],
    }), 200


@customer_bp.get("/<int:customer_id>")
@login_required
def get_customer(customer_id):
    try:
        customer = customer_service.get_one(customer_id)
        return jsonify(serialize_customer(customer)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@customer_bp.post("")
@login_required
def create_customer():
    data = request.get_json(silent=True) or {}
    errors = validate_customer(data)
    if errors:
        return jsonify({"errors": errors}), 422
    try:
        customer = customer_service.create(data)
        return jsonify(serialize_customer(customer)), 201
    except Exception:
        logger.exception("Error creating customer")
        return jsonify({"error": "Internal server error"}), 500


@customer_bp.put("/<int:customer_id>")
@login_required
def update_customer(customer_id):
    data = request.get_json(silent=True) or {}
    errors = validate_customer(data, partial=True)
    if errors:
        return jsonify({"errors": errors}), 422
    try:
        customer = customer_service.update(customer_id, data)
        return jsonify(serialize_customer(customer)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@customer_bp.delete("/<int:customer_id>")
@admin_required
def delete_customer(customer_id):
    try:
        customer_service.delete(customer_id)
        return jsonify({"message": "Customer deleted"}), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code
