import os
from celery import Celery

# Get the Redis URL from environment variables. Fallback for local development if needed.
redis_url = os.getenv("REDIS_URL")
if not redis_url:
    print("⚠️ REDIS_URL environment variable not found. Using default for local dev.")
    redis_url = "redis://localhost:6379/0"

# Initialize the Celery app
celery_app = Celery(
    "tasks",
    broker=redis_url,
    backend=redis_url,
    include=["app.libs.analysis_tasks"] 
)

celery_app.conf.update(
    task_track_started=True,
    result_expires=3600,
    broker_connection_retry_on_startup=True,
)
