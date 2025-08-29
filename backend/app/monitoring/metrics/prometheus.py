"""Prometheus metrics collection."""

from prometheus_client import Counter, Gauge, Histogram, Summary

# Analysis metrics
ANALYSIS_DURATION = Histogram(
    'analysis_duration_seconds',
    'Time spent on code analysis',
    ['analyzer', 'project']
)

ISSUES_COUNT = Counter(
    'issues_total',
    'Total number of issues found',
    ['severity', 'category']
)

# Queue metrics
QUEUE_SIZE = Gauge(
    'task_queue_size',
    'Number of tasks in queue',
    ['queue']
)

TASK_DURATION = Summary(
    'task_duration_seconds',
    'Time spent processing tasks',
    ['task_type']
)

# AI metrics
AI_REQUEST_COUNT = Counter(
    'ai_requests_total',
    'Total number of AI analysis requests',
    ['model']
)

AI_LATENCY = Histogram(
    'ai_latency_seconds',
    'Latency of AI model responses',
    ['model']
)
