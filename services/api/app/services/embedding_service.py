import logging
from typing import List
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger("mentorai-os.services.embedding_service")

class EmbeddingService:
    """Service to interface with Gemini's Embeddings API for vector search context."""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = genai.Client(api_key=self.api_key)
        self.model = "gemini-embedding-2"

    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for a single string."""
        try:
            response = await self.client.aio.models.embed_content(
                model=self.model,
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            if response.embeddings:
                return response.embeddings[0].values
            raise ValueError("No embeddings returned from Gemini API")
        except Exception as e:
            logger.error(f"Error generating embedding: {e}", exc_info=True)
            raise

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embedding vectors for a list of strings in batch."""
        if not texts:
            return []
        try:
            response = await self.client.aio.models.embed_content(
                model=self.model,
                contents=texts,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            if response.embeddings:
                return [emb.values for emb in response.embeddings]
            raise ValueError("No embeddings returned from Gemini API")
        except Exception as e:
            logger.error(f"Error generating embeddings batch: {e}", exc_info=True)
            raise

