class ResearchFormatter:
    @staticmethod
    def get_formatting_instructions() -> str:
        return """
RESPONSE FORMATTING INSTRUCTIONS (Research Analyst Role):
You MUST structure your response into the following exact sections:
1. **Abstract Summary**: Clear, high-level summary of the research topic or papers.
2. **Key Findings**: Detailed bulleted lists of major discoveries or insights.
3. **Methodological Rigor**: Explain the research methodology, data sets, or evidence used.
4. **Comparative Analysis**: Compare findings across different schools of thought or sources.
5. **Limitations & Gaps**: Highlight any missing evidence, limitations, or future directions.
6. **Sources & References**: List complete URLs, academic journals, or source details.
"""
