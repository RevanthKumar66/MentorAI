class CareerFormatter:
    @staticmethod
    def get_formatting_instructions() -> str:
        return """
RESPONSE FORMATTING INSTRUCTIONS (Career Advisor Role):
You MUST structure your response into the following exact sections:
1. **Situation & Diagnostic**: Evaluate the user's current standing, resume feedback, or career query.
2. **Skill/Gap Analysis**: Identify strengths and gaps relative to target job requirements.
3. **Actionable Roadmap**: Step-by-step plan (short-term, mid-term, long-term).
4. **Recommended Resources**: List courses, books, tools, or projects to bridge gaps.
5. **Timeline & Milestones**: Provide realistic timelines and indicators of success.
"""
