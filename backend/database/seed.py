"""
database/seed.py
------------------
Populates the database with sample data, including a default admin
and staff user with properly hashed passwords.

Run with:  python -m database.seed
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from werkzeug.security import generate_password_hash
from database.db import get_db_cursor, init_db


def seed():
    init_db()

    with get_db_cursor(commit=True) as cur:
        # ---- Users -----------------------------------------------------
        cur.execute("SELECT COUNT(*) AS c FROM users")
        row = cur.fetchone()
        count = row["c"] if hasattr(row, "keys") else row[0]
        if count == 0:
            admin_hash = generate_password_hash("Admin@123")
            staff_hash = generate_password_hash("Staff@123")
            cur.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                ("System Administrator", "admin@inventory.local", admin_hash, "admin"),
            )
            cur.execute(
                "INSERT INTO users (full_name, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                ("Staff Member", "staff@inventory.local", staff_hash, "staff"),
            )
            print("Seeded users: admin@inventory.local / Admin@123, staff@inventory.local / Staff@123")
        else:
            print("Users already exist - skipping user seeding.")

        # ---- Categories / Products / Customers (from .sql file) --------
        cur.execute("SELECT COUNT(*) AS c FROM categories")
        row = cur.fetchone()
        count = row["c"] if hasattr(row, "keys") else row[0]
        if count == 0:
            seed_sql_path = os.path.join(os.path.dirname(__file__), "seed_data.sql")
            with open(seed_sql_path, "r") as f:
                lines = f.readlines()
            # Strip SQL comment lines (--) before splitting into statements
            sql = "\n".join(l for l in lines if not l.strip().startswith("--"))
            for statement in sql.split(";"):
                statement = statement.strip()
                if statement:
                    cur.execute(statement)
            print("Seeded categories, products, and customers.")
        else:
            print("Categories already exist - skipping catalog seeding.")

    print("Database seeding complete.")


if __name__ == "__main__":
    seed()
