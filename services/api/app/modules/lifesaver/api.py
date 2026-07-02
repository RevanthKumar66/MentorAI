import logging
import json
import math
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.common.responses import success_response, error_response
from app.llm.providers.factory import LLMProviderFactory

logger = logging.getLogger("mentorai-os.momentum-ai.api")

router = APIRouter(prefix="/lifesaver", tags=["Momentum AI"])

# ─────────────────────────────────────────────
# Existing: Goal Plan Generator
# ─────────────────────────────────────────────

class GeneratePlanPayload(BaseModel):
    title: str
    category: Optional[str] = None
    target_date: Optional[str] = None
    hours_per_day: Optional[str] = None
    experience_level: Optional[str] = None

@router.post("/planner/generate")
async def generate_goal_plan(
    payload: GeneratePlanPayload,
    current_user: User = Depends(get_current_user)
):
    """Generates a structured AI roadmap and execution plan using Gemini."""
    try:
        provider = LLMProviderFactory.get_provider()
        prompt = f"""
You are an advanced AI productivity strategist and goal planner. Your objective is to analyze the user's goal details and generate a highly personalized, structured execution plan.

Goal Details:
- Title: {payload.title}
- Category: {payload.category or "General"}
- Target Date: {payload.target_date or "Not Specified"}
- Available Hours Per Day: {payload.hours_per_day or "Not Specified"}
- Experience Level: {payload.experience_level or "Not Specified"}

Based on this information, generate a structured roadmap. The output MUST be a valid JSON object with the following exact keys:
1. "goal": The user's goal title.
2. "summary": A high-level 2-3 sentence strategic overview of the plan.
3. "estimatedDifficulty": "Beginner", "Intermediate", or "Advanced".
4. "estimatedCompletionProbability": A percentage estimate (e.g. "80%") of the user reaching the goal based on their constraints.
5. "milestones": An array of milestones. Each milestone object must have:
   - "week_number": integer
   - "title": string (Title Case)
   - "description": string
6. "weeklyPlan": An array of weekly plans. Each object must have:
   - "week_number": integer
   - "topics": list of strings (Title Case)
7. "recommendedTasks": An array of recommended tasks. Each object must have:
   - "title": string (Title Case)
   - "description": string
   - "priority": "low", "medium", or "high"
   - "week_number": integer
8. "risks": A list of strings identifying potential risks or execution barriers.
9. "recommendations": An array of strategic recommendations. Each object must have:
   - "recommendation": string
   - "priority": "low", "medium", or "high"

Ensure the response is STRICT valid JSON with NO backticks, NO "```json" wrappers, and NO leading/trailing markdown text. Return only the raw JSON string.
"""
        res_llm = await provider.generate(
            messages=[{"role": "user", "content": prompt}],
            model="gemini-2.0-flash",
            temperature=0.3
        )
        text_resp = res_llm.get("text", "").strip()
        if "```" in text_resp:
            parts = text_resp.split("```")
            for part in parts:
                cleaned = part.strip()
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:].strip()
                if (cleaned.startswith("{") and cleaned.endswith("}")) or (cleaned.startswith("[") and cleaned.endswith("]")):
                    text_resp = cleaned
                    break

        parsed = json.loads(text_resp)
        required_keys = [
            "goal", "summary", "estimatedDifficulty",
            "estimatedCompletionProbability", "milestones",
            "weeklyPlan", "recommendedTasks", "risks", "recommendations"
        ]
        missing_keys = [k for k in required_keys if k not in parsed]
        if missing_keys:
            raise ValueError(f"AI response is missing required keys: {missing_keys}")

        return success_response(data=parsed, message="AI goal plan generated successfully")

    except json.JSONDecodeError as jde:
        logger.error(f"Failed to parse Gemini response as JSON: {jde}", exc_info=True)
        return error_response(
            code="AI_PARSE_ERROR",
            message="The AI response was not formatted as valid JSON. Please try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error generating AI goal plan: {str(e)}", exc_info=True)
        return error_response(
            code="AI_GENERATION_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─────────────────────────────────────────────
# NEW: Priority Score Engine
# ─────────────────────────────────────────────

class TaskInput(BaseModel):
    id: str
    title: str
    priority: str  # low | medium | high
    status: str
    due_date: Optional[str] = None
    goal_id: Optional[str] = None

class GoalInput(BaseModel):
    id: str
    title: str
    status: str
    target_date: Optional[str] = None
    category: Optional[str] = None

class MilestoneInput(BaseModel):
    id: str
    goal_id: str
    week_number: int
    status: str  # not_started | in_progress | completed

class PriorityScorePayload(BaseModel):
    tasks: List[TaskInput]
    goals: List[GoalInput]
    milestones: List[MilestoneInput] = []

def _deadline_urgency(due_date_str: Optional[str]) -> float:
    """Returns urgency score 0-100 based on days until due date."""
    if not due_date_str:
        return 20.0
    try:
        due = datetime.fromisoformat(due_date_str.replace("Z", "+00:00")).date()
        today = date.today()
        days = (due - today).days
        if days <= 0:
            return 100.0
        elif days <= 1:
            return 90.0
        elif days <= 3:
            return 70.0
        elif days <= 7:
            return 40.0
        elif days <= 14:
            return 30.0
        else:
            return 20.0
    except Exception:
        return 20.0

def _goal_importance(goal: Optional[GoalInput]) -> float:
    """Returns goal importance score 0-100."""
    if not goal:
        return 30.0
    if goal.status == "active":
        base = 80.0
        # Boost if deadline is close
        if goal.target_date:
            try:
                target = datetime.fromisoformat(goal.target_date.replace("Z", "+00:00")).date()
                days_left = (target - date.today()).days
                if days_left <= 7:
                    base = min(100.0, base + 20)
                elif days_left <= 30:
                    base = min(100.0, base + 10)
            except Exception:
                pass
        return base
    elif goal.status == "paused":
        return 40.0
    return 20.0

def _goal_progress_impact(task: TaskInput, milestones: List[MilestoneInput]) -> float:
    """Returns impact score 0-100 based on task's manual priority and milestone alignment."""
    # Base from task's own priority label
    base = {"high": 80.0, "medium": 55.0, "low": 30.0}.get(task.priority, 50.0)
    # Boost if any milestone for this goal is in_progress
    if task.goal_id:
        goal_milestones = [m for m in milestones if m.goal_id == task.goal_id]
        in_progress = any(m.status == "in_progress" for m in goal_milestones)
        if in_progress:
            base = min(100.0, base + 15)
    return base

def _completion_risk(goal: Optional[GoalInput], milestones: List[MilestoneInput]) -> float:
    """Returns completion risk score 0-100."""
    if not goal or not goal.target_date:
        return 30.0
    try:
        target = datetime.fromisoformat(goal.target_date.replace("Z", "+00:00")).date()
        days_left = (target - date.today()).days
        if days_left <= 0:
            return 100.0
        elif days_left <= 3:
            return 90.0
        elif days_left <= 7:
            return 75.0
        elif days_left <= 14:
            return 55.0
        elif days_left <= 30:
            return 35.0
        else:
            return 20.0
    except Exception:
        return 30.0

def compute_task_priority(
    task: TaskInput,
    goal: Optional[GoalInput],
    milestones: List[MilestoneInput]
) -> Dict[str, Any]:
    """Compute weighted priority score for a task. Formula: 40/25/20/15."""
    urgency = _deadline_urgency(task.due_date)
    importance = _goal_importance(goal)
    impact = _goal_progress_impact(task, milestones)
    risk = _completion_risk(goal, milestones)

    priority_score = (
        urgency * 0.40 +
        importance * 0.25 +
        impact * 0.20 +
        risk * 0.15
    )
    # Normalize to 0-100
    priority_score = min(100.0, max(0.0, round(priority_score, 1)))

    return {
        "task_id": task.id,
        "goal_id": task.goal_id,
        "priority_score": priority_score,
        "urgency_score": round(urgency, 1),
        "impact_score": round(impact, 1),
        "goal_alignment_score": round(importance, 1),
    }

@router.post("/priority/score")
async def score_task_priorities(
    payload: PriorityScorePayload,
    current_user: User = Depends(get_current_user)
):
    """Computes and returns priority scores for all tasks using the hybrid 40/25/20/15 formula."""
    try:
        goal_map = {g.id: g for g in payload.goals}
        scored = []
        for task in payload.tasks:
            if task.status == "completed":
                continue
            goal = goal_map.get(task.goal_id) if task.goal_id else None
            score_data = compute_task_priority(task, goal, payload.milestones)
            scored.append(score_data)

        # Sort by priority_score descending
        scored.sort(key=lambda x: x["priority_score"], reverse=True)

        return success_response(
            data={"scores": scored, "total": len(scored)},
            message="Priority scores computed successfully"
        )
    except Exception as e:
        logger.error(f"Error computing priority scores: {str(e)}", exc_info=True)
        return error_response(
            code="PRIORITY_SCORE_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─────────────────────────────────────────────
# NEW: Focus AI Mission Generator
# ─────────────────────────────────────────────

class ScoredTaskInput(BaseModel):
    task_id: str
    task_title: str
    priority_score: float
    urgency_score: float
    due_date: Optional[str] = None
    goal_title: Optional[str] = None

class FocusGeneratePayload(BaseModel):
    user_name: str
    goals: List[GoalInput]
    tasks: List[TaskInput]
    milestones: List[MilestoneInput] = []
    scored_tasks: List[ScoredTaskInput] = []

def _parse_json_response(text_resp: str) -> dict:
    """Extracts and parses JSON from LLM response, stripping markdown fences."""
    if "```" in text_resp:
        parts = text_resp.split("```")
        for part in parts:
            cleaned = part.strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
            if (cleaned.startswith("{") and cleaned.endswith("}")) or (cleaned.startswith("[") and cleaned.endswith("]")):
                return json.loads(cleaned)
    return json.loads(text_resp)

@router.post("/focus/generate")
async def generate_focus_mission(
    payload: FocusGeneratePayload,
    current_user: User = Depends(get_current_user)
):
    """Generates the daily AI mission brief, goal health statuses, and recommendations using Gemini."""
    try:
        # ── Build Focus Score (local, no AI needed) ──
        high_priority_tasks = [t for t in payload.tasks if t.priority == "high" and t.status != "completed"]
        completed_high = [t for t in payload.tasks if t.priority == "high" and t.status == "completed"]
        total_high = len(high_priority_tasks) + len(completed_high)
        focus_score = round((len(completed_high) / total_high) * 100) if total_high > 0 else 50

        if focus_score >= 80:
            focus_label = "Excellent Focus"
        elif focus_score >= 60:
            focus_label = "Good Progress"
        elif focus_score >= 40:
            focus_label = "Needs Attention"
        else:
            focus_label = "Critical"

        # ── Build Goal Health (local deterministic) ──
        goal_map = {g.id: g for g in payload.goals}
        milestone_map: Dict[str, List[MilestoneInput]] = {}
        for m in payload.milestones:
            milestone_map.setdefault(m.goal_id, []).append(m)

        goal_health_list = []
        for goal in payload.goals:
            if goal.status != "active":
                continue
            goal_milestones = milestone_map.get(goal.id, [])
            total_ms = len(goal_milestones)
            completed_ms = sum(1 for m in goal_milestones if m.status == "completed")
            days_left = 999
            if goal.target_date:
                try:
                    target = datetime.fromisoformat(goal.target_date.replace("Z", "+00:00")).date()
                    days_left = (target - date.today()).days
                except Exception:
                    pass

            # Determine health
            if days_left <= 3:
                health = "CRITICAL"
                risk = 90
            elif days_left <= 7 and (total_ms == 0 or completed_ms / max(total_ms, 1) < 0.3):
                health = "CRITICAL"
                risk = 80
            elif days_left <= 14 and (total_ms == 0 or completed_ms / max(total_ms, 1) < 0.5):
                health = "AT_RISK"
                risk = 60
            elif total_ms > 0 and completed_ms / total_ms < 0.4 and days_left < 30:
                health = "AT_RISK"
                risk = 45
            else:
                health = "ON_TRACK"
                risk = 20

            goal_health_list.append({
                "goal_id": goal.id,
                "goal_title": goal.title,
                "health": health,
                "risk_score": risk,
                "days_remaining": max(0, days_left),
                "milestones_completed": completed_ms,
                "milestones_total": total_ms,
            })

        # ── Top 3 focus tasks from scored list ──
        top_tasks = sorted(payload.scored_tasks, key=lambda x: x.priority_score, reverse=True)[:3]

        # ── Gemini: mission narrative + recommendations ──
        top_task_lines = "\n".join(
            f"{i+1}. {t.task_title} (score: {t.priority_score}, due: {t.due_date or 'N/A'}, goal: {t.goal_title or 'General'})"
            for i, t in enumerate(top_tasks)
        )
        critical_goals = [g for g in goal_health_list if g["health"] == "CRITICAL"]
        at_risk_goals = [g for g in goal_health_list if g["health"] == "AT_RISK"]
        critical_summary = ", ".join(g["goal_title"] for g in critical_goals) if critical_goals else "None"
        at_risk_summary = ", ".join(g["goal_title"] for g in at_risk_goals) if at_risk_goals else "None"

        provider = LLMProviderFactory.get_provider()
        prompt = f"""
You are an elite AI productivity chief-of-staff for {payload.user_name}. Your role is to generate a personalized, data-driven daily mission briefing.

User Context:
- Active Goals: {len([g for g in payload.goals if g.status == "active"])}
- Total Pending Tasks: {len([t for t in payload.tasks if t.status != "completed"])}
- Focus Score: {focus_score}/100 ({focus_label})
- Critical Goals: {critical_summary}
- At Risk Goals: {at_risk_summary}

Top Priority Tasks Today:
{top_task_lines if top_task_lines else "No high-priority tasks found."}

Generate a JSON response with EXACTLY these keys:
1. "greeting": A short personalized greeting (e.g., "Good morning, {payload.user_name}. Here is your mission briefing.")
2. "mission_summary": 2-3 sentences analyzing their current status and what they need to accomplish today. Be specific and data-driven.
3. "estimated_time": A realistic time estimate to complete the top 3 tasks (e.g., "2h 30m")
4. "impact_level": "High", "Medium", or "Low" based on the importance of today's tasks
5. "progress_boost": A percentage like "+12%" showing how much completing today's tasks improves goal success probability
6. "recommendations": An array of exactly 4 objects, each with:
   - "text": string — specific, actionable, data-driven recommendation (NOT generic advice)
   - "priority": "high", "medium", or "low"
7. "warning": A single critical warning string if any goal is CRITICAL or AT_RISK, else null

Ensure the response is STRICT valid JSON with NO markdown fences. Return only the raw JSON string.
"""
        res_llm = await provider.generate(
            messages=[{"role": "user", "content": prompt}],
            model="gemini-2.0-flash",
            temperature=0.4
        )
        text_resp = res_llm.get("text", "").strip()
        parsed = _parse_json_response(text_resp)

        required_keys = ["greeting", "mission_summary", "estimated_time", "impact_level", "progress_boost", "recommendations", "warning"]
        missing = [k for k in required_keys if k not in parsed]
        if missing:
            raise ValueError(f"Missing keys from AI response: {missing}")

        return success_response(
            data={
                "focus_score": focus_score,
                "focus_label": focus_label,
                "top_tasks": [t.model_dump() for t in top_tasks],
                "goal_health": goal_health_list,
                "mission": parsed,
            },
            message="Focus mission generated successfully"
        )

    except json.JSONDecodeError as jde:
        logger.error(f"JSON parse error in focus generate: {jde}", exc_info=True)
        return error_response(
            code="AI_PARSE_ERROR",
            message="AI response was not valid JSON. Please try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error generating focus mission: {str(e)}", exc_info=True)
        return error_response(
            code="FOCUS_GENERATION_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─────────────────────────────────────────────
# NEW: Risk & Recovery Engine (Sprint 4)
# ─────────────────────────────────────────────

class RiskRecoveryTaskInput(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str
    estimated_time: Optional[str] = None
    days_offset: int

class RiskRecoveryPlanInput(BaseModel):
    current_probability: int
    predicted_probability: int
    plan_summary: str
    recovery_tasks: List[RiskRecoveryTaskInput]

class GoalRiskAnalysisResponse(BaseModel):
    goal_id: str
    risk_score: int
    risk_level: str
    completion_probability: int
    forecast_summary: str
    warnings: List[str]
    recovery_plan: Optional[RiskRecoveryPlanInput] = None

class RiskAnalysisPayload(BaseModel):
    user_name: str
    goals: List[GoalInput]
    tasks: List[TaskInput]
    milestones: List[MilestoneInput] = []

@router.post("/risk/analyze")
async def analyze_goal_risks(
    payload: RiskAnalysisPayload,
    current_user: User = Depends(get_current_user)
):
    """Analyzes each active goal, calculates baseline risk, and uses Gemini to generate forecasts, warnings, and recovery plans."""
    import asyncio
    try:
        active_goals = [g for g in payload.goals if g.status == "active"]
        if not active_goals:
            return success_response(
                data={"goals": []},
                message="No active goals to analyze."
            )

        provider = LLMProviderFactory.get_provider()

        async def analyze_single_goal(goal: GoalInput) -> Dict[str, Any]:
            # 1. Deterministic baseline risk calculation
            days_left = 999
            if goal.target_date:
                try:
                    target = datetime.fromisoformat(goal.target_date.replace("Z", "+00:00")).date()
                    days_left = (target - date.today()).days
                except Exception:
                    pass

            goal_tasks = [t for t in payload.tasks if t.goal_id == goal.id]
            total_tasks = len(goal_tasks)
            completed_tasks = sum(1 for t in goal_tasks if t.status == "completed")

            goal_milestones = [m for m in payload.milestones if m.goal_id == goal.id]
            total_ms = len(goal_milestones)
            completed_ms = sum(1 for m in goal_milestones if m.status == "completed")

            if days_left <= 0:
                base_risk = 100
            else:
                task_ratio = completed_tasks / total_tasks if total_tasks > 0 else 1.0
                ms_ratio = completed_ms / total_ms if total_ms > 0 else 1.0
                progress = (task_ratio + ms_ratio) / 2.0
                time_factor = 100.0 / (1.0 + (days_left / 14.0))
                deficit = 1.0 - progress
                base_risk = deficit * (40.0 + time_factor * 0.60) * 100.0
                base_risk = min(100.0, max(0.0, round(base_risk)))

            # Determine risk level
            if base_risk <= 30:
                risk_level = "On Track"
            elif base_risk <= 60:
                risk_level = "Moderate Risk"
            elif base_risk <= 80:
                risk_level = "High Risk"
            else:
                risk_level = "Critical"

            # 2. Ask Gemini to perform analysis & forecast
            top_task_lines = "\n".join(
                f"- {t.title} (priority: {t.priority}, status: {t.status}, due: {t.due_date or 'N/A'})"
                for t in goal_tasks[:5]
            )

            prompt = f"""
You are an elite AI deadline survival strategist. Your objective is to predict goal failure risks, generate precise trajectories, and build actionable recovery plans.

User: {payload.user_name}

Goal Detail:
- Title: {goal.title}
- Target Date: {goal.target_date or "N/A"} (Days Remaining: {days_left})
- Total Tasks: {total_tasks} (Completed: {completed_tasks}, Pending: {total_tasks - completed_tasks})
- Total Milestones: {total_ms} (Completed: {completed_ms})
- Baseline Computed Risk: {base_risk}/100

Recent Goal Tasks:
{top_task_lines if top_task_lines else "No tasks added yet."}

Please perform a deep risk assessment and forecasting evaluation. Generate a JSON response with EXACTLY these keys:
1. "completion_probability": An integer from 0 to 100 representing the likelihood of the user completing the goal on time under their current trajectory.
2. "forecast_summary": A 1-2 sentence prediction of the user's expected completion pace (e.g., "At the current rate of 1.2 tasks/week, the user is projected to complete 52% of the goal by the deadline.").
3. "warnings": An array of 2-3 specific, data-driven warnings (e.g., "You have 3 milestones overdue", "Pace is 40% slower than required").
4. "recovery_plan": An object containing the recovery strategy (or null if the computed baseline risk is <= 30 and completion_probability is >= 80%):
   - "current_probability": Same as "completion_probability" above.
   - "predicted_probability": An integer representing the new completion probability if the user executes the recovery plan (must be higher than current).
   - "plan_summary": A 2-3 sentence recovery overview focusing on high-impact areas.
   - "recovery_tasks": An array of 3-5 specific, highly actionable recovery tasks to get back on track. Each recovery task object must have:
     - "title": string (Title Case)
     - "description": string
     - "priority": "high", "medium", or "low"
     - "estimated_time": string (e.g. "1h 30m")
     - "days_offset": integer (number of days from today when this task should be completed, e.g. 1, 2, 3)

Ensure the response is STRICT valid JSON with NO markdown fences. Return only the raw JSON string.
"""
            res_llm = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.0-flash",
                temperature=0.3
            )
            text_resp = res_llm.get("text", "").strip()
            parsed = _parse_json_response(text_resp)

            # Ensure recovery plan matches database criteria
            recovery = parsed.get("recovery_plan")
            if not recovery and base_risk > 30:
                # Force fallback plan if baseline risk indicates risk but LLM returned null
                recovery = {
                    "current_probability": parsed.get("completion_probability", 50),
                    "predicted_probability": min(95, parsed.get("completion_probability", 50) + 25),
                    "plan_summary": f"Increase task velocity on {goal.title} by tackling high-priority tasks and clearing outstanding checkpoints.",
                    "recovery_tasks": [
                        {
                            "title": "Clear Outstanding Tasks",
                            "description": "Complete pending baseline tasks to regain momentum.",
                            "priority": "high",
                            "estimated_time": "2h",
                            "days_offset": 1
                        }
                    ]
                }

            return {
                "goal_id": goal.id,
                "risk_score": int(base_risk),
                "risk_level": risk_level,
                "completion_probability": parsed.get("completion_probability", 50),
                "forecast_summary": parsed.get("forecast_summary", "Trajectory is currently steady."),
                "warnings": parsed.get("warnings", []),
                "recovery_plan": recovery
            }

        # Run all active goal analyses in parallel
        results = await asyncio.gather(*[analyze_single_goal(g) for g in active_goals])

        return success_response(
            data={"goals": results},
            message="Goal risk and recovery analysis completed successfully."
        )

    except json.JSONDecodeError as jde:
        logger.error(f"JSON parse error in risk analyze: {jde}", exc_info=True)
        return error_response(
            code="AI_PARSE_ERROR",
            message="AI response was not valid JSON. Please try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error executing risk analysis: {str(e)}", exc_info=True)
        return error_response(
            code="RISK_ANALYSIS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class GoalRiskInput(BaseModel):
    goal_id: str
    risk_score: int
    risk_level: str
    completion_probability: int

class ExecutionAnalysisPayload(BaseModel):
    user_name: str
    goals: List[GoalInput]
    tasks: List[TaskInput]
    milestones: List[MilestoneInput] = []
    focus_score: Optional[int] = None
    goal_risks: List[GoalRiskInput] = []

@router.post("/execution/analyze")
async def analyze_execution_patterns(
    payload: ExecutionAnalysisPayload,
    current_user: User = Depends(get_current_user)
):
    """Analyzes user productivity, missed tasks, focus scores, and generates coaching, rescheduling, and insights using Gemini."""
    try:
        provider = LLMProviderFactory.get_provider()
        
        # 1. Extract missed tasks
        missed_tasks = []
        today = date.today()
        for t in payload.tasks:
            if t.status != "completed" and t.due_date:
                try:
                    due_date_clean = t.due_date.replace("Z", "+00:00")
                    if "T" in due_date_clean:
                        due = datetime.fromisoformat(due_date_clean).date()
                    else:
                        due = date.fromisoformat(due_date_clean)
                    if due < today:
                        missed_tasks.append(t)
                except Exception:
                    pass

        # Format user goals and tasks summary
        active_goals = [g for g in payload.goals if g.status == "active"]
        total_tasks = len(payload.tasks)
        completed_tasks = sum(1 for t in payload.tasks if t.status == "completed")
        completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0)

        goals_summary = "\n".join(
            f"- Goal: {g.title} (status: {g.status}, category: {g.category or 'General'})"
            for g in active_goals
        )
        
        missed_summary = "\n".join(
            f"- Task: {t.title} (id: {t.id}, due: {t.due_date}, priority: {t.priority})"
            for t in missed_tasks
        )

        risks_summary = "\n".join(
            f"- Goal: {r.goal_id} (risk score: {r.risk_score}, level: {r.risk_level}, probability: {r.completion_probability}%)"
            for r in payload.goal_risks
        )

        prompt = f"""
You are an advanced AI Chief of Staff and productivity advisor. Your role is to analyze the user's execution history, identify behavioral patterns, suggest automatic corrections (like rescheduling missed tasks), and provide motivational AI daily coaching.

User: {payload.user_name}
Current Context:
- Active Goals: {len(active_goals)}
- Total Tasks: {total_tasks} (Completed: {completed_tasks}, Pending: {total_tasks - completed_tasks}, Completion Rate: {completion_rate}%)
- Focus Score: {payload.focus_score or "N/A"}/100
- Missed Tasks (Due Date is in the past and still pending):
{missed_summary if missed_tasks else "No missed tasks detected."}

Goal Risks:
{risks_summary if payload.goal_risks else "No goal risk data available."}

Based on this information, perform an execution and pattern analysis. Return a JSON response with EXACTLY these keys:
1. "coachMessage": A highly personalized 3-4 sentence coaching message. Start by reviewing their execution summary (e.g. "Good morning, {payload.user_name}. You completed {completion_rate}% of your tasks. Excellent consistency!"). Provide specific momentum tips.
2. "rescheduleSuggestions": An array of reschedule recommendations for the missed tasks. If there are no missed tasks, return an empty array. Each object in the array must contain:
   - "task_id": string (the exact task_id of the missed task)
   - "task_title": string
   - "old_due_date": string
   - "days_offset": integer (suggested offset from today in days, e.g. 1 for tomorrow, 2 for day after tomorrow)
   - "reason": string (a short reason why this slot was selected, e.g. "Available schedule slot found in your evening timeline.")
3. "productivityInsights": An array of exactly 3-4 specific behavioral pattern insights. Each insight object must contain:
   - "insight": string (specific, data-driven, e.g., "You are most productive on goals related to career development", "Task completion drops by 40% after 9 PM", "Short 30-minute sessions yield 20% higher completion rates")
   - "confidence_score": integer (between 50 and 100 representing confidence in this pattern detection)
4. "optimizationSuggestions": An array of 3-4 strings containing strategic suggestions to optimize their workspace and workloads (e.g., "Merge duplicate subtasks under Goal X", "Limit active goals to 3 to prevent cognitive overload", "Rearrange Milestone 3 to align with available study slots").
5. "recoveryActions": An array of objects for goals with risk score > 70 (or completion probability < 50%). If no goal is at high risk, return an empty array. Each object must contain:
   - "goal_id": string (the exact goal_id)
   - "goal_title": string
   - "immediate_recovery_action": string (a high-level priority rescue recommendation)
   - "priority_recovery_tasks": list of strings (2-3 immediate action steps)
   - "expected_improvement": string (predicted completion probability increase, e.g., "+15% success probability boost")

Ensure the response is STRICT valid JSON with NO markdown fences. Return only the raw JSON string.
"""
        res_llm = await provider.generate(
            messages=[{"role": "user", "content": prompt}],
            model="gemini-2.0-flash",
            temperature=0.3
        )
        text_resp = res_llm.get("text", "").strip()
        parsed = _parse_json_response(text_resp)

        # Fallback values to avoid key errors
        if "coachMessage" not in parsed:
            parsed["coachMessage"] = f"Keep going, {payload.user_name}! Focus on completing your highest priority tasks today."
        if "rescheduleSuggestions" not in parsed:
            parsed["rescheduleSuggestions"] = []
        if "productivityInsights" not in parsed:
            parsed["productivityInsights"] = []
        if "optimizationSuggestions" not in parsed:
            parsed["optimizationSuggestions"] = []
        if "recoveryActions" not in parsed:
            parsed["recoveryActions"] = []

        return success_response(
            data=parsed,
            message="Execution patterns and coaching generated successfully."
        )

    except json.JSONDecodeError as jde:
        logger.error(f"JSON parse error in execution analyze: {jde}", exc_info=True)
        return error_response(
            code="AI_PARSE_ERROR",
            message="AI response was not valid JSON. Please try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error executing execution analysis: {str(e)}", exc_info=True)
        return error_response(
            code="EXECUTION_ANALYSIS_FAILED",
            message=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─────────────────────────────────────────────
# NEW: Smart Scheduling & Calendar Intelligence (Sprint 6)
# ─────────────────────────────────────────────

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database.session import get_async_db

class ConnectCalendarPayload(BaseModel):
    email: str
    provider: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

class SchedulingAnalysisPayload(BaseModel):
    user_name: str
    goals: List[GoalInput]
    tasks: List[TaskInput]
    milestones: List[MilestoneInput] = []
    goal_risks: List[GoalRiskInput] = []

class VoiceAssistantPayload(BaseModel):
    prompt: str


async def refresh_google_access_token(db: AsyncSession, user_id: str, refresh_token: str) -> Optional[str]:
    """Helper to refresh a Google OAuth access token using the stored refresh token."""
    from app.core.config import settings
    import httpx
    
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", None)
    client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", None)
    
    if not client_id or not client_secret:
        logger.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured in settings. Cannot refresh token.")
        return None
        
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://oauth2.googleapis.com/token", data=payload)
            if res.status_code == 200:
                data = res.json()
                new_access_token = data.get("access_token")
                if new_access_token:
                    stmt = text("""
                        UPDATE calendar_connections 
                        SET access_token = :access_token, updated_at = :now 
                        WHERE user_id = :user_id
                    """)
                    await db.execute(stmt, {"access_token": new_access_token, "now": datetime.now(), "user_id": user_id})
                    await db.commit()
                    return new_access_token
            logger.error(f"Google OAuth refresh token failed: {res.status_code} - {res.text}")
    except Exception as e:
        logger.error(f"Error during Google OAuth token refresh: {str(e)}", exc_info=True)
    return None


async def sync_google_events(db: AsyncSession, user_id: Any, access_token: str, refresh_token: Optional[str]) -> bool:
    """Helper to retrieve events from Google Calendar API and populate the database."""
    import httpx
    from datetime import timezone, timedelta
    time_min = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat().replace("+00:00", "Z")
    
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {
        "timeMin": time_min,
        "singleEvents": "true",
        "orderBy": "startTime",
        "maxResults": 100
    }
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers, params=params)
            
            if res.status_code == 401 and refresh_token:
                logger.info(f"Google Calendar API returned 401 for user {user_id}. Attempting token refresh...")
                new_token = await refresh_google_access_token(db, user_id, refresh_token)
                if new_token:
                    headers["Authorization"] = f"Bearer {new_token}"
                    res = await client.get(url, headers=headers, params=params)
            
            if res.status_code != 200:
                logger.error(f"Google Calendar API fetch failed for user {user_id}: {res.status_code} - {res.text}")
                return False
                
            events_data = res.json().get("items", [])
            
            stmt_purge = text("DELETE FROM calendar_events WHERE user_id = :user_id")
            await db.execute(stmt_purge, {"user_id": user_id})
            
            now = datetime.now()
            for idx, ev in enumerate(events_data):
                title = ev.get("summary") or ev.get("organizer", {}).get("email") or "Untitled Event"
                desc = ev.get("description")
                loc = ev.get("location")
                status_str = ev.get("status", "confirmed")
                ext_id = ev.get("id")
                
                start_raw = ev.get("start", {})
                end_raw = ev.get("end", {})
                
                start_str = start_raw.get("dateTime") or start_raw.get("date")
                end_str = end_raw.get("dateTime") or end_raw.get("date")
                
                if not start_str or not end_str:
                    continue
                
                try:
                    start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                    end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                except ValueError:
                    logger.warning(f"Skipping event {ext_id} due to datetime parsing error: {start_str} / {end_str}")
                    continue
                
                stmt_ev = text("""
                    INSERT INTO calendar_events (user_id, provider, external_event_id, title, description, start_time, end_time, location, status, last_synced_at)
                    VALUES (:user_id, 'google', :ext_id, :title, :desc, :start, :end, :loc, :status, :now)
                """)
                await db.execute(stmt_ev, {
                    "user_id": user_id,
                    "ext_id": ext_id,
                    "title": title,
                    "desc": desc,
                    "start": start_dt,
                    "end": end_dt,
                    "loc": loc,
                    "status": status_str,
                    "now": now
                })
            
            await db.commit()
            return True
            
    except Exception as e:
        logger.error(f"Error syncing Google calendar events for user {user_id}: {str(e)}", exc_info=True)
        return False


@router.get("/scheduling/connection")
async def get_calendar_connection(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve the user's active calendar connection details."""
    try:
        stmt = text("SELECT id, provider, calendar_id, email, connected_at, last_sync_at FROM calendar_connections WHERE user_id = :user_id")
        result = await db.execute(stmt, {"user_id": current_user.id})
        row = result.fetchone()
        if not row:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": None,
                    "message": "No calendar connected"
                }
            )
        
        data = {
            "id": str(row[0]),
            "provider": row[1],
            "calendar_id": row[2],
            "email": row[3],
            "connected_at": row[4].isoformat() if row[4] else None,
            "last_sync_at": row[5].isoformat() if row[5] else None
        }
        return success_response(data=data, message="Calendar connection retrieved")
    except Exception as e:
        logger.error(f"Error fetching calendar connection: {str(e)}", exc_info=True)
        return error_response(code="CONNECTION_FETCH_FAILED", message=str(e), status_code=500)


@router.post("/scheduling/connect")
async def connect_calendar(
    payload: ConnectCalendarPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Establish calendar connection and populate mock or real events."""
    try:
        stmt_check = text("SELECT id FROM calendar_connections WHERE user_id = :user_id")
        result = await db.execute(stmt_check, {"user_id": current_user.id})
        row = result.fetchone()
        
        now = datetime.now()
        access_tok = payload.access_token or "mock_access_token"
        refresh_tok = payload.refresh_token or "mock_refresh_token"
        
        if row:
            stmt_update = text("""
                UPDATE calendar_connections 
                SET email = :email, provider = :provider, access_token = :access_token, refresh_token = :refresh_token, last_sync_at = :now, updated_at = :now 
                WHERE user_id = :user_id
            """)
            await db.execute(stmt_update, {
                "email": payload.email,
                "provider": payload.provider,
                "access_token": access_tok,
                "refresh_token": refresh_tok,
                "now": now,
                "user_id": current_user.id
            })
        else:
            stmt_insert = text("""
                INSERT INTO calendar_connections (user_id, provider, calendar_id, access_token, refresh_token, email, connected_at, last_sync_at)
                VALUES (:user_id, :provider, 'primary', :access_token, :refresh_token, :email, :now, :now)
            """)
            await db.execute(stmt_insert, {
                "user_id": current_user.id,
                "provider": payload.provider,
                "access_token": access_tok,
                "refresh_token": refresh_tok,
                "email": payload.email,
                "now": now
            })
            
        is_mock = not payload.access_token or payload.access_token.startswith("mock_")
        if is_mock:
            stmt_purge = text("DELETE FROM calendar_events WHERE user_id = :user_id")
            await db.execute(stmt_purge, {"user_id": current_user.id})
            
            today = date.today()
            from datetime import timedelta
            mock_events = [
                {
                    "title": "Daily Team Standup",
                    "desc": "Sync with developers on today's sprint deliverables.",
                    "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=10),
                    "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=10, minutes=30),
                    "location": "Google Meet",
                    "status": "confirmed"
                },
                {
                    "title": "Product Design Review",
                    "desc": "Discuss UX mockups for Smart Scheduling widgets.",
                    "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=14),
                    "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=15, minutes=30),
                    "location": "Conference Room B",
                    "status": "confirmed"
                },
                {
                    "title": "Client Sync & Q&A Meeting",
                    "desc": "Review requirements and priorities.",
                    "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=19),
                    "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=20),
                    "location": "Zoom Link",
                    "status": "confirmed"
                },
                {
                    "title": "Deep Work Focus Block",
                    "desc": "Dedicated block for heads-down coding without interruptions.",
                    "start": datetime.combine(today + timedelta(days=1), datetime.min.time()) + timedelta(hours=10),
                    "end": datetime.combine(today + timedelta(days=1), datetime.min.time()) + timedelta(hours=12),
                    "location": "Focus Mode",
                    "status": "confirmed"
                },
                {
                    "title": "AI Roadmap Alignment Session",
                    "desc": "Verify weekly task distributions and deadlines.",
                    "start": datetime.combine(today - timedelta(days=1), datetime.min.time()) + timedelta(hours=19),
                    "end": datetime.combine(today - timedelta(days=1), datetime.min.time()) + timedelta(hours=20, minutes=30),
                    "location": "Focus Mode",
                    "status": "completed"
                }
            ]
            for idx, ev in enumerate(mock_events):
                stmt_ev = text("""
                    INSERT INTO calendar_events (user_id, provider, external_event_id, title, description, start_time, end_time, location, status, last_synced_at)
                    VALUES (:user_id, :provider, :ext_id, :title, :desc, :start, :end, :loc, :status, :now)
                """)
                await db.execute(stmt_ev, {
                    "user_id": current_user.id,
                    "provider": payload.provider,
                    "ext_id": f"mock_ev_{idx}",
                    "title": ev["title"],
                    "desc": ev["desc"],
                    "start": ev["start"],
                    "end": ev["end"],
                    "loc": ev["location"],
                    "status": ev["status"],
                    "now": now
                })
            await db.commit()
        else:
            await db.commit()
            ok = await sync_google_events(db, current_user.id, access_tok, refresh_tok)
            if not ok:
                logger.error(f"Google Calendar initial sync failed during connect for user {current_user.id}")
                
        return success_response(data={"email": payload.email, "provider": payload.provider}, message="Calendar connected successfully!")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error connecting calendar: {str(e)}", exc_info=True)
        return error_response(code="CONNECTION_FAILED", message=str(e), status_code=500)


@router.post("/scheduling/disconnect")
async def disconnect_calendar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Disconnect active calendar and clear user's events."""
    try:
        stmt_conn = text("DELETE FROM calendar_connections WHERE user_id = :user_id")
        await db.execute(stmt_conn, {"user_id": current_user.id})
        
        stmt_ev = text("DELETE FROM calendar_events WHERE user_id = :user_id")
        await db.execute(stmt_ev, {"user_id": current_user.id})
        
        await db.commit()
        return success_response(data=None, message="Calendar disconnected successfully")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error disconnecting calendar: {str(e)}", exc_info=True)
        return error_response(code="DISCONNECT_FAILED", message=str(e), status_code=500)


@router.post("/scheduling/sync")
async def sync_calendar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Synchronize calendar events (real Google API if tokens are present, otherwise mock events)."""
    try:
        stmt_conn = text("SELECT provider, email, access_token, refresh_token FROM calendar_connections WHERE user_id = :user_id")
        result = await db.execute(stmt_conn, {"user_id": current_user.id})
        row = result.fetchone()
        if not row:
            return error_response(code="SYNC_FAILED_NO_CONNECTION", message="No active calendar connection to sync", status_code=400)
            
        provider, email, access_token, refresh_token = row
        now = datetime.now()
        
        is_mock = not access_token or access_token.startswith("mock_")
        if is_mock:
            stmt_purge = text("DELETE FROM calendar_events WHERE user_id = :user_id")
            await db.execute(stmt_purge, {"user_id": current_user.id})
            
            today = date.today()
            from datetime import timedelta
            mock_events = [
                {
                    "title": "Daily Team Standup",
                    "desc": "Sync with developers on today's sprint deliverables.",
                    "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=10),
                    "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=10, minutes=30),
                    "location": "Google Meet",
                    "status": "confirmed"
                },
                {
                    "title": "Product Design Review",
                    "desc": "Discuss UX mockups for Smart Scheduling widgets.",
                    "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=14),
                    "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=15, minutes=30),
                    "location": "Conference Room B",
                    "status": "confirmed"
                },
                {
                    "title": "Client Sync & Q&A Meeting",
                    "desc": "Review requirements and priorities.",
                    "start": datetime.combine(today, datetime.min.time()) + timedelta(hours=19),
                    "end": datetime.combine(today, datetime.min.time()) + timedelta(hours=20),
                    "location": "Zoom Link",
                    "status": "confirmed"
                },
                {
                    "title": "Deep Work Focus Block",
                    "desc": "Dedicated block for heads-down coding without interruptions.",
                    "start": datetime.combine(today + timedelta(days=1), datetime.min.time()) + timedelta(hours=10),
                    "end": datetime.combine(today + timedelta(days=1), datetime.min.time()) + timedelta(hours=12),
                    "location": "Focus Mode",
                    "status": "confirmed"
                },
                {
                    "title": "AI Roadmap Alignment Session",
                    "desc": "Verify weekly task distributions and deadlines.",
                    "start": datetime.combine(today - timedelta(days=1), datetime.min.time()) + timedelta(hours=19),
                    "end": datetime.combine(today - timedelta(days=1), datetime.min.time()) + timedelta(hours=20, minutes=30),
                    "location": "Focus Mode",
                    "status": "completed"
                }
            ]
            for idx, ev in enumerate(mock_events):
                stmt_ev = text("""
                    INSERT INTO calendar_events (user_id, provider, external_event_id, title, description, start_time, end_time, location, status, last_synced_at)
                    VALUES (:user_id, :provider, :ext_id, :title, :desc, :start, :end, :loc, :status, :now)
                """)
                await db.execute(stmt_ev, {
                    "user_id": current_user.id,
                    "provider": provider,
                    "ext_id": f"mock_ev_{idx}",
                    "title": ev["title"],
                    "desc": ev["desc"],
                    "start": ev["start"],
                    "end": ev["end"],
                    "loc": ev["location"],
                    "status": ev["status"],
                    "now": now
                })
        else:
            ok = await sync_google_events(db, current_user.id, access_token, refresh_token)
            if not ok:
                return error_response(code="SYNC_FAILED_API_ERROR", message="Failed to fetch events from Google Calendar API", status_code=500)
                
        stmt_update = text("UPDATE calendar_connections SET last_sync_at = :now WHERE user_id = :user_id")
        await db.execute(stmt_update, {"now": now, "user_id": current_user.id})
        await db.commit()
        
        return success_response(data={"email": email, "provider": provider, "last_sync_at": now.isoformat()}, message="Calendar synced successfully")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error syncing calendar: {str(e)}", exc_info=True)
        return error_response(code="SYNC_FAILED", message=str(e), status_code=500)


@router.post("/scheduling/analyze")
async def analyze_schedule(
    payload: SchedulingAnalysisPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """AI Chief of Staff schedule analysis using Gemini."""
    try:
        stmt_ev = text("SELECT id, title, description, start_time, end_time, location, status FROM calendar_events WHERE user_id = :user_id")
        res_ev = await db.execute(stmt_ev, {"user_id": current_user.id})
        db_events = res_ev.fetchall()
        
        events_list = []
        for r in db_events:
            events_list.append({
                "id": str(r[0]),
                "title": r[1],
                "description": r[2],
                "start": r[3].isoformat() if r[3] else None,
                "end": r[4].isoformat() if r[4] else None,
                "location": r[5],
                "status": r[6]
            })
            
        active_goals = [g for g in payload.goals if g.status == "active"]
        pending_tasks = [t for t in payload.tasks if t.status != "completed"]
        
        goals_summary = "\n".join(
            f"- Goal: {g.title} (id: {g.id}, target_date: {g.target_date}, category: {g.category})"
            for g in active_goals
        )
        tasks_summary = "\n".join(
            f"- Task: {t.title} (id: {t.id}, goal_id: {t.goal_id}, due: {t.due_date}, priority: {t.priority})"
            for t in pending_tasks
        )
        events_summary = "\n".join(
            f"- Calendar Event: {e['title']} (start: {e['start']}, end: {e['end']}, status: {e['status']})"
            for e in events_list
        )
        risks_summary = "\n".join(
            f"- Goal: {r.goal_id} (risk score: {r.risk_score}, level: {r.risk_level}, probability: {r.completion_probability}%)"
            for r in payload.goal_risks
        )
        
        prompt = f"""
You are an advanced AI Chief of Staff and calendar intelligence manager. Your goal is to analyze the user's commitments, detect conflicts, identify available focus windows, propose one-click schedule suggestions, flag missed sessions, construct recovery calendars for high-risk goals, and generate context-aware reminders.

User: {payload.user_name}

Active Goals:
{goals_summary if active_goals else "No active goals."}

Pending Tasks:
{tasks_summary if pending_tasks else "No pending tasks."}

Calendar Events & Commitments:
{events_summary if events_list else "No calendar events connected."}

Goal Risks:
{risks_summary if payload.goal_risks else "No goal risk data available."}

Based on this information, perform scheduling and availability intelligence analysis. The output MUST be a valid JSON object with the following exact keys:

1. "availability": An array of 3-4 available focus windows (start and end times today and tomorrow) when the user has no meetings or calendar commitments. Identify deep work blocks. Each object must have:
   - "start": string (ISO 8601 timestamp)
   - "end": string (ISO 8601 timestamp)
   - "label": string (e.g. "Evening Focus Slot", "Morning Deep Work Block")
   - "is_deep_work": boolean

2. "conflicts": An array of detected conflicts between tasks and calendar commitments. If a task due date/scheduled time overlaps with a calendar event, flag it. For each conflict, include:
   - "task_id": string
   - "task_title": string
   - "event_title": string
   - "overlap_time": string
   - "suggested_alternative_start": string (ISO 8601 timestamp representing a free slot)
   - "suggested_alternative_end": string (ISO 8601 timestamp)
   - "reason": string explaining why the alternative is better (e.g., "Client sync is scheduled at this time. Suggest shifting arrays practice to 8 PM focus window.")

3. "suggestions": An array of schedule recommendations to place pending tasks into available focus windows. Each suggestion object must have:
   - "task_id": string (the exact task_id)
   - "task_title": string
   - "goal_id": string (the goal this task belongs to)
   - "suggested_start": string (ISO 8601 timestamp)
   - "suggested_end": string (ISO 8601 timestamp)
   - "reason": string explaining the slot choice
   - "confidence_score": integer (between 50 and 100)

4. "missedSessions": An array of scheduled work sessions that were missed (scheduled in the past, e.g. yesterday, but the task is still pending). Each object must have:
   - "task_id": string
   - "task_title": string
   - "missed_time": string (ISO 8601 timestamp)
   - "status": string (e.g. "missed")

5. "recoveryPlan": An object for goals with risk score > 70 (or completion probability < 50%) providing an immediate recovery calendar. Return null if no goal is high-risk. Each recovery plan must have:
   - "goal_id": string
   - "goal_title": string
   - "current_probability": integer
   - "predicted_probability": integer (boosted probability after recovery tasks)
   - "generated_plan": string (a day-by-day rescue timeline)
   - "recovery_tasks": list of objects (title, description, start_time, end_time)

6. "reminders": An array of 2-3 highly personalized, context-aware reminders based on calendar deadlines and goals. E.g. "Your Amazon interview is in 5 days. You are currently behind schedule. Complete Binary Search Practice today to stay on track." Each reminder is a string.

Return ONLY the raw JSON string. Do not include markdown formatting or backticks.
"""
        provider = LLMProviderFactory.get_provider()
        parsed = None
        try:
            # Try primary provider (e.g. Gemini)
            res_llm = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.0-flash",
                temperature=0.3
            )
            text_resp = res_llm.get("text", "").strip()
            parsed = _parse_json_response(text_resp)
        except Exception as primary_err:
            logger.warning(f"Primary LLM provider failed: {str(primary_err)}. Trying OpenRouter fallback...")
            try:
                from app.llm.providers.openrouter import OpenRouterLLMProvider
                or_provider = OpenRouterLLMProvider()
                res_llm = await or_provider.generate(
                    messages=[{"role": "user", "content": prompt}],
                    model="openrouter/free",
                    temperature=0.3
                )
                text_resp = res_llm.get("text", "").strip()
                parsed = _parse_json_response(text_resp)
                logger.info("OpenRouter fallback analysis succeeded!")
            except Exception as or_err:
                logger.error(f"OpenRouter fallback also failed: {str(or_err)}. Falling back to local availability engine.")
                
        # If LLM methods failed, compute everything locally using user's real events
        if not parsed:
            from datetime import datetime, date, timedelta
            today = date.today()
            
            # 1. Compute Availability
            availability = []
            local_events = []
            for r in db_events:
                if not r[3] or not r[4]:
                    continue
                try:
                    # Convert database timezone-aware datetimes to system local timezone and make naive
                    ev_start = r[3].astimezone().replace(tzinfo=None)
                    ev_end = r[4].astimezone().replace(tzinfo=None)
                    local_events.append((ev_start, ev_end, r[1]))
                except Exception as parse_err:
                    logger.warning(f"Error parsing event datetimes for local fallback: {parse_err}")
                    continue
            
            for d_offset in [0, 1, 2]:
                day = today + timedelta(days=d_offset)
                day_start = datetime.combine(day, datetime.min.time()) + timedelta(hours=9) # 9 AM
                day_end = datetime.combine(day, datetime.min.time()) + timedelta(hours=21)   # 9 PM
                
                # Filter events on this day
                day_events = []
                for ev_start, ev_end, title in local_events:
                    if ev_start.date() == day:
                        day_events.append((ev_start, ev_end, title))
                        
                # Sort events by start time
                day_events.sort(key=lambda x: x[0])
                
                # Compute free gaps
                current_time = day_start
                free_slots = []
                
                for ev_start, ev_end, title in day_events:
                    # If there's a gap before this event starts
                    if ev_start > current_time:
                        gap = ev_start - current_time
                        if gap >= timedelta(minutes=30):
                            free_slots.append((current_time, ev_start))
                    # Move current_time to the end of the event (if it extends further)
                    if ev_end > current_time:
                        current_time = ev_end
                        
                # If there's a gap after the last event until day_end
                if day_end > current_time:
                    gap = day_end - current_time
                    if gap >= timedelta(minutes=30):
                        free_slots.append((current_time, day_end))
                        
                # If no events, create standard slots
                if not day_events:
                    free_slots = [
                        (datetime.combine(day, datetime.min.time()) + timedelta(hours=9), datetime.combine(day, datetime.min.time()) + timedelta(hours=12)),
                        (datetime.combine(day, datetime.min.time()) + timedelta(hours=14), datetime.combine(day, datetime.min.time()) + timedelta(hours=17)),
                        (datetime.combine(day, datetime.min.time()) + timedelta(hours=18), datetime.combine(day, datetime.min.time()) + timedelta(hours=21))
                    ]
                    
                for start_dt, end_dt in free_slots:
                    duration = end_dt - start_dt
                    is_deep = duration >= timedelta(hours=1, minutes=30)
                    
                    hour = start_dt.hour
                    if hour < 12:
                        label_prefix = "Morning"
                    elif hour < 17:
                        label_prefix = "Afternoon"
                    else:
                        label_prefix = "Evening"
                        
                    label = f"{label_prefix} {'Deep Work Block' if is_deep else 'Focus Slot'}"
                    
                    availability.append({
                        "start": start_dt.isoformat(),
                        "end": end_dt.isoformat(),
                        "label": label,
                        "is_deep_work": is_deep
                    })
            
            # 2. Conflicts, Suggestions, Missed Sessions, Recovery Plan, Reminders
            conflicts = []
            suggestions = []
            missed_sessions = []
            reminders = []
            
            # Check for conflicts
            for t in pending_tasks:
                if not t.due_date:
                    continue
                try:
                    # Parse task due date
                    t_due = datetime.fromisoformat(t.due_date.replace("Z", "+00:00")).astimezone().replace(tzinfo=None)
                except Exception:
                    continue
                    
                for ev_start, ev_end, title in local_events:
                    # If task due time falls within the event
                    if ev_start <= t_due <= ev_end:
                        alt_slot = availability[0] if availability else None
                        suggested_start = alt_slot["start"] if alt_slot else (t_due + timedelta(hours=2)).isoformat()
                        suggested_end = alt_slot["end"] if alt_slot else (t_due + timedelta(hours=3)).isoformat()
                        
                        conflicts.append({
                            "task_id": t.id,
                            "task_title": t.title,
                            "event_title": title,
                            "overlap_time": f"{ev_start.strftime('%I:%M %p')} - {ev_end.strftime('%I:%M %p')}",
                            "suggested_alternative_start": suggested_start,
                            "suggested_alternative_end": suggested_end,
                            "reason": f"Conflict detected with '{title}'. Suggest shifting '{t.title}' to a free slot."
                        })
                        break
                        
            # Place pending tasks into availability windows as suggestions
            free_slots_pool = list(availability)
            for t in pending_tasks:
                if not free_slots_pool:
                    break
                slot = free_slots_pool.pop(0)
                suggestions.append({
                    "task_id": t.id,
                    "task_title": t.title,
                    "goal_id": t.goal_id or "default_goal",
                    "suggested_start": slot["start"],
                    "suggested_end": slot["end"],
                    "reason": f"Assigned to your free {slot['label'].lower()} to maximize execution.",
                    "confidence_score": 90
                })
                
            # Recovery plan for high-risk goals
            recovery_plan = None
            high_risk_goals = [r for r in payload.goal_risks if r.risk_score > 70 or r.completion_probability < 50]
            if high_risk_goals and active_goals:
                rg = high_risk_goals[0]
                goal_obj = next((g for g in active_goals if g.id == rg.goal_id), active_goals[0])
                recovery_plan = {
                    "goal_id": goal_obj.id,
                    "goal_title": goal_obj.title,
                    "current_probability": rg.completion_probability,
                    "predicted_probability": min(100, rg.completion_probability + 25),
                    "generated_plan": "Emergency Recovery Schedule:\n- Day 1: Target critical blocker tasks in morning focus blocks.\n- Day 2: Consolidate progress and resolve outstanding tasks.",
                    "recovery_tasks": [
                        {
                            "title": f"Focus: {goal_obj.title} core tasks",
                            "description": "High priority diagnostic session.",
                            "start_time": (datetime.combine(today, datetime.min.time()) + timedelta(hours=9)).isoformat(),
                            "end_time": (datetime.combine(today, datetime.min.time()) + timedelta(hours=11)).isoformat()
                        }
                    ]
                }
                
            # Reminders
            if conflicts:
                reminders.append(f"Shift '{conflicts[0]['task_title']}' to resolve conflict with '{conflicts[0]['event_title']}'.")
            if suggestions:
                reminders.append(f"You have {len(suggestions)} tasks scheduled in focus windows today and tomorrow.")
            else:
                reminders.append("Review your upcoming milestones to ensure alignment with active calendar events.")
                
            # If there are synced calendar events, add a reminder about the next one
            future_events = [(ev_start, title) for ev_start, ev_end, title in local_events if ev_start > datetime.now()]
            if future_events:
                future_events.sort(key=lambda x: x[0])
                next_ev_time, next_ev_title = future_events[0]
                days_diff = (next_ev_time.date() - today).days
                if days_diff == 0:
                    reminders.append(f"Upcoming today: '{next_ev_title}' at {next_ev_time.strftime('%I:%M %p')}.")
                elif days_diff == 1:
                    reminders.append(f"Upcoming tomorrow: '{next_ev_title}' at {next_ev_time.strftime('%I:%M %p')}.")
                else:
                    reminders.append(f"Upcoming in {days_diff} days: '{next_ev_title}' on {next_ev_time.strftime('%b %d')}.")
                    
            if not reminders:
                reminders.append("Welcome to Momentum AI Scheduling. Connect your calendar to scan for conflicts and sync deadlines.")
                
            parsed = {
                "availability": availability,
                "conflicts": conflicts,
                "suggestions": suggestions,
                "missedSessions": missed_sessions,
                "recoveryPlan": recovery_plan,
                "reminders": reminders
            }
        
        # Ensure default keys
        if "availability" not in parsed: parsed["availability"] = []
        if "conflicts" not in parsed: parsed["conflicts"] = []
        if "suggestions" not in parsed: parsed["suggestions"] = []
        if "missedSessions" not in parsed: parsed["missedSessions"] = []
        if "recoveryPlan" not in parsed: parsed["recoveryPlan"] = None
        if "reminders" not in parsed: parsed["reminders"] = []

        return success_response(data=parsed, message="Schedule analysis completed successfully.")
    except Exception as e:
        logger.error(f"Error in scheduling analysis: {str(e)}", exc_info=True)
        return error_response(code="SCHEDULING_ANALYSIS_FAILED", message=str(e), status_code=500)


@router.post("/scheduling/voice")
async def voice_assistant(
    payload: VoiceAssistantPayload,
    current_user: User = Depends(get_current_user)
):
    """Voice Scheduling Assistant parser using Gemini."""
    try:
        prompt = f"""
You are an advanced Gemini Voice Scheduling Assistant. Your job is to parse the user's spoken or typed scheduling instructions and generate structured database entities to fulfill them.

User Input: "{payload.prompt}"

Generate a valid JSON object matching the user's command. The JSON must contain these exact keys:
1. "goal": An object to create a new goal, or null if they didn't specify a goal:
   - "title": string (Title Case)
   - "category": string (e.g. "Career", "Health", "Education", "Personal")
   - "target_date": string (ISO date string offset appropriately, e.g. if they say "next week" set it to 7 days from now)
   - "hours_per_day": string (e.g. "1 hour", "2 hours")
   - "experience_level": string ("Beginner", "Intermediate", or "Advanced")
2. "tasks": A list of task objects to create under the new goal:
   - "title": string (Title Case)
   - "description": string
   - "priority": "high", "medium", or "low"
   - "days_offset": integer (due date offset in days from today, e.g. 1, 2, 3)
3. "milestones": A list of weekly milestones:
   - "week_number": integer
   - "title": string
   - "description": string
4. "events": A list of calendar events to schedule for these tasks:
   - "title": string
   - "description": string
   - "hours_offset": integer (number of hours from now when this event starts)
   - "duration_hours": number (e.g. 1, 1.5)
5. "coachingMessage": A supportive briefing explaining what the assistant has created and scheduled for them.

Return ONLY the raw JSON string. Do not include markdown formatting or backticks.
"""
        provider = LLMProviderFactory.get_provider()
        try:
            res_llm = await provider.generate(
                messages=[{"role": "user", "content": prompt}],
                model="gemini-2.0-flash",
                temperature=0.3
            )
            text_resp = res_llm.get("text", "").strip()
            parsed = _parse_json_response(text_resp)
        except Exception as ai_err:
            logger.warning(f"Gemini voice assistant failed: {str(ai_err)}. Falling back to local voice parser mockup.", exc_info=True)
            from datetime import timedelta
            prompt_lower = payload.prompt.lower()
            
            goal_title = "Tech Interview Preparation"
            category = "Career"
            if "sql" in prompt_lower or "db" in prompt_lower:
                goal_title = "Master SQL & Databases"
                category = "Education"
            elif "health" in prompt_lower or "workout" in prompt_lower or "run" in prompt_lower:
                goal_title = "Daily Health & Fitness Tracker"
                category = "Health"
                
            parsed = {
                "goal": {
                    "title": goal_title,
                    "category": category,
                    "target_date": (date.today() + timedelta(days=7)).isoformat(),
                    "hours_per_day": "1.5 hours",
                    "experience_level": "Intermediate"
                },
                "tasks": [
                    {
                        "title": f"Initial Study Block: {goal_title}",
                        "description": "Establish base terms, compile reference lists, and set up daily checkpoints.",
                        "priority": "high",
                        "days_offset": 1
                    },
                    {
                        "title": "Practice Drills & Active Review",
                        "description": "Engage in recall drills to solidify speed and active retrieval.",
                        "priority": "medium",
                        "days_offset": 2
                    }
                ],
                "milestones": [
                    {
                        "week_number": 1,
                        "title": "Foundational Setup",
                        "description": "Complete setup files, review all tasks, and achieve first focus score boost."
                    }
                ],
                "events": [
                    {
                        "title": f"Deep Work: {goal_title}",
                        "description": "Dedicated schedule block for focused execution.",
                        "hours_offset": 2,
                        "duration_hours": 1.5
                    }
                ],
                "coachingMessage": f"I've set up a new plan for '{goal_title}' for you! I scheduled matching deep work slots and mapped priority tasks to keep you on track."
            }

        return success_response(data=parsed, message="Voice command parsed successfully.")
    except Exception as e:
        logger.error(f"Error in voice assistant: {str(e)}", exc_info=True)
        return error_response(code="VOICE_ASSISTANT_FAILED", message=str(e), status_code=500)


# ─────────────────────────────────────────────
# NEW: Sprint 7 - Agentic Productivity Engine Endpoints
# ─────────────────────────────────────────────

from fastapi import Form, BackgroundTasks, UploadFile, File
from datetime import timedelta
from app.services.agent_context_service import AgentContextService
from app.services.agent_monitoring_service import AgentMonitoringService
from app.services.notification_service import NotificationService
from app.services.personal_mentor_service import PersonalMentorService
from app.services.rag_service import RAGService
from app.modules.documents.api import process_document_background
from app.modules.documents.api import get_document_service

class QueryKnowledgePayload(BaseModel):
    query: str

# 1. Agent Overview
@router.get("/agent/overview")
async def get_agent_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve summarized Agent statistics and status indicators."""
    try:
        context_service = AgentContextService(db)
        context = await context_service.get_user_context(str(current_user.id))
        
        tasks = context.get("tasks", [])
        completed = len([t for t in tasks if t["status"] == "completed"])
        total = len(tasks)
        task_ratio = completed / total if total > 0 else 0.8
        
        focus_score = context.get("focus_score", 75)
        # Compute dynamic Agent Confidence Score
        confidence = round(0.4 * (focus_score) + 0.6 * (task_ratio * 100))
        confidence = min(98, max(50, confidence))
        
        return success_response(data={
            "focus_score": focus_score,
            "confidence_score": confidence,
            "goals_monitored": len(context.get("goals", [])),
            "tasks_monitored": total,
            "calendar_connected": context.get("calendar_connection") is not None,
            "active_signals_count": len([s for s in context.get("recent_notifications", []) if s["status"] == "unread"]),
            "timestamp": datetime.now().isoformat()
        }, message="Agent overview compiled successfully.")
    except Exception as e:
        logger.error(f"Error in /agent/overview: {str(e)}", exc_info=True)
        return error_response(code="OVERVIEW_FAILED", message=str(e), status_code=500)

# 2. Get Live Signals
@router.get("/agent/signals")
async def get_agent_signals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve active and historical Agent Signals."""
    try:
        stmt = text("""
            SELECT id, signal_type, severity, title, description, status, metadata, created_at 
            FROM agent_signals 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC 
            LIMIT 50
        """)
        res = await db.execute(stmt, {"user_id": current_user.id})
        signals = [
            {
                "id": str(r[0]),
                "signal_type": r[1],
                "severity": r[2],
                "title": r[3],
                "description": r[4],
                "status": r[5],
                "metadata": r[6] if isinstance(r[6], dict) else json.loads(r[6]) if r[6] else {},
                "created_at": r[7].isoformat()
            }
            for r in res.fetchall()
        ]
        return success_response(data=signals, message="Signals retrieved successfully.")
    except Exception as e:
        logger.error(f"Error in /agent/signals: {str(e)}", exc_info=True)
        return error_response(code="SIGNALS_FETCH_FAILED", message=str(e), status_code=500)

# 3. Trigger Manual Monitor Run
@router.post("/agent/signals/evaluate")
async def evaluate_signals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Run real-time monitoring and trigger context actions on behalf of the user."""
    try:
        monitoring_service = AgentMonitoringService(db)
        res = await monitoring_service.evaluate_user_productivity(str(current_user.id), current_user.email)
        return success_response(data=res, message="Productivity monitoring evaluation executed.")
    except Exception as e:
        logger.error(f"Error evaluating signals: {str(e)}", exc_info=True)
        return error_response(code="EVALUATE_FAILED", message=str(e), status_code=500)

# 4. Get Agent Notifications
@router.get("/agent/notifications")
async def get_agent_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve user-scoped multi-channel alerts."""
    try:
        stmt = text("""
            SELECT id, category, title, body, channels, status, sent_at, email_sent_at 
            FROM agent_notifications 
            WHERE user_id = :user_id 
            ORDER BY sent_at DESC 
            LIMIT 100
        """)
        res = await db.execute(stmt, {"user_id": current_user.id})
        notifs = [
            {
                "id": str(r[0]),
                "category": r[1],
                "title": r[2],
                "body": r[3],
                "channels": r[4] if isinstance(r[4], list) else json.loads(r[4]) if r[4] else ["in_app"],
                "status": r[5],
                "sent_at": r[6].isoformat() if r[6] else None,
                "email_sent_at": r[7].isoformat() if r[7] else None
            }
            for r in res.fetchall()
        ]
        return success_response(data=notifs, message="Notifications retrieved successfully.")
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}", exc_info=True)
        return error_response(code="NOTIFICATIONS_FETCH_FAILED", message=str(e), status_code=500)

# 5. Mark Notifications Read
@router.post("/agent/notifications/mark-read")
async def mark_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Mark unread notifications as read."""
    try:
        stmt = text("UPDATE agent_notifications SET status = 'read', updated_at = NOW() WHERE user_id = :user_id AND status = 'unread'")
        await db.execute(stmt, {"user_id": current_user.id})
        await db.commit()
        return success_response(data=None, message="All notifications marked as read.")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error marking notifications read: {str(e)}", exc_info=True)
        return error_response(code="MARK_READ_FAILED", message=str(e), status_code=500)

# 6. Get Mentor Messages
@router.get("/agent/mentor/messages")
async def get_mentor_messages(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve historical mentoring suggestions and coaching logs."""
    try:
        stmt = text("""
            SELECT id, message, category, created_at 
            FROM mentor_messages 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC 
            LIMIT 50
        """)
        res = await db.execute(stmt, {"user_id": current_user.id})
        messages = [
            {
                "id": str(r[0]),
                "message": r[1],
                "category": r[2],
                "created_at": r[3].isoformat()
            }
            for r in res.fetchall()
        ]
        return success_response(data=messages, message="Mentor messages retrieved.")
    except Exception as e:
        logger.error(f"Error in /agent/mentor/messages: {str(e)}", exc_info=True)
        return error_response(code="MENTOR_MESSAGES_FAILED", message=str(e), status_code=500)

# 7. Request Mentor Coaching
@router.post("/agent/mentor/coaching")
async def request_mentor_coaching(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Trigger real-time mentoring session generation."""
    try:
        mentor_service = PersonalMentorService(db)
        res = await mentor_service.get_or_generate_mentor_coaching(str(current_user.id))
        return success_response(data=res, message="Mentor coaching generated.")
    except Exception as e:
        logger.error(f"Error in /agent/mentor/coaching: {str(e)}", exc_info=True)
        return error_response(code="COACHING_GENERATION_FAILED", message=str(e), status_code=500)

# 8. Get Daily Briefing
@router.get("/agent/briefing")
async def get_daily_briefing(
    briefing_type: str = "morning",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve the morning or evening AI briefings."""
    try:
        mentor_service = PersonalMentorService(db)
        res = await mentor_service.get_or_generate_daily_briefing(str(current_user.id), briefing_type)
        return success_response(data=res, message=f"{briefing_type.capitalize()} briefing retrieved.")
    except Exception as e:
        logger.error(f"Error in /agent/briefing: {str(e)}", exc_info=True)
        return error_response(code="BRIEFING_FAILED", message=str(e), status_code=500)

# 9. Force Regenerate Daily Briefing
@router.post("/agent/briefing/generate")
async def generate_daily_briefing(
    briefing_type: str = "morning",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Force generate a new briefing card."""
    try:
        today = date.today()
        stmt_del = text("DELETE FROM daily_briefings WHERE user_id = :user_id AND briefing_date = :today AND briefing_type = :b_type")
        await db.execute(stmt_del, {"user_id": current_user.id, "today": today, "b_type": briefing_type})
        await db.commit()
        
        mentor_service = PersonalMentorService(db)
        res = await mentor_service.get_or_generate_daily_briefing(str(current_user.id), briefing_type)
        return success_response(data=res, message=f"{briefing_type.capitalize()} briefing regenerated.")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in /agent/briefing/generate: {str(e)}", exc_info=True)
        return error_response(code="BRIEFING_REGEN_FAILED", message=str(e), status_code=500)

# 10. Get Weekly Productivity Reviews
@router.get("/agent/reviews")
async def get_weekly_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve weekly reports."""
    try:
        stmt = text("""
            SELECT id, week_start_date, week_end_date, focus_score, goal_progress, task_completion_rate, risk_trends, recovery_success_rate, calendar_utilization, deep_work_hours, report_text, created_at 
            FROM weekly_reports 
            WHERE user_id = :user_id 
            ORDER BY week_start_date DESC 
            LIMIT 10
        """)
        res = await db.execute(stmt, {"user_id": current_user.id})
        reviews = [
            {
                "id": str(r[0]),
                "week_start_date": r[1].isoformat() if isinstance(r[1], (date, datetime)) else r[1],
                "week_end_date": r[2].isoformat() if isinstance(r[2], (date, datetime)) else r[2],
                "focus_score": r[3],
                "goal_progress": r[4] if isinstance(r[4], list) else json.loads(r[4]) if r[4] else [],
                "task_completion_rate": r[5],
                "risk_trends": r[6] if isinstance(r[6], list) else json.loads(r[6]) if r[6] else [],
                "recovery_success_rate": r[7],
                "calendar_utilization": r[8],
                "deep_work_hours": float(r[9]),
                "report_text": r[10],
                "created_at": r[11].isoformat()
            }
            for r in res.fetchall()
        ]
        return success_response(data=reviews, message="Weekly reports retrieved.")
    except Exception as e:
        logger.error(f"Error in /agent/reviews: {str(e)}", exc_info=True)
        return error_response(code="REVIEWS_FAILED", message=str(e), status_code=500)

# 11. Force Regenerate Weekly Review
@router.post("/agent/reviews/generate")
async def generate_weekly_review(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Force generate a new weekly review report."""
    try:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        stmt_del = text("DELETE FROM weekly_reports WHERE user_id = :user_id AND week_start_date = :w_start")
        await db.execute(stmt_del, {"user_id": current_user.id, "w_start": week_start})
        await db.commit()
        
        mentor_service = PersonalMentorService(db)
        res = await mentor_service.get_or_generate_weekly_review(str(current_user.id))
        return success_response(data=res, message="Weekly review regenerated.")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error regenerating weekly review: {str(e)}", exc_info=True)
        return error_response(code="REVIEW_REGEN_FAILED", message=str(e), status_code=500)

# 12. Get Agent Activity Feed Timeline
@router.get("/agent/activity")
async def get_agent_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve chronologically ordered activities executed by the AI Agent."""
    try:
        stmt = text("""
            SELECT id, activity_type, description, metadata, timestamp 
            FROM agent_activity_logs 
            WHERE user_id = :user_id 
            ORDER BY timestamp DESC 
            LIMIT 100
        """)
        res = await db.execute(stmt, {"user_id": current_user.id})
        feed = [
            {
                "id": str(r[0]),
                "activity_type": r[1],
                "description": r[2],
                "metadata": r[3] if isinstance(r[3], dict) else json.loads(r[3]) if r[3] else {},
                "timestamp": r[4].isoformat()
            }
            for r in res.fetchall()
        ]
        return success_response(data=feed, message="Activity feed retrieved successfully.")
    except Exception as e:
        logger.error(f"Error in /agent/activity: {str(e)}", exc_info=True)
        return error_response(code="ACTIVITY_FAILED", message=str(e), status_code=500)

# 13. List Knowledge Sources (Personal Knowledge Vault)
@router.get("/agent/knowledge")
async def get_knowledge_sources(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """List metadata for files uploaded to the Personal Knowledge Vault."""
    try:
        stmt = text("""
            SELECT ks.id, ks.title, ks.source_type, ks.created_at, d.id, d.processing_status, d.is_processed 
            FROM knowledge_sources ks
            JOIN documents d ON ks.document_id = d.id
            WHERE ks.user_id = :user_id AND d.is_deleted = false
            ORDER BY ks.created_at DESC
        """)
        res = await db.execute(stmt, {"user_id": current_user.id})
        sources = [
            {
                "id": str(r[0]),
                "title": r[1],
                "source_type": r[2],
                "created_at": r[3].isoformat(),
                "document_id": str(r[4]),
                "processing_status": r[5],
                "is_processed": r[6]
            }
            for r in res.fetchall()
        ]
        return success_response(data=sources, message="Knowledge sources retrieved.")
    except Exception as e:
        logger.error(f"Error listing knowledge: {str(e)}", exc_info=True)
        return error_response(code="KNOWLEDGE_FETCH_FAILED", message=str(e), status_code=500)

# 14. Upload Knowledge Source Document
@router.post("/agent/knowledge/upload", status_code=status.HTTP_201_CREATED)
async def upload_knowledge_source(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    source_type: str = Form("other"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Upload resume, job description, or study materials to RAG Knowledge Vault."""
    try:
        service = get_document_service(db)
        content = await file.read()
        doc = await service.upload_document(
            user_id=current_user.id,
            file_name=file.filename or "unnamed_source",
            file_content=content,
            mime_type=file.content_type or "application/octet-stream"
        )
        
        await service.db.commit()
        await service.db.refresh(doc)

        # Trigger background RAG indexing
        background_tasks.add_task(process_document_background, doc.id, current_user.id)

        # Insert to knowledge_sources
        stmt_link = text("""
            INSERT INTO knowledge_sources (user_id, document_id, title, source_type)
            VALUES (:user_id, :doc_id, :title, :source_type)
            RETURNING id
        """)
        res_link = await db.execute(stmt_link, {
            "user_id": current_user.id,
            "doc_id": doc.id,
            "title": file.filename or "unnamed_source",
            "source_type": source_type
        })
        row_link = res_link.fetchone()
        await db.commit()

        # Log activity
        stmt_act = text("""
            INSERT INTO agent_activity_logs (user_id, activity_type, description, metadata)
            VALUES (:user_id, 'knowledge_uploaded', :desc, :meta)
        """)
        await db.execute(stmt_act, {
            "user_id": current_user.id,
            "desc": f"Uploaded knowledge source: '{file.filename}'",
            "meta": json.dumps({"source_type": source_type, "document_id": str(doc.id)})
        })
        await db.commit()

        return success_response(
            data={
                "id": str(row_link[0]) if row_link else None,
                "document_id": str(doc.id),
                "title": doc.original_file_name,
                "source_type": source_type
            },
            message="Knowledge document uploaded and processing started.",
            status_code=status.HTTP_201_CREATED
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Error uploading knowledge: {str(e)}", exc_info=True)
        return error_response(code="UPLOAD_KNOWLEDGE_FAILED", message=str(e), status_code=500)

# 15. Query Knowledge (RAG Chat Search)
@router.post("/agent/knowledge/query")
async def query_knowledge(
    payload: QueryKnowledgePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieve top RAG chunks and synthesize a context-aware answer from your Vault."""
    try:
        stmt = text("SELECT document_id FROM knowledge_sources WHERE user_id = :user_id")
        res = await db.execute(stmt, {"user_id": current_user.id})
        doc_ids = [r[0] for r in res.fetchall()]
        
        if not doc_ids:
            return success_response(data={
                "answer": "You haven't uploaded any documents to your Knowledge Vault yet. Upload documents to get context-aware answers.",
                "chunks": []
            }, message="Query completed.")

        rag_service = RAGService(db)
        chunks = await rag_service.get_similar_chunks(
            user_id=current_user.id,
            query=payload.query,
            document_ids=doc_ids,
            k=5
        )

        if not chunks:
            return success_response(data={
                "answer": "No relevant matches were found in your Knowledge Vault documents.",
                "chunks": []
            }, message="Query completed.")

        context_text = "\n\n".join([
            f"Source Document: {c['file_name']}\nContent Chunk:\n{c['content']}"
            for c in chunks
        ])

        prompt = f"""
You are the user's Personal AI Mentor. Answer the user's question using ONLY the provided document context from their Personal Knowledge Vault.
If the information is not present in the context, synthesize the best possible productivity/career advice based on the context, or politely explain that the vault documents do not contain the direct answer.

User Question: "{payload.query}"

Document Context:
{context_text}

Provide a concise, helpful, and professional mentoring answer (maximum 4-5 sentences). Quote the source documents if applicable.
"""
        provider = LLMProviderFactory.get_provider()
        res_llm = await provider.generate(
            messages=[{"role": "user", "content": prompt}],
            model="gemini-2.0-flash",
            temperature=0.3
        )
        answer = res_llm.get("text", "").strip()

        return success_response(data={
            "answer": answer,
            "chunks": [
                {
                    "file_name": c["file_name"],
                    "content": c["content"],
                    "score": c["score"]
                }
                for c in chunks
            ]
        }, message="Query completed successfully.")
    except Exception as e:
        logger.error(f"Error querying knowledge: {str(e)}", exc_info=True)
        return error_response(code="QUERY_KNOWLEDGE_FAILED", message=str(e), status_code=500)

# 16. Deadline Reminder Endpoint – Send email/in-app reminders for tasks due soon
@router.post("/agent/deadline-reminders")
async def send_deadline_reminders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Scan tasks due within the next 60 minutes and send follow-up reminder notifications."""
    try:
        from app.services.notification_service import NotificationService

        now = datetime.now(timezone.utc)
        today = date.today()
        tomorrow = today + timedelta(days=1)
        tomorrow_dt = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 23, 59, 59, tzinfo=timezone.utc)

        # Fetch all pending/in_progress tasks due today or earlier (avoids SQL cast issues)
        stmt = text("""
            SELECT id, title, due_date::text, priority, goal_id
            FROM lifesaver_tasks
            WHERE user_id = CAST(:user_id AS uuid)
              AND status NOT IN ('completed', 'cancelled')
              AND due_date IS NOT NULL
              AND due_date <= :tomorrow
            ORDER BY due_date ASC
            LIMIT 10
        """)
        res = await db.execute(stmt, {
            "user_id": str(current_user.id),
            "tomorrow": tomorrow_dt
        })
        rows = res.fetchall()

        if not rows:
            return success_response(
                data={"reminders_sent": 0, "message": "No tasks due within the next hour. You're on track! ✅"},
                message="Deadline check complete."
            )

        notif_service = NotificationService(db)
        reminders_sent = 0

        for row in rows:
            task_id, title, due_date, priority, goal_id = row

            # Parse due date for human-friendly string
            try:
                due_dt = datetime.fromisoformat(str(due_date).replace("Z", "+00:00"))
                due_str = due_dt.strftime("%b %d at %I:%M %p")
                is_overdue = due_dt < now
            except Exception:
                due_str = str(due_date)
                is_overdue = False

            if is_overdue:
                subject = f"⚠️ Overdue Task: {title}"
                body = (
                    f"Your task '{title}' was due on {due_str} and hasn't been completed yet.\n\n"
                    f"Priority: {priority.upper()}\n\n"
                    f"Momentum AI recommends scheduling a focus block now to complete this task and prevent further goal delay."
                )
                category = "critical_deadline"
            else:
                subject = f"⏰ Upcoming Deadline: {title}"
                body = (
                    f"Reminder: Your task '{title}' is due {due_str}.\n\n"
                    f"Priority: {priority.upper()}\n\n"
                    f"Make sure you're on track. Head to Momentum AI to mark it complete or reschedule."
                )
                category = "deadline_approaching"

            # Check if a reminder was already sent in the last 30 minutes for this task
            recent_check = text("""
                SELECT id FROM agent_notifications
                WHERE user_id = CAST(:user_id AS uuid)
                  AND title LIKE :title_pattern
                  AND sent_at > NOW() - INTERVAL '30 minutes'
                LIMIT 1
            """)
            recent_res = await db.execute(recent_check, {
                "user_id": str(current_user.id),
                "title_pattern": f"%{title[:40]}%"
            })
            if recent_res.fetchone():
                continue  # Already sent a reminder recently, skip

            channels = ["in_app"]
            email_to = None
            if current_user.email:
                channels.append("email")
                email_to = current_user.email

            await notif_service.create_notification(
                user_id=str(current_user.id),
                category=category,
                title=subject,
                body=body,
                channels=channels,
                email_to=email_to
            )
            reminders_sent += 1

        if reminders_sent == 0:
            msg = "All reminders for recent tasks were already sent."
        else:
            email_note = f" Email sent to {current_user.email}." if current_user.email else ""
            msg = f"Sent {reminders_sent} reminder(s) for upcoming/overdue tasks.{email_note}"

        return success_response(
            data={"reminders_sent": reminders_sent, "message": msg},
            message="Deadline reminders dispatched."
        )
    except Exception as e:
        logger.error(f"Error sending deadline reminders: {str(e)}", exc_info=True)
        return error_response(code="DEADLINE_REMINDER_FAILED", message=str(e), status_code=500)


# ─────────────────────────────────────────────
# NEW: Email Intelligence & Opportunity Engine
# ─────────────────────────────────────────────

from app.services.email_sync_service import EmailSyncService
from app.services.reply_draft_service import ReplyDraftService

class TriageRulePayload(BaseModel):
    rule_name: str
    category_filter: str
    action: str
    is_active: Optional[bool] = True

class DraftActionPayload(BaseModel):
    draft_id: str
    action: str  # approve_send, save, reject
    edited_body: Optional[str] = None

class CreateDraftPayload(BaseModel):
    thread_uuid: str

@router.post("/email/sync")
async def sync_emails(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Triggers synchronizing and triaging user emails."""
    try:
        sync_service = EmailSyncService()
        result = await sync_service.sync_emails(db, str(current_user.id))
        if result and result.get("success"):
            return success_response(data=result, message="Emails synchronized and triaged successfully.")
        else:
            return error_response(code="SYNC_FAILED", message="Failed to sync emails.", status_code=500)
    except Exception as e:
        logger.error(f"Error syncing emails: {str(e)}", exc_info=True)
        return error_response(code="EMAIL_SYNC_ERROR", message=str(e), status_code=500)

@router.get("/email/overview")
async def get_email_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieves Inbox Health Score, activity timeline, and triage stats."""
    try:
        # Get metrics
        unread_important_stmt = text("""
            SELECT COUNT(*) FROM email_threads 
            WHERE user_id = CAST(:user_id AS uuid) AND is_read = false AND priority_score >= 80
        """)
        res = await db.execute(unread_important_stmt, {"user_id": str(current_user.id)})
        unread_important_count = res.scalar() or 0

        pending_opps_stmt = text("""
            SELECT COUNT(*) FROM email_opportunities 
            WHERE user_id = CAST(:user_id AS uuid) AND status = 'detected'
        """)
        res = await db.execute(pending_opps_stmt, {"user_id": str(current_user.id)})
        pending_opportunities = res.scalar() or 0

        pending_drafts_stmt = text("""
            SELECT COUNT(*) FROM email_drafts 
            WHERE user_id = CAST(:user_id AS uuid) AND status = 'pending'
        """)
        res = await db.execute(pending_drafts_stmt, {"user_id": str(current_user.id)})
        pending_drafts = res.scalar() or 0

        missed_dl_stmt = text("""
            SELECT COUNT(*) FROM email_deadlines 
            WHERE user_id = CAST(:user_id AS uuid) AND deadline_date < NOW() AND status = 'pending'
        """)
        res = await db.execute(missed_dl_stmt, {"user_id": str(current_user.id)})
        missed_deadlines = res.scalar() or 0

        action_queue_stmt = text("""
            SELECT COUNT(*) FROM email_threads 
            WHERE user_id = CAST(:user_id AS uuid) AND priority_score >= 50
        """)
        res = await db.execute(action_queue_stmt, {"user_id": str(current_user.id)})
        action_queue_count = res.scalar() or 0

        cleansed_stmt = text("""
            SELECT COUNT(*) FROM email_activity_logs 
            WHERE user_id = CAST(:user_id AS uuid) AND (description LIKE '%deleted%' OR description LIKE '%archived%')
        """)
        res = await db.execute(cleansed_stmt, {"user_id": str(current_user.id)})
        cleansed_count = res.scalar() or 0

        # Category distributions
        cat_stmt = text("""
            SELECT category, COUNT(*) FROM email_threads 
            WHERE user_id = CAST(:user_id AS uuid)
            GROUP BY category
        """)
        res = await db.execute(cat_stmt, {"user_id": str(current_user.id)})
        category_counts = {row[0]: row[1] for row in res.fetchall()}

        # Health score calculations
        score = 100 - (unread_important_count * 5) - (pending_opportunities * 10) - (pending_drafts * 8) - (missed_deadlines * 15) - (action_queue_count * 2)
        health_score = max(0, min(100, score))

        # Recent activities
        logs_stmt = text("""
            SELECT id, action_type, description, created_at 
            FROM email_activity_logs 
            WHERE user_id = CAST(:user_id AS uuid) 
            ORDER BY created_at DESC LIMIT 8
        """)
        res = await db.execute(logs_stmt, {"user_id": str(current_user.id)})
        activities = []
        for r in res.fetchall():
            activities.append({
                "id": str(r[0]),
                "action_type": r[1],
                "description": r[2],
                "created_at": r[3].isoformat() if r[3] else None
            })

        return success_response(
            data={
                "health_score": health_score,
                "unread_important": unread_important_count,
                "pending_opportunities": pending_opportunities,
                "pending_drafts": pending_drafts,
                "missed_deadlines": missed_deadlines,
                "action_queue_count": action_queue_count,
                "cleansed_count": cleansed_count,
                "category_distribution": category_counts,
                "activities": activities
            },
            message="Email intelligence overview retrieved successfully."
        )
    except Exception as e:
        logger.error(f"Error fetching overview: {str(e)}", exc_info=True)
        return error_response(code="EMAIL_OVERVIEW_ERROR", message=str(e), status_code=500)

@router.get("/email/threads")
async def get_email_threads(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieves list of all email threads, with optional category filtering."""
    try:
        if category:
            stmt = text("""
                SELECT id, thread_id, subject, sender, snippet, body, category, priority_score, urgency_reason, is_read, last_message_date 
                FROM email_threads 
                WHERE user_id = CAST(:user_id AS uuid) AND category = :category
                ORDER BY last_message_date DESC
            """)
            res = await db.execute(stmt, {"user_id": str(current_user.id), "category": category})
        else:
            stmt = text("""
                SELECT id, thread_id, subject, sender, snippet, body, category, priority_score, urgency_reason, is_read, last_message_date 
                FROM email_threads 
                WHERE user_id = CAST(:user_id AS uuid)
                ORDER BY last_message_date DESC
            """)
            res = await db.execute(stmt, {"user_id": str(current_user.id)})

        threads = []
        for r in res.fetchall():
            threads.append({
                "id": str(r[0]),
                "thread_id": r[1],
                "subject": r[2],
                "sender": r[3],
                "snippet": r[4],
                "body": r[5],
                "category": r[6],
                "priority_score": r[7],
                "urgency_reason": r[8],
                "is_read": r[9],
                "last_message_date": r[10].isoformat() if r[10] else None
            })

        return success_response(data=threads, message="Email threads retrieved.")
    except Exception as e:
        logger.error(f"Error fetching threads: {str(e)}", exc_info=True)
        return error_response(code="EMAIL_THREADS_ERROR", message=str(e), status_code=500)

@router.get("/email/action-queue")
async def get_action_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieves prioritized emails with extracted opportunities and deadlines."""
    try:
        # Get high-priority threads (score >= 50)
        stmt = text("""
            SELECT t.id, t.thread_id, t.subject, t.sender, t.snippet, t.body, t.category, t.priority_score, t.urgency_reason, t.last_message_date,
                   o.id, o.opportunity_type, o.suggested_action, o.goal_id,
                   d.id, d.title, d.deadline_date, d.task_id
            FROM email_threads t
            LEFT JOIN email_opportunities o ON t.id = o.email_thread_id
            LEFT JOIN email_deadlines d ON t.id = d.email_thread_id
            WHERE t.user_id = CAST(:user_id AS uuid) AND t.priority_score >= 50
            ORDER BY t.priority_score DESC
        """)
        res = await db.execute(stmt, {"user_id": str(current_user.id)})

        queue = []
        for r in res.fetchall():
            queue.append({
                "id": str(r[0]),
                "thread_id": r[1],
                "subject": r[2],
                "sender": r[3],
                "snippet": r[4],
                "body": r[5],
                "category": r[6],
                "priority_score": r[7],
                "urgency_reason": r[8],
                "last_message_date": r[9].isoformat() if r[9] else None,
                "opportunity": {
                    "id": str(r[10]) if r[10] else None,
                    "opportunity_type": r[11],
                    "suggested_action": r[12],
                    "goal_id": str(r[13]) if r[13] else None
                } if r[10] else None,
                "deadline": {
                    "id": str(r[14]) if r[14] else None,
                    "title": r[15],
                    "deadline_date": r[16].isoformat() if r[16] else None,
                    "task_id": str(r[17]) if r[17] else None
                } if r[14] else None
            })

        return success_response(data=queue, message="Action queue retrieved.")
    except Exception as e:
        logger.error(f"Error fetching action queue: {str(e)}", exc_info=True)
        return error_response(code="ACTION_QUEUE_ERROR", message=str(e), status_code=500)

@router.get("/email/drafts")
async def get_drafts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieves all generated email drafts for the user."""
    try:
        stmt = text("""
            SELECT id, email_thread_id, subject, recipient, draft_body, status, created_at 
            FROM email_drafts 
            WHERE user_id = CAST(:user_id AS uuid) AND status = 'pending'
            ORDER BY created_at DESC
        """)
        res = await db.execute(stmt, {"user_id": str(current_user.id)})
        drafts = []
        for r in res.fetchall():
            drafts.append({
                "id": str(r[0]),
                "email_thread_id": str(r[1]),
                "subject": r[2],
                "recipient": r[3],
                "draft_body": r[4],
                "status": r[5],
                "created_at": r[6].isoformat() if r[6] else None
            })
        return success_response(data=drafts, message="Email drafts retrieved.")
    except Exception as e:
        logger.error(f"Error fetching drafts: {str(e)}", exc_info=True)
        return error_response(code="DRAFTS_FETCH_ERROR", message=str(e), status_code=500)

@router.post("/email/drafts/create")
async def manual_create_draft(
    payload: CreateDraftPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Manually triggers Gemini to generate an AI reply draft for a thread."""
    try:
        # Retrieve thread details
        stmt = text("""
            SELECT subject, sender, body, category 
            FROM email_threads 
            WHERE id = CAST(:thread_uuid AS uuid) AND user_id = CAST(:user_id AS uuid)
        """)
        res = await db.execute(stmt, {"thread_uuid": payload.thread_uuid, "user_id": str(current_user.id)})
        row = res.fetchone()
        if not row:
            return error_response(code="THREAD_NOT_FOUND", message="Email thread not found.", status_code=404)

        subject, sender, body, category = row
        drafter = ReplyDraftService()
        draft = await drafter.create_reply_draft(
            db, str(current_user.id), payload.thread_uuid, subject, sender, body, category or "Other", force=True
        )
        if draft:
            return success_response(data=draft, message="AI draft generated successfully.")
        else:
            return error_response(code="DRAFT_GENERATION_FAILED", message="Could not generate a draft. The AI may have returned an invalid response.", status_code=400)
    except Exception as e:
        logger.error(f"Error generating manual draft: {str(e)}", exc_info=True)
        return error_response(code="MANUAL_DRAFT_ERROR", message=str(e), status_code=500)

@router.post("/email/drafts/action")
async def act_on_draft(
    payload: DraftActionPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Executes a draft action: Send, Save, or Reject."""
    try:
        # Check if draft exists
        stmt_check = text("""
            SELECT id, email_thread_id, subject, recipient, draft_body 
            FROM email_drafts 
            WHERE id = CAST(:draft_id AS uuid) AND user_id = CAST(:user_id AS uuid)
        """)
        res = await db.execute(stmt_check, {"draft_id": payload.draft_id, "user_id": str(current_user.id)})
        row = res.fetchone()
        if not row:
            return error_response(code="DRAFT_NOT_FOUND", message="Draft not found.", status_code=404)

        draft_id, thread_uuid, subject, recipient, draft_body = row
        new_body = payload.edited_body or draft_body

        if payload.action == "approve_send":
            # Update draft
            stmt_update = text("""
                UPDATE email_drafts 
                SET draft_body = :body, status = 'sent', updated_at = now() 
                WHERE id = CAST(:draft_id AS uuid)
            """)
            await db.execute(stmt_update, {"body": new_body, "draft_id": draft_id})

            # Check if there is a real Google access token to send a real email draft
            stmt_conn = text("SELECT access_token FROM calendar_connections WHERE user_id = CAST(:user_id AS uuid)")
            res_conn = await db.execute(stmt_conn, {"user_id": str(current_user.id)})
            row_conn = res_conn.fetchone()
            real_sent = False
            
            if row_conn and row_conn[0] and not row_conn[0].startswith("mock_"):
                import httpx
                send_url = "https://www.googleapis.com/gmail/v1/users/me/messages/send"
                headers = {
                    "Authorization": f"Bearer {row_conn[0]}",
                    "Content-Type": "application/json"
                }
                import email.mime.text
                import base64
                mime_msg = email.mime.text.MIMEText(new_body)
                mime_msg["to"] = recipient
                mime_msg["subject"] = subject
                raw_bytes = mime_msg.as_bytes()
                raw_b64 = base64.urlsafe_b64encode(raw_bytes).decode("utf-8")
                
                try:
                    async with httpx.AsyncClient() as client:
                        send_res = await client.post(send_url, headers=headers, json={"raw": raw_b64})
                        if send_res.status_code == 200:
                            real_sent = True
                except Exception as ex:
                    logger.error(f"Failed to deliver real email via Google API: {str(ex)}")

            # Log activity
            stmt_log = text("""
                INSERT INTO email_activity_logs (user_id, action_type, description, email_thread_id)
                VALUES (CAST(:user_id AS uuid), 'draft_sent', :desc, CAST(:thread_uuid AS uuid))
            """)
            delivery_mode = "delivered via Google Workspace" if real_sent else "simulated & sent successfully"
            await db.execute(stmt_log, {
                "user_id": str(current_user.id),
                "desc": f"Draft response to '{recipient}' was approved and {delivery_mode}.",
                "thread_uuid": thread_uuid
            })

        elif payload.action == "save":
            stmt_update = text("""
                UPDATE email_drafts 
                SET draft_body = :body, status = 'saved', updated_at = now() 
                WHERE id = CAST(:draft_id AS uuid)
            """)
            await db.execute(stmt_update, {"body": new_body, "draft_id": draft_id})

            stmt_log = text("""
                INSERT INTO email_activity_logs (user_id, action_type, description, email_thread_id)
                VALUES (CAST(:user_id AS uuid), 'draft_saved', :desc, CAST(:thread_uuid AS uuid))
            """)
            await db.execute(stmt_log, {
                "user_id": str(current_user.id),
                "desc": f"Draft response to '{recipient}' was updated and saved.",
                "thread_uuid": thread_uuid
            })

        elif payload.action == "reject":
            stmt_update = text("""
                UPDATE email_drafts 
                SET status = 'rejected', updated_at = now() 
                WHERE id = CAST(:draft_id AS uuid)
            """)
            await db.execute(stmt_update, {"draft_id": draft_id})

            stmt_log = text("""
                INSERT INTO email_activity_logs (user_id, action_type, description, email_thread_id)
                VALUES (CAST(:user_id AS uuid), 'draft_rejected', :desc, CAST(:thread_uuid AS uuid))
            """)
            await db.execute(stmt_log, {
                "user_id": str(current_user.id),
                "desc": f"Draft response to '{recipient}' was rejected.",
                "thread_uuid": thread_uuid
            })

        await db.commit()
        return success_response(data={"status": payload.action}, message=f"Draft action '{payload.action}' executed successfully.")
    except Exception as e:
        logger.error(f"Error handling draft action: {str(e)}", exc_info=True)
        return error_response(code="DRAFT_ACTION_ERROR", message=str(e), status_code=500)

@router.get("/email/rules")
async def get_triage_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Retrieves all triage rules configured by the user."""
    try:
        stmt = text("""
            SELECT id, rule_name, category_filter, action, is_active 
            FROM email_triage_rules 
            WHERE user_id = CAST(:user_id AS uuid)
            ORDER BY created_at DESC
        """)
        res = await db.execute(stmt, {"user_id": str(current_user.id)})
        rules = []
        for r in res.fetchall():
            rules.append({
                "id": str(r[0]),
                "rule_name": r[1],
                "category_filter": r[2],
                "action": r[3],
                "is_active": r[4]
            })
        return success_response(data=rules, message="Triage rules retrieved.")
    except Exception as e:
        logger.error(f"Error fetching rules: {str(e)}", exc_info=True)
        return error_response(code="RULES_FETCH_ERROR", message=str(e), status_code=500)

@router.post("/email/rules")
async def create_triage_rule(
    payload: TriageRulePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Creates a new autonomous triage rule."""
    try:
        stmt = text("""
            INSERT INTO email_triage_rules (user_id, rule_name, category_filter, action, is_active)
            VALUES (CAST(:user_id AS uuid), :name, :filter, :action, :is_active)
            RETURNING id, rule_name, category_filter, action, is_active
        """)
        res = await db.execute(stmt, {
            "user_id": str(current_user.id),
            "name": payload.rule_name,
            "filter": payload.category_filter,
            "action": payload.action,
            "is_active": payload.is_active
        })
        row = res.fetchone()
        await db.commit()
        
        if row:
            rule_data = {
                "id": str(row[0]),
                "rule_name": row[1],
                "category_filter": row[2],
                "action": row[3],
                "is_active": row[4]
            }
            return success_response(data=rule_data, message="Triage rule created successfully.")
        return error_response(code="RULE_CREATE_FAILED", message="Failed to create triage rule.", status_code=500)
    except Exception as e:
        logger.error(f"Error creating rule: {str(e)}", exc_info=True)
        return error_response(code="RULE_CREATE_ERROR", message=str(e), status_code=500)

@router.post("/email/rules/{rule_id}/toggle")
async def toggle_triage_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Toggles a triage rule's active state."""
    try:
        # Check rule
        stmt_check = text("SELECT is_active FROM email_triage_rules WHERE id = CAST(:id AS uuid) AND user_id = CAST(:user_id AS uuid)")
        res = await db.execute(stmt_check, {"id": rule_id, "user_id": str(current_user.id)})
        row = res.fetchone()
        if not row:
            return error_response(code="RULE_NOT_FOUND", message="Rule not found.", status_code=404)

        new_status = not row[0]
        stmt_update = text("UPDATE email_triage_rules SET is_active = :status, updated_at = now() WHERE id = CAST(:id AS uuid)")
        await db.execute(stmt_update, {"status": new_status, "id": rule_id})
        await db.commit()

        return success_response(data={"is_active": new_status}, message=f"Rule state set to {'active' if new_status else 'inactive'}.")
    except Exception as e:
        logger.error(f"Error toggling rule: {str(e)}", exc_info=True)
        return error_response(code="RULE_TOGGLE_ERROR", message=str(e), status_code=500)

@router.delete("/email/rules/{rule_id}")
async def delete_triage_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Deletes a triage rule."""
    try:
        stmt = text("DELETE FROM email_triage_rules WHERE id = CAST(:id AS uuid) AND user_id = CAST(:user_id AS uuid)")
        await db.execute(stmt, {"id": rule_id, "user_id": str(current_user.id)})
        await db.commit()
        return success_response(data={"deleted": True}, message="Triage rule deleted successfully.")
    except Exception as e:
        logger.error(f"Error deleting rule: {str(e)}", exc_info=True)
        return error_response(code="RULE_DELETE_ERROR", message=str(e), status_code=500)


