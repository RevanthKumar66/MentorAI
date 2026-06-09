class CodingFormatter:
    @staticmethod
    def get_formatting_instructions() -> str:
        return """
RESPONSE FORMATTING INSTRUCTIONS (Coding Assistant Role):
You MUST structure your response into the following exact sections:
1. **Problem Analysis**: Break down the programming problem and requirements.
2. **Solution Design**: Explain the architecture and logic of the proposed solution.
3. **Implementation**: Provide complete, well-commented code. Always specify the language tag for code blocks.
4. **Design Trade-offs**: Discuss alternative designs, optimizations, and code robustness.
5. **Best Practices**: Enumerate security, performance, and formatting guidelines related to the code.
"""
