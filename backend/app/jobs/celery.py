"""Celery worker initialization and configuration."""

import os
from celery import Celery
from kombu import Queue, Exchange

# Initialize Celery
app = Celery('archon')

# Configure Celery
app.conf.update(
    # Broker settings
    broker_url=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    result_backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Queue settings
    task_queues=(
        Queue('high', Exchange('high'), routing_key='high',
              queue_arguments={'x-max-priority': 10}),
        Queue('medium', Exchange('medium'), routing_key='medium',
              queue_arguments={'x-max-priority': 5}),
        Queue('low', Exchange('low'), routing_key='low',
              queue_arguments={'x-max-priority': 1}),
    ),
    
    task_routes={
        # High priority tasks
        'app.jobs.queues.high_priority.*': {'queue': 'high'},
        
        # Medium priority tasks
        'app.jobs.queues.medium_priority.*': {'queue': 'medium'},
        
        # Low priority tasks (AI analysis)
        'app.jobs.queues.low_priority.*': {'queue': 'low'},
    },
    
    # Worker settings
    worker_prefetch_multiplier=1,  # One task per worker at a time
    task_acks_late=True,  # Task acknowledgment after completion
    
    # Task timeouts
    task_soft_time_limit=300,  # 5 minutes
    task_time_limit=600,      # 10 minutes
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
)

# Auto-discover tasks in registered apps
app.autodiscover_tasks([
    'app.jobs.queues.high_priority',
    'app.jobs.queues.medium_priority',
    'app.jobs.queues.low_priority',
])

if __name__ == '__main__':
    app.start()
