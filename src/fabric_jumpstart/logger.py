"""Logging utilities for capturing and filtering logs during operations."""

import io
import logging
import re
from contextlib import contextmanager
from typing import Callable, List, Optional

_ANSI_RE = re.compile(r"\x1B[@-Z\\-_]|\x1B\[[0-?]*[ -/]*[@-~]")


def strip_ansi(text: str) -> str:
    """Remove ANSI escape codes from a string.
    
    Args:
        text: Text that may contain ANSI codes
        
    Returns:
        Clean text without ANSI codes
    """
    return _ANSI_RE.sub('', text or '')


def should_filter_log(message: str) -> bool:
    """Determine if a log message should be filtered out.
    
    Args:
        message: Log message to check
        
    Returns:
        True if message should be filtered, False otherwise
    """
    cleaned = strip_ansi(str(message))
    return cleaned.lstrip().startswith("#####")


class BufferedLogHandler(logging.Handler):
    """Collect INFO+ log records for rendering in HTML or other outputs.
    
    Args:
        sink: List to append log records to
        on_emit: Optional callback to invoke after each log record
        level: Minimum log level to capture (default: INFO)
    """

    def __init__(
        self, 
        sink: List[dict], 
        on_emit: Optional[Callable[[], None]] = None,
        level: int = logging.INFO
    ):
        super().__init__(level=level)
        self.sink = sink
        self.on_emit = on_emit

    def emit(self, record: logging.LogRecord):
        """Process a log record and add it to the sink."""
        try:
            if record.levelno >= self.level:
                msg = record.getMessage()
                if should_filter_log(msg):
                    return
                self.sink.append({
                    "level": record.levelname,
                    "message": msg,
                })
                if record.exc_info:
                    exc_text = logging.Formatter().formatException(record.exc_info)
                    for line in exc_text.splitlines():
                        if not line:
                            continue
                        self.sink.append({
                            "level": record.levelname,
                            "message": line,
                        })
                if self.on_emit:
                    self.on_emit()
        except Exception:
            # Swallow logging issues to avoid breaking the operation
            pass


class StreamToLogger:
    """Capture stdout/stderr writes and feed them into a log buffer.
    
    Args:
        sink: List to append log records to
        on_emit: Optional callback to invoke after each write
        level: Log level string (e.g., "INFO", "ERROR")
    """

    def __init__(
        self, 
        sink: List[dict], 
        on_emit: Optional[Callable[[], None]] = None, 
        level: str = "INFO"
    ):
        self.sink = sink
        self.on_emit = on_emit
        self.level = level
        self._buf = ""

    def write(self, s: str) -> int:
        """Write string to the logger, buffering incomplete lines."""
        if not s:
            return 0
        self._buf += s
        lines = self._buf.splitlines(keepends=True)
        self._buf = '' if (lines and not lines[-1].endswith('\n')) else ''
        if lines and not lines[-1].endswith('\n'):
            self._buf = lines.pop()
        for line in lines:
            msg = line.rstrip('\n')
            if msg:
                if should_filter_log(msg):
                    continue
                self.sink.append({"level": self.level, "message": msg})
                if self.on_emit:
                    self.on_emit()
        return len(s)

    def flush(self):
        """Flush any remaining buffered content."""
        if self._buf:
            msg = self._buf
            if should_filter_log(msg):
                self._buf = ""
                return
            self.sink.append({"level": self.level, "message": msg})
            if self.on_emit:
                self.on_emit()
            self._buf = ""


@contextmanager
def log_capture_context(
    log_buffer: List[dict],
    target_loggers: List[logging.Logger],
    on_emit: Optional[Callable[[], None]] = None,
    debug: bool = False,
    capture_stdout: bool = True,
    capture_stderr: bool = True
):
    """Context manager for capturing logs and stdout/stderr.
    
    Args:
        log_buffer: List to collect log records in
        target_loggers: List of loggers to capture from
        on_emit: Optional callback after each log/write
        debug: If True, set log level to DEBUG, else INFO
        capture_stdout: If True, redirect stdout to logger
        capture_stderr: If True, redirect stderr to logger
        
    Yields:
        Tuple of (handler, stdout_proxy, stderr_proxy)
        
    Example:
        log_buffer = []
        loggers = [logging.getLogger('myapp')]
        with log_capture_context(log_buffer, loggers):
            # Logs are captured to log_buffer
            logger.info("test")
    """
    handler = BufferedLogHandler(log_buffer, on_emit=on_emit)
    stdout_proxy = StreamToLogger(log_buffer, on_emit=on_emit, level="INFO") if capture_stdout else None
    stderr_proxy = StreamToLogger(log_buffer, on_emit=on_emit, level="ERROR") if capture_stderr else None
    
    # Save original states
    original_states = []
    for logger in target_loggers:
        original_states.append((logger, list(logger.handlers), logger.propagate, logger.level))
        logger.handlers = [handler]
        logger.propagate = False
        logger.setLevel(logging.DEBUG if debug else logging.INFO)
    
    try:
        if capture_stdout and capture_stderr:
            import contextlib
            with contextlib.redirect_stdout(stdout_proxy), contextlib.redirect_stderr(stderr_proxy):
                yield handler, stdout_proxy, stderr_proxy
        elif capture_stdout:
            import contextlib
            with contextlib.redirect_stdout(stdout_proxy):
                yield handler, stdout_proxy, None
        elif capture_stderr:
            import contextlib
            with contextlib.redirect_stderr(stderr_proxy):
                yield handler, None, stderr_proxy
        else:
            yield handler, None, None
    finally:
        # Restore original states
        for logger, handlers, propagate, level in original_states:
            logger.handlers = handlers
            logger.propagate = propagate
            logger.setLevel(level)


@contextmanager
def suppress_logger(logger_name: str, level: int = logging.ERROR):
    """Temporarily silence a logger.
    
    Args:
        logger_name: Name of logger to suppress
        level: New log level to set (default: ERROR)
        
    Example:
        with suppress_logger('fabric_cicd'):
            # fabric_cicd logs are suppressed
            do_something()
    """
    logger = logging.getLogger(logger_name)
    original_level = logger.level
    try:
        logger.setLevel(level)
        with io.StringIO():
            yield
    finally:
        logger.setLevel(original_level)
