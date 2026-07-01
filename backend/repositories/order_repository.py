"""repositories/order_repository.py - Data-access layer for orders and order_items."""
from database.db import get_db_cursor

ORDER_SELECT = """
    SELECT o.*, c.full_name AS customer_name
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
"""

ITEM_SELECT = """
    SELECT oi.*, p.name AS product_name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = %s
"""


def list_orders(limit: int, offset: int, status: str = None, customer_id: int = None):
    query = ORDER_SELECT + " WHERE 1=1"
    params = []
    if status:
        query += " AND o.status = %s"
        params.append(status)
    if customer_id:
        query += " AND o.customer_id = %s"
        params.append(customer_id)
    query += " ORDER BY o.id DESC LIMIT %s OFFSET %s"
    params += [limit, offset]
    with get_db_cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()


def count_orders(status: str = None, customer_id: int = None):
    query = "SELECT COUNT(*) AS c FROM orders o WHERE 1=1"
    params = []
    if status:
        query += " AND o.status = %s"
        params.append(status)
    if customer_id:
        query += " AND o.customer_id = %s"
        params.append(customer_id)
    with get_db_cursor() as cur:
        cur.execute(query, params)
        return cur.fetchone()["c"]


def find_by_id(order_id: int):
    with get_db_cursor() as cur:
        cur.execute(ORDER_SELECT + " WHERE o.id = %s", (order_id,))
        return cur.fetchone()


def find_items(order_id: int):
    with get_db_cursor() as cur:
        cur.execute(ITEM_SELECT, (order_id,))
        return cur.fetchall()


def create_order(customer_id: int, user_id: int, items: list):
    """
    Create an order with its line items inside a single transaction.
    `items` is a list of dicts: {product_id, quantity, unit_price}
    """
    total = sum(item["quantity"] * item["unit_price"] for item in items)
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO orders (customer_id, user_id, status, total_amount) "
            "VALUES (%s, %s, 'pending', %s) RETURNING id",
            (customer_id, user_id, total),
        )
        order_id = cur.fetchone()["id"]
        for item in items:
            subtotal = item["quantity"] * item["unit_price"]
            cur.execute(
                """INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                   VALUES (%s, %s, %s, %s, %s)""",
                (order_id, item["product_id"], item["quantity"], item["unit_price"], subtotal),
            )
            cur.execute(
                "UPDATE products SET quantity_in_stock = quantity_in_stock - %s WHERE id = %s",
                (item["quantity"], item["product_id"]),
            )
    return find_by_id(order_id)


def update_status(order_id: int, status: str):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "UPDATE orders SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (status, order_id),
        )
    return find_by_id(order_id)


def cancel_order_restock(order_id: int, items: list):
    """Restock products and mark order cancelled, in one transaction."""
    with get_db_cursor(commit=True) as cur:
        for item in items:
            cur.execute(
                "UPDATE products SET quantity_in_stock = quantity_in_stock + %s WHERE id = %s",
                (item["quantity"], item["product_id"]),
            )
        cur.execute(
            "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (order_id,),
        )
    return find_by_id(order_id)


def dashboard_stats():
    with get_db_cursor() as cur:
        cur.execute("SELECT COUNT(*) AS c FROM products WHERE is_active = TRUE")
        total_products = cur.fetchone()["c"]

        cur.execute("SELECT COUNT(*) AS c FROM products WHERE is_active = TRUE AND quantity_in_stock <= reorder_level")
        low_stock = cur.fetchone()["c"]

        cur.execute("SELECT COUNT(*) AS c FROM orders")
        total_orders = cur.fetchone()["c"]

        cur.execute("SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'")
        pending_orders = cur.fetchone()["c"]

        cur.execute("SELECT COALESCE(SUM(total_amount), 0) AS s FROM orders WHERE status != 'cancelled'")
        revenue = cur.fetchone()["s"]

        cur.execute("SELECT COUNT(*) AS c FROM customers")
        total_customers = cur.fetchone()["c"]

    return {
        "total_products": total_products,
        "low_stock_products": low_stock,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": float(revenue),
        "total_customers": total_customers,
    }
