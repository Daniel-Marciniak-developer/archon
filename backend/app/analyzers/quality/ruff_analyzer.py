import json
from typing import List
from app.libs.models import IssueBase, ToolName
from ..base.base_analyzer import BaseAnalyzer

class RuffAnalyzer(BaseAnalyzer):
    """
    Analyzer that uses Ruff to check Python code quality.
    Ruff is a fast Python linter that checks for code style, imports, and common issues.
    """

    def __init__(self):
        super().__init__(ToolName.RUFF)

    @property
    def name(self) -> str:
        return "Ruff Code Quality Analyzer"

    def analyze(self, project_path: str) -> List[IssueBase]:
        """
        Runs Ruff analysis on the project and returns standardized issues.

        Args:
            project_path: Path to the project directory to analyze

        Returns:
            List[IssueBase]: List of code quality issues found by Ruff
        """
        self._log_analysis_start(project_path)

        if not self._is_ruff_available():
            self.logger.warning("Ruff is not installed or not available")
            self._log_analysis_result(0, project_path)
            return []

        command = self.get_ruff_command()
        success, output = self._run_tool_safely(
            command,
            project_path,
            timeout=120
        )

        issues = []
        if success:
            try:
                issues = self._parse_ruff_output(output)
            except (json.JSONDecodeError, KeyError, TypeError) as e:
                self.logger.error(f"Failed to parse Ruff output: {e}")
                issues = []

        self._log_analysis_result(len(issues), project_path)
        return issues

    def _is_ruff_available(self) -> bool:
        """
        Checks if Ruff is available in the system.

        Returns:
            bool: True if Ruff is available, False otherwise
        """
        from app.libs.utils.process_utils import is_tool_available
        return is_tool_available("ruff")

    def _parse_ruff_output(self, output: str) -> List[IssueBase]:
        """
        Parses Ruff JSON output and converts it to standardized IssueBase objects.

        Args:
            output: JSON string output from Ruff

        Returns:
            List[IssueBase]: List of parsed issues
        """
        if not output.strip():
            return []

        ruff_data = json.loads(output)
        issues = []

        for item in ruff_data:
            try:
                location = item.get("location", {})
                issue = self._create_issue(
                    category="Quality",
                    severity=self._map_ruff_severity(item.get("code", "")),
                    title=f"{item['code']}: {item['message']}",
                    description=self._create_description(item),
                    file_path=item["filename"],
                    line_number=location.get("row", 1),
                    start_line=location.get("row"),
                    end_line=location.get("end_row"),
                    start_column=location.get("column"),
                    end_column=location.get("end_column")
                )
                issues.append(issue)
            except KeyError as e:
                self.logger.warning(f"Skipping malformed Ruff issue: {e}")
                continue

        return issues

    def _map_ruff_severity(self, code: str) -> str:
        """
        Maps Ruff error codes to severity levels.

        Args:
            code: Ruff error code (e.g., "E501", "F401")

        Returns:
            str: Mapped severity level
        """
        severity_map = {
            # Error codes
            "E": "High",    # Error
            "F": "High",    # Flake8
            "W": "Medium",  # Warning
            "C": "Low",     # Convention
            "B": "High",    # Bug
            "S": "High",    # Security
            "A": "Medium",  # Assignment
            "COM": "Low",   # Commas
            "D": "Low",     # Docstrings
            "DTZ": "Low",   # Date/Time
            "EM": "Medium", # Error Messages
            "EXE": "High",  # Executable
            "FA": "Medium", # From __all__
            "FBT": "Low",   # Boolean Trap
            "FIX": "High",  # Fixer
            "FLY": "Low",   # f-strings
            "G": "Low",     # Logging Format
            "I": "Low",     # Import
            "ICN": "Low",   # Import Conventions
            "INP": "Low",   # Implicit Namespace
            "ISC": "Low",   # String Concat
            "N": "Low",     # Naming
            "PD": "Medium", # Pandas
            "PGH": "Low",   # Generic
            "PIE": "Low",   # Miscellaneous
            "PL": "High",   # Pylint
            "PT": "High",   # Pytest
            "PTH": "Low",   # Pathlib
            "Q": "Low",     # Quotes
            "RET": "Medium", # Return
            "RSE": "Medium", # Raise
            "RUF": "Medium", # Ruff-specific
            "SIM": "Medium",  # flake8-simplify
            "TID": "Low",     # flake8-tidy-imports
            "TCH": "Medium",  # flake8-type-checking
            "ARG": "Medium",  # flake8-unused-arguments
            "PTH": "Medium",  # flake8-use-pathlib
            "ERA": "Low",     # eradicate (commented code)
            "PD": "Medium",   # pandas-vet
            "PGH": "High",    # pygrep-hooks
            "FLY": "Low",     # flynt (f-strings)
            "NPY": "Medium",  # NumPy-specific
            "AIR": "Medium",  # Airflow-specific
        }

        # Get first letter/characters before numbers
        code_prefix = ''.join(c for c in code if not c.isdigit())
        return severity_map.get(code_prefix, "Low")

    def _create_description(self, item: dict) -> str:
        """
        Creates a detailed description for the issue.

        Args:
            item: Ruff issue dictionary

        Returns:
            str: Formatted description
        """
        base_description = item.get("message", "Code quality issue detected")
        code = item.get("code", "")
        location = item.get("location", {})
        end_location = item.get("end_location", {})
        fix_info = item.get("fix", {})

        description_parts = [base_description]

        if code:
            description_parts.append(f"Rule: {code}")

        if location.get("column"):
            start_col = location["column"]
            end_col = end_location.get("column", start_col + 1)
            if start_col == end_col:
                description_parts.append(f"Column: {start_col}")
            else:
                description_parts.append(f"Columns: {start_col}-{end_col}")

        if fix_info and fix_info.get("message"):
            description_parts.append(f"Fix: {fix_info['message']}")

        return " | ".join(description_parts)

    def get_ruff_command(self) -> List[str]:
        """
        Builds comprehensive Ruff command with extensive rule coverage.

        Returns:
            List[str]: Complete Ruff command with all enabled rules
        """
        command = [
            "ruff", "check", ".",
            "--output-format=json",
            "--force-exclude",
            "--no-cache",
            "--select=ALL",  # Enable all available rules
            "--ignore=D100,D101,D102,D103,D104,D105,D106,D107",  # Ignore some docstring rules
            "--ignore=D203,D211,D212,D213",  # Ignore conflicting docstring rules
            "--ignore=ANN",  # Ignore type annotation requirements for now
            "--ignore=COM812,COM819",  # Ignore some comma rules that conflict
            "--ignore=ISC001,ISC002",  # Ignore implicit string concatenation
            "--ignore=Q000,Q001,Q002,Q003",  # Ignore quote style conflicts
        ]

        return command
