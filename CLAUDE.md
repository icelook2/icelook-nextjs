# Icelook

A web-service for managing and booking beauty appointments.

## Business Model

**Client flow:** Find beauty page by nickname → select services → select specialist → select time → book appointment.

**Beauty Page:** Any user can create a beauty page and become its owner. Owners can invite users and create specialists. Users can be part of multiple beauty pages as either **admin** or **specialist**.

**Services & Pricing:** Beauty pages organize services into service groups. Specialists are assigned to services with individual prices. When specialists have different prices, the beauty page displays a price range (min–max).

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

- **User**: Any Icelook user (can be client, owner, admin, or specialist)
- **Beauty Page**: A page with a unique nickname where services are offered
- **Specialist**: A user assigned to provide services on a beauty page
- **Service Group**: Category for organizing services
- **Service**: What specialists offer (assigned to a service group)
- **Specialist-Service Assignment**: Links specialist to service with a specific price
- **Appointment**: Booked time slot between client and specialist

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
