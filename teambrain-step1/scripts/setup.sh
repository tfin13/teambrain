#!/usr/bin/env bash
# TeamBrain Step 1 setup. Run from the folder that should CONTAIN the project.
# Usage: bash setup.sh /path/to/unzipped/teambrain-step1
set -euo pipefail

STEP1_DIR="${1:?Pass the path to the unzipped teambrain-step1 folder}"
STEP1_DIR="$(cd "$STEP1_DIR" && pwd)"

# 1. Next.js 15 + TypeScript + Tailwind v4 + ESLint, App Router, no src/ dir
npx create-next-app@15 teambrain \
  --ts --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --use-npm --turbopack --yes
cd teambrain

# 2. shadcn/ui (writes components.json, lib/utils.ts, theme tokens in app/globals.css)
npx shadcn@latest init --yes --base-color neutral
npx shadcn@latest add button card input --yes

# 3. Drizzle + Postgres driver
npm install drizzle-orm postgres lucide-react
npm install -D drizzle-kit dotenv

# 4. Drop in the Step 1 files (overwrites app/page.tsx from the template)
cp -R "$STEP1_DIR"/app "$STEP1_DIR"/components "$STEP1_DIR"/lib .
cp "$STEP1_DIR"/docker-compose.yml "$STEP1_DIR"/drizzle.config.ts "$STEP1_DIR"/.env.example "$STEP1_DIR"/CLAUDE.md .
cp .env.example .env.local

# 5. Database scripts
npm pkg set scripts.db:up="docker compose up -d --wait"
npm pkg set scripts.db:down="docker compose down"
npm pkg set scripts.db:generate="drizzle-kit generate"
npm pkg set scripts.db:migrate="drizzle-kit migrate"
npm pkg set scripts.db:studio="drizzle-kit studio"

# 6. Start Postgres, create and apply the first migration
npm run db:up
npm run db:generate -- --name init
npm run db:migrate

git add -A && git commit -m "Step 1: scaffold Next.js 15, Tailwind, shadcn/ui, Drizzle, Postgres"

echo "Done. Run: cd teambrain && npm run dev"
