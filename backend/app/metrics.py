from threading import Lock


_counters = {
    'total_requests': 0,
    'error_requests': 0,
    'application_submissions': 0,
    'status_transitions': 0,
}
_lock = Lock()


def increment(name: str, value: int = 1) -> None:
    with _lock:
        _counters[name] = _counters.get(name, 0) + value


def snapshot() -> dict:
    with _lock:
        return dict(_counters)
