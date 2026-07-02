import pathlib
import os
from typing import Dict, List, Any

# Define registries metadata
ROLES: Dict[str, Dict[str, Any]] = {
    "general": {
        "id": "general",
        "name": "General Assistant",
        "description": "Standard multi-purpose AI assistant for general queries.",
        "icon": "MessageSquare"
    },
    "learning": {
        "id": "learning",
        "name": "Learning Mentor",
        "description": "Structured explanations, analogies, and practice questions.",
        "icon": "GraduationCap"
    },
    "coding": {
        "id": "coding",
        "name": "Senior Coding Assistant",
        "description": "High-quality, production-ready code blocks and debug aid.",
        "icon": "Code"
    },
    "dsa": {
        "id": "dsa",
        "name": "DSA Coding Coach",
        "description": "Step-by-step algorithms, Big O, dry-runs and complexity analysis.",
        "icon": "GitFork"
    },
    "research": {
        "id": "research",
        "name": "Research Analyst",
        "description": "Academic paper summaries, comparative synthesis, and references.",
        "icon": "Search"
    },
    "career": {
        "id": "career",
        "name": "Career Advisor",
        "description": "Resume feedback, action plans, and job prep tips.",
        "icon": "Briefcase"
    },
    "datascience": {
        "id": "datascience",
        "name": "Data Scientist",
        "description": "Exploratory analysis, feature engineering, and ML advice.",
        "icon": "BarChart3"
    },
    "document": {
        "id": "document",
        "name": "Document Assistant",
        "description": "Strict RAG context question answering with references.",
        "icon": "FileText"
    },
    "resume": {
        "id": "resume",
        "name": "Resume Preparation AI",
        "description": "Resume builder, ATS optimization, score, cover letter generator.",
        "icon": "FileSpreadsheet"
    },
    "language": {
        "id": "language",
        "name": "Language Learning Mentor",
        "description": "Telugu-to-English, regional translation guides, vocabulary and grammar lessons.",
        "icon": "Languages"
    },
    "agent": {
        "id": "agent",
        "name": "Business Automation Agent Builder",
        "description": "Interactive workflow triggers, automated business node rules, and integration pipelines.",
        "icon": "Cpu"
    },
    "job": {
        "id": "job",
        "name": "Job Profile Optimizer",
        "description": "Naukri, LinkedIn, Unstop, Apna profile auditing and career opportunities suggestions.",
        "icon": "Briefcase"
    }
}

PERSONAS: Dict[str, Dict[str, Any]] = {
    "teacher": {
        "id": "teacher",
        "name": "Patient Teacher",
        "description": "Supportive and collaborative tone, interactive pacing.",
        "avatar_emoji": "👩‍🏫"
    },
    "senior_engineer": {
        "id": "senior_engineer",
        "name": "Senior Engineer",
        "description": "Direct, pragmatically code-oriented, technical details.",
        "avatar_emoji": "💻"
    },
    "research_scientist": {
        "id": "research_scientist",
        "name": "Research Scientist",
        "description": "Rigorous, analytical, precise terminology, evidence-focused.",
        "avatar_emoji": "🔬"
    },
    "interview_coach": {
        "id": "interview_coach",
        "name": "Interview Coach",
        "description": "Strategically targeted feedback, communication-focused.",
        "avatar_emoji": "⏱️"
    },
    "career_mentor": {
        "id": "career_mentor",
        "name": "Career Mentor",
        "description": "Empathetic guidance, action plans, growth focus.",
        "avatar_emoji": "👔"
    },
    "data_scientist": {
        "id": "data_scientist",
        "name": "Data Scientist",
        "description": "Metrics-driven, mathematically grounded, analytical.",
        "avatar_emoji": "📊"
    },
    "startup_founder": {
        "id": "startup_founder",
        "name": "Startup Founder",
        "description": "High-velocity product focus, pragmatic MVP trade-offs.",
        "avatar_emoji": "🚀"
    }
}

def get_prompts_dir() -> pathlib.Path:
    current = pathlib.Path(__file__).resolve()
    for parent in current.parents:
        prompts_path = parent / "packages" / "prompts"
        if prompts_path.exists() and prompts_path.is_dir():
            return prompts_path
    
    cwd = pathlib.Path(os.getcwd())
    for parent in [cwd] + list(cwd.parents):
        prompts_path = parent / "packages" / "prompts"
        if prompts_path.exists() and prompts_path.is_dir():
            return prompts_path
            
    return cwd / "packages" / "prompts"

def get_prompt(category: str, name: str) -> str:
    """Load a prompt file from packages/prompts directory.
    
    category: 'roles', 'personas', or 'chat'
    name: name of the prompt (without extension, e.g. 'coding' or 'system')
    """
    prompts_dir = get_prompts_dir()
    file_path = prompts_dir / category / f"{name}.md"
    
    # Fallbacks for flexibility
    if not file_path.exists():
        file_path = prompts_dir / "chat" / f"{name}_prompt.md"
    if not file_path.exists():
        file_path = prompts_dir / "chat" / f"{name}.md"
        
    if not file_path.exists():
        return f"Default instruction prompt for {category}/{name}."
        
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()
