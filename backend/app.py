"""
app.py
-------
Application entry point. Wires together Flask, CORS, blueprints,
global error handling, and request logging.
"""
import os
import sys
import time
from datetime import datetime, timezone

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


def _log_api_failure(exc: Exception):
    """
    Emit everything Loki/Grafana need to alert on a failed request:
    HTTP method, path, exception message, full stack trace, and an
    explicit timestamp. This runs for *any* exception that reaches
    Flask uncaught, including database outages - the exact case that
    previously produced no ERROR log at all.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    logger.error(
        "%s %s -> 500 | exception=%s | timestamp=%s",
        request.method,
        request.path,
        repr(exc),
        timestamp,
        exc_info=True,
    )


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Belt-and-braces: make sure Flask never re-raises an exception past
    # our own error handlers (e.g. into the interactive debugger) - every
    # exception, in every environment, should go through the logging
    # handlers registered below instead.
    app.config["PROPAGATE_EXCEPTIONS"] = False

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
        # Reached when Flask/Werkzeug itself raises or wraps a 500
        # (e.g. via abort(500)). getattr covers the case where there's
        # no underlying Python exception attached.
        _log_api_failure(getattr(e, "original_exception", e))
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(Exception)
    def unhandled_exception(e):
        """
        Catch-all for every exception that isn't an HTTPException with
        its own handler above (404/405/500). This is what makes
        database outages, driver errors, and any other unexpected
        failure visible as an ERROR log with a full stack trace,
        instead of failing the request with no log line at all. Flask
        finds this handler via the exception's MRO regardless of
        FLASK_ENV/debug settings, so it fires the same way in
        development and in Docker/production.
        """
        _log_api_failure(e)
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    # ---- Startup -------------------------------------------------------
    # A startup failure (most commonly: Postgres isn't reachable yet, or
    # never comes up) must be logged loudly and cause the process to
    # exit non-zero - not hang, and not print a bare traceback that
    # bypasses the logging pipeline - so Docker's restart policy and
    # Loki-based alerting both see it.
    try:
        if Config.DB_ENGINE == "postgres":
            logger.info("Waiting for PostgreSQL to become available...")
            wait_for_postgres()
            logger.info("PostgreSQL is available - initializing schema.")
            init_db()
        elif not os.path.exists(Config.SQLITE_PATH):
            logger.info("No existing SQLite database found - initializing schema.")
            init_db()
    except Exception:
        logger.critical("Fatal error during application startup", exc_info=True)
        sys.exit(1)

    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=Config.DEBUG)
