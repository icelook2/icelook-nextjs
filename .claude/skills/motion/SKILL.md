---
description: Motion (motion.dev) animation library documentation and Base UI integration
allowed-tools: ["WebFetch"]
---

# Motion

**PROACTIVELY use Motion** for ANY animation needs. Never use raw CSS animations or other animation libraries.

Motion (formerly Framer Motion) is the animation library for icelook. Use it for all animations.

## Documentation

When implementing animations, fetch the relevant documentation:

- **Base UI integration**: https://motion.dev/docs/base-ui (IMPORTANT - use this for animating Base UI components)
- **Quick start**: https://motion.dev/docs/react-quick-start
- **Animation guide**: https://motion.dev/docs/react-animation
- **Gestures**: https://motion.dev/docs/react-gestures
- **Layout animations**: https://motion.dev/docs/react-layout-animations
- **Exit animations**: https://motion.dev/docs/react-exit-animations
- **Scroll animations**: https://motion.dev/docs/react-scroll-animations

## Key Patterns

### Basic Animation

```tsx
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### With Base UI Components

Base UI components support a `render` prop for custom rendering with Motion.

Fetch https://motion.dev/docs/base-ui for the complete integration guide.

```tsx
import { Dialog } from "@base-ui/react/dialog";
import { motion, AnimatePresence } from "motion/react";

// Example pattern - fetch docs for full implementation
<Dialog.Portal>
  <Dialog.Backdrop
    render={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
  />
  <Dialog.Popup
    render={
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      />
    }
  />
</Dialog.Portal>
```

### Exit Animations

Use `AnimatePresence` for exit animations:

```tsx
import { AnimatePresence, motion } from "motion/react";

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

## When to Fetch Docs

Always fetch the Base UI integration guide when:
- Animating dialogs, popovers, tooltips, or any overlay components
- Adding enter/exit animations to Base UI components
- Unsure how to combine Motion with Base UI's render prop pattern
