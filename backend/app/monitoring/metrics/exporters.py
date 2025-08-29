"""Metric exporters for various systems."""

from typing import Dict, Any
from app.monitoring.metrics.prometheus import (
    ANALYSIS_DURATION,
    ISSUES_COUNT,
    QUEUE_SIZE,
    TASK_DURATION,
    AI_REQUEST_COUNT,
    AI_LATENCY
)

class MetricsExporter:
    """
    Exports metrics to various monitoring systems.
    """
    
    def export_analysis_metrics(self, metrics: Dict[str, Any]) -> None:
        """Export analysis related metrics."""
        for analyzer, duration in metrics.get('durations', {}).items():
            ANALYSIS_DURATION.labels(analyzer=analyzer).observe(duration)
            
        for severity, count in metrics.get('issues', {}).items():
            ISSUES_COUNT.labels(severity=severity).inc(count)
    
    def export_queue_metrics(self, metrics: Dict[str, Any]) -> None:
        """Export queue related metrics."""
        for queue, size in metrics.get('queue_sizes', {}).items():
            QUEUE_SIZE.labels(queue=queue).set(size)
            
        for task_type, duration in metrics.get('task_durations', {}).items():
            TASK_DURATION.labels(task_type=task_type).observe(duration)
    
    def export_ai_metrics(self, metrics: Dict[str, Any]) -> None:
        """Export AI related metrics."""
        for model, count in metrics.get('requests', {}).items():
            AI_REQUEST_COUNT.labels(model=model).inc(count)
            
        for model, latency in metrics.get('latencies', {}).items():
            AI_LATENCY.labels(model=model).observe(latency)
