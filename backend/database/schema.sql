-- =====================================================================
-- Inventory & Order Management System - Database Schema
-- PostgreSQL syntax (target production database, run inside Docker
-- Compose via the `postgres` service). See db.py for connection setup.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: users
-- Stores application users with role-based access (admin / staff).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Table: categories
-- Product categories for grouping inventory items.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(255),
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Table: products
-- Core inventory items with stock and pricing information.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    sku             VARCHAR(50)   NOT NULL UNIQUE,
    name            VARCHAR(150)  NOT NULL,
    description     TEXT,
    category_id     INTEGER       REFERENCES categories(id) ON DELETE SET NULL,
    unit_price      DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity_in_stock INTEGER     NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    reorder_level   INTEGER       NOT NULL DEFAULT 10,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Table: customers
-- Customers that orders are placed for.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(150) UNIQUE,
    phone           VARCHAR(30),
    address         VARCHAR(255),
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Table: orders
-- Sales orders placed by customers, processed by staff users.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id              SERIAL PRIMARY KEY,
    customer_id     INTEGER      NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    user_id         INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    order_date      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Table: order_items
-- Line items belonging to an order (many-to-many: orders <-> products).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INTEGER       NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity        INTEGER       NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal        DECIMAL(12,2) NOT NULL
);

-- ---------------------------------------------------------------------
-- Indexes for performance on common lookups
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku         ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_customer      ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product  ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
