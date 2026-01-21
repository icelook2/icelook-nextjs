---
description: Generate 40 distinct UI variants with a switcher for rapid prototyping and design exploration
---

# Variants

Generate exactly 40 distinct visual variants of a component or feature with an interactive switcher to explore and compare them.

## When to Use

Use `/variants` when:
- Exploring different visual designs for a new component
- Comparing styling approaches (layouts, colors, spacing, typography)
- Rapid prototyping to find the best design direction
- Getting inspiration by seeing many different takes on the same element

## How It Works

1. **You describe** what you want variants of (e.g., "a pricing card", "a hero section", "a navigation menu")
2. **Claude generates** exactly 40 distinct variants, each with meaningfully different visual approaches
3. **A switcher component** lets you cycle through variants with arrow keys or buttons
4. **You pick** the variant that works best and iterate from there

## Critical Rules

### Always 40 Variants

Every `/variants` request generates **exactly 40 variants**. No exceptions, no asking "how many do you want?" — always 40.

### Stay Within the App's Design System

Variants must feel like they belong in the Icelook app. Use:
- The existing color palette (violet as primary, gray scale, etc.)
- Existing spacing patterns from the codebase
- Typography that matches the app
- Dark/light mode support (mandatory)

Do NOT create variants that look like they're from a completely different app. The goal is exploring design variations within our established aesthetic, not creating alien designs.

### Meaningful Differences

Each variant MUST be meaningfully different from others.

**BAD — Too Similar:**
- Variant 1: `rounded-lg p-4 bg-violet-500`
- Variant 2: `rounded-xl p-5 bg-violet-600`
- This is just tweaking numbers. Reject this.

**GOOD — Meaningfully Different:**
- Variant 1: Horizontal card with image left, text right, subtle border
- Variant 2: Vertical stack, large header, no image, gradient background
- Variant 3: Minimal single-line with icon, expandable on click
- Variant 4: Grid-based with multiple info blocks, badge in corner

### What Makes Variants Meaningfully Different

Vary these aspects to create truly distinct variants:

| Aspect | How to Vary |
|--------|-------------|
| **Layout structure** | Horizontal vs vertical, grid vs list, single vs multi-column |
| **Visual hierarchy** | What's emphasized — title vs image vs price vs CTA |
| **Information density** | Compact/dense vs spacious/minimal |
| **Decorative elements** | Icons, badges, dividers, backgrounds, shadows |
| **Interaction patterns** | Static vs hover effects vs expandable |
| **Shape language** | Sharp geometric vs soft rounded vs mixed |
| **Content arrangement** | Centered vs left-aligned vs asymmetric |
| **Component composition** | Monolithic vs clearly sectioned |

### 40 Variants Strategy

To generate 40 truly distinct variants, think in categories:

1. **Variants 1-8**: Layout variations (horizontal, vertical, grid, asymmetric, etc.)
2. **Variants 9-16**: Hierarchy variations (what element dominates)
3. **Variants 17-24**: Density variations (minimal to information-rich)
4. **Variants 25-32**: Style variations (bordered, shadowed, gradient, flat, etc.)
5. **Variants 33-40**: Creative/unique approaches (unconventional but still on-brand)

## Implementation

### CRITICAL: Integrate Into Existing Page

**NEVER create a separate page for variants.** Variants MUST be integrated directly into the existing page where the component is used. The user should see variants in context, on the real page with real data.

### File Structure

Place variant files alongside the component being explored:

```
app/
  (main)/
    appointments/
      _components/
        appointment-card.tsx         # Original component
        variant-switcher.tsx         # Switcher component (add here)
        card-variants/               # Variants folder (add here)
          variant-01.tsx
          variant-02.tsx
          ...
          variant-40.tsx
```

### Variant Switcher Component

Create a switcher component in the same `_components` folder as the component being explored:

```tsx
"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type VariantSwitcherProps = {
  variants: React.ReactNode[];
};

export function VariantSwitcher({ variants }: VariantSwitcherProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? variants.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === variants.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Switcher controls - compact, above content */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={goToPrevious}
          className="p-1.5 rounded-lg bg-surface-alt hover:bg-surface-alt/80 transition-colors"
          aria-label="Previous variant"
        >
          <ChevronLeft className="w-4 h-4 text-muted" />
        </button>
        <span className="text-xs font-medium text-muted tabular-nums min-w-[60px] text-center">
          {currentIndex + 1} / {variants.length}
        </span>
        <button
          onClick={goToNext}
          className="p-1.5 rounded-lg bg-surface-alt hover:bg-surface-alt/80 transition-colors"
          aria-label="Next variant"
        >
          <ChevronRight className="w-4 h-4 text-muted" />
        </button>
      </div>
      {/* Current variant */}
      <div>{variants[currentIndex]}</div>
    </div>
  );
}
```

### Each Variant File

Each variant should be a self-contained component that accepts the same props as the original:

```tsx
// card-variants/variant-01.tsx
import type { ClientAppointment } from "@/lib/queries/appointments";

type Props = {
  appointment: ClientAppointment;
  onReschedule?: () => void;
};

export function Variant01({ appointment, onReschedule }: Props) {
  return (
    // The variant implementation
    // Must support dark mode
    // Must use app's design system
    // Must work with REAL data passed via props
  );
}
```

### Integration Into Existing Page

Modify the existing page/component to use VariantSwitcher with real data:

```tsx
// In the existing list component or page
import { VariantSwitcher } from "./_components/variant-switcher";
import { Variant01 } from "./_components/card-variants/variant-01";
// ... import all variants

// For each appointment, render all variants through the switcher
{appointments.map((appointment) => (
  <VariantSwitcher
    key={appointment.id}
    variants={[
      <Variant01 key="v01" appointment={appointment} />,
      <Variant02 key="v02" appointment={appointment} />,
      // ... all 40
    ]}
  />
))}
```

## Example Session

User: `/variants` for the appointment card on /appointments

Claude will:
1. Read the existing appointment card component to understand props and data
2. Create `card-variants/` folder in the existing `_components` directory
3. Create the VariantSwitcher component in `_components`
4. Generate 40 distinct variants that accept the same props as the original
5. Modify the existing page to use VariantSwitcher with real appointment data
6. User sees variants on the ACTUAL /appointments page with REAL data

## After Exploration

Once you find a variant you like:
1. Note the variant number
2. Tell Claude: "I like variant 23. Let's use that."
3. Claude replaces the original component with the chosen variant's implementation
4. Claude cleans up the variant files and switcher (they're temporary exploration tools)

## Reminder

- **Always 40 variants** — no shortcuts
- **Stay on-brand** — variants should feel like Icelook
- **Meaningful differences** — if two variants look almost the same, one of them is wrong
- **NEVER create separate pages** — always integrate into the existing page where the component lives
- **Use real data** — variants must work with the actual props/data the component uses
