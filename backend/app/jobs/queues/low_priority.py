"""Low priority queue for AI-powered tasks."""

from celery import Celery
from app.jobs.tasks import app

@app.task(queue='low')
def run_ai_analysis(project_id: str):
    """Run AI-powered code analysis."""
    pass

@app.task(queue='low')
def generate_ai_insights(project_id: str):
    """Generate AI-powered insights and recommendations."""
    pass
