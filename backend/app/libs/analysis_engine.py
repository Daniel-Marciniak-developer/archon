import json
import subprocess
import os
from typing import List, Dict, Any

# Define severity mappings and penalties
SEVERITY_MAPPING = {
    # Bandit severities: LOW, MEDIUM, HIGH
    "LOW": "Low",
    "MEDIUM": "Medium",
    "HIGH": "High",
    # Ruff severities are part of the error code, e.g., F841 -> We'll use a default
}

SEVERITY_PENALTIES = {
    "Critical": 20,
    "High": 10,
    "Medium": 5,
    "Low": 1,
}

# Define category weights
CATEGORY_WEIGHTS = {
    "Structure": 0.4,
    "Code Quality": 0.3,
    "Security": 0.2,
    "Dependencies": 0.1, # Not yet implemented
}


class StandardizedIssue(Dict):
    category: str
    severity: str
    title: str
    description: str
    file_path: str
    line_number: int


def _run_tool(command: List[str], project_path: str) -> Dict[str, Any]:
    """Runs a command-line tool and returns its JSON output."""
    try:
        result = subprocess.run(
            command,
            cwd=project_path,
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(result.stdout)
    except FileNotFoundError:
        # This happens if the tool (e.g., ruff) is not installed
        tool = command[0]
        print(f"Error: The analysis tool '{tool}' was not found.")
        raise
    except subprocess.CalledProcessError as e:
        # This happens if the tool returns a non-zero exit code
        print(f"Error running tool {' '.join(command)}: {e.stderr}")
        return {} # Return empty dict if tool fails
    except json.JSONDecodeError as e:
        # This happens if the tool's output is not valid JSON
        print(f"Error decoding JSON from {' '.join(command)}: {e}")
        return {}


def _parse_ruff_output(data: List[Dict[str, Any]]) -> List[StandardizedIssue]:
    """Parses Ruff's JSON output into a standardized format."""
    issues = []
    for item in data:
        issues.append({
            "category": "Code Quality", # Ruff covers quality, style, etc.
            "severity": "Medium", # Ruff doesn't provide severity, so we use a default
            "title": f"{item['code']}: {item['message']}",
            "description": item['message'],
            "file_path": item['filename'],
            "line_number": item['location']['row'],
        })
    return issues


def _parse_bandit_output(data: Dict[str, Any]) -> List[StandardizedIssue]:
    """Parses Bandit's JSON output into a standardized format."""
    issues = []
    if "results" in data:
        for item in data["results"]:
            issues.append({
                "category": "Security",
                "severity": SEVERITY_MAPPING.get(item['issue_severity'], "Medium"),
                "title": item['issue_text'],
                "description": f"Confidence: {item['issue_confidence']}. More info: {item['more_info']}",
                "file_path": item['filename'],
                "line_number": item['line_number'],
            })
    return issues


def _calculate_scores(issues: List[StandardizedIssue]) -> Dict[str, float]:
    """Calculates scores based on the list of standardized issues."""
    scores = {
        "Structure": 100.0,
        "Code Quality": 100.0,
        "Security": 100.0,
        "Dependencies": 100.0, # Placeholder
    }
    
    for issue in issues:
        penalty = SEVERITY_PENALTIES.get(issue["severity"], 0)
        if issue["category"] in scores:
            scores[issue["category"]] -= penalty

    # Ensure scores don't go below zero
    for category in scores:
        scores[category] = max(0, scores[category])

    # Calculate weighted overall score
    overall_score = (
        scores["Structure"] * CATEGORY_WEIGHTS["Structure"] +
        scores["Code Quality"] * CATEGORY_WEIGHTS["Code Quality"] +
        scores["Security"] * CATEGORY_WEIGHTS["Security"] +
        scores["Dependencies"] * CATEGORY_WEIGHTS["Dependencies"]
    )
    scores["overall_score"] = overall_score

    return scores


def run_analysis(project_path: str) -> Dict[str, Any]:
    """
    Runs a full analysis on a project directory, executes tools,
    parses results, and calculates scores.
    """
    print(f"Starting analysis for project at: {project_path}")

    # Step 1: Run analysis tools
    ruff_output = _run_tool(["ruff", "check", ".", "--output-format=json", "--force-exclude"], project_path)
    bandit_output = _run_tool(["bandit", "-r", ".", "-f", "json"], project_path)

    # Step 2: Parse and standardize results
    ruff_issues = _parse_ruff_output(ruff_output)
    bandit_issues = _parse_bandit_output(bandit_output)
    all_issues = ruff_issues + bandit_issues

    print(f"Found {len(ruff_issues)} issues with Ruff.")
    print(f"Found {len(bandit_issues)} issues with Bandit.")

    # Step 3: Calculate scores
    scores = _calculate_scores(all_issues)
    
    # Step 4: Return a complete report
    report = {
        "overall_score": scores["overall_score"],
        "structure_score": scores["Structure"],
        "quality_score": scores["Code Quality"],
        "security_score": scores["Security"],
        "dependencies_score": scores["Dependencies"],
        "issues": all_issues
    }
    
    print(f"Analysis complete. Overall score: {report['overall_score']:.2f}%")
    return report

# Example of how to run this for testing (optional)
if __name__ == "__main__":
    # Create a dummy project for testing
    if not os.path.exists("test_project"):
        os.makedirs("test_project")
    with open("test_project/main.py", "w") as f:
        f.write("import os\n\n") # Unused import (Ruff)
        f.write("password = '12345'\n") # Hardcoded password (Bandit)

    # Run the analysis
    test_report = run_analysis("./test_project")
    print("\n--- ANALYSIS REPORT ---")
    print(json.dumps(test_report, indent=2))
    
    # Clean up
    os.remove("test_project/main.py")
    os.rmdir("test_project")
