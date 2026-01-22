---
description: Icelook coding conventions and style guidelines
---

# Coding Conventions

**PROACTIVELY apply these conventions** when writing or reviewing ANY code in the icelook project. Do not wait to be asked - enforce these rules automatically.

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

### Theming (Dark & Light Mode)

**Every component must support both dark and light themes** - never hardcode colors without dark mode equivalents.

Use Tailwind's `dark:` variant for all color-related classes. The theme is controlled by a class on the `<html>` element.

```tsx
// BAD - only light theme
function Card({ children }: Props) {
  return (
    <div className="bg-white text-gray-900 border-gray-200">
      {children}
    </div>
  );
}

// GOOD - both themes supported
function Card({ children }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
      {children}
    </div>
  );
}
```

#### Theme Color Guidelines

| Element | Light | Dark |
|---------|-------|------|
| Background (page) | `bg-white` | `dark:bg-gray-950` |
| Background (card) | `bg-gray-50` | `dark:bg-gray-900` |
| Background (elevated) | `bg-white` | `dark:bg-gray-800` |
| Text (primary) | `text-gray-900` | `dark:text-gray-100` |
| Text (secondary) | `text-gray-600` | `dark:text-gray-400` |
| Text (muted) | `text-gray-500` | `dark:text-gray-500` |
| Border | `border-gray-200` | `dark:border-gray-700` |
| Border (subtle) | `border-gray-100` | `dark:border-gray-800` |

#### With CVA

When using CVA, include dark mode in each variant:

```tsx
const cardVariants = cva(
  "rounded-lg border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
        elevated: "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

#### Testing Both Themes

When creating or modifying components, verify they look correct in both themes before considering the work complete.

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

### Use react-hook-form's Built-in Features

**Always use react-hook-form's built-in state tracking** - never manually track form state that the library already provides.

```tsx
// BAD - manually tracking dirty state
const [name, setName] = useState(initial.name);
const [email, setEmail] = useState(initial.email);
const isDirty = name !== initial.name || email !== initial.email; // Don't do this!

// BAD - using JSON.stringify for comparison (fragile and slow)
const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

// GOOD - use react-hook-form's formState
const { formState: { isDirty, dirtyFields } } = useForm({
  defaultValues: initialValues,
});
// isDirty is automatically tracked by the library!
```

Available `formState` properties you should use instead of manual tracking:
- `isDirty` - form has been modified from default values
- `dirtyFields` - object of which fields have been modified
- `isValid` - form passes validation
- `isSubmitting` - form is being submitted
- `isSubmitted` - form has been submitted at least once
- `errors` - validation errors

## Common Utilities - Prefer Libraries

**PROACTIVELY use established libraries** for common operations instead of writing custom implementations.

### Deep Comparison

```tsx
// BAD - JSON.stringify comparison (fragile, ignores key order, slow)
const isEqual = JSON.stringify(a) === JSON.stringify(b);

// BAD - custom deep comparison function
function deepEqual(a, b) { /* 50 lines of recursion */ }

// GOOD - use lodash-es (tree-shakeable lodash)
import { isEqual } from "lodash-es";
const areEqual = isEqual(a, b);
```

### Array Operations

```tsx
// BAD - manual unique
const unique = array.filter((item, index) => array.indexOf(item) === index);

// GOOD - use lodash-es
import { uniq, uniqBy, groupBy, keyBy } from "lodash-es";
const unique = uniq(array);
const uniqueById = uniqBy(array, 'id');
```

### Date Operations

See `.claude/skills/date-handling/SKILL.md` - always use date-fns for date formatting, parsing, and manipulation.

### Established Libraries in This Project

| Need | Library | Example |
|------|---------|---------|
| Date handling | `date-fns`, `date-fns-tz` | `format(date, 'yyyy-MM-dd')` |
| Deep comparison | `lodash-es` | `isEqual(a, b)` |
| Array utilities | `lodash-es` | `groupBy`, `keyBy`, `uniq` |
| Form state | `react-hook-form` | `formState.isDirty` |
| Schema validation | `zod` | `schema.parse(data)` |
| Class names | `cn` (our utility) | `cn('base', condition && 'extra')` |

### Rule

Before implementing any utility function, check:
1. Does react-hook-form already provide this? (for form state)
2. Does date-fns provide this? (for dates)
3. Does lodash-es provide this? (for data manipulation)
4. Does Zod provide this? (for validation)

If yes, use the library. Custom implementations create maintenance burden and are usually less robust.

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

## State Management

**PROACTIVELY minimize useState usage** - prefer derived state, form libraries, and context where appropriate.

### Form State

**Always use react-hook-form** for form state management - never manage form fields with individual useState calls.

```tsx
// BAD - managing form state manually
function Form() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    if (!name) setErrors({ name: "Required" });
    // ...manual validation
  };
}

// GOOD - using react-hook-form
function Form() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### Server Action State

Use `useTransition` for server action pending states, and minimal `useState` for server errors:

```tsx
// Recommended pattern
const [isPending, startTransition] = useTransition();
const [serverError, setServerError] = useState<string | null>(null);

async function handleSubmit(data: FormData) {
  startTransition(async () => {
    const result = await serverAction(data);
    if (!result.success) {
      setServerError(result.error);
    }
  });
}
```

### Avoid Derived State in useState

```tsx
// BAD - derived state stored in useState
const [items, setItems] = useState(initialItems);
const [filteredItems, setFilteredItems] = useState(items);

useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
}, [items]);

// GOOD - derive directly during render
const [items, setItems] = useState(initialItems);
const filteredItems = items.filter(i => i.active);
```

## Next.js Patterns

**PROACTIVELY use Next.js best practices** for data fetching and component architecture.

### Server Components First

Default to Server Components. Only add "use client" when you need:
- Event handlers (onClick, onChange)
- Hooks (useState, useEffect, useContext)
- Browser APIs

```tsx
// Server Component (default) - fetches data
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);  // Direct DB query
  return <ProfileView user={user} />;
}

// Client Component - handles interaction
"use client"
function ProfileActions({ userId }: { userId: string }) {
  const handleFollow = () => { /* ... */ };
  return <Button onClick={handleFollow}>Follow</Button>;
}
```

### Server Actions for Mutations

Use server actions for all data mutations:

```tsx
// In actions.ts
"use server"

export async function updateProfile(data: ProfileData) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  await db.update("profiles", parsed.data);
  revalidatePath("/profile");
  return { success: true };
}
```

### Data Fetching in Pages

Fetch data in page.tsx (Server Component) and pass to client components:

```tsx
// page.tsx (Server Component)
export default async function Page({ params }: Props) {
  const data = await fetchData(params.id);
  return <ClientComponent initialData={data} />;
}
```
