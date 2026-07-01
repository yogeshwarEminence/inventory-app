"""repositories/category_repository.py - Data-access layer for categories."""
from database.db import get_db_cursor


def list_categories():
    with get_db_cursor() as cur:
        cur.execute("SELECT * FROM categories ORDER BY name ASC")
        return cur.fetchall()


def find_by_id(category_id: int):
    with get_db_cursor() as cur:
        cur.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
        return cur.fetchone()


def create_category(name: str, description: str):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO categories (name, description) VALUES (%s, %s) RETURNING id",
            (name, description),
        )
        new_id = cur.fetchone()["id"]
    return find_by_id(new_id)


def update_category(category_id: int, name: str, description: str):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "UPDATE categories SET name = %s, description = %s WHERE id = %s",
            (name, description, category_id),
        )
    return find_by_id(category_id)


def delete_category(category_id: int):
    with get_db_cursor(commit=True) as cur:
        cur.execute("DELETE FROM categories WHERE id = %s", (category_id,))
