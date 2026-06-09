from .learning_formatter import LearningFormatter
from .coding_formatter import CodingFormatter
from .dsa_formatter import DSAFormatter
from .research_formatter import ResearchFormatter
from .career_formatter import CareerFormatter
from .datascience_formatter import DataScienceFormatter
from .document_formatter import DocumentFormatter

FORMATTERS = {
    "learning": LearningFormatter,
    "coding": CodingFormatter,
    "dsa": DSAFormatter,
    "research": ResearchFormatter,
    "career": CareerFormatter,
    "datascience": DataScienceFormatter,
    "document": DocumentFormatter
}

def get_formatting_instructions(role_type: str) -> str:
    formatter = FORMATTERS.get(role_type)
    if formatter:
        return formatter.get_formatting_instructions()
    return ""
