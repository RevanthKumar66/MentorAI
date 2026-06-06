import logging
from typing import Dict, Any, List

logger = logging.getLogger("mentorai-os.intelligence.output_processor")

class OutputProcessor:
    """Orchestrates response intelligence workflow and prompt construction."""

    def __init__(self, classifier=None, planner=None, selector=None, generator=None):
        from app.intelligence.intent_classifier import IntentClassifier
        from app.intelligence.response_planner import ResponsePlanner
        from app.intelligence.format_selector import FormatSelector
        from app.intelligence.suggestion_generator import SuggestionGenerator

        self.classifier = classifier or IntentClassifier()
        self.planner = planner or ResponsePlanner()
        self.selector = selector or FormatSelector()
        self.generator = generator or SuggestionGenerator()

    async def orchestrate_planning(self, query: str, provider=None, model: str = "gemini-2.5-flash") -> Dict[str, Any]:
        """Runs classifier, planner, selector to build response specifications."""
        intent_info = await self.classifier.classify(query, provider=provider, model=model)
        plan = self.planner.plan(query, intent_info)
        rules = self.selector.select_rules(plan, query)
        
        return {
            "intent": intent_info.get("intent"),
            "confidence": intent_info.get("confidence"),
            "complexity": plan.get("complexity"),
            "sections": plan.get("sections"),
            "use_table": plan.get("use_table"),
            "use_diagram": plan.get("use_diagram"),
            "length_guideline": plan.get("length_guideline"),
            "formatting_rules": rules
        }

    def construct_system_prompt(self, intelligence_plan: Dict[str, Any], base_prompt: str) -> str:
        """Dynamically constructs system instructions using intelligence rules and base prompt."""
        sections_str = ", ".join([f"'{s}'" for s in intelligence_plan.get("sections", [])])
        rules_str = "\n".join([f"- {r}" for r in intelligence_plan.get("formatting_rules", [])])
        suggestions_instruction = self.generator.get_instructions()
        
        dynamic_instruction = (
            f"=== RESPONSE INTELLIGENCE INSTRUCTIONS ===\n"
            f"You are operating as MentorAI under specialized Response Intelligence rules.\n"
            f"User query has been analyzed:\n"
            f"- Intent category: {intelligence_plan.get('intent')}\n"
            f"- Complexity level: {intelligence_plan.get('complexity')}\n\n"
            f"1. REQUIRED RESPONSE STRUCTURE:\n"
            f"You MUST structure your response utilizing the following sections, and use clear Markdown headers "
            f"(e.g., '## Section Name') for each section: {sections_str}.\n"
            f"Never output a wall of text. Always use visual spacing and bullet lists.\n\n"
            f"2. FORMATTING RULES:\n"
            f"{rules_str}\n\n"
            f"3. LENGTH LIMIT:\n"
            f"{intelligence_plan.get('length_guideline')}\n\n"
            f"4. FOLLOW-UP QUESTIONS GUIDELINE:\n"
            f"{suggestions_instruction}\n"
            f"==========================================\n\n"
        )
        
        return f"{dynamic_instruction}{base_prompt}"
