---
description: Icelook coding conventions and style guidelines
---

# Coding Conventions

Apply these conventions when writing or reviewing code in the icelook project.

## Components

**Always wrap Base UI components** - never implement from scratch if Base UI has the component.

Base UI provides unstyled, accessible primitives. Our job is to wrap them and add styles.

```typescript
// BAD - implementing button from scratch
function Button({ children, onClick }: ButtonProps) {
  return (
    <button className="..." onClick={onClick}>
      {children}
    </button>
  );
}

// GOOD - wrapping Base UI button
import { Button as BaseButton } from "@base-ui/react/button";

function Button({ children, ...props }: ButtonProps) {
  return (
    <BaseButton className="..." {...props}>
      {children}
    </BaseButton>
  );
}
```

### When to create from scratch

Only create a component manually if:
1. Base UI does not have an equivalent component
2. The component is highly specific to icelook domain (e.g., `AppointmentCard`)

Check `.claude/skills/base-ui/llms-index.md` for available Base UI components.

### Component Styling with CVA

**Always use CVA (class-variance-authority) for component variants** - never use simple objects or conditional ternaries for variant styles.

CVA provides type-safe, composable class name generation for component variants. Use it with `cn` utility for conditional classes.

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-violet-500 text-white hover:bg-violet-600",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "bg-transparent hover:bg-gray-100",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-lg",
      },
    },
    // Combine variants for specific overrides
    compoundVariants: [
      {
        variant: "primary",
        size: "lg",
        className: "shadow-lg",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

type ButtonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
};

function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

The `cn` utility merges Tailwind classes intelligently:
```tsx
import { cn } from "@/lib/utils/cn";

// Combines and deduplicates classes
cn("px-4 py-2", "px-6") // → "py-2 px-6"
cn("bg-red-500", condition && "bg-blue-500") // → conditional class
```

### Animations

**Always use Motion (motion.dev)** for animations - never use raw CSS animations or other libraries.

Motion (formerly Framer Motion) is our standard animation library. It integrates well with Base UI.

```tsx
import { motion } from "motion/react";

function FadeIn({ children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  );
}
```

For Motion + Base UI integration patterns, see `.claude/skills/motion/SKILL.md`.

## Component Structure

**Split large files into smaller, focused components** - if a piece of JSX can be grouped and named, extract it.

### Hard Rule: 100 Lines Max

**If a component exceeds 100 lines of code, it must be split.** No exceptions.

This is the primary indicator that a component is doing too much and needs to be broken down into smaller, focused components.

### Why?

- Improves readability
- Makes code self-documenting through component names
- Easier to test and maintain
- Reduces cognitive load

### Guidelines

1. **Extract logical groups** - if JSX represents a distinct section, make it a component

```tsx
// BAD - large page with inline sections
function HomePage() {
  return (
    <main>
      <div className="...">
        <h2>Featured Salons</h2>
        {/* 50 lines of salon grid markup */}
      </div>
      <div className="...">
        <h2>Special Offers</h2>
        {/* 30 lines of advertisement markup */}
      </div>
    </main>
  );
}

// GOOD - extracted into named components
function HomePage() {
  return (
    <main>
      <FeaturedSalons />
      <SpecialOffers />
    </main>
  );
}
```

2. **Extract list items** - when mapping, create a component for the item

```tsx
// BAD - inline JSX in map
function SpecialistList({ specialists }: Props) {
  return (
    <ul>
      {specialists.map((specialist) => (
        <li key={specialist.id}>
          <img src={specialist.avatar} />
          <h3>{specialist.name}</h3>
          <p>{specialist.specialty}</p>
          <StarRating value={specialist.rating} />
          <button>Book Now</button>
        </li>
      ))}
    </ul>
  );
}

// GOOD - extracted item component
function SpecialistList({ specialists }: Props) {
  return (
    <ul>
      {specialists.map((specialist) => (
        <SpecialistCard key={specialist.id} specialist={specialist} />
      ))}
    </ul>
  );
}
```

3. **Rule of thumb**: If you can name it, extract it. Names like `Advertisement`, `SearchFilters`, `BookingForm`, `SpecialistCard` make the parent component read like documentation.

## Forms & Validation

**Always use Zod with React Hook Form** - never use native HTML validation or manual validation logic.

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // ...
}
```

This applies to all validation - forms, API inputs, environment variables, etc. Zod is the single source of truth for data validation.

## TypeScript

- **Never use `any`** - use `unknown`, generics, or proper types instead (enforced by Biome)
- If you encounter a situation where `any` seems necessary, use `unknown` and narrow the type

## Control Flow

- **Always use braces for if statements** - never single-line without braces

```typescript
// BAD
if (condition) doSomething();

// BAD
if (condition)
  doSomething();

// GOOD
if (condition) {
  doSomething();
}
```

## Environment Variables

### Naming Convention

- **Private (server-only)**: Prefix with `IL_`
  - Example: `IL_API_SECRET`, `IL_DATABASE_URL`
- **Public (client-exposed)**: Prefix with `NEXT_PUBLIC_IL_`
  - Example: `NEXT_PUBLIC_IL_APP_URL`, `NEXT_PUBLIC_IL_STRIPE_KEY`

This distinguishes icelook-specific variables from third-party service variables (like `SENTRY_DSN`).

### Validation

**Always validate environment variables** - check existence and throw explicit errors at startup.

```typescript
// BAD - silent failure or undefined behavior
const apiKey = process.env.IL_API_KEY;

// GOOD - fail fast with clear error
const apiKey = process.env.IL_API_KEY;
if (!apiKey) {
  throw new Error("Missing required environment variable: IL_API_KEY");
}

// GOOD - helper function pattern
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const apiKey = getEnvVar("IL_API_KEY");
```
