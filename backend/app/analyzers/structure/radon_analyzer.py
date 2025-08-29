"""Radon analyzer for code complexity metrics."""

from typing import List
from app.libs.models import IssueBase, ToolName
from ..base.base_analyzer import BaseAnalyzer

class RadonAnalyzer(BaseAnalyzer):
    """
    Analyzer that uses Radon to check code complexity.
    Analyzes cyclomatic complexity, maintainability index, and raw metrics.
    """

    def __init__(self):
        super().__init__(ToolName.RADON)

    @property
    def name(self) -> str:
        return "Radon Complexity Analyzer"

    def analyze(self, project_path: str) -> List[IssueBase]:
        """Implementation coming soon"""
        return []
