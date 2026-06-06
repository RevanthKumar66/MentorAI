import logging

logger = logging.getLogger("mentorai-os.intelligence.suggestion_generator")

class SuggestionGenerator:
    """Generates prompt guidelines for LLM to output interactive follow-up question suggestions."""

    def __init__(self):
        pass

    def get_instructions(self) -> str:
        """Returns formatting instructions for appending suggested questions to the response."""
        return (
            "At the absolute end of your response, you MUST append a section titled "
            "`## Suggested Follow-up Questions`. Under this header, generate a list of "
            "exactly 3 to 5 highly relevant, concise, and actionable follow-up questions/prompts "
            "that the user might want to ask next, based on the content of your response. "
            "Each question should be a single bullet point. "
            "Example:\n"
            "## Suggested Follow-up Questions\n"
            "* How do embeddings work in vector retrieval?\n"
            "* What vector databases are commonly used with RAG?\n"
            "* How does text chunking affect search performance?\n\n"
            "Do not add any text or formatting after this section."
        )
