import logging
from typing import Dict, Any, List

logger = logging.getLogger("mentorai-os.intelligence.format_selector")

class FormatSelector:
    """Determines formatting rules and layout instructions based on planned response structure."""

    def __init__(self):
        pass

    def select_rules(self, plan: Dict[str, Any], query: str) -> List[str]:
        """Generates clear, explicit instructions for formatting of the LLM output."""
        rules = []
        intent = plan.get("intent", "general_chat")
        
        # 1. Table rule
        if plan.get("use_table", False):
            rules.append("When comparing choices, database engines, architectures, or statistics, you MUST summarize them using a clean, well-formatted Markdown Table.")
        
        # 2. Mermaid diagram rule
        if plan.get("use_diagram", False):
            rules.append(
                "You MUST include a visual diagram (flowchart, sequence diagram, or block diagram) "
                "modeled in standard Mermaid syntax inside a ```mermaid ... ``` code block. "
                "Do NOT write HTML inside the Mermaid diagram and quote labels containing special characters like parentheses."
            )
            
        # 3. Code formatting rule
        if intent in ["coding", "dsa", "data_science"]:
            rules.append("You MUST present all code solutions inside fully syntax-highlighted code blocks with the appropriate language identifier (e.g., ```python, ```typescript). Never write unformatted inline code.")
            
        # 4. Tutorial/Numbered step rule
        query_lower = query.lower()
        is_tutorial = any(w in query_lower for w in ["how to", "tutorial", "steps to", "guide", "setup", "install"]) or intent == "planning"
        if is_tutorial:
            rules.append("You MUST organize process steps, tutorials, and instructions as a clean, sequential numbered list (1., 2., 3.).")

        # 5. Callout block rule
        rules.append(
            "Use Markdown blockquote callouts for highlights or notes "
            "(e.g., '> [!NOTE]\\n> Important context here' or '> [!WARNING]\\n> Warning detail')."
        )
        
        # 6. Progressive disclosure styling
        if plan.get("complexity") == "expert":
            rules.append("Use a progressive disclosure style: start with a quick 1-2 sentence Summary at the top, then go into details and advanced explanations.")
            
        return rules
