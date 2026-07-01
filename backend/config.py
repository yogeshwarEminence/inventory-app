"""
config.py
----------
Centralized application configuration, loaded from environment
variables (see .env.example). Keeps secrets and environment-specific
settings out of source code.
"""
import os
from datetime import timedelta

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Config:
    # General
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = ENV == "development"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_EXPIRES_HOURS", "8")))
    JWT_ALGORITHM = "HS256"

    # Database engine: 'sqlite' (default) or 'postgres'
    DB_ENGINE = os.getenv("DB_ENGINE", "sqlite")

    # SQLite
    SQLITE_PATH = os.getenv(
        "SQLITE_PATH",
        os.path.join(os.path.dirname(__file__), "database", "inventory.db"),
    )

    # PostgreSQL (used only if DB_ENGINE=postgres)
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "inventory_db")
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    # Pagination defaults
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
