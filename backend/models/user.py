"""models/user.py - Row -> dict serialization for User entity."""


def serialize_user(row) -> dict:
    return {
        "id": row["id"],
        "full_name": row["full_name"],
        "email": row["email"],
        "role": row["role"],
        "is_active": bool(row["is_active"]),
        "created_at": str(row["created_at"]) if row["created_at"] else None,
    }
