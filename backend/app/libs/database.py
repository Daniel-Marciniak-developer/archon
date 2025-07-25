import os
import asyncpg
from app.env import mode, Mode
async def get_db_connection():
    if mode == Mode.PROD:
        db_url = os.getenv("DATABASE_URL_ADMIN_PROD")
    else:
        db_url = os.getenv("DATABASE_URL_ADMIN_DEV")
    if not db_url:
        raise ValueError(f"Database URL not found for mode: {mode}")
    conn = await asyncpg.connect(db_url)
    return conn
