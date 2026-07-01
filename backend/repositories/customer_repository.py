"""repositories/customer_repository.py - Data-access layer for customers."""
from database.db import get_db_cursor


def list_customers(limit: int, offset: int, search: str = None):
    query = "SELECT * FROM customers"
    params = []
    if search:
        # ILIKE for case-insensitive search (PostgreSQL's LIKE is
        # case-sensitive, unlike SQLite's default ASCII LIKE behavior).
        query += " WHERE full_name ILIKE %s OR email ILIKE %s"
        params += [f"%{search}%", f"%{search}%"]
    query += " ORDER BY id DESC LIMIT %s OFFSET %s"
    params += [limit, offset]
    with get_db_cursor() as cur:
        cur.execute(query, params)
        return cur.fetchall()


def count_customers(search: str = None):
    query = "SELECT COUNT(*) AS c FROM customers"
    params = []
    if search:
        query += " WHERE full_name ILIKE %s OR email ILIKE %s"
        params += [f"%{search}%", f"%{search}%"]
    with get_db_cursor() as cur:
        cur.execute(query, params)
        return cur.fetchone()["c"]


def find_by_id(customer_id: int):
    with get_db_cursor() as cur:
        cur.execute("SELECT * FROM customers WHERE id = %s", (customer_id,))
        return cur.fetchone()


def create_customer(data: dict):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO customers (full_name, email, phone, address) "
            "VALUES (%s, %s, %s, %s) RETURNING id",
            (data["full_name"], data.get("email"), data.get("phone"), data.get("address")),
        )
        new_id = cur.fetchone()["id"]
    return find_by_id(new_id)


def update_customer(customer_id: int, data: dict):
    fields, params = [], []
    for key in ("full_name", "email", "phone", "address"):
        if key in data:
            fields.append(f"{key} = %s")
            params.append(data[key])
    if not fields:
        return find_by_id(customer_id)
    params.append(customer_id)
    with get_db_cursor(commit=True) as cur:
        cur.execute(f"UPDATE customers SET {', '.join(fields)} WHERE id = %s", params)
    return find_by_id(customer_id)


def delete_customer(customer_id: int):
    with get_db_cursor(commit=True) as cur:
        cur.execute("DELETE FROM customers WHERE id = %s", (customer_id,))
