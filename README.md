# PostPlanify Clone

A Next.js 16 + React 19 + Tailwind CSS 4 clone of postplanify.com — a social media scheduling and content planning platform.

## Tech Stack

- **Next.js** 16.2.1 (App Router, Turbopack)
- **React** 19.2.4
- **TypeScript** 5
- **Tailwind CSS** 4
- **@base-ui/react** 1.3
- **lucide-react** 1.6
- **shadcn/ui** 4.1

## Routes

178 routes total, including:

- **80 tools** (`/tools/*`) — Instagram, Facebook, TikTok, YouTube, Twitter/X, LinkedIn, Pinterest, Threads, Bluesky generators and analyzers
- **11 features** (`/features/*`)
- **7 integrations** (`/integrations/*`)
- **32 alternatives** (`/alternative-to-*`)
- **9 scheduler landings** (`/{platform}-scheduler`)
- **15 marketing pages** (pricing, blog, help, changelog, etc.)
- **2 MCP** (`/mcp/*`)
- **17 dashboard routes** (`/dashboard/*`)

## Local development

```bash
# Install dependencies (Node.js 20+ required, 24+ recommended)
npm install

# Start dev server on http://localhost:3000
npm run dev

# Type check
npm run typecheck

# Production build
npm run build
npm start
```

## Deployment

### Hostinger (recommended)

1. hPanel → Hosting → Manage → Advanced → **Node.js Apps**
2. Create new application, point to this GitHub repo
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Set Node.js version to **20 or higher**

### Docker

```bash
docker-compose up -d
```

## Project structure

```
src/
  app/          # Next.js App Router pages (178 routes)
  components/   # React components (dashboard, marketing, sections, tools, ui)
  data/         # Static data (terms, holidays, alternatives, etc.)
  hooks/        # Custom React hooks
  lib/          # Utility libraries
  types/        # TypeScript type definitions
public/         # Static assets (images, logos, videos)
```

## License

Private — all rights reserved.
