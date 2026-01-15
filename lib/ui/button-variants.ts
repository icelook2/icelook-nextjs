import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 font-medium text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-2xl bg-accent text-white hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent",
        secondary:
          "rounded-full bg-surface text-foreground hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent",
        ghost:
          "bg-transparent hover:bg-surface disabled:hover:bg-transparent rounded-2xl text-foreground",
        soft: "rounded-full bg-surface text-foreground hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent",
        danger:
          "rounded-2xl bg-danger text-white hover:bg-danger/90 focus-visible:ring-2 focus-visible:ring-danger",
        link: "bg-transparent p-0 text-accent hover:underline",
        "link-primary": "bg-transparent p-0 text-foreground hover:underline",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-4 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    compoundVariants: [
      {
        variant: ["link", "link-primary"],
        className: "px-0 py-0",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);
