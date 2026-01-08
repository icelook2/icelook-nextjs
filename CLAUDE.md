# Icelook

A web-service for managing and booking beauty appointments.

## Business Model

**Client flow:** Find beauty page by nickname → browse services → select time → book appointment.

**Beauty Page:** A personal business profile (like Instagram Business). Any user can create a beauty page and become its **creator**. The creator IS the specialist — they manage their own services, schedule, and appointments. Think of it as a solo professional's booking page.

**Creator capabilities:**
- Create and organize services into service groups
- Set prices for each service
- Define working days and hours (can vary by day)
- Accept or decline appointment requests

**Services & Pricing:** Creators organize their services into service groups and set their own prices. Each service has one price (the creator's price).

For detailed business rules, see `.claude/skills/icelook-business-expert/SKILL.md`.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19 with React Compiler enabled
- **Styling**: Tailwind CSS 4
- **Components**: Base UI (`@base-ui/react`) - unstyled, composable components
- **Animations**: Motion (motion.dev) - formerly Framer Motion
- **Forms**: React Hook Form + Zod (form state and schema validation)
- **Icons**: Lucide React (`lucide-react`) - always use Lucide icons, never custom SVGs
- **Database**: Supabase (separate repository)
- **Analytics**: Mixpanel
- **Error Monitoring**: Sentry
- **Testing**: Playwright (e2e)
- **Linting/Formatting**: Biome
- **Package Manager**: pnpm
- **Deployment**: Vercel

## Tooling

### Sentry

Error monitoring and performance tracking. Used for:

- Catching and reporting runtime errors in production
- Tracking performance issues and slow transactions
- Alerting on error spikes

### Mixpanel

Product analytics. Used for:

- Tracking user behavior and feature usage
- Analyzing conversion funnels (e.g., search → view specialist → book appointment)
- Understanding user engagement and retention

### Playwright

End-to-end testing framework. Used for:

- Testing critical user flows (booking, authentication, etc.)
- Cross-browser testing
- Visual regression testing

## Architecture

### This Repository (icelook-nextjs)

Frontend Next.js application. Contains:

- `/app` - App Router pages and layouts
- `/tests` - Playwright e2e tests
- `/.claude/skills` - Claude Code skills (e.g., Base UI docs)

### Supabase (Separate Repository)

Backend database, auth, and API. **Not in this repo.**

When working with database schema, migrations, or RLS policies, note that changes need to be made in the Supabase repository.

## Development

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm lint     # Run Biome linter
pnpm format   # Format code with Biome
pnpm test     # Run Playwright tests
pnpm test:ui  # Run Playwright with UI
```

## Key Entities (Domain Model)

- **User**: Any Icelook user (can be a client or a creator)
- **Beauty Page**: A personal business profile with a unique nickname (one creator per page)
- **Creator**: The user who owns a beauty page and provides services (the creator IS the specialist)
- **Service Group**: Category for organizing services (e.g., "Hair", "Nails")
- **Service**: What the creator offers, with a set price
- **Appointment**: Booked time slot between a client and a creator

## Conventions

See `.claude/skills/coding-conventions/SKILL.md` for detailed coding guidelines including:

- Component patterns (always wrap Base UI)
- **Theming (dark & light mode must always be supported)**
- TypeScript rules (no `any`)
- Environment variable naming (`IL_` prefix)
- Control flow style (always use braces)

For Base UI component documentation, see `.claude/skills/base-ui/`.

### CRITICAL: No z-index

**NEVER use `z-index` in this codebase. This is a strict rule.**

- All floating UI (dialogs, selects, popovers, tooltips) must use **Portals** for stacking
- Portals render elements to `<body>` in DOM order - later elements naturally appear on top
- If you encounter stacking issues, the solution is ALWAYS to fix the Portal usage, never add z-index
- **ASK FOR PERMISSION** before even considering z-index as a solution

Why: z-index creates maintenance nightmares with competing values (z-50, z-[9999], etc.). Portals solve stacking correctly by leveraging DOM order.

## Supabase info for local development

supabase local development setup is running.

╭──────────────────────────────────────╮
│ 🔧 Development Tools                 │
├─────────┬────────────────────────────┤
│ Studio  │ http://127.0.0.1:54423     │
│ Mailpit │ http://127.0.0.1:54424     │
│ MCP     │ http://127.0.0.1:54421/mcp │
╰─────────┴────────────────────────────╯

╭─────────────────────────────────────────────────╮
│ 🌐 APIs                                         │
├─────────────┬───────────────────────────────────┤
│ Project URL │ http://127.0.0.1:54421            │
│ REST        │ http://127.0.0.1:54421/rest/v1    │
│ GraphQL     │ http://127.0.0.1:54421/graphql/v1 │
╰─────────────┴───────────────────────────────────╯

╭───────────────────────────────────────────────────────────────╮
│ ⛁ Database                                                    │
├─────┬─────────────────────────────────────────────────────────┤
│ URL │ postgresql://postgres:postgres@127.0.0.1:54422/postgres │
╰─────┴─────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│ 🔑 Authentication Keys                                       │
├─────────────┬────────────────────────────────────────────────┤
│ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │
│ Secret      │ sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz      │
╰─────────────┴────────────────────────────────────────────────╯

╭───────────────────────────────────────────────────────────────────────────────╮
│ 📦 Storage (S3)                                                               │
├────────────┬──────────────────────────────────────────────────────────────────┤
│ URL        │ http://127.0.0.1:54421/storage/v1/s3                             │
│ Access Key │ 625729a08b95bf1b7ff351a663f3a23c                                 │
│ Secret Key │ 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907 │
│ Region     │ local                                                            │
╰────────────┴──────────────────────────────────────────────────────────────────╯
