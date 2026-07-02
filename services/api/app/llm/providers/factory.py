import logging
from typing import Dict, Type

from app.core.config import settings
from app.llm.providers.base import BaseLLMProvider
from app.llm.providers.gemini import GeminiLLMProvider
from app.llm.providers.openrouter import OpenRouterLLMProvider
from app.llm.providers.ollama import OllamaLLMProvider
from app.llm.providers.huggingface import HuggingFaceLLMProvider
from app.llm.exceptions import LLMProviderException

logger = logging.getLogger("mentorai-os.llm.factory")

_PROVIDERS: Dict[str, Type[BaseLLMProvider]] = {
    "gemini": GeminiLLMProvider,
    "openrouter": OpenRouterLLMProvider,
    "ollama": OllamaLLMProvider,
    "huggingface": HuggingFaceLLMProvider,
}

class LLMProviderFactory:
    """Factory for instantiating the LLM gateway providers."""

    @staticmethod
    def get_provider(provider_name: str | None = None) -> BaseLLMProvider:
        """Get the configured or requested provider instance.
        
        Args:
            provider_name: Override for provider name. If None, uses LLM_PROVIDER from settings.
        """
        provider_name = (provider_name or settings.LLM_PROVIDER).lower()
        
        if provider_name not in _PROVIDERS:
            logger.error(f"Unknown LLM provider requested: {provider_name}")
            raise LLMProviderException(
                f"LLM provider '{provider_name}' is not configured or unsupported. "
                f"Supported providers: {list(_PROVIDERS.keys())}"
            )
            
        logger.info(f"Instantiating LLM provider: {provider_name}")
        return _PROVIDERS[provider_name]()
