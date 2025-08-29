"""Base runner for isolated code analysis."""

from abc import ABC, abstractmethod

class BaseRunner(ABC):
    """
    Base class for running analyzers in isolation.
    Provides process and container isolation capabilities.
    """

    @abstractmethod
    def run_in_process(self, command: list[str], timeout: int = 60) -> tuple[bool, str]:
        """Run analyzer in a separate process with timeout."""
        pass

    @abstractmethod
    def run_in_container(self, command: list[str], timeout: int = 300) -> tuple[bool, str]:
        """Run analyzer in an isolated container with timeout."""
        pass
