import time
import json
import logging
from typing import AsyncGenerator, List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.llm.providers.base import BaseLLMProvider
from app.llm.exceptions import LLMProviderException

logger = logging.getLogger("mentorai-os.llm.huggingface")

# Default free model — no HF license required, excellent at instruction following
DEFAULT_HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"

# Map short/Gemini-style names to full HuggingFace model IDs (all free)
_MODEL_MAP: Dict[str, str] = {
    "gemini-2.0-flash":     "mistralai/Mistral-7B-Instruct-v0.3",
    "gemini-2.5-flash":     "mistralai/Mistral-7B-Instruct-v0.3",
    "gemini-2.5-pro":       "Qwen/Qwen2.5-7B-Instruct",
    "gemini-1.5-flash":     "mistralai/Mistral-7B-Instruct-v0.3",
    "gemini-1.5-pro":       "Qwen/Qwen2.5-7B-Instruct",
    # Explicit HF model aliases (short names)
    "mistral-7b":           "mistralai/Mistral-7B-Instruct-v0.3",
    "qwen-7b":              "Qwen/Qwen2.5-7B-Instruct",
    "phi-3-mini":           "microsoft/Phi-3-mini-128k-instruct",
    "zephyr-7b":            "HuggingFaceH4/zephyr-7b-beta",
    "gemma-2b":             "google/gemma-2-2b-it",
    "smollm":               "HuggingFaceH4/smollm2-1.7b-instruct",
    "llama-3.2-3b":         "meta-llama/Llama-3.2-3B-Instruct",
}


class HuggingFaceLLMProvider(BaseLLMProvider):
    """HuggingFace Inference API provider — free, no billing required.
    
    Uses HuggingFace's OpenAI-compatible chat/completions endpoint.
    Free tier: ~1000 req/hour per model, no credit card needed.
    """

    BASE_URL = "https://api-inference.huggingface.co/models"

    def __init__(self):
        self.api_key = settings.HF_API_KEY or ""
        if not self.api_key or self.api_key.startswith("placeholder"):
            logger.warning("HuggingFace API key not configured. Set HF_API_KEY in .env")

    def _resolve_model(self, model: str) -> str:
        """Normalize short model names to full HuggingFace model IDs."""
        return _MODEL_MAP.get(model, model if "/" in model else DEFAULT_HF_MODEL)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "x-use-cache": "false",
        }

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        model_id = self._resolve_model(model)
        logger.info(f"HuggingFace generate: model={model_id}")
        start_time = time.perf_counter()

        # Build message list — inject system prompt if present
        payload_messages = list(messages)
        if system_prompt:
            payload_messages.insert(0, {"role": "system", "content": system_prompt})

        # Use OpenAI-compatible chat/completions endpoint
        url = f"{self.BASE_URL}/{model_id}/v1/chat/completions"
        payload = {
            "model": model_id,
            "messages": payload_messages,
            "max_tokens": 1024,
            "temperature": temperature if temperature is not None else 0.7,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                res = await client.post(url, json=payload, headers=self._headers())

                # Handle cold start — HF returns 503 with estimated_time
                if res.status_code == 503:
                    error_data = res.json()
                    wait_time = error_data.get("estimated_time", 30)
                    logger.warning(
                        f"HF model {model_id} is loading (cold start). "
                        f"Estimated wait: {wait_time}s. Retrying..."
                    )
                    raise LLMProviderException(
                        f"Model is warming up (cold start ~{wait_time:.0f}s). "
                        f"Please try again in {wait_time:.0f} seconds."
                    )

                res.raise_for_status()
                response_data = res.json()

            latency_ms = int((time.perf_counter() - start_time) * 1000)
            choice = response_data["choices"][0]["message"]
            usage = response_data.get("usage", {})

            return {
                "text": choice.get("content", ""),
                "input_tokens": usage.get("prompt_tokens", 0),
                "output_tokens": usage.get("completion_tokens", 0),
                "latency_ms": latency_ms,
            }

        except LLMProviderException:
            raise
        except Exception as e:
            logger.error(f"HuggingFace generate failed: {str(e)}", exc_info=True)
            raise LLMProviderException(f"HuggingFace API call failed: {str(e)}") from e

    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        model_id = self._resolve_model(model)
        logger.info(f"HuggingFace stream: model={model_id}")
        start_time = time.perf_counter()

        payload_messages = list(messages)
        if system_prompt:
            payload_messages.insert(0, {"role": "system", "content": system_prompt})

        url = f"{self.BASE_URL}/{model_id}/v1/chat/completions"
        payload = {
            "model": model_id,
            "messages": payload_messages,
            "max_tokens": 1024,
            "temperature": temperature if temperature is not None else 0.7,
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST", url, json=payload, headers=self._headers()
                ) as response:
                    if response.status_code == 503:
                        raise LLMProviderException("Model is warming up. Please retry in 30 seconds.")
                    response.raise_for_status()

                    input_tokens = 0
                    output_tokens = 0

                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
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
                                    "latency_ms": None,
                                }
                        except Exception:
                            continue

            latency_ms = int((time.perf_counter() - start_time) * 1000)
            yield {
                "text": "",
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms,
            }

        except LLMProviderException:
            raise
        except Exception as e:
            logger.error(f"HuggingFace stream failed: {str(e)}", exc_info=True)
            raise LLMProviderException(f"HuggingFace stream failed: {str(e)}") from e
