"""Celery task definitions."""

from celery import Celery

app = Celery('archon',
             broker='redis://localhost:6379/0',
             backend='redis://localhost:6379/0')

app.conf.task_routes = {
    'app.jobs.queues.high_priority.*': {'queue': 'high'},
    'app.jobs.queues.medium_priority.*': {'queue': 'medium'},
    'app.jobs.queues.low_priority.*': {'queue': 'low'},
}

app.conf.task_queue_max_priority = {
    'high': 10,
    'medium': 5,
    'low': 1,
}
