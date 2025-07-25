import json
import subprocess
import os
from typing import List, Dict, Any
SEVERITY_MAPPING = {
    "LOW": "Low",
    "MEDIUM": "Medium",
    "HIGH": "High",
}
SEVERITY_PENALTIES = {
    "Critical": 20,
    "High": 10,
    "Medium": 5,
    "Low": 1,
}
CATEGORY_WEIGHTS = {
    "Structure": 0.4,
    "Code Quality": 0.3,
    "Security": 0.2,
    "Dependencies": 0.1,
}
class StandardizedIssue(Dict):
    category: str
    severity: str
    title: str
    description: str
    file_path: str
    line_number: int
def _run_tool(command: List[str], project_path: str) -> Dict[str, Any]:
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
        tool = command[0]
        raise
    except subprocess.CalledProcessError as e:
        return {}
    except json.JSONDecodeError as e:
        return {}
def _parse_ruff_output(data: List[Dict[str, Any]]) -> List[StandardizedIssue]:
    issues = []
    for item in data:
        issues.append({
            "category": "Code Quality",
            "severity": "Medium",
            "title": f"{item['code']}: {item['message']}",
            "description": item['message'],
            "file_path": item['filename'],
            "line_number": item['location']['row'],
        })
    return issues
def _parse_bandit_output(data: Dict[str, Any]) -> List[StandardizedIssue]:
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
    scores = {
        "Structure": 100.0,
        "Code Quality": 100.0,
        "Security": 100.0,
        "Dependencies": 100.0,
    }
    for issue in issues:
        penalty = SEVERITY_PENALTIES.get(issue["severity"], 0)
        if issue["category"] in scores:
            scores[issue["category"]] -= penalty
    for category in scores:
        scores[category] = max(0, scores[category])
    overall_score = (
        scores["Structure"] * CATEGORY_WEIGHTS["Structure"] +
        scores["Code Quality"] * CATEGORY_WEIGHTS["Code Quality"] +
        scores["Security"] * CATEGORY_WEIGHTS["Security"] +
        scores["Dependencies"] * CATEGORY_WEIGHTS["Dependencies"]
    )
    scores["overall_score"] = overall_score
    return scores
def run_analysis(project_path: str) -> Dict[str, Any]:
    ruff_output = _run_tool(["ruff", "check", ".", "--output-format=json", "--force-exclude"], project_path)
    bandit_output = _run_tool(["bandit", "-r", ".", "-f", "json"], project_path)
    ruff_issues = _parse_ruff_output(ruff_output)
    bandit_issues = _parse_bandit_output(bandit_output)
    all_issues = ruff_issues + bandit_issues
    scores = _calculate_scores(all_issues)
    report = {
        "overall_score": scores["overall_score"],
        "structure_score": scores["Structure"],
        "quality_score": scores["Code Quality"],
        "security_score": scores["Security"],
        "dependencies_score": scores["Dependencies"],
        "issues": all_issues
    }
    return report
if __name__ == "__main__":
    if not os.path.exists("test_project"):
        os.makedirs("test_project")
    with open("test_project/main.py", "w") as f:
        f.write("import os\n\n")
        f.write("password = '12345'\n")
    test_report = run_analysis("./test_project")
    os.remove("test_project/main.py")
    os.rmdir("test_project")
