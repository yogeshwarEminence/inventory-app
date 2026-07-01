"""models/product.py - Row -> dict serialization for Product/Category entities."""


def serialize_category(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "created_at": str(row["created_at"]) if row["created_at"] else None,
    }


def serialize_product(row) -> dict:
    return {
        "id": row["id"],
        "sku": row["sku"],
        "name": row["name"],
        "description": row["description"],
        "category_id": row["category_id"],
        "category_name": row["category_name"] if "category_name" in row.keys() else None,
        "unit_price": float(row["unit_price"]),
        "quantity_in_stock": row["quantity_in_stock"],
        "reorder_level": row["reorder_level"],
        "is_active": bool(row["is_active"]),
        "low_stock": row["quantity_in_stock"] <= row["reorder_level"],
        "created_at": str(row["created_at"]) if row["created_at"] else None,
        "updated_at": str(row["updated_at"]) if row["updated_at"] else None,
    }
