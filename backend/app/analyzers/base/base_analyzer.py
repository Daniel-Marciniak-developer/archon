from abc import ABC, abstractmethod
from typing import List
import logging
from app.libs.models import IssueBase, ToolName
from app.libs.utils.process_utils import run_command

class BaseAnalyzer(ABC):
    """
    Abstract base class for all code analyzers.
    Every analyzer must inherit from this class and implement the analyze method.
    """

    def __init__(self, tool_name: ToolName):
        """
        Initialize the analyzer with a specific tool name.

        Args:
            tool_name: The tool this analyzer represents (RUFF, BANDIT, etc.)
        """
        self.tool_name = tool_name
        self.logger = logging.getLogger(f"{__name__}.{tool_name.value}")

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Returns the human-readable name of the analyzer.
        Must be implemented by each concrete analyzer.
        """
        pass

    @abstractmethod
    def analyze(self, project_path: str) -> List[IssueBase]:
        """
        Analyzes the project and returns a list of issues found.
        This is the main method that every analyzer must implement.

        Args:
            project_path: Path to the project directory to analyze

        Returns:
            List[IssueBase]: List of issues found during analysis
        """
        pass

    def _run_tool_safely(self, command: List[str], project_path: str, timeout: int = 120) -> tuple[bool, str]:
        """
        Safely runs the analyzer tool with proper error handling and logging.

        Args:
            command: Command to execute (e.g., ["ruff", "check", "."])
            project_path: Directory where to run the command
            timeout: Maximum execution time in seconds

        Returns:
            tuple[bool, str]: (success, output_or_error)
        """
        self.logger.info(f"Running {self.tool_name.value} analyzer on {project_path}")

        success, output = run_command(command, project_path, timeout)

        if success:
            self.logger.info(f"{self.tool_name.value} completed successfully")
        else:
            self.logger.warning(f"{self.tool_name.value} failed: {output}")

        return success, output

    def _log_analysis_start(self, project_path: str) -> None:
        """
        Logs the start of analysis for this analyzer.

        Args:
            project_path: Path being analyzed
        """
        self.logger.info(f"Starting {self.name} analysis on {project_path}")

    def _log_analysis_result(self, issues_count: int, project_path: str) -> None:
        """
        Logs the result of analysis.

        Args:
            issues_count: Number of issues found
            project_path: Path that was analyzed
        """
        if issues_count > 0:
            self.logger.info(f"{self.name} found {issues_count} issues in {project_path}")
        else:
            self.logger.info(f"{self.name} found no issues in {project_path}")

    def _create_issue(self, category: str, severity: str, title: str, description: str,
                     file_path: str, line_number: int, start_line: int = None,
                     end_line: int = None, start_column: int = None, end_column: int = None) -> IssueBase:
        """
        Creates a standardized issue object.

        Args:
            category: Issue category (e.g., "Quality", "Security")
            severity: Issue severity ("Critical", "High", "Medium", "Low")
            title: Short issue title
            description: Detailed description
            file_path: Path to the file with the issue
            line_number: Line number where issue was found
            start_line: Start line of the issue context (optional)
            end_line: End line of the issue context (optional)
            start_column: Start column of the issue context (optional)
            end_column: End column of the issue context (optional)

        Returns:
            IssueBase: Standardized issue object
        """
        return IssueBase(
            tool=self.tool_name,
            category=category,
            severity=severity,
            title=title,
            description=description,
            file_path=file_path,
            line_number=line_number,
            start_line=start_line,
            end_line=end_line,
            start_column=start_column,
            end_column=end_column
        )
