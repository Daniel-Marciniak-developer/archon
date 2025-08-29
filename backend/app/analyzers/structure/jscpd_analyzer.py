"""JSCPD analyzer for code duplication detection."""

import json
import os
import tempfile
from typing import List
from app.libs.models import IssueBase, ToolName, IssueCategory, IssueSeverity, StructureMetrics
from ..base.base_analyzer import BaseAnalyzer


class JSCPDAnalyzer(BaseAnalyzer):
    """
    Analyzer that uses JSCPD to detect code duplications.
    Supports multiple programming languages.
    """

    def __init__(self):
        super().__init__(ToolName.JSCPD)

    @property
    def name(self) -> str:
        return "JSCPD Duplication Analyzer"

    def analyze(self, project_path: str) -> List[IssueBase]:
        """
        Analyzes project using JSCPD for code duplication.
        
        Args:
            project_path: Path to the project directory
            
        Returns:
            List of duplication issues found
        """
        self._log_analysis_start(project_path)
        issues = []

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                # jscpd uses output as directory, not file
                command = [
                    "npx", "jscpd",
                    ".",
                    "--reporters", "json",
                    "--output", temp_dir,
                    "--min-lines", "5",
                    "--min-tokens", "50",
                    "--threshold", "100",  # Increase threshold to avoid threshold error
                    "--format", "python"
                ]
                
                success = self._run_tool_safely(command, project_path)
                
                # jscpd creates jscpd-report.json in the output directory
                output_file = os.path.join(temp_dir, "jscpd-report.json")
                if success and os.path.exists(output_file):
                    issues = self._parse_jscpd_output(output_file)
                    
        except Exception as e:
            self.logger.error(f"JSCPD analysis failed: {str(e)}")
            
        self._log_analysis_result(len(issues), project_path)
        return issues

    def _parse_jscpd_output(self, output_file: str) -> List[IssueBase]:
        """Parse JSCPD JSON output and create issues"""
        issues = []
        
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            duplicates = data.get('duplicates', [])
            
            for duplicate in duplicates:
                first_file = duplicate.get('firstFile', {})
                second_file = duplicate.get('secondFile', {})
                
                first_path = first_file.get('name', '')
                second_path = second_file.get('name', '')
                
                if not first_path or not second_path:
                    continue
                    
                lines_count = duplicate.get('lines', 0)
                tokens_count = duplicate.get('tokens', 0)
                
                severity = self._get_duplication_severity(lines_count, tokens_count)
                
                issue1 = self._create_issue(
                    category=IssueCategory.STRUCTURE,
                    severity=severity,
                    title=f"Code duplication: {lines_count} lines",
                    description=f"Duplicated code found with {second_path}. "
                               f"{lines_count} lines, {tokens_count} tokens duplicated.",
                    file_path=first_path,
                    line_number=first_file.get('start', 1),
                    start_line=first_file.get('start', 1),
                    end_line=first_file.get('end', first_file.get('start', 1))
                )
                
                issue1.metrics = StructureMetrics(
                    duplicate_tokens=tokens_count,
                    sloc=lines_count,
                    duplicate_files=[second_path]
                )
                
                issues.append(issue1)
                
                issue2 = self._create_issue(
                    category=IssueCategory.STRUCTURE,
                    severity=severity,
                    title=f"Code duplication: {lines_count} lines",
                    description=f"Duplicated code found with {first_path}. "
                               f"{lines_count} lines, {tokens_count} tokens duplicated.",
                    file_path=second_path,
                    line_number=second_file.get('start', 1),
                    start_line=second_file.get('start', 1),
                    end_line=second_file.get('end', second_file.get('start', 1))
                )
                
                issue2.metrics = StructureMetrics(
                    duplicate_tokens=tokens_count,
                    sloc=lines_count,
                    duplicate_files=[first_path]
                )
                
                issues.append(issue2)
                
        except (json.JSONDecodeError, FileNotFoundError, KeyError) as e:
            self.logger.error(f"Failed to parse JSCPD output: {e}")
            
        return issues

    def _get_duplication_severity(self, lines: int, tokens: int) -> IssueSeverity:
        """Map duplication metrics to severity level"""
        if lines >= 50 or tokens >= 200:
            return IssueSeverity.CRITICAL
        elif lines >= 20 or tokens >= 100:
            return IssueSeverity.HIGH
        elif lines >= 10 or tokens >= 50:
            return IssueSeverity.MEDIUM
        else:
            return IssueSeverity.LOW
