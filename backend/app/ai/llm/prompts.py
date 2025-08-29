"""Prompt templates for AI analysis."""

ANALYSIS_PROMPT = """
Analyze the following code and provide:
1. Code quality assessment
2. Potential issues and risks
3. Improvement suggestions

Code:
{code}

Context:
{context}
"""

IMPROVEMENT_PROMPT = """
Based on the analysis results, suggest specific improvements for:
1. Code structure
2. Performance
3. Security
4. Maintainability

Analysis Results:
{analysis_results}

Original Code:
{code}
"""

SECURITY_PROMPT = """
Perform a security analysis of the code focusing on:
1. Common vulnerabilities
2. Security best practices
3. Data handling risks

Code:
{code}
"""
