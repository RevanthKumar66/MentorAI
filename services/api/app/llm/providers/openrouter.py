import time
import json
import logging
import os
from typing import AsyncGenerator, List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.llm.providers.base import BaseLLMProvider
from app.llm.exceptions import LLMProviderException

logger = logging.getLogger("mentorai-os.llm.openrouter")

# ── Free model fallback chain ────────────────────────────────────────────────
# Tried in order when the primary hits a 429 rate limit.
# All verified free on OpenRouter (no credits required).
FREE_MODEL_FALLBACKS: List[str] = [
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
]

# ── Model name map ───────────────────────────────────────────────────────────
# Maps bare model names (Gemini-style used throughout services) to OpenRouter IDs.
# Default target is the first entry of FREE_MODEL_FALLBACKS.
_MODEL_MAP: Dict[str, str] = {
    "gemini-2.0-flash": FREE_MODEL_FALLBACKS[0],
    "gemini-2.5-flash": FREE_MODEL_FALLBACKS[0],
    "gemini-2.5-pro":   FREE_MODEL_FALLBACKS[0],
    "gemini-1.5-flash": FREE_MODEL_FALLBACKS[0],
    "gemini-1.5-pro":   FREE_MODEL_FALLBACKS[0],
    # Paid models — require OpenRouter credits
    "gpt-4o":           "openai/gpt-4o",
    "gpt-4o-mini":      "openai/gpt-4o-mini",
    "claude-3-5-sonnet":"anthropic/claude-3-5-sonnet",
    "claude-3-haiku":   "anthropic/claude-3-haiku",
}


class OpenRouterLLMProvider(BaseLLMProvider):
    """OpenRouter LLM Provider with automatic free-model fallback chain.

    When a free model returns 429 (rate limited), the provider automatically
    tries the next model in FREE_MODEL_FALLBACKS until one succeeds.
    """

    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    def _resolve_model(self, model: str) -> str:
        """Normalize bare model names to full OpenRouter model IDs."""
        return _MODEL_MAP.get(model, model)

    def _is_free_model(self, model: str) -> bool:
        return model.endswith(":free")

    def _prepare_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "MentorAI OS"
        }

    async def _call_model(
        self,
        model: str,
        payload_messages: List[Dict[str, str]],
        temperature: Optional[float],
    ) -> Dict[str, Any]:
        """Single model call — raises LLMProviderException on any failure."""
        payload = {
            "model": model,
            "messages": payload_messages,
            "temperature": temperature if temperature is not None else 0.7,
            "max_tokens": 1024,
        }
        async with httpx.AsyncClient(timeout=90.0) as client:
            res = await client.post(
                self.base_url,
                json=payload,
                headers=self._prepare_headers()
            )

        if res.status_code == 429:
            logger.warning(f"OpenRouter 429 rate limit on model={model}. Will try next fallback.")
            raise LLMProviderException(f"429_RATE_LIMITED:{model}")

        if res.status_code in (402, 403):
            logger.warning(f"OpenRouter {res.status_code} on model={model} (not free or no credits).")
            raise LLMProviderException(f"{res.status_code}_BILLING:{model}")

        res.raise_for_status()
        response_data = res.json()
        choice = response_data["choices"][0]["message"]
        usage = response_data.get("usage", {})
        return {
            "text": choice.get("content", ""),
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
            "_model_used": model,
        }

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        resolved = self._resolve_model(model)
        logger.info(f"OpenRouter generate: model={resolved}")
        start_time = time.perf_counter()

        payload_messages = list(messages)
        if system_prompt:
            payload_messages.insert(0, {"role": "system", "content": system_prompt})

        # Build fallback chain: primary model first, then free model chain
        if self._is_free_model(resolved):
            candidates = [resolved] + [m for m in FREE_MODEL_FALLBACKS if m != resolved]
        else:
            candidates = [resolved]  # Paid model — no fallback

        last_error: Optional[Exception] = None
        for candidate in candidates:
            try:
                result = await self._call_model(candidate, payload_messages, temperature)
                used = result.pop("_model_used", candidate)
                if used != resolved:
                    logger.info(f"OpenRouter fallback succeeded with model={used}")
                latency_ms = int((time.perf_counter() - start_time) * 1000)
                result["latency_ms"] = latency_ms
                return result
            except LLMProviderException as e:
                msg = str(e)
                if "429_RATE_LIMITED" in msg or "402_BILLING" in msg or "403_BILLING" in msg:
                    last_error = e
                    continue  # Try next fallback
                raise  # Non-rate-limit error — propagate immediately
            except Exception as e:
                last_error = e
                logger.error(f"OpenRouter error on model={candidate}: {e}")
                continue

        raise LLMProviderException(
            f"All {len(candidates)} free model(s) are rate-limited or unavailable. "
            f"Last error: {last_error}. Please try again in a few minutes."
        )

    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        resolved = self._resolve_model(model)
        logger.info(f"OpenRouter stream: model={resolved}")
        start_time = time.perf_counter()

        payload_messages = list(messages)
        if system_prompt:
            payload_messages.insert(0, {"role": "system", "content": system_prompt})

        if self._is_free_model(resolved):
            candidates = [resolved] + [m for m in FREE_MODEL_FALLBACKS if m != resolved]
        else:
            candidates = [resolved]

        for candidate in candidates:
            payload = {
                "model": candidate,
                "messages": payload_messages,
                "temperature": temperature if temperature is not None else 0.7,
                "max_tokens": 1024,
                "stream": True
            }
            try:
                async with httpx.AsyncClient(timeout=90.0) as client:
                    async with client.stream(
                        "POST",
                        self.base_url,
                        json=payload,
                        headers=self._prepare_headers()
                    ) as response:
                        if response.status_code == 429:
                            logger.warning(f"OpenRouter stream 429 on {candidate}, trying next...")
                            continue
                        if response.status_code in (402, 403):
                            logger.warning(f"OpenRouter stream billing error on {candidate}, trying next...")
                            continue
                        response.raise_for_status()

                        input_tokens = 0
                        output_tokens = 0

                        async for line in response.aiter_lines():
                            if not line:
                                continue
                            if line.startswith("data: "):
                                data_str = line[6:]
                                if data_str.strip() == "[DONE]":
                                    break
                                try:
                                    data = json.loads(data_str)
                                    choice = data["choices"][0]
                                    delta = choice.get("delta", {})
                                    text_chunk = delta.get("content", "")

                                    usage = data.get("usage")
                                    if usage:
                                        input_tokens = usage.get("prompt_tokens", 0)
                                        output_tokens = usage.get("completion_tokens", 0)

                                    if text_chunk:
                                        yield {
                                            "text": text_chunk,
                                            "input_tokens": None,
                                            "output_tokens": None,
                                            "latency_ms": None
                                        }
                                except Exception:
                                    continue

                latency_ms = int((time.perf_counter() - start_time) * 1000)
                yield {
                    "text": "",
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "latency_ms": latency_ms
                }
                return  # Stream succeeded — stop trying candidates

            except LLMProviderException:
                raise
            except Exception as e:
                logger.error(f"OpenRouter stream error on {candidate}: {e}")
                continue

        raise LLMProviderException("All free model fallbacks exhausted during streaming.")
