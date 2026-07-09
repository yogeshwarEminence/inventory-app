"""
database/db.py
----------------
Database connection layer.

Runtime database is PostgreSQL (see config.py / .env). psycopg2 is used
with a RealDictCursor so query results behave like dict-like rows
(row["col"], row.keys(), dict(row)) - the same interface the rest of
the codebase (models/, repositories/) already relies on.

DB_ENGINE=sqlite is still accepted for local, dependency-free
experimentation, but the repository layer now uses PostgreSQL (%s)
parameter placeholders, so SQLite mode is not functionally supported
end-to-end - use PostgreSQL (the Docker Compose default) for a working
application.

Every place a database error can originate (connecting, and running a
query) is wrapped so it is logged with a clear, greppable message and
a full traceback *before* it is re-raised. Re-raising matters just as
much as logging: callers (repositories -> services -> controllers)
still need the exception to propagate so the Flask-level error handler
in app.py can turn it into a proper 500 response - this module's job is
only to make sure the failure is never silent, not to swallow it.
"""
import os
import time
import sqlite3
from contextlib import contextmanager

from config import Config
from utils.logger import get_logger

logger = get_logger(__name__)


def get_connection():
    """Return a new database connection based on configured engine."""
    if Config.DB_ENGINE == "postgres":
        import psycopg2
        import psycopg2.extras
        try:
            conn = psycopg2.connect(
                host=Config.POSTGRES_HOST,
                port=Config.POSTGRES_PORT,
                dbname=Config.POSTGRES_DB,
                user=Config.POSTGRES_USER,
                password=Config.POSTGRES_PASSWORD,
                cursor_factory=psycopg2.extras.RealDictCursor,
            )
            return conn
        except Exception:
            # This is the single choke point every DB-backed request goes
            # through, so logging here guarantees an "ERROR Database
            # connection failed" line (with traceback) shows up in Loki
            # any time Postgres is stopped/unreachable/refusing
            # connections - regardless of which API route triggered it.
            logger.error("Database connection failed", exc_info=True)
            raise

    # Default: SQLite
    try:
        conn = sqlite3.connect(Config.SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn
    except Exception:
        logger.error("Database connection failed", exc_info=True)
        raise


def wait_for_postgres(max_attempts: int = 30, delay_seconds: float = 1.0):
    """
    Block until PostgreSQL accepts connections, or raise after
    max_attempts. Needed because Docker Compose's `depends_on` only
    waits for the postgres *container* to start, not for the database
    inside it to finish initializing and start accepting connections.
    """
    if Config.DB_ENGINE != "postgres":
        return

    import psycopg2

    last_error = None
    for attempt in range(1, max_attempts + 1):
        try:
            conn = psycopg2.connect(
                host=Config.POSTGRES_HOST,
                port=Config.POSTGRES_PORT,
                dbname=Config.POSTGRES_DB,
                user=Config.POSTGRES_USER,
                password=Config.POSTGRES_PASSWORD,
            )
            conn.close()
            return
        except psycopg2.OperationalError as e:
            last_error = e
            logger.warning(
                f"PostgreSQL not yet available "
                f"(attempt {attempt}/{max_attempts}): {e}"
            )
            time.sleep(delay_seconds)

    # Startup-time DB outage: this is fatal (the app cannot serve
    # requests), so it's logged at CRITICAL with the last connection
    # error's traceback before being raised to the caller (app.py),
    # which is expected to abort startup rather than run in a broken
    # state.
    logger.critical(
        f"Could not connect to PostgreSQL after {max_attempts} attempts",
        exc_info=last_error,
    )
    raise RuntimeError(
        f"Could not connect to PostgreSQL after {max_attempts} attempts: {last_error}"
    )


@contextmanager
def get_db_cursor(commit=False):
    """
    Context manager that yields a cursor and handles
    commit / rollback / close automatically.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            # The connection may already be dead (e.g. it dropped mid
            # query) - don't let a failed rollback mask the original
            # error below.
            pass
        logger.error("Database query failed", exc_info=True)
        raise
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            conn.close()
        except Exception:
            pass


def init_db():
    """Initialize database schema from schema.sql if not already present."""
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    try:
        with open(schema_path, "r") as f:
            schema_sql = f.read()

        if Config.DB_ENGINE == "postgres":
            wait_for_postgres()

        conn = get_connection()
        try:
            if Config.DB_ENGINE == "postgres":
                cur = conn.cursor()
                cur.execute(schema_sql)
                conn.commit()
            else:
                conn.executescript(schema_sql)
                conn.commit()
        finally:
            conn.close()
    except Exception:
        logger.critical("Failed to initialize database schema", exc_info=True)
        raise
