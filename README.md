# InvenTrack — Inventory & Order Management System

A complete three-tier web application for managing product inventory, categories, customers, and sales orders. Built as a real-world, production-style example of a layered full-stack architecture.

## Why this project

Inventory and order management is a problem nearly every small-to-medium business faces: tracking stock levels, preventing overselling, managing customers, and processing orders through a lifecycle (pending → processing → shipped → completed). It's complex enough to showcase authentication, validation, relational data modeling, transactional business logic (stock deduction/restocking), and a real multi-page UI — while staying scoped enough to deliver completely.

## Architecture (Three-Tier)

```
┌─────────────────────┐      REST/JSON over HTTPS      ┌──────────────────────┐      SQL       ┌──────────────────┐
│   Frontend (Tier 1) │ ──────────────────────────────▶ │   Backend (Tier 2)   │ ─────────────▶ │  Database (Tier 3)│
│  React (Vite) SPA   │ ◀────────────────────────────── │  Python / Flask API  │ ◀───────────── │  SQLite/PostgreSQL │
└─────────────────────┘                                  └──────────────────────┘                 └──────────────────┘
```

- **Tier 1 — Frontend**: Responsive React single-page app (built with Vite), using React Router for navigation and the Context API for auth/toast state. Communicates with the backend exclusively via REST API calls — no other change was made to how the UI talks to the server.
- **Tier 2 — Backend**: Python (Flask) REST API with a strict layered architecture: **Controllers → Services → Repositories → Database**. JWT-based authentication, input validation, centralized error handling, and structured logging. **Unchanged from the original implementation.**
- **Tier 3 — Database**: Relational database. Ships with **SQLite** by default (zero configuration, file-based) and is fully portable to **PostgreSQL** by changing one environment variable. **Unchanged from the original implementation.**

> **Migration note:** Only the frontend was rebuilt (from vanilla HTML/CSS/JS to React). The backend, its layered architecture, the REST API contract, and the database schema/engine are exactly as before, so the two tiers remain fully compatible with no API changes required.

## Backend Layered Architecture

```
backend/
├── app.py                  # Application entry point, blueprint registration, error handlers
├── config.py                # Centralized environment-based configuration
├── controllers/              # REST route handlers (HTTP layer) — request/response only
│   ├── auth_controller.py
│   ├── category_controller.py
│   ├── product_controller.py
│   ├── customer_controller.py
│   └── order_controller.py
├── services/                 # Business logic layer — validation rules, transactions, workflow
│   ├── auth_service.py
│   ├── category_service.py
│   ├── product_service.py
│   ├── customer_service.py
│   └── order_service.py
├── repositories/             # Data access layer — raw SQL queries only, no business logic
│   ├── user_repository.py
│   ├── category_repository.py
│   ├── product_repository.py
│   ├── customer_repository.py
│   └── order_repository.py
├── models/                   # Row → JSON serialization helpers
│   ├── user.py
│   ├── product.py
│   └── order.py
├── database/
│   ├── schema.sql             # Full DDL (tables, constraints, indexes)
│   ├── seed_data.sql          # Sample catalog/customer data
│   ├── seed.py                 # Seeding script (creates schema + sample data + demo users)
│   └── db.py                   # Connection layer (SQLite default, PostgreSQL-ready)
├── utils/
│   ├── auth.py                  # JWT creation/verification, route decorators
│   ├── validators.py            # Request payload validation
│   └── logger.py                # Rotating file + console logging
├── requirements.txt
└── .env.example
```

This separation means: controllers never touch SQL, services never touch Flask's `request` object, and repositories never contain business rules. Each layer can be tested or replaced independently.

## Frontend Architecture (React)

```
frontend/
├── index.html              # Vite entry HTML (mounts <div id="root">)
├── package.json
├── vite.config.js
├── .env.example             # VITE_API_BASE override for the backend URL
└── src/
    ├── main.jsx              # React root, wraps App in BrowserRouter
    ├── App.jsx                # Route table + protected/public route guards
    ├── api.js                 # fetch wrapper + JWT header injection (same contract as before)
    ├── utils.js                # currency/date formatting, debounce helper
    ├── styles.css               # Original stylesheet, reused as-is
    ├── context/
    │   └── AuthContext.jsx       # Session state: login/register/logout, current user, isAdmin
    ├── components/
    │   ├── AppShell.jsx           # Sidebar + topbar layout, wraps all authenticated pages
    │   ├── Modal.jsx               # Reusable modal dialog
    │   ├── Pagination.jsx           # Reusable numbered pagination control
    │   └── Toast.jsx                 # Toast notification provider/hook
    └── pages/
        ├── Login.jsx               # Sign in / register screen
        ├── Dashboard.jsx            # Summary stat cards
        ├── Products.jsx              # Product CRUD, search, low-stock filter, stock adjust
        ├── Categories.jsx             # Category CRUD
        ├── Customers.jsx               # Customer CRUD, search
        └── Orders.jsx                   # Order list/filter, detail view, status transitions, new-order builder
```

