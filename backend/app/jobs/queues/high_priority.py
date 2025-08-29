"""High priority queue for fast tasks."""

from celery import Celery
from app.jobs.tasks import app

@app.task(queue='high')
def run_quick_analysis(project_id: str):
    """Run quick analysis tasks like Ruff."""
    pass

@app.task(queue='high')
def generate_quick_report(project_id: str):
    """Generate initial report with quick results."""
    pass
