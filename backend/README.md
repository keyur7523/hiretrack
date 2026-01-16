# HireTrack Backend

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Services

Start PostgreSQL and Redis locally (Docker Compose optional, but not included here).

## Migrations

```bash
alembic upgrade head
```

## Run

```bash
uvicorn app.main:app --reload --port 8080
```
