"""
app.py
-------
Application entry point. Wires together Flask, CORS, blueprints,
global error handling, and request logging.
"""
import os
import time

from flask import Flask, jsonify, request, g
from flask_cors import CORS

from config import Config
from database.db import init_db, wait_for_postgres
from utils.logger import get_logger

from controllers.auth_controller import auth_bp
from controllers.category_controller import category_bp
from controllers.product_controller import product_bp
from controllers.customer_controller import customer_bp
from controllers.order_controller import order_bp, dashboard_bp

logger = get_logger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})

    # ---- Register blueprints -------------------------------------------------
    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(dashboard_bp)

    # ---- Request logging -------------------------------------------------
    @app.before_request
    def start_timer():
        g._start_time = time.time()

    @app.after_request
    def log_request(response):
        duration_ms = (time.time() - getattr(g, "_start_time", time.time())) * 1000
        logger.info(
            f"{request.method} {request.path} -> {response.status_code} ({duration_ms:.1f}ms)"
        )
        return response

    # ---- Health check ------------------------------------------------------
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "inventory-management-api"}), 200

    # ---- Global error handlers ----------------------------------------------
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Unhandled internal server error")
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    # Initialize the database schema on startup (idempotent - schema.sql
    # uses CREATE TABLE/INDEX IF NOT EXISTS).
    if Config.DB_ENGINE == "postgres":
        logger.info("Waiting for PostgreSQL to become available...")
        wait_for_postgres()
        logger.info("PostgreSQL is available - initializing schema.")
        init_db()
    elif not os.path.exists(Config.SQLITE_PATH):
        logger.info("No existing SQLite database found - initializing schema.")
        init_db()

    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=Config.DEBUG)
