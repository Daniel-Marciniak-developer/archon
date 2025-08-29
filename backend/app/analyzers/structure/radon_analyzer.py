"""Radon analyzer for code complexity metrics."""

import json
from typing import List
from app.libs.models import IssueBase, ToolName, IssueCategory, IssueSeverity, StructureMetrics
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
        """
        Analyzes project using Radon for complexity metrics.
        
        Args:
            project_path: Path to the project directory
            
        Returns:
            List of issues found by Radon analysis
        """
        self._log_analysis_start(project_path)
        issues = []

        try:
            cc_issues = self._analyze_cyclomatic_complexity(project_path)
            issues.extend(cc_issues)

            mi_issues = self._analyze_maintainability_index(project_path)
            issues.extend(mi_issues)

            raw_issues = self._analyze_raw_metrics(project_path)
            issues.extend(raw_issues)

        except Exception as e:
            self.logger.error(f"Radon analysis failed: {str(e)}")
            
        self._log_analysis_result(len(issues), project_path)
        return issues

    def _analyze_cyclomatic_complexity(self, project_path: str) -> List[IssueBase]:
        """Analyze cyclomatic complexity using radon cc"""
        issues = []

        command = ["radon", "cc", ".", "--json", "--average"]
        success, output = self._run_tool_safely(command, project_path)
        
        if not success:
            return issues
            
        try:
            cc_data = json.loads(output)
            for file_path, functions in cc_data.items():
                if isinstance(functions, list):
                    for func_data in functions:
                        complexity = func_data.get('complexity', 0)
                        if complexity >= 10:
                            severity = self._get_complexity_severity(complexity)
                            
                            issue = self._create_issue(
                                category=IssueCategory.STRUCTURE,
                                severity=severity,
                                title=f"High cyclomatic complexity: {complexity}",
                                description=f"Function '{func_data.get('name')}' has complexity {complexity}. Consider refactoring.",
                                file_path=file_path,
                                line_number=func_data.get('lineno', 1),
                                start_line=func_data.get('lineno', 1),
                                end_line=func_data.get('endline', func_data.get('lineno', 1))
                            )

                            issue.metrics = StructureMetrics(
                                cyclomatic_complexity=complexity
                            )
                            
                            issues.append(issue)
                            
        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"Failed to parse Radon CC output: {e}")
            
        return issues

    def _analyze_maintainability_index(self, project_path: str) -> List[IssueBase]:
        """Analyze maintainability index using radon mi"""
        issues = []
        
        command = ["radon", "mi", ".", "--json"]
        success, output = self._run_tool_safely(command, project_path)
        
        if not success:
            return issues
            
        try:
            mi_data = json.loads(output)
            for file_path, mi_value in mi_data.items():
                if isinstance(mi_value, (int, float)) and mi_value < 60:
                    severity = self._get_maintainability_severity(mi_value)
                    
                    issue = self._create_issue(
                        category=IssueCategory.STRUCTURE,
                        severity=severity,
                        title=f"Low maintainability index: {mi_value:.2f}",
                        description=f"File has low maintainability index {mi_value:.2f}. Consider refactoring.",
                        file_path=file_path,
                        line_number=1
                    )
                    
                    issue.metrics = StructureMetrics(
                        maintainability_index=mi_value
                    )
                    
                    issues.append(issue)
                    
        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"Failed to parse Radon MI output: {e}")
            
        return issues

    def _analyze_raw_metrics(self, project_path: str) -> List[IssueBase]:
        """Analyze raw metrics using radon raw"""
        issues = []
        
        command = ["radon", "raw", ".", "--json"]
        success, output = self._run_tool_safely(command, project_path)
        
        if not success:
            return issues
            
        try:
            raw_data = json.loads(output)
            for file_path, metrics in raw_data.items():
                sloc = metrics.get('sloc', 0)

                if sloc > 200:
                    severity = IssueSeverity.MEDIUM if sloc < 500 else IssueSeverity.HIGH
                    
                    issue = self._create_issue(
                        category=IssueCategory.STRUCTURE,
                        severity=severity,
                        title=f"Large file: {sloc} lines",
                        description=f"File has {sloc} lines of code. Consider splitting into smaller modules.",
                        file_path=file_path,
                        line_number=1
                    )
                    
                    issue.metrics = StructureMetrics(
                        sloc=sloc
                    )
                    
                    issues.append(issue)
                    
        except (json.JSONDecodeError, KeyError) as e:
            self.logger.error(f"Failed to parse Radon raw output: {e}")
            
        return issues

    def _get_complexity_severity(self, complexity: float) -> IssueSeverity:
        """Map complexity value to severity level"""
        if complexity >= 15:
            return IssueSeverity.CRITICAL
        elif complexity >= 10:
            return IssueSeverity.HIGH
        elif complexity >= 7:
            return IssueSeverity.MEDIUM
        else:
            return IssueSeverity.LOW

    def _get_maintainability_severity(self, mi_value: float) -> IssueSeverity:
        """Map maintainability index to severity level"""
        if mi_value < 40:
            return IssueSeverity.CRITICAL
        elif mi_value < 50:
            return IssueSeverity.HIGH
        elif mi_value < 60:
            return IssueSeverity.MEDIUM
        else:
            return IssueSeverity.LOW
