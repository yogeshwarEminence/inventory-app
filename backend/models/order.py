"""models/order.py - Row -> dict serialization for Order/Customer entities."""


def serialize_customer(row) -> dict:
    return {
        "id": row["id"],
        "full_name": row["full_name"],
        "email": row["email"],
        "phone": row["phone"],
        "address": row["address"],
        "created_at": str(row["created_at"]) if row["created_at"] else None,
    }


def serialize_order(row, items=None) -> dict:
    result = {
        "id": row["id"],
        "customer_id": row["customer_id"],
        "customer_name": row["customer_name"] if "customer_name" in row.keys() else None,
        "user_id": row["user_id"],
        "status": row["status"],
        "total_amount": float(row["total_amount"]),
        "order_date": str(row["order_date"]) if row["order_date"] else None,
        "updated_at": str(row["updated_at"]) if row["updated_at"] else None,
    }
    if items is not None:
        result["items"] = items
    return result


def serialize_order_item(row) -> dict:
    return {
        "id": row["id"],
        "order_id": row["order_id"],
        "product_id": row["product_id"],
        "product_name": row["product_name"] if "product_name" in row.keys() else None,
        "quantity": row["quantity"],
        "unit_price": float(row["unit_price"]),
        "subtotal": float(row["subtotal"]),
    }
