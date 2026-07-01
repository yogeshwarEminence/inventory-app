"""repositories/product_repository.py - Data-access layer for products."""
from database.db import get_db_cursor

BASE_SELECT = """
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
"""


def list_products(limit: int, offset: int, search: str = None, category_id: int = None,
                   low_stock_only: bool = False):
    query = BASE_SELECT + " WHERE p.is_active = TRUE"
    params = []
    if search:
        # ILIKE for case-insensitive search (PostgreSQL's LIKE is
        # case-sensitive, unlike SQLite's default ASCII LIKE behavior).
        query += " AND (p.name ILIKE %s OR p.sku ILIKE %s)"
        params += [f"%{search}%", f"%{search}%"]
    if category_id:
        query += " AND p.category_id = %s"
        params.append(category_id)
    if low_stock_only:
        query += " AND p.quantity_in_stock <= p.reorder_level"
    query += " ORDER BY p.id DESC LIMIT %s OFFSET %s"
    params += [limit, offset]

    with get_db_cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()


def count_products(search: str = None, category_id: int = None, low_stock_only: bool = False):
    query = "SELECT COUNT(*) AS c FROM products p WHERE p.is_active = TRUE"
    params = []
    if search:
        query += " AND (p.name ILIKE %s OR p.sku ILIKE %s)"
        params += [f"%{search}%", f"%{search}%"]
    if category_id:
        query += " AND p.category_id = %s"
        params.append(category_id)
    if low_stock_only:
        query += " AND p.quantity_in_stock <= p.reorder_level"

    with get_db_cursor() as cur:
        cur.execute(query, params)
        return cur.fetchone()["c"]


def find_by_id(product_id: int):
    with get_db_cursor() as cur:
        cur.execute(BASE_SELECT + " WHERE p.id = %s", (product_id,))
        return cur.fetchone()


def find_by_sku(sku: str):
    with get_db_cursor() as cur:
        cur.execute("SELECT * FROM products WHERE sku = %s", (sku,))
        return cur.fetchone()


def create_product(data: dict):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            """INSERT INTO products
               (sku, name, description, category_id, unit_price, quantity_in_stock, reorder_level)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (
                data["sku"], data["name"], data.get("description"),
                data.get("category_id"), data["unit_price"],
                data.get("quantity_in_stock", 0), data.get("reorder_level", 10),
            ),
        )
        new_id = cur.fetchone()["id"]
    return find_by_id(new_id)


def update_product(product_id: int, data: dict):
    fields, params = [], []
    for key in ("sku", "name", "description", "category_id", "unit_price",
                "quantity_in_stock", "reorder_level", "is_active"):
        if key in data:
            fields.append(f"{key} = %s")
            params.append(data[key])
    if not fields:
        return find_by_id(product_id)
    fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(product_id)
    with get_db_cursor(commit=True) as cur:
        cur.execute(f"UPDATE products SET {', '.join(fields)} WHERE id = %s", params)
    return find_by_id(product_id)


def adjust_stock(product_id: int, delta: int):
    """Increment (or decrement, with a negative delta) stock quantity."""
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "UPDATE products SET quantity_in_stock = quantity_in_stock + %s, "
            "updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (delta, product_id),
        )
    return find_by_id(product_id)


def soft_delete_product(product_id: int):
    with get_db_cursor(commit=True) as cur:
        cur.execute("UPDATE products SET is_active = FALSE WHERE id = %s", (product_id,))
