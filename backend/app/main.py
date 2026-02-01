import logging
import os
import time
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import get_settings
from app.db import close_redis, init_redis
from app.metrics import increment
from app.utils import get_request_id, log_event
from routers import router as api_router


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(title='HireTrack API')

origins = [origin.strip() for origin in settings.cors_origins.split(',') if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.middleware('http')
async def request_logging_middleware(request: Request, call_next):
    request_id = get_request_id()
    request.state.request_id = request_id
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    increment('total_requests', 1)
    if response.status_code >= 400:
        increment('error_requests', 1)
    log_event(
        'request',
        request_id=request_id,
        user_id=getattr(request.state, 'user_id', None),
        endpoint=request.url.path,
        method=request.method,
        status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
    )
    response.headers['X-Request-ID'] = request_id
    return response


def run_migrations():
    """Run Alembic migrations on startup using subprocess."""
    import subprocess
    import sys
    import os
    
    try:
        logger.info("Running database migrations...")
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=base_dir,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            logger.info("Migrations completed successfully")
        else:
            logger.error(f"Migration failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        logger.error("Migration timed out")
    except Exception as e:
        logger.error(f"Migration error: {e}")


@app.on_event('startup')
async def on_startup() -> None:
    run_migrations()
    init_redis()


@app.on_event('shutdown')
async def on_shutdown() -> None:
    await close_redis()


app.include_router(api_router)

# Serve frontend static files in production
# The frontend build should be copied to backend/static/
STATIC_DIR = Path(__file__).resolve().parents[1] / "static"

if STATIC_DIR.exists():
    # Serve static assets (js, css, images, etc.)
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    # Catch-all route for SPA - must be last
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve index.html for all non-API routes (SPA fallback)."""
        # If the path looks like a file with extension, try to serve it
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # Otherwise serve index.html for client-side routing
        return FileResponse(STATIC_DIR / "index.html")
