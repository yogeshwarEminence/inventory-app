"""
repositories/user_repository.py
---------------------------------
Data-access layer for the `users` table. No business logic here -
only SQL queries.
"""
from database.db import get_db_cursor


def find_by_email(email: str):
    with get_db_cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cur.fetchone()


def find_by_id(user_id: int):
    with get_db_cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cur.fetchone()


def create_user(full_name: str, email: str, password_hash: str, role: str = "staff"):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO users (full_name, email, password_hash, role) "
            "VALUES (%s, %s, %s, %s) RETURNING id",
            (full_name, email, password_hash, role),
        )
        new_id = cur.fetchone()["id"]
    return find_by_id(new_id)


def list_users(limit: int, offset: int):
    with get_db_cursor() as cur:
        cur.execute(
            "SELECT * FROM users ORDER BY id DESC LIMIT %s OFFSET %s", (limit, offset)
        )
        return cur.fetchall()


def count_users():
    with get_db_cursor() as cur:
        cur.execute("SELECT COUNT(*) AS c FROM users")
        return cur.fetchone()["c"]


def set_active(user_id: int, is_active: bool):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "UPDATE users SET is_active = %s WHERE id = %s", (bool(is_active), user_id)
        )
    return find_by_id(user_id)
