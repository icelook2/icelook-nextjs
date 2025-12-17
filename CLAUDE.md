# Icelook

A booking platform for beauty and barber services connecting clients with specialists and salons.

## Project Purpose

**Two-sided marketplace:**

- **Clients**: Search for specialists or salons, view services, and book appointments
- **Specialists** (barbers, beauty professionals): Create schedules, define services, manage appointments

**Organization hierarchy:**

```
Organization (large business)
└── Salon (location)
    └── Specialist (invited to salon)
```

Supports both independent specialists and large organizations with multiple salons.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19 with React Compiler enabled
- **Styling**: Tailwind CSS 4
- **Components**: Base UI (`@base-ui/react`) - unstyled, composable components
- **Animations**: Motion (motion.dev) - formerly Framer Motion
- **Forms**: React Hook Form + Zod (form state and schema validation)
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

- **User**: Can be a client, specialist, or organization admin
- **Organization**: Business entity that can own multiple salons
- **Salon**: Physical location offering services
- **Specialist**: Service provider (barber, stylist, etc.)
- **Service**: What specialists offer (haircut, coloring, etc.)
- **Appointment**: Booked time slot between client and specialist
- **Schedule**: Specialist's availability

## Conventions

See `.claude/skills/coding-conventions/SKILL.md` for detailed coding guidelines including:

- Component patterns (always wrap Base UI)
- TypeScript rules (no `any`)
- Environment variable naming (`IL_` prefix)
- Control flow style (always use braces)

For Base UI component documentation, see `.claude/skills/base-ui/`.
