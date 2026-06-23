import time
import json
import logging
from typing import AsyncGenerator, List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.llm.providers.base import BaseLLMProvider
from app.llm.exceptions import LLMProviderException

logger = logging.getLogger("mentorai-os.llm.ollama")

class OllamaLLMProvider(BaseLLMProvider):
    """Local Ollama LLM Provider integration gateway."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.api_url = f"{self.base_url}/api/chat"

    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        logger.info(f"Ollama generate: model={model}")
        start_time = time.perf_counter()

        payload_messages = list(messages)
        if system_prompt:
            payload_messages.insert(0, {"role": "system", "content": system_prompt})

        payload: Dict[str, Any] = {
            "model": model,
            "messages": payload_messages,
            "stream": False
        }
        if temperature is not None:
            payload["options"] = {"temperature": temperature}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(self.api_url, json=payload)
                res.raise_for_status()
                response_data = res.json()

            latency_ms = int((time.perf_counter() - start_time) * 1000)
            
            message = response_data.get("message", {})
            content = message.get("content", "")
            
            # Ollama returns token counts as prompt_eval_count and eval_count
            input_tokens = response_data.get("prompt_eval_count", 0)
            output_tokens = response_data.get("eval_count", 0)

            return {
                "text": content,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms
            }

        except Exception as e:
            logger.error(f"Ollama generate failed: {str(e)}")
            raise LLMProviderException(f"Ollama API call failed: {str(e)}") from e

    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        logger.info(f"Ollama stream: model={model}")
        start_time = time.perf_counter()

        payload_messages = list(messages)
        if system_prompt:
            payload_messages.insert(0, {"role": "system", "content": system_prompt})

        payload: Dict[str, Any] = {
            "model": model,
            "messages": payload_messages,
            "stream": True
        }
        if temperature is not None:
            payload["options"] = {"temperature": temperature}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", self.api_url, json=payload) as response:
                    response.raise_for_status()
                    
                    input_tokens = 0
                    output_tokens = 0

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        
                        try:
                            data = json.loads(line)
                            
                            # Stream chunk
                            message = data.get("message", {})
                            text_chunk = message.get("content", "")
                            
                            if text_chunk:
                                yield {
                                    "text": text_chunk,
                                    "input_tokens": None,
                                    "output_tokens": None,
                                    "latency_ms": None
                                }
                            
                            # Terminal chunk will have done=True and usage stats
                            if data.get("done", False):
                                input_tokens = data.get("prompt_eval_count", 0)
                                output_tokens = data.get("eval_count", 0)
                                
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
            logger.error(f"Ollama stream failed: {str(e)}")
            raise LLMProviderException(f"Ollama stream failed: {str(e)}") from e
