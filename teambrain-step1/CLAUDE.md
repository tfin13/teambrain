# TeamBrain

Small businesses upload internal documents, then search and chat with them. Answers cite their sources.
We are building the **Smallest MVP** only: one weekend, one developer.

## Stack
- Next.js 15 (App Router, Server Components, Server Actions), TypeScript strict
- Tailwind CSS v4 + shadcn/ui (components in `components/ui`, don't edit them by hand; add with `npx shadcn@latest add <name>`)
- PostgreSQL 17 via Docker locally, Neon in production
- Drizzle ORM (`lib/db/schema.ts`), migrations in `lib/db/migrations`
- Retrieval = Postgres full-text search only (generated `tsv` column + GIN index). No embeddings, no pgvector.
- Auth.js v5 Credentials + bcryptjs, JWT sessions. `lib/auth/config.ts` is edge-safe (used by `middleware.ts`); `lib/auth/index.ts` adds the DB-backed provider. Get the user with `requireUser()`.
- Coming later: Claude via Vercel AI SDK (step 7)

## Commands
- `npm run db:up` / `npm run db:down`: start / stop local Postgres
- `npm run db:generate`: create a migration after editing `schema.ts`
- `npm run db:migrate`: apply migrations
- `npm run db:studio`: browse data
- `npm run dev`, `npm run build`, `npm run lint`

## Rules
- Business logic lives in `lib/`; pages and route handlers stay thin.
- Every query on `documents` or `chunks` filters by `userId` from the session, never from request input. Each user is their own workspace.
- Server-only code (db, API keys) never imports into client components.
- Never edit generated migration files; change `schema.ts` and regenerate.
- Use shadcn/ui + lucide icons; Tailwind semantic tokens (`bg-muted`, `text-muted-foreground`), not raw colors.
- Keep scope to the Smallest MVP: PDF/TXT/MD upload ≤ 5 MB, document list + delete, keyword search, chat with [n] citations. Don't add features outside it.

## Layout
- `app/(app)/` signed-in pages: documents, search, chat
- `app/api/` route handlers (chat streaming, search)
- `components/` app components; `components/ui/` shadcn primitives
- `lib/db` client + schema · `lib/actions` server actions · `lib/ingest` extract + chunk · `lib/retrieval` search · `lib/ai` prompts + citations
