import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import get_settings
from app.db import Base
import app.models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
config.set_main_option('sqlalchemy.url', settings.database_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option('sqlalchemy.url')
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={'paramstyle': 'named'},
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        def do_run_migrations(sync_conn):
            context.configure(
                connection=sync_conn,
                target_metadata=target_metadata,
                compare_type=True,
            )
            context.run_migrations()

        await connection.run_sync(do_run_migrations)
        await connection.commit()

    await connectable.dispose()


def run_migrations() -> None:
    if context.is_offline_mode():
        run_migrations_offline()
    else:
        asyncio.run(run_migrations_online())


run_migrations()
