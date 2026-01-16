import logging
import uuid
from typing import Any


logger = logging.getLogger('hiretrack')


def get_request_id() -> str:
    return str(uuid.uuid4())


def log_event(message: str, **data: Any) -> None:
    payload = {'message': message, **data}
    logger.info(payload)


def paginate(page: int | None, page_size: int | None) -> tuple[int, int]:
    safe_page = max(page or 1, 1)
    safe_size = max(page_size or 10, 1)
    return safe_page, safe_size
