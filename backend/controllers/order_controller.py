"""controllers/order_controller.py - REST endpoints for orders and dashboard stats."""
from flask import Blueprint, request, jsonify, g

from services import order_service
from services.order_service import ServiceError
from utils.validators import validate_order
from utils.auth import login_required
from utils.logger import get_logger
from models.order import serialize_order, serialize_order_item

logger = get_logger(__name__)
order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@order_bp.get("")
@login_required
def list_orders():
    page = request.args.get("page", 1)
    page_size = request.args.get("page_size")
    status = request.args.get("status")
    customer_id = request.args.get("customer_id", type=int)
    result = order_service.list_orders(page, page_size, status, customer_id)
    return jsonify({
        "items": [serialize_order(o) for o in result["items"]],
        "page": result["page"], "page_size": result["page_size"],
        "total": result["total"], "total_pages": result["total_pages"],
    }), 200


@order_bp.get("/<int:order_id>")
@login_required
def get_order(order_id):
    try:
        order, items = order_service.get_one_with_items(order_id)
        serialized_items = [serialize_order_item(i) for i in items]
        return jsonify(serialize_order(order, items=serialized_items)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@order_bp.post("")
@login_required
def create_order():
    data = request.get_json(silent=True) or {}
    errors = validate_order(data)
    if errors:
        return jsonify({"errors": errors}), 422
    try:
        order = order_service.create_order(data, g.current_user["id"])
        return jsonify(serialize_order(order)), 201
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code
    except Exception:
        logger.exception("Error creating order")
        return jsonify({"error": "Internal server error"}), 500


@order_bp.patch("/<int:order_id>/status")
@login_required
def update_order_status(order_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"errors": ["'status' is required"]}), 422
    try:
        order = order_service.update_status(order_id, new_status)
        return jsonify(serialize_order(order)), 200
    except ServiceError as e:
        return jsonify({"error": e.message}), e.status_code


@dashboard_bp.get("/stats")
@login_required
def dashboard_stats():
    stats = order_service.dashboard_stats()
    return jsonify(stats), 200
