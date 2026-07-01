"""
utils/validators.py
---------------------
Lightweight request payload validation helpers (no heavy framework
dependency). Each validator returns a list of error strings; an empty
list means the payload is valid.
"""
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def require_fields(data: dict, fields: list) -> list:
    errors = []
    for field in fields:
        if field not in data or data[field] in (None, ""):
            errors.append(f"'{field}' is required")
    return errors


def validate_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email or ""))


def validate_user_registration(data: dict) -> list:
    errors = require_fields(data, ["full_name", "email", "password"])
    if "email" in data and data["email"] and not validate_email(data["email"]):
        errors.append("Invalid email format")
    if "password" in data and data["password"] and len(data["password"]) < 6:
        errors.append("Password must be at least 6 characters long")
    if "role" in data and data["role"] not in (None, "admin", "staff"):
        errors.append("role must be 'admin' or 'staff'")
    return errors


def validate_login(data: dict) -> list:
    return require_fields(data, ["email", "password"])


def validate_product(data: dict, partial=False) -> list:
    required = [] if partial else ["sku", "name", "unit_price"]
    errors = require_fields(data, required)
    if "unit_price" in data and data["unit_price"] is not None:
        try:
            if float(data["unit_price"]) < 0:
                errors.append("unit_price cannot be negative")
        except (TypeError, ValueError):
            errors.append("unit_price must be a number")
    if "quantity_in_stock" in data and data["quantity_in_stock"] is not None:
        try:
            if int(data["quantity_in_stock"]) < 0:
                errors.append("quantity_in_stock cannot be negative")
        except (TypeError, ValueError):
            errors.append("quantity_in_stock must be an integer")
    return errors


def validate_category(data: dict) -> list:
    return require_fields(data, ["name"])


def validate_customer(data: dict, partial=False) -> list:
    required = [] if partial else ["full_name"]
    errors = require_fields(data, required)
    if data.get("email") and not validate_email(data["email"]):
        errors.append("Invalid email format")
    return errors


def validate_order(data: dict) -> list:
    errors = require_fields(data, ["customer_id", "items"])
    items = data.get("items")
    if items is not None:
        if not isinstance(items, list) or len(items) == 0:
            errors.append("'items' must be a non-empty list")
        else:
            for idx, item in enumerate(items):
                if "product_id" not in item or "quantity" not in item:
                    errors.append(f"items[{idx}] must include product_id and quantity")
                elif not isinstance(item["quantity"], int) or item["quantity"] <= 0:
                    errors.append(f"items[{idx}].quantity must be a positive integer")
    return errors
