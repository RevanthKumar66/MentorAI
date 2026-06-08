import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("mentorai-os.intelligence.response_planner")

class ResponsePlanner:
    """Plans response structure, sections, length, and visual assets based on classification."""
    
    def __init__(self):
        pass

    def plan(self, query: str, intent_info: Dict[str, Any], user_settings: Optional[Any] = None) -> Dict[str, Any]:
        """Plans sections, diagrams, and formatting based on intent, query keywords, and user settings."""
        intent = intent_info.get("intent", "general_chat")
        complexity = intent_info.get("complexity", "medium")
        
        # Detect keywords for tables/diagrams
        query_lower = query.lower()
        use_table = any(w in query_lower for w in ["compare", "vs", "versus", "comparison", "difference", "sql vs"])
        use_diagram = any(w in query_lower for w in ["workflow", "flowchart", "flow", "sequence", "architecture", "pipeline", "interaction", "oauth2", "rag"])
        
        # Default sections map based on user specs
        sections = []
        
        if intent == "coding":
            sections = ["Problem Understanding", "Code Solution", "Explanation", "Complexity Analysis", "Improvements", "Edge Cases"]
        elif intent == "dsa":
            sections = ["Problem Statement", "Approach", "Dry Run", "Code", "Complexity", "Optimizations", "Interview Follow-Ups"]
        elif intent == "learning":
            sections = ["Concept", "Real World Analogy", "Example", "Common Mistakes", "Practice Questions", "Further Learning"]
        elif intent == "research":
            sections = ["Executive Summary", "Detailed Analysis", "Key Findings", "Risks", "Recommendations", "Sources"]
        elif intent == "data_science":
            sections = ["Dataset Summary", "Data Quality Issues", "Cleaning Suggestions", "Feature Engineering Ideas", "Visualizations To Create", "ML Algorithms To Consider", "Next Steps"]
        elif intent == "workflow_design" or use_diagram:
            sections = ["Workflow Overview", "System Architecture & Flow", "Component Interactions", "Implementation Best Practices"]
            use_diagram = True
        elif intent == "comparison" or use_table:
            sections = ["Introduction", "Comparative Matrix", "Key Differences Detailed", "Pros and Cons Comparison", "Recommendation"]
            use_table = True
        elif intent == "math":
            sections = ["Problem Statement", "Core Theorem/Formula", "Step-by-Step Derivation", "Final Solution", "Sample Application"]
        elif intent == "planning":
            sections = ["Project Goal", "Pre-requisites", "Step-by-step Roadmap", "Milestones & Checkpoints", "Risks & Mitigations"]
        else:
            # Fallback for general_chat, document_analysis, career_guidance, etc.
            if complexity == "simple":
                sections = ["Summary"]
            elif complexity == "expert":
                sections = ["Overview", "Detailed Architecture", "Step-by-step Deep Dive", "Summary Findings", "Advanced Recommendations"]
            else:
                sections = ["Overview", "Detailed Explanation", "Examples & Applications", "Key Takeaways"]

        # Adjust length guideline based on user settings or fallback to complexity
        length_guideline = None
        if user_settings and hasattr(user_settings, 'response_length') and user_settings.response_length:
            resp_len = user_settings.response_length.lower()
            if resp_len == "short":
                length_guideline = "Generate a brief, highly concise response under 150-200 words. Get straight to the point."
            elif resp_len == "long":
                length_guideline = "Generate a comprehensive, detailed, and complete response (400-800+ words), expanding thoroughly on all aspects."
            elif resp_len == "medium":
                length_guideline = "Generate a balanced response, typically 200-400 words, with clear structure."

        if not length_guideline:
            length_guidelines_map = {
                "simple": "Concise, direct, under 200 words.",
                "medium": "Balanced depth, 200-400 words, including example if helpful.",
                "complex": "Thorough, structured, 400-800 words, using lists/tables.",
                "expert": "Comprehensive deep-dive, 800+ words, detailed code/diagrams, progressive disclosure style."
            }
            length_guideline = length_guidelines_map.get(complexity, "Balanced depth.")
        
        return {
            "sections": sections,
            "complexity": complexity,
            "use_table": use_table,
            "use_diagram": use_diagram,
            "length_guideline": length_guideline
        }
