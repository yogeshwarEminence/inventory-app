"""services/category_service.py - Business logic for category management."""
from repositories import category_repository
from utils.logger import get_logger

logger = get_logger(__name__)


class ServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_all():
    return category_repository.list_categories()


def get_one(category_id: int):
    category = category_repository.find_by_id(category_id)
    if not category:
        raise ServiceError("Category not found", 404)
    return category


def create(data: dict):
    category = category_repository.create_category(data["name"].strip(), data.get("description"))
    logger.info(f"Category created: {category['name']}")
    return category


def update(category_id: int, data: dict):
    existing = get_one(category_id)
    name = data.get("name", existing["name"])
    description = data.get("description", existing["description"])
    updated = category_repository.update_category(category_id, name, description)
    logger.info(f"Category updated: id={category_id}")
    return updated


def delete(category_id: int):
    get_one(category_id)
    category_repository.delete_category(category_id)
    logger.info(f"Category deleted: id={category_id}")
