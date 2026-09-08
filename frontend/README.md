# Frontend

Next.js (App Router) frontend for Ximacent — premium paid online voting.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Runs on [http://localhost:3001](http://localhost:3001). API expected at `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`).

## Stack

- Next.js + TypeScript + Tailwind CSS v3
- shadcn/ui primitives (brand-customized)
- TanStack Query, react-hook-form + zod, Framer Motion
- Typed API client in `src/lib/api/`
