from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any, Optional

class BaseLLMProvider(ABC):
    """Base interface for all LLM providers (Gemini, OpenRouter, Ollama)."""

    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """Generates a complete response and returns detailed metrics.
        
        Returns:
            Dict containing:
                "text": str
                "input_tokens": int
                "output_tokens": int
                "latency_ms": int
        """
        pass

    @abstractmethod
    def stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Streams responses token-by-token and yields metrics in the final chunk.
        
        Yields:
            Dict containing:
                "text": str
                "input_tokens": Optional[int]
                "output_tokens": Optional[int]
                "latency_ms": Optional[int]
        """
        pass
pre_declare = True
