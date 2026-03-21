"""Admin CLI utilities for HireTrack."""

import asyncio
import sys

from app.db import async_session
from app.models import User, UserRole


async def promote_to_admin(email: str) -> None:
    """Promote a user to admin role by email."""
    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f"User with email '{email}' not found.")
            return
        user.role = UserRole.admin
        await session.commit()
        print(f"User '{email}' promoted to admin.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python admin.py <email>")
        sys.exit(1)
    asyncio.run(promote_to_admin(sys.argv[1]))
