"""Medium priority queue for standard analysis tasks."""

from celery import Celery
from app.jobs.tasks import app

@app.task(queue='medium')
def run_full_analysis(project_id: str):
    """Run complete analysis including structure and security."""
    pass

@app.task(queue='medium')
def generate_full_report(project_id: str):
    """Generate complete analysis report."""
    pass
