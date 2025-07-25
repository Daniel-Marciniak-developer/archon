import json
from typing import List
from app.libs.models import IssueBase, ToolName
from .base_analyzer import BaseAnalyzer

class BanditAnalyzer(BaseAnalyzer):
    """
    Analyzer that uses Bandit to check Python code for security vulnerabilities.
    Bandit is a tool designed to find common security issues in Python code.
    """

    def __init__(self):
        super().__init__(ToolName.BANDIT)

    @property
    def name(self) -> str:
        return "Bandit Security Analyzer"

    def analyze(self, project_path: str) -> List[IssueBase]:
        """
        Runs Bandit security analysis on the project and returns standardized issues.

        Args:
            project_path: Path to the project directory to analyze

        Returns:
            List[IssueBase]: List of security issues found by Bandit
        """
        self._log_analysis_start(project_path)

        if not self._is_bandit_available():
            self.logger.warning("Bandit is not installed or not available")
            self._log_analysis_result(0, project_path)
            return []

        command = self.get_bandit_command(severity_level="low", confidence_level="low")
        success, output = self._run_tool_safely(
            command,
            project_path,
            timeout=120
        )

        issues = []
        if success:
            try:
                issues = self._parse_bandit_output(output)
            except (json.JSONDecodeError, KeyError, TypeError) as e:
                self.logger.error(f"Failed to parse Bandit output: {e}")
                issues = []

        self._log_analysis_result(len(issues), project_path)
        return issues

    def _is_bandit_available(self) -> bool:
        """
        Checks if Bandit is available in the system.

        Returns:
            bool: True if Bandit is available, False otherwise
        """
        from app.libs.utils.process_utils import is_tool_available
        return is_tool_available("bandit")

    def _parse_bandit_output(self, output: str) -> List[IssueBase]:
        """
        Parses Bandit JSON output and converts it to standardized IssueBase objects.
        Extracts all available fields including metrics and enhanced location data.

        Args:
            output: JSON string output from Bandit

        Returns:
            List[IssueBase]: List of parsed security issues
        """
        if not output.strip():
            return []

        try:
            bandit_data = json.loads(output)
        except json.JSONDecodeError:
            self.logger.error("Invalid JSON output from Bandit")
            return []

        metrics = bandit_data.get("metrics", {})
        if metrics:
            self._log_bandit_metrics(metrics)

        issues = []
        results = bandit_data.get("results", [])

        for item in results:
            try:
                line_range = item.get("line_range", [])
                issue = self._create_issue(
                    category="Security",
                    severity=self._map_bandit_severity(
                        item.get("issue_severity", "MEDIUM"),
                        item.get("issue_confidence", "MEDIUM")
                    ),
                    title=f"{item.get('test_id', 'Unknown')}: {item.get('issue_text', 'Security issue')}",
                    description=self._create_enhanced_description(item),
                    file_path=item.get("filename", "unknown"),
                    line_number=item.get("line_number", 1),
                    start_line=line_range[0] if len(line_range) > 0 else None,
                    end_line=line_range[-1] if len(line_range) > 1 else None,
                    start_column=item.get("col_offset"),
                    end_column=item.get("end_col_offset")
                )
                issues.append(issue)
            except (KeyError, TypeError) as e:
                self.logger.warning(f"Skipping malformed Bandit issue: {e}")
                continue

        return issues

    def _log_bandit_metrics(self, metrics: dict) -> None:
        """
        Logs Bandit scan metrics for analysis insights.

        Args:
            metrics: Metrics dictionary from Bandit output
        """
        totals = metrics.get("_totals", {})
        if totals:
            loc = totals.get("loc", 0)
            high_sev = totals.get("SEVERITY.HIGH", 0)
            medium_sev = totals.get("SEVERITY.MEDIUM", 0)
            low_sev = totals.get("SEVERITY.LOW", 0)

            self.logger.info(f"Bandit scanned {loc} lines of code")
            self.logger.info(f"Security issues by severity: HIGH={high_sev}, MEDIUM={medium_sev}, LOW={low_sev}")

    def _map_bandit_severity(self, severity: str, confidence: str) -> str:
        """
        Maps Bandit severity and confidence to our severity levels.
        Combines both severity and confidence for more accurate risk assessment.

        Args:
            severity: Bandit severity (LOW, MEDIUM, HIGH)
            confidence: Bandit confidence (LOW, MEDIUM, HIGH)

        Returns:
            str: Severity level (Critical, High, Medium, Low)
        """
        severity = severity.upper() if severity else "MEDIUM"
        confidence = confidence.upper() if confidence else "MEDIUM"

        if severity == "HIGH" and confidence == "HIGH":
            return "Critical"

        if severity == "HIGH":
            return "High"

        if severity == "MEDIUM" and confidence == "HIGH":
            return "High"

        if severity == "MEDIUM":
            return "Medium"

        return "Low"

    def _create_enhanced_description(self, item: dict) -> str:
        """
        Creates a comprehensive description for the security issue using all available Bandit data.

        Args:
            item: Bandit issue dictionary

        Returns:
            str: Formatted description with complete security details
        """
        base_description = item.get("issue_text", "Security vulnerability detected")
        test_name = item.get("test_name", "")
        confidence = item.get("issue_confidence", "")
        severity = item.get("issue_severity", "")
        more_info = item.get("more_info", "")
        code_snippet = item.get("code", "")

        col_offset = item.get("col_offset")
        end_col_offset = item.get("end_col_offset")
        line_range = item.get("line_range", [])

        issue_cwe = item.get("issue_cwe", {})

        description_parts = [base_description]

        if test_name:
            description_parts.append(f"Test: {test_name}")

        if confidence and severity:
            description_parts.append(f"Confidence: {confidence}, Severity: {severity}")

        if col_offset is not None and end_col_offset is not None:
            if col_offset == end_col_offset:
                description_parts.append(f"Column: {col_offset}")
            else:
                description_parts.append(f"Columns: {col_offset}-{end_col_offset}")

        if len(line_range) > 1:
            description_parts.append(f"Lines: {line_range[0]}-{line_range[-1]}")

        if issue_cwe and issue_cwe.get("id"):
            cwe_id = issue_cwe["id"]
            cwe_link = issue_cwe.get("link", f"https://cwe.mitre.org/data/definitions/{cwe_id}.html")
            description_parts.append(f"CWE-{cwe_id}: {cwe_link}")

        if code_snippet:
            if len(code_snippet) > 150:
                code_snippet = code_snippet[:147] + "..."
            clean_code = " ".join(code_snippet.strip().split())
            description_parts.append(f"Code: {clean_code}")

        if more_info:
            description_parts.append(f"More info: {more_info}")

        return " | ".join(description_parts)

    def get_bandit_command(self, severity_level: str = "all", confidence_level: str = "all") -> List[str]:
        """
        Builds optimized Bandit command with all available options.

        Args:
            severity_level: Minimum severity level (all, low, medium, high)
            confidence_level: Minimum confidence level (all, low, medium, high)

        Returns:
            List[str]: Complete Bandit command
        """
        command = [
            "bandit",
            "-r", ".",
            "-f", "json",
            "-v",
        ]

        if severity_level != "all":
            command.extend([f"--severity-level={severity_level}"])

        if confidence_level != "all":
            command.extend([f"--confidence-level={confidence_level}"])

        skip_tests = []
        if skip_tests:
            command.extend(["--skip", ",".join(skip_tests)])

        exclude_paths = [
            "venv/",
            ".venv/",
            "__pycache__/",
            ".git/",
            "node_modules/",
        ]
        command.extend(["-x", ",".join(exclude_paths)])

        return command