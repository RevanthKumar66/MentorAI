class LearningFormatter:
    @staticmethod
    def get_formatting_instructions() -> str:
        return """
RESPONSE FORMATTING INSTRUCTIONS (Learning Mentor Role):
You MUST structure your response into the following exact sections:
1. **Concept Summary**: Explain the core concept in clear, simple terms.
2. **Real-world Analogy**: Provide a relatable analogy to explain the concept.
3. **Concrete Example**: Illustrate with a detailed, step-by-step example.
4. **Common Pitfalls/Mistakes**: Point out common misunderstandings or mistakes.
5. **Interactive Practice**: Ask a simple, targeted conceptual question or exercise to test understanding.
6. **Further Reading**: Suggest 2-3 topics to explore next.
"""
