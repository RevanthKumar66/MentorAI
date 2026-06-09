from app.ai.registry.registry import get_prompt
from app.ai.formatters import get_formatting_instructions
from app.models.chat import ChatSession
from app.models.user_preferences import UserPreferences
from typing import Optional

class WorkspaceContextBuilder:
    @staticmethod
    def build_system_prompt(
        session: ChatSession,
        preferences: Optional[UserPreferences] = None
    ) -> str:
        """Construct the custom system prompt combining base system, role, persona, and user preferences."""
        # 1. Base system prompt
        base_system = get_prompt("system", "global")
        
        # 2. Role-specific prompt
        role_type = session.role_type or "general"
        role_prompt = get_prompt("roles", role_type)
        
        # 3. Persona-specific prompt
        persona_type = session.persona_type or "teacher"
        persona_prompt = get_prompt("personas", persona_type)
        
        # 4. User preferences context
        pref_context = ""
        if preferences:
            pref_context = f"""
USER PROFILE & PREFERENCES:
- Experience Level: {preferences.experience_level}
- Learning Style: {preferences.learning_style}
- Career Goal: {preferences.career_goal}
- Preferred Language: {preferences.preferred_language}

Please tailor the complexity, explanations, and language of your responses to match these preferences.
"""

        # 5. Role-specific structured formatting instructions
        formatting_instr = get_formatting_instructions(role_type)
        
        # Assemble components
        system_prompt = f"""{base_system}

### ROLE INSTRUCTIONS
{role_prompt}

### PERSONA & TONE STYLE
{persona_prompt}
{pref_context}
{formatting_instr}
"""
        return system_prompt.strip()

    @staticmethod
    def build_full_context(
        session: ChatSession,
        preferences: Optional[UserPreferences] = None,
        rag_context: Optional[str] = None
    ) -> str:
        """Build the full prompt context including RAG retrieval if available."""
        system_prompt = WorkspaceContextBuilder.build_system_prompt(session, preferences)
        
        if rag_context:
            system_prompt += f"\n\n### RETRIEVED CONTEXT DOCUMENTS\n{rag_context}\n\nUse the retrieved context documents above if relevant to answer the user's question. If the document assistant role is selected, anchor responses strictly to this context."
            
        return system_prompt
