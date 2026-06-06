import time
import logging
from typing import AsyncGenerator, List, Dict, Any, Optional
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.llm.providers.base import BaseLLMProvider
from app.llm.exceptions import LLMProviderException

logger = logging.getLogger("mentorai-os.llm.gemini")

class GeminiLLMProvider(BaseLLMProvider):
    """Google Gemini LLM Provider integration gateway."""

    def __init__(self):
        # Initialize GenAI Client using settings key
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key == "placeholder-gemini-key":
            logger.warning("Gemini API key is not configured or using placeholder.")
        self.client = genai.Client(api_key=api_key)

    def _prepare_contents(self, messages: List[Dict[str, str]]) -> List[types.Content]:
        """Converts user/assistant message dicts to Google GenAI Content types."""
        contents = []
        for msg in messages:
            # Map roles: Google GenAI uses 'user' and 'model'
            role = "user" if msg["role"] == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                )
            )
        return contents

    def _prepare_config(
        self, 
        system_prompt: Optional[str] = None, 
        temperature: Optional[float] = None
    ) -> types.GenerateContentConfig:
        """Prepares the GenerateContentConfig payload."""
        return types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature
        )

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        logger.info(f"Generating content using model {model}...")
        start_time = time.perf_counter()
        try:
            contents = self._prepare_contents(messages)
            config = self._prepare_config(system_prompt, temperature)

            # Call async generation
            response = await self.client.aio.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )

            latency_ms = int((time.perf_counter() - start_time) * 1000)
            
            # Read token metrics
            input_tokens = 0
            output_tokens = 0
            if response.usage_metadata:
                input_tokens = response.usage_metadata.prompt_token_count or 0
                output_tokens = response.usage_metadata.candidates_token_count or 0

            return {
                "text": response.text or "",
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms
            }

        except Exception as e:
            logger.error(f"Gemini generation failed: {str(e)}", exc_info=True)
            raise LLMProviderException(f"Gemini API call failed: {str(e)}") from e

    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        logger.info(f"Streaming content using model {model}...")
        start_time = time.perf_counter()
        try:
            contents = self._prepare_contents(messages)
            config = self._prepare_config(system_prompt, temperature)

            # Call async streaming
            response_stream = await self.client.aio.models.generate_content_stream(
                model=model,
                contents=contents,
                config=config
            )

            input_tokens = 0
            output_tokens = 0

            async for chunk in response_stream:
                chunk_text = chunk.text or ""
                
                # Check for token metrics in the chunk (usually present in the final chunk)
                if chunk.usage_metadata:
                    input_tokens = chunk.usage_metadata.prompt_token_count or 0
                    output_tokens = chunk.usage_metadata.candidates_token_count or 0

                yield {
                    "text": chunk_text,
                    "input_tokens": input_tokens if input_tokens > 0 else None,
                    "output_tokens": output_tokens if output_tokens > 0 else None,
                    "latency_ms": None
                }

            # Final latency calculation
            latency_ms = int((time.perf_counter() - start_time) * 1000)
            
            # Yield a final completion signal with the computed metrics
            yield {
                "text": "",
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": latency_ms
            }

        except Exception as e:
            logger.error(f"Gemini streaming failed: {str(e)}", exc_info=True)
            raise LLMProviderException(f"Gemini streaming failed: {str(e)}") from e
