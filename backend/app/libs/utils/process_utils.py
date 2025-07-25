import subprocess
import logging
import os
from typing import Tuple

logger = logging.getLogger(__name__)

def run_command(command: list[str], cwd: str, timeout: int = 60) -> Tuple[bool, str]:
    """
    Safely executes an external program with error handling and timeout control.

    Args:
        command: List of program arguments (e.g., ["ruff", "check", ".", "--output-format=json"])
        cwd: Path to directory where to run the program (e.g., "/tmp/project123")
        timeout: Maximum execution time in seconds (default 60)

    Returns:
        Tuple[bool, str]: (success, output_or_error)
        - success: True if program completed successfully
        - output_or_error: Program stdout or error description
    """

    if not command or not isinstance(command, list):
        return (False, "Parameter 'command' must be a non-empty list")

    if not cwd or not isinstance(cwd, str):
        return (False, "Parameter 'cwd' must be a non-empty string")

    if not os.path.exists(cwd):
        error_msg = f"Directory '{cwd}' does not exist"
        logger.error(error_msg)
        return (False, error_msg)

    command_str = ' '.join(command)
    logger.info(f"Running command: {command_str}")
    logger.info(f"Working directory: {cwd}")
    logger.info(f"Timeout: {timeout} seconds")

    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False
        )

        tool_name = command[0].lower() if command else ""

        if result.returncode == 0:
            logger.info(f"Command '{command[0]}' completed successfully")
            return (True, result.stdout)
        elif tool_name == "bandit" and result.returncode == 1:
            logger.info(f"Bandit found security issues (exit code 1)")
            return (True, result.stdout)
        elif tool_name == "ruff" and result.returncode == 1:
            logger.info(f"Ruff found code quality issues (exit code 1)")
            return (True, result.stdout)
        else:
            error_output = result.stderr if result.stderr else result.stdout
            logger.warning(f"Command '{command[0]}' failed with exit code {result.returncode}")
            return (False, f"Command '{command_str}' failed with exit code {result.returncode}:\n{error_output}")

    except subprocess.TimeoutExpired:
        error_msg = f"Command '{command[0]}' exceeded timeout of {timeout} seconds"
        logger.error(error_msg)
        return (False, error_msg)

    except FileNotFoundError:
        error_msg = f"Command '{command[0]}' not found. Is it installed?"
        logger.error(error_msg)
        return (False, error_msg)

    except PermissionError:
        error_msg = f"Permission denied to execute '{command[0]}'"
        logger.error(error_msg)
        return (False, error_msg)

    except Exception as e:
        error_msg = f"Unexpected error running '{command[0]}': {str(e)}"
        logger.error(error_msg)
        return (False, error_msg)

def is_tool_available(tool_name: str) -> bool:
    """
    Checks if a command-line tool is available in the system.

    Args:
        tool_name: Name of the tool to check (e.g., "ruff", "bandit")

    Returns:
        bool: True if tool is available, False otherwise
    """
    try:
        result = subprocess.run(
            [tool_name, "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        return False
