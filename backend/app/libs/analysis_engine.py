import logging
from typing import List, Dict, Any
from app.libs.models import IssueBase
from app.libs.analyzers import RuffAnalyzer, BanditAnalyzer

logger = logging.getLogger(__name__)

SEVERITY_PENALTIES = {
    "Critical": 20,
    "High": 10,
    "Medium": 5,
    "Low": 1,
}

CATEGORY_WEIGHTS = {
    "Structure": 0.4,
    "Quality": 0.3,
    "Security": 0.2,
    "Dependencies": 0.1,
}

class AnalysisEngine:
    def __init__(self):
        self.analyzers = [
            RuffAnalyzer(),
            BanditAnalyzer(),
        ]
        self.logger = logging.getLogger(f"{__name__}.AnalysisEngine")

    def run_analysis(self, project_path: str) -> Dict[str, Any]:
        self.logger.info(f"Starting complete analysis on {project_path}")

        all_issues = []

        for analyzer in self.analyzers:
            try:
                self.logger.info(f"Running {analyzer.name}")
                issues = analyzer.analyze(project_path)
                all_issues.extend(issues)
                self.logger.info(f"{analyzer.name} found {len(issues)} issues")
            except Exception as e:
                self.logger.error(f"Error in {analyzer.name}: {e}")
                continue

        scores = self._calculate_scores(all_issues)
        issues_dict = [self._issue_to_dict(issue) for issue in all_issues]

        report = {
            "overall_score": scores["overall_score"],
            "structure_score": scores["Structure"],
            "quality_score": scores["Quality"],
            "security_score": scores["Security"],
            "dependencies_score": scores["Dependencies"],
            "issues": issues_dict
        }

        self.logger.info(f"Analysis complete. Found {len(all_issues)} total issues. Overall score: {scores['overall_score']:.1f}")
        return report

    def _calculate_scores(self, issues: List[IssueBase]) -> Dict[str, float]:
        scores = {
            "Structure": 100.0,
            "Quality": 100.0,
            "Security": 100.0,
            "Dependencies": 100.0,
        }

        for issue in issues:
            penalty = SEVERITY_PENALTIES.get(issue.severity.value, 0)
            category = issue.category.value
            if category in scores:
                scores[category] -= penalty

        for category in scores:
            scores[category] = max(0, scores[category])

        overall_score = (
            scores["Structure"] * CATEGORY_WEIGHTS["Structure"] +
            scores["Quality"] * CATEGORY_WEIGHTS["Quality"] +
            scores["Security"] * CATEGORY_WEIGHTS["Security"] +
            scores["Dependencies"] * CATEGORY_WEIGHTS["Dependencies"]
        )
        scores["overall_score"] = overall_score
        return scores

    def _issue_to_dict(self, issue: IssueBase) -> Dict[str, Any]:
        result = {
            "category": issue.category.value,
            "severity": issue.severity.value,
            "tool": issue.tool.value,
            "title": issue.title,
            "description": issue.description,
            "file_path": issue.file_path,
            "line_number": issue.line_number,
        }

        if issue.start_line is not None:
            result["start_line"] = issue.start_line
        if issue.end_line is not None:
            result["end_line"] = issue.end_line
        if issue.start_column is not None:
            result["start_column"] = issue.start_column
        if issue.end_column is not None:
            result["end_column"] = issue.end_column

        return result


def run_analysis(project_path: str) -> Dict[str, Any]:
    engine = AnalysisEngine()
    return engine.run_analysis(project_path)
