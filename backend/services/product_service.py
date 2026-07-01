"""services/product_service.py - Business logic for product/inventory management."""
from config import Config
from repositories import product_repository
from utils.logger import get_logger

logger = get_logger(__name__)


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


def list_products(page=1, page_size=None, search=None, category_id=None, low_stock_only=False):
    page, page_size, offset = _paginate(page, page_size)
    items = product_repository.list_products(page_size, offset, search, category_id, low_stock_only)
    total = product_repository.count_products(search, category_id, low_stock_only)
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size if page_size else 0,
    }


def get_one(product_id: int):
    product = product_repository.find_by_id(product_id)
    if not product:
        raise ServiceError("Product not found", 404)
    return product


def create(data: dict):
    if product_repository.find_by_sku(data["sku"].strip().upper()):
        raise ServiceError("A product with this SKU already exists", 409)
    data = dict(data)
    data["sku"] = data["sku"].strip().upper()
    product = product_repository.create_product(data)
    logger.info(f"Product created: {product['sku']} - {product['name']}")
    return product


def update(product_id: int, data: dict):
    get_one(product_id)
    if "sku" in data:
        existing_sku = product_repository.find_by_sku(data["sku"].strip().upper())
        if existing_sku and existing_sku["id"] != product_id:
            raise ServiceError("Another product already uses this SKU", 409)
        data["sku"] = data["sku"].strip().upper()
    updated = product_repository.update_product(product_id, data)
    logger.info(f"Product updated: id={product_id}")
    return updated


def adjust_stock(product_id: int, delta: int):
    product = get_one(product_id)
    if product["quantity_in_stock"] + delta < 0:
        raise ServiceError("Insufficient stock for this adjustment", 400)
    updated = product_repository.adjust_stock(product_id, delta)
    logger.info(f"Stock adjusted for product id={product_id}, delta={delta}")
    return updated


def delete(product_id: int):
    get_one(product_id)
    product_repository.soft_delete_product(product_id)
    logger.info(f"Product deactivated: id={product_id}")
