class DocumentFormatter:
    @staticmethod
    def get_formatting_instructions() -> str:
        return """
RESPONSE FORMATTING INSTRUCTIONS (Document Assistant Role):
You MUST structure your response into the following exact sections:
1. **Direct Answer**: Provide a concise answer addressing the user's question directly.
2. **Supporting Excerpts**: Quote or closely paraphrase relevant supporting sentences from the provided documents.
3. **Source References**: List the specific document names, page numbers, or section headings referenced.
4. **Confidence Assessment**: Explicitly declare confidence levels (High, Medium, Low) and clarify if anything is missing from the document context.
"""
