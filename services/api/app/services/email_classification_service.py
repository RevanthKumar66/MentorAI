import logging
import json
from typing import Dict, Any, Optional
from app.llm.providers.factory import LLMProviderFactory

logger = logging.getLogger("mentorai-os.services.email_classification_service")

class EmailClassificationService:
    """Uses Gemini to classify emails and rank their urgency (1-100)."""

    def __init__(self):
        self.provider = LLMProviderFactory.get_provider()

    async def classify_email(self, subject: str, sender: str, body: str) -> Dict[str, Any]:
        """Classifies email into categories and computes priority score 1-100."""
        prompt = f"""
You are an advanced email classification agent. Analyze the email details below:
- Subject: {subject}
- Sender: {sender}
- Body: {body}

Classify the email into exactly ONE of the following categories:
- Job Opportunity
- Interview
- Assessment
- Assignment
- Meeting
- Event
- Bill
- Newsletter
- Promotion
- Spam
- Personal
- Learning Resource
- Other

Also, assign a priority score between 1 and 100 representing how urgent and important this email is for the user. Guidelines:
- High priority (85-100): Interviews, coding assessments due soon, urgent meetings, bills due soon.
- Medium priority (50-84): Job opportunities, assignments, upcoming events, standard meetings.
- Low priority (1-49): Newsletters, promotions, spam, general learning resources.

Provide a short, 1-sentence reason for the priority score.

Return a STRICT JSON response with the following keys:
1. "category": The exact category string from the list above.
2. "priority_score": Integer (1-100).
3. "urgency_reason": A concise reason string.

Ensure the response is STRICT valid JSON with NO markdown fences or trailing code blocks.
"""
        try:
            res_llm = await self.provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.0-flash",
                temperature=0.1
            )
            text_resp = res_llm.get("text", "").strip()

            # Clean markdown fences if any
            if "```" in text_resp:
                parts = text_resp.split("```")
                for part in parts:
                    cleaned = part.strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()
                    if cleaned.startswith("{") and cleaned.endswith("}"):
                        text_resp = cleaned
                        break

            parsed = json.loads(text_resp)
            return {
                "category": parsed.get("category", "Other"),
                "priority_score": int(parsed.get("priority_score", 50)),
                "urgency_reason": parsed.get("urgency_reason", "Classified automatically by AI.")
            }
        except Exception as e:
            logger.error(f"Error classifying email thread: {str(e)}", exc_info=True)
            # Fallback heuristics
            lower_subj = subject.lower()
            lower_body = body.lower()
            category = "Other"
            priority = 50
            reason = "Automatic fallback classification."

            if "assessment" in lower_subj or "hackerrank" in lower_subj or "codility" in lower_subj:
                category = "Assessment"
                priority = 90
                reason = "Detected assessment invitation keyword."
            elif "interview" in lower_subj or "schedule" in lower_subj or "calendly" in lower_body:
                category = "Interview"
                priority = 95
                reason = "Detected interview scheduling keyword."
            elif "offer" in lower_subj or "job description" in lower_body:
                category = "Job Opportunity"
                priority = 80
                reason = "Detected job opportunity keyword."
            elif "newsletter" in lower_subj or "tldr" in lower_subj:
                category = "Newsletter"
                priority = 20
                reason = "Detected newsletter subscription keyword."
            elif "sale" in lower_subj or "discount" in lower_subj or "off" in lower_subj:
                category = "Promotion"
                priority = 15
                reason = "Detected promotional marketing keywords."

            return {
                "category": category,
                "priority_score": priority,
                "urgency_reason": reason
            }