Each page owns its own data fetching (via `useEffect` + the shared `Api` client) and renders the same tables, modals, and forms as the original UI — same fields, same validation messages, same behavior — just as React components instead of DOM string templates.

## Features

- **Authentication**: JWT-based registration/login with bcrypt-style password hashing (Werkzeug's PBKDF2). Two roles: `admin` (full CRUD) and `staff` (read + order placement).
- **Product/Inventory CRUD**: SKU-based catalog with category assignment, pricing, stock levels, reorder thresholds, and low-stock flagging.
- **Category CRUD**: Simple taxonomy for products.
- **Customer CRUD**: Customer directory used when placing orders.
- **Order Management**: Multi-item orders with automatic stock validation and deduction at creation time, plus a guarded status lifecycle (`pending → processing → shipped → completed`, or `→ cancelled` with automatic restocking).
- **Dashboard**: Live stats (total products, low-stock count, total/pending orders, revenue, customer count).
- **Validation & Error Handling**: Every write endpoint validates input server-side and returns structured error messages; global 404/405/500 handlers.
- **Logging**: Every request is logged (method, path, status, duration) to console and a rotating log file (`backend/logs/app.log`).
- **Responsive UI**: Works on desktop and mobile (collapsible sidebar, fluid tables).

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, React Router 6, Vite (build tool/dev server) |
| Backend   | Python 3.10+, Flask, PyJWT, Werkzeug, flask-cors |
| Database  | SQLite (default) — fully portable to PostgreSQL (psycopg2 included) |

## Getting Started

### Prerequisites
- Python 3.10+ and pip
- Node.js 18+ and npm (for the React frontend)

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # adjust values as needed (defaults work out of the box)

# Initialize the database schema and load sample data:
python3 -m database.seed

# Run the API server:
python3 app.py
```

The API will be available at `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`.

**Demo accounts created by the seed script:**
| Role  | Email                     | Password    |
|-------|---------------------------|-------------|
| Admin | admin@inventory.local     | Admin@123   |
| Staff | staff@inventory.local     | Staff@123   |

### 2. Frontend Setup (React)

```bash
cd frontend
npm install

cp .env.example .env             # optional: set VITE_API_BASE if the backend isn't on localhost:5000

npm run dev
```

Open `http://localhost:8080` in your browser (Vite dev server). The frontend auto-detects the API at `http://localhost:5000` if `VITE_API_BASE` isn't set (see `src/api.js`).

To build a production bundle:

```bash
npm run build      # outputs static files to frontend/dist
npm run preview    # serve the production build locally on port 8080
```

The contents of `frontend/dist` after `npm run build` can be deployed to any static host (nginx, S3 + CDN, Vercel, Netlify, etc.) — see `frontend/Dockerfile` for a containerized nginx build.

### 3. Switching to PostgreSQL (optional)

1. Create a PostgreSQL database.
2. In `backend/.env`, set:
   ```
   DB_ENGINE=postgres
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=inventory_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=yourpassword
   ```
3. Apply the schema: `psql -U postgres -d inventory_db -f database/schema.sql`
4. Load sample data: `psql -U postgres -d inventory_db -f database/seed_data.sql` (then create demo users via the `/api/auth/register` endpoint, since password hashing must be done by the application).

`schema.sql` uses `INTEGER PRIMARY KEY AUTOINCREMENT` (SQLite syntax); for PostgreSQL replace these with `SERIAL PRIMARY KEY` (a documented comment marks each occurrence).

## API Reference

Base URL: `/api`

### Auth
| Method | Endpoint              | Auth        | Description |
|--------|------------------------|-------------|--------------|
| POST   | `/auth/register`       | Public      | Create a new user account |
| POST   | `/auth/login`          | Public      | Authenticate and receive a JWT |
| GET    | `/auth/me`              | Bearer token | Get current authenticated user |

### Categories
| Method | Endpoint              | Auth          |
|--------|------------------------|---------------|
| GET    | `/categories`          | Any logged-in user |
| GET    | `/categories/:id`      | Any logged-in user |
| POST   | `/categories`          | Admin only |
| PUT    | `/categories/:id`      | Admin only |
| DELETE | `/categories/:id`      | Admin only |

### Products
| Method | Endpoint                       | Auth |
|--------|----------------------------------|------|
| GET    | `/products?page=&page_size=&search=&category_id=&low_stock=true` | Any logged-in user |
| GET    | `/products/:id`                  | Any logged-in user |
| POST   | `/products`                       | Admin only |
| PUT    | `/products/:id`                   | Admin only |
| PATCH  | `/products/:id/stock` (`{delta}`) | Any logged-in user |
| DELETE | `/products/:id`                   | Admin only (soft delete) |

### Customers
| Method | Endpoint              | Auth |
|--------|------------------------|------|
| GET    | `/customers?page=&search=` | Any logged-in user |
| GET    | `/customers/:id`       | Any logged-in user |
| POST   | `/customers`            | Any logged-in user |
| PUT    | `/customers/:id`        | Any logged-in user |
| DELETE | `/customers/:id`        | Admin only |

### Orders
| Method | Endpoint                          | Auth |
|--------|-------------------------------------|------|
| GET    | `/orders?page=&status=&customer_id=` | Any logged-in user |
| GET    | `/orders/:id`                        | Any logged-in user |
| POST   | `/orders` (`{customer_id, items:[{product_id, quantity}]}`) | Any logged-in user |
| PATCH  | `/orders/:id/status` (`{status}`)    | Any logged-in user |

### Dashboard
| Method | Endpoint           | Auth |
|--------|---------------------|------|
| GET    | `/dashboard/stats`  | Any logged-in user |

All authenticated endpoints require an `Authorization: Bearer <token>` header. This contract is unchanged from the original vanilla-JS frontend, so the React frontend and the backend need no code changes to interoperate.

## Database Schema Overview

- **users** — application accounts (admin/staff), hashed passwords
- **categories** — product categories
- **products** — inventory items (SKU, price, stock, reorder level)
- **customers** — customer directory
- **orders** — sales orders with status lifecycle and computed total
- **order_items** — order line items (many-to-many between orders and products)

See `backend/database/schema.sql` for full DDL with constraints and indexes, and `backend/database/seed_data.sql` for sample data.

## Order Lifecycle & Stock Logic

1. Placing an order validates that every requested product has sufficient stock, then atomically deducts stock and creates the order + line items in a single transaction.
2. Status transitions are guarded by a state machine (`order_service.VALID_TRANSITIONS`) — you cannot, for example, ship a `pending` order without first marking it `processing`.
3. Cancelling an order (`pending` or `processing` only) automatically restocks every item back to inventory.

## Logging

All requests are logged with method, path, response status, and duration to both the console and `backend/logs/app.log` (rotating, 2MB per file, 3 backups retained).

## Security Notes

- Passwords are hashed with Werkzeug's PBKDF2 implementation — never stored in plaintext.
- JWT tokens expire after 8 hours by default (configurable via `JWT_EXPIRES_HOURS`).
- Role-based access control restricts catalog mutation (create/edit/delete products & categories, delete customers) to `admin` users. The React frontend mirrors this by conditionally rendering admin-only buttons based on the logged-in user's role, but the backend is the source of truth and re-validates every request.
- Change `SECRET_KEY` and `JWT_SECRET` in `.env` before any real deployment.

## Project Structure

```
inventory-app/
├── backend/         # Flask REST API (see backend layered architecture above) — unchanged
└── frontend/         # React (Vite) single-page app — rebuilt from the original vanilla JS/HTML/CSS
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── Dockerfile
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── utils.js
        ├── styles.css
        ├── context/AuthContext.jsx
        ├── components/ (AppShell, Modal, Pagination, Toast)
        └── pages/ (Login, Dashboard, Products, Categories, Customers, Orders)
```

## Status

✅ **Project complete.** All planned modules (auth, products, categories, customers, orders, dashboard) are implemented, tested end-to-end against a running server, and documented above. The frontend has been migrated from vanilla HTML/CSS/JS to React while the backend (Flask/layered architecture) and database (SQLite/PostgreSQL) remain unchanged.
