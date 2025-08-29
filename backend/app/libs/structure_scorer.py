"""
Structure scoring system for complex analysis
"""

from typing import List, Dict, Any
from app.libs.models import IssueBase
import numpy as np


class StructureScorer:
    """
    Advanced scoring system for structure analysis.
    Combines multiple metrics using weighted formula.
    """

    def __init__(self):
        self.weights = {
            'complexity': 0.35,
            'maintainability': 0.20,
            'duplication': 0.15,
            'coupling': 0.15,
            'cohesion': 0.10,
            'cycles': 0.05
        }

    def calculate_structure_score(self, issues: List[IssueBase]) -> Dict[str, Any]:
        """
        Calculate comprehensive structure score from all structure issues.
        
        Args:
            issues: List of structure-related issues
            
        Returns:
            Dictionary with detailed structure scoring
        """
        structure_issues = [issue for issue in issues if issue.category.value == "Structure"]
        
        if not structure_issues:
            return {
                "structure_score": 100.0,
                "complexity_score": 100.0,
                "maintainability_score": 100.0,
                "duplication_score": 100.0,
                "hotspot_files": [],
                "metrics_summary": {}
            }

        metrics_by_file = self._aggregate_metrics_by_file(structure_issues)
        file_scores = self._calculate_file_scores(metrics_by_file)
        hotspots = self._identify_hotspots(file_scores)
        
        overall_structure_score = self._calculate_overall_score(file_scores)
        component_scores = self._calculate_component_scores(metrics_by_file)
        
        return {
            "structure_score": overall_structure_score,
            "complexity_score": component_scores["complexity"],
            "maintainability_score": component_scores["maintainability"],
            "duplication_score": component_scores["duplication"],
            "hotspot_files": hotspots[:10],
            "metrics_summary": self._create_metrics_summary(metrics_by_file),
            "total_files_analyzed": len(metrics_by_file)
        }

    def _aggregate_metrics_by_file(self, issues: List[IssueBase]) -> Dict[str, Dict[str, Any]]:
        """Group metrics by file path"""
        file_metrics = {}
        
        for issue in issues:
            file_path = issue.file_path
            
            if file_path not in file_metrics:
                file_metrics[file_path] = {
                    'issues': [],
                    'complexity_total': 0,
                    'complexity_count': 0,
                    'maintainability_index': None,
                    'sloc': 0,
                    'duplicate_tokens': 0,
                    'duplicates_count': 0,
                    'severity_penalty': 0
                }
            
            file_data = file_metrics[file_path]
            file_data['issues'].append(issue)
            
            severity_penalties = {
                "Critical": 20,
                "High": 10,
                "Medium": 5,
                "Low": 1
            }
            file_data['severity_penalty'] += severity_penalties.get(issue.severity.value, 0)
            
            if hasattr(issue, 'metrics') and issue.metrics:
                metrics = issue.metrics
                
                if metrics.cyclomatic_complexity is not None:
                    file_data['complexity_total'] += metrics.cyclomatic_complexity
                    file_data['complexity_count'] += 1
                    
                if metrics.maintainability_index is not None:
                    file_data['maintainability_index'] = metrics.maintainability_index
                    
                if metrics.sloc is not None:
                    file_data['sloc'] = max(file_data['sloc'], metrics.sloc)
                    
                if metrics.duplicate_tokens is not None:
                    file_data['duplicate_tokens'] += metrics.duplicate_tokens
                    file_data['duplicates_count'] += 1
        
        return file_metrics

    def _calculate_file_scores(self, file_metrics: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate risk score for each file"""
        file_scores = []
        
        all_complexities = []
        all_mis = []
        all_slocs = []
        all_duplicates = []
        
        for file_data in file_metrics.values():
            if file_data['complexity_count'] > 0:
                avg_complexity = file_data['complexity_total'] / file_data['complexity_count']
                all_complexities.append(avg_complexity)
            
            if file_data['maintainability_index'] is not None:
                all_mis.append(file_data['maintainability_index'])
            
            if file_data['sloc'] > 0:
                all_slocs.append(file_data['sloc'])
                
            if file_data['duplicate_tokens'] > 0:
                all_duplicates.append(file_data['duplicate_tokens'])
        
        complexity_percentiles = self._calculate_percentiles(all_complexities)
        mi_percentiles = self._calculate_percentiles(all_mis)
        sloc_percentiles = self._calculate_percentiles(all_slocs)
        duplicate_percentiles = self._calculate_percentiles(all_duplicates)
        
        for file_path, file_data in file_metrics.items():
            score_components = {}
            
            if file_data['complexity_count'] > 0:
                avg_complexity = file_data['complexity_total'] / file_data['complexity_count']
                score_components['complexity'] = self._normalize_metric(
                    avg_complexity, complexity_percentiles, higher_is_worse=True)
            else:
                score_components['complexity'] = 0.0
            
            if file_data['maintainability_index'] is not None:
                score_components['maintainability'] = self._normalize_metric(
                    file_data['maintainability_index'], mi_percentiles, higher_is_worse=False)
            else:
                score_components['maintainability'] = 0.0
            
            if file_data['sloc'] > 0:
                score_components['size'] = self._normalize_metric(
                    file_data['sloc'], sloc_percentiles, higher_is_worse=True)
            else:
                score_components['size'] = 0.0
                
            if file_data['duplicate_tokens'] > 0:
                score_components['duplication'] = self._normalize_metric(
                    file_data['duplicate_tokens'], duplicate_percentiles, higher_is_worse=True)
            else:
                score_components['duplication'] = 0.0
            
            final_score = (
                score_components['complexity'] * self.weights['complexity'] +
                score_components['maintainability'] * self.weights['maintainability'] +
                score_components['duplication'] * self.weights['duplication'] +
                score_components['size'] * 0.1 +
                min(file_data['severity_penalty'] / 50.0, 1.0) * 0.1
            )
            
            file_scores.append({
                'file_path': file_path,
                'score': min(final_score, 1.0),
                'issues_count': len(file_data['issues']),
                'complexity_score': score_components['complexity'],
                'maintainability_score': score_components['maintainability'],
                'duplication_score': score_components['duplication'],
                'sloc': file_data['sloc'],
                'avg_complexity': file_data['complexity_total'] / max(file_data['complexity_count'], 1),
                'maintainability_index': file_data['maintainability_index'],
                'duplicate_tokens': file_data['duplicate_tokens']
            })
        
        return sorted(file_scores, key=lambda x: x['score'], reverse=True)

    def _calculate_percentiles(self, values: List[float]) -> Dict[str, float]:
        """Calculate percentile thresholds for normalization"""
        if not values:
            return {'p5': 0, 'p25': 0, 'p50': 0, 'p75': 0, 'p95': 0}
        
        return {
            'p5': np.percentile(values, 5),
            'p25': np.percentile(values, 25),
            'p50': np.percentile(values, 50),
            'p75': np.percentile(values, 75),
            'p95': np.percentile(values, 95)
        }

    def _normalize_metric(self, value: float, percentiles: Dict[str, float], higher_is_worse: bool = True) -> float:
        """Normalize metric to 0-1 scale using percentile-based approach"""
        if not percentiles or percentiles['p95'] == percentiles['p5']:
            return 0.0
        
        if higher_is_worse:
            if value <= percentiles['p5']:
                return 0.0
            elif value >= percentiles['p95']:
                return 1.0
            else:
                return (value - percentiles['p5']) / (percentiles['p95'] - percentiles['p5'])
        else:
            if value >= percentiles['p95']:
                return 0.0
            elif value <= percentiles['p5']:
                return 1.0
            else:
                return 1.0 - (value - percentiles['p5']) / (percentiles['p95'] - percentiles['p5'])

    def _identify_hotspots(self, file_scores: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify the most problematic files (hotspots)"""
        hotspots = []
        
        for file_data in file_scores:
            if file_data['score'] > 0.3:
                priority = "CRITICAL" if file_data['score'] > 0.7 else "HIGH" if file_data['score'] > 0.5 else "MEDIUM"
                
                hotspots.append({
                    'file_path': file_data['file_path'],
                    'risk_score': file_data['score'],
                    'priority': priority,
                    'issues_count': file_data['issues_count'],
                    'complexity_score': file_data['complexity_score'],
                    'maintainability_score': file_data['maintainability_score'],
                    'duplication_score': file_data['duplication_score'],
                    'sloc': file_data['sloc']
                })
        
        return hotspots

    def _calculate_overall_score(self, file_scores: List[Dict[str, Any]]) -> float:
        """Calculate overall structure score from file scores"""
        if not file_scores:
            return 100.0
        
        total_risk = sum(file_data['score'] for file_data in file_scores)
        avg_risk = total_risk / len(file_scores)
        
        return max(0.0, 100.0 - (avg_risk * 100.0))

    def _calculate_component_scores(self, file_metrics: Dict[str, Dict[str, Any]]) -> Dict[str, float]:
        """Calculate individual component scores"""
        if not file_metrics:
            return {"complexity": 100.0, "maintainability": 100.0, "duplication": 100.0}
        
        complexity_issues = sum(1 for file_data in file_metrics.values() if file_data['complexity_count'] > 0)
        maintainability_issues = sum(1 for file_data in file_metrics.values() if file_data['maintainability_index'] and file_data['maintainability_index'] < 60)
        duplication_issues = sum(1 for file_data in file_metrics.values() if file_data['duplicates_count'] > 0)
        
        total_files = len(file_metrics)
        
        return {
            "complexity": max(0.0, 100.0 - (complexity_issues / total_files * 50)),
            "maintainability": max(0.0, 100.0 - (maintainability_issues / total_files * 50)),
            "duplication": max(0.0, 100.0 - (duplication_issues / total_files * 50))
        }

    def _create_metrics_summary(self, file_metrics: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Create summary of all metrics"""
        total_sloc = sum(file_data['sloc'] for file_data in file_metrics.values())
        total_duplicates = sum(file_data['duplicate_tokens'] for file_data in file_metrics.values())
        
        complexity_values = []
        mi_values = []
        
        for file_data in file_metrics.values():
            if file_data['complexity_count'] > 0:
                avg_complexity = file_data['complexity_total'] / file_data['complexity_count']
                complexity_values.append(avg_complexity)
            
            if file_data['maintainability_index'] is not None:
                mi_values.append(file_data['maintainability_index'])
        
        return {
            "total_lines_of_code": total_sloc,
            "total_duplicate_tokens": total_duplicates,
            "avg_complexity": np.mean(complexity_values) if complexity_values else 0,
            "avg_maintainability_index": np.mean(mi_values) if mi_values else 0,
            "files_with_complexity_issues": len(complexity_values),
            "files_with_maintainability_issues": len(mi_values),
            "files_with_duplicates": sum(1 for file_data in file_metrics.values() if file_data['duplicates_count'] > 0)
        }
