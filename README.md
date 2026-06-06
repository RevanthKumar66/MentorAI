# MentorAI OS

Production-Grade AI Learning & Productivity Platform.

## Repository Structure

- `apps/web`: Next.js 15 app (TypeScript, React 19, Tailwind, Zustand)
- `packages/ui`: Shared component library UI
- `packages/types`: Shared TypeScript typings
- `packages/prompts`: Shared prompt templates
- `packages/config`: ESLint, TSConfig, Tailwind presets
- `packages/utils`: Shared utilities
- `services/api`: FastAPI app (Gemini, LangGraph, pgvector, Supabase, Celery)
- `services/worker`: Celery asynchronous worker

## Prerequisites

- Node.js >= 18 (pnpm >= 10)
- Python >= 3.12 (uv)

## Getting Started

### JS/TS Dependencies

```bash
pnpm install
```

### Python Dependencies

```bash
uv sync
```
