"""
utils/logger.py
-----------------
Centralized logging configuration for the application.

Design goals:
  * Logs go to stdout/stderr ONLY. Docker captures a container's
    stdout/stderr and Fluent Bit tails that, forwarding everything to
    Loki. Writing to a file *inside* the container adds a second,
    redundant pipeline: the file is lost whenever the container is
    recreated, it isn't picked up by Fluent Bit's Docker log input,
    and it can silently fill the container's disk. So this module
    replaces the previous file + console setup with stdout/stderr
    only.
  * INFO/DEBUG/WARNING go to stdout, ERROR/CRITICAL go to stderr.
    This means `docker logs` (and Fluent Bit, which tags Docker logs
    with a `stream` field of `stdout`/`stderr`) can distinguish normal
    activity from failures even before Loki's `level` label is
    parsed, which makes Grafana alerting rules more robust.
  * The log level is configurable via the LOG_LEVEL environment
    variable (DEBUG / INFO / WARNING / ERROR / CRITICAL), defaulting
    to INFO, so the same image can be run chattier in staging and
    quieter in production without a code change.
  * Any exception that reaches the top of a thread - the main thread
    (via sys.excepthook) or any background thread (via
    threading.excepthook) - is logged with a full traceback instead of
    crashing the process with an unstructured traceback that bypasses
    the logging pipeline entirely.
"""
import logging
import os
import sys
import threading

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

_configured = False


class _MaxLevelFilter(logging.Filter):
    """Filter that only lets records at or below a given level through."""

    def __init__(self, max_level):
        super().__init__()
        self.max_level = max_level

    def filter(self, record):
        return record.levelno <= self.max_level


def _install_exception_hooks(root_logger: logging.Logger) -> None:
    """
    Make sure NO exception can ever crash the process, or a background
    thread, without a corresponding ERROR/CRITICAL log line + stack
    trace being emitted first.
    """

    def _log_unhandled_main(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        root_logger.critical(
            "Uncaught exception - process is about to exit",
            exc_info=(exc_type, exc_value, exc_traceback),
        )

    sys.excepthook = _log_unhandled_main

    def _log_unhandled_thread(args: "threading.ExceptHookArgs"):
        root_logger.critical(
            "Uncaught exception in background thread '%s'",
            args.thread.name,
            exc_info=(args.exc_type, args.exc_value, args.exc_traceback),
        )

    threading.excepthook = _log_unhandled_thread


def _configure_root_logger() -> None:
    global _configured
    if _configured:
        return

    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)

    formatter = logging.Formatter(_LOG_FORMAT, datefmt=_DATE_FORMAT)

    # DEBUG / INFO / WARNING -> stdout
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(level)
    stdout_handler.addFilter(_MaxLevelFilter(logging.WARNING))
    stdout_handler.setFormatter(formatter)

    # ERROR / CRITICAL -> stderr
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(logging.ERROR)
    stderr_handler.setFormatter(formatter)

    root.addHandler(stdout_handler)
    root.addHandler(stderr_handler)

    _install_exception_hooks(root)
    _configured = True


def get_logger(name: str) -> logging.Logger:
    """
    Return a module-scoped logger.

    The root logger is configured exactly once with the stdout/stderr
    handlers above; every named logger returned here simply propagates
    up to it. That is deliberately different from the previous
    implementation, which attached its own handlers to *each* named
    logger - centralizing the handlers avoids duplicate log lines and
    keeps stream routing (stdout vs stderr) in one place.
    """
    _configure_root_logger()
    return logging.getLogger(name)
