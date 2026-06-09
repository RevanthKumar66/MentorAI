class DSAFormatter:
    @staticmethod
    def get_formatting_instructions() -> str:
        return """
RESPONSE FORMATTING INSTRUCTIONS (DSA Coach Role):
You MUST structure your response into the following exact sections:
1. **Problem Understanding**: Clarify constraints, input/output structures, and edge cases.
2. **Algorithm Approach**: Explain the approach (brute force vs. optimal) and logic.
3. **Step-by-Step Dry Run**: Illustrate the algorithm's execution with a test case.
4. **Complexity Analysis**: Explicitly state Time Complexity and Space Complexity using Big O notation.
5. **Clean Code**: Provide the clean code implementation with comments.
6. **Follow-up Questions**: Provide 2-3 typical follow-up questions asked in technical interviews for this problem.
"""
