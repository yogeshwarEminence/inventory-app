"""services/customer_service.py - Business logic for customer management."""
from config import Config
from repositories import customer_repository
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


def list_customers(page=1, page_size=None, search=None):
    page, page_size, offset = _paginate(page, page_size)
    items = customer_repository.list_customers(page_size, offset, search)
    total = customer_repository.count_customers(search)
    return {
        "items": items, "page": page, "page_size": page_size, "total": total,
        "total_pages": (total + page_size - 1) // page_size if page_size else 0,
    }


def get_one(customer_id: int):
    customer = customer_repository.find_by_id(customer_id)
    if not customer:
        raise ServiceError("Customer not found", 404)
    return customer


def create(data: dict):
    customer = customer_repository.create_customer(data)
    logger.info(f"Customer created: {customer['full_name']}")
    return customer


def update(customer_id: int, data: dict):
    get_one(customer_id)
    updated = customer_repository.update_customer(customer_id, data)
    logger.info(f"Customer updated: id={customer_id}")
    return updated


def delete(customer_id: int):
    get_one(customer_id)
    customer_repository.delete_customer(customer_id)
    logger.info(f"Customer deleted: id={customer_id}")
