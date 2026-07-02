import logging
from typing import Dict, Any

logger = logging.getLogger("mentorai-os.intelligence.intent_classifier")

class IntentClassifier:
    """Classifies user queries into specific intents and complexity levels using LLM."""
    
    def __init__(self, provider=None):
        self.provider = provider

    async def classify(self, query: str, provider=None, model: str = "gemini-2.0-flash") -> Dict[str, Any]:
        """Classifies query and returns intent name, confidence, and complexity."""
        if not provider:
            from app.llm.providers.factory import LLMProviderFactory
            provider = LLMProviderFactory.get_provider()
            
        system_instruction = (
            "You are an AI-native intent and complexity classifier for MentorAI.\n"
            "Analyze the user query and classify it into exactly one of the following intents:\n"
            "- learning (conceptual explanations, how things work, analogies, study aids)\n"
            "- coding (writing code, refactoring, fixing bugs, explanations of code)\n"
            "- dsa (data structures and algorithms, competitive programming, complexity analysis, interview prep)\n"
            "- research (analysis of papers, reports, key findings, data summaries, risks)\n"
            "- data_science (statistics, machine learning, dataset summary, visualizations, feature engineering, data cleaning)\n"
            "- document_analysis (analyzing uploaded text, summaries, PDF analysis, extraction)\n"
            "- career_guidance (resume advice, career path, senior role roadmap, interview prep)\n"
            "- general_chat (greetings, simple conversation, chit-chat, assistant questions)\n"
            "- math (equations, derivations, calculations, proofs)\n"
            "- workflow_design (designing pipelines, architecture diagrams, sequence workflows)\n"
            "- comparison (comparing options, products, databases, pros/cons, comparisons)\n"
            "- planning (creating roadmaps, checklists, task plans, project planning)\n\n"
            "Also, analyze the complexity level of the query as one of:\n"
            "- simple (greetings, basic questions: 'What is Python?', 'hi', 'how are you')\n"
            "- medium (requires moderate explanation or code snippet: 'how to reverse a list in python')\n"
            "- complex (multiple steps, multi-factor analysis: 'compare performance of PostgreSQL vs MongoDB under high write load')\n"
            "- expert (deep architecture design, system designs, advanced math: 'explain distributed tracing architecture with code')\n\n"
            "Return the classification strictly as a JSON object with keys: 'intent' (string), 'confidence' (float between 0 and 1), and 'complexity' (string). Do not add any markdown formatting, backticks, or other text outside the JSON."
        )
        
        try:
            messages = [{"role": "user", "content": f"User Query: {query}"}]
            res = await provider.generate(
                messages=messages,
                model=model,
                system_prompt=system_instruction,
                temperature=0.1
            )
            raw_text = res.get("text", "").strip()
            
            # Clean up potential markdown formatting blockticks
            if raw_text.startswith("```"):
                lines = raw_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_text = "\n".join(lines).strip()
            
            import json
            data = json.loads(raw_text)
            intent = data.get("intent", "general_chat").strip().lower()
            confidence = float(data.get("confidence", 0.8))
            complexity = data.get("complexity", "simple").strip().lower()
            
            # Fallback handling
            valid_intents = {
                "learning", "coding", "dsa", "research", "data_science", "document_analysis",
                "career_guidance", "general_chat", "math", "workflow_design", "comparison", "planning"
            }
            if intent not in valid_intents:
                intent = "general_chat"
                
            valid_complexities = {"simple", "medium", "complex", "expert"}
            if complexity not in valid_complexities:
                complexity = "medium"
                
            return {
                "intent": intent,
                "confidence": confidence,
                "complexity": complexity
            }
        except Exception as e:
            logger.error(f"Intent classification failed: {str(e)}", exc_info=True)
            # Default fallback
            return {
                "intent": "general_chat",
                "confidence": 0.5,
                "complexity": "medium"
            }
