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

class OpenRouterLLMProvider(BaseLLMProvider):
    """OpenRouter LLM Provider integration gateway."""

    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    def _prepare_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "MentorAI OS"
        }

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        logger.info(f"OpenRouter generate: model={model}")
        start_time = time.perf_counter()
        
        # Inject system prompt if present
        payload_messages = list(messages)
        if system_prompt:
            payload_messages.insert(0, {"role": "system", "content": system_prompt})

        payload = {
            "model": model,
            "messages": payload_messages,
            "temperature": temperature if temperature is not None else 0.7
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    self.base_url,
                    json=payload,
                    headers=self._prepare_headers()
                )
                res.raise_for_status()
                response_data = res.json()

            latency_ms = int((time.perf_counter() - start_time) * 1000)
            
            choice = response_data["choices"][0]["message"]
            usage = response_data.get("usage", {})
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)

            return {
                "text": choice.get("content", ""),
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms
            }

        except Exception as e:
            logger.error(f"OpenRouter generate failed: {str(e)}")
            raise LLMProviderException(f"OpenRouter API call failed: {str(e)}") from e

    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        logger.info(f"OpenRouter stream: model={model}")
        start_time = time.perf_counter()
        
        payload_messages = list(messages)
        if system_prompt:
            payload_messages.insert(0, {"role": "system", "content": system_prompt})

        payload = {
            "model": model,
            "messages": payload_messages,
            "temperature": temperature if temperature is not None else 0.7,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    self.base_url,
                    json=payload,
                    headers=self._prepare_headers()
                ) as response:
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
                                
                                # OpenRouter occasionally sends usage in streaming chunks
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

        except Exception as e:
            logger.error(f"OpenRouter stream failed: {str(e)}")
            raise LLMProviderException(f"OpenRouter stream failed: {str(e)}") from e
