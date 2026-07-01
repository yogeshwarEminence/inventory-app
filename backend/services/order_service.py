"""
services/order_service.py
----------------------------
Business logic for order creation and lifecycle management, including
stock validation, status transitions, and restocking on cancellation.
"""
from config import Config
from repositories import order_repository, product_repository, customer_repository
from utils.logger import get_logger

logger = get_logger(__name__)

VALID_TRANSITIONS = {
    "pending": {"processing", "cancelled"},
    "processing": {"shipped", "cancelled"},
    "shipped": {"completed"},
    "completed": set(),
    "cancelled": set(),
}


class ServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _paginate(page, page_size):
    page = max(int(page or 1), 1)
    page_size = min(int(page_size or Config.DEFAULT_PAGE_SIZE), Config.MAX_PAGE_SIZE)
    offset = (page - 1) * page_size
    return page, page_size, offset


def list_orders(page=1, page_size=None, status=None, customer_id=None):
    page, page_size, offset = _paginate(page, page_size)
    items = order_repository.list_orders(page_size, offset, status, customer_id)
    total = order_repository.count_orders(status, customer_id)
    return {
        "items": items, "page": page, "page_size": page_size, "total": total,
        "total_pages": (total + page_size - 1) // page_size if page_size else 0,
    }


def get_one_with_items(order_id: int):
    order = order_repository.find_by_id(order_id)
    if not order:
        raise ServiceError("Order not found", 404)
    items = order_repository.find_items(order_id)
    return order, items


def create_order(data: dict, user_id: int):
    customer = customer_repository.find_by_id(data["customer_id"])
    if not customer:
        raise ServiceError("Customer not found", 404)

    resolved_items = []
    for item in data["items"]:
        product = product_repository.find_by_id(item["product_id"])
        if not product or not product["is_active"]:
            raise ServiceError(f"Product id={item['product_id']} not found or inactive", 404)
        if product["quantity_in_stock"] < item["quantity"]:
            raise ServiceError(
                f"Insufficient stock for '{product['name']}' "
                f"(available: {product['quantity_in_stock']}, requested: {item['quantity']})",
                409,
            )
        resolved_items.append({
            "product_id": product["id"],
            "quantity": item["quantity"],
            "unit_price": float(product["unit_price"]),
        })

    order = order_repository.create_order(data["customer_id"], user_id, resolved_items)
    logger.info(f"Order created: id={order['id']} customer_id={data['customer_id']} items={len(resolved_items)}")
    return order


def update_status(order_id: int, new_status: str):
    order = order_repository.find_by_id(order_id)
    if not order:
        raise ServiceError("Order not found", 404)

    current = order["status"]
    if new_status not in VALID_TRANSITIONS.get(current, set()):
        raise ServiceError(
            f"Cannot transition order from '{current}' to '{new_status}'", 400
        )

    if new_status == "cancelled":
        items = order_repository.find_items(order_id)
        updated = order_repository.cancel_order_restock(order_id, items)
    else:
        updated = order_repository.update_status(order_id, new_status)

    logger.info(f"Order id={order_id} status changed: {current} -> {new_status}")
    return updated


def dashboard_stats():
    return order_repository.dashboard_stats()
