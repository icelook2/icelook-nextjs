"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// Field Root
const fieldRootVariants = cva("flex", {
  variants: {
    direction: {
      column: "flex-col",
      row: "flex-row items-center",
    },
    gap: {
      default: "gap-1.5",
      sm: "gap-1",
      lg: "gap-2",
      none: "gap-0",
    },
  },
  defaultVariants: {
    direction: "column",
    gap: "default",
  },
});

type FieldRootProps = ComponentPropsWithoutRef<typeof BaseField.Root> &
  VariantProps<typeof fieldRootVariants> & {
    children: ReactNode;
  };

function FieldRoot({
  direction,
  gap,
  className,
  children,
  ...props
}: FieldRootProps) {
  return (
    <BaseField.Root
      className={cn(fieldRootVariants({ direction, gap }), className)}
      {...props}
    >
      {children}
    </BaseField.Root>
  );
}

// Field Label
const fieldLabelVariants = cva("font-medium text-foreground", {
  variants: {
    size: {
      default: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

type FieldLabelProps = ComponentPropsWithoutRef<typeof BaseField.Label> &
  VariantProps<typeof fieldLabelVariants> & {
    children: ReactNode;
  };

function FieldLabel({ size, className, children, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      className={cn(fieldLabelVariants({ size }), className)}
      {...props}
    >
      {children}
    </BaseField.Label>
  );
}

// Field Error
type FieldErrorProps = ComponentPropsWithoutRef<typeof BaseField.Error> & {
  children?: ReactNode;
};

function FieldError({ children, className, ...props }: FieldErrorProps) {
  if (!children) {
    return null;
  }

  return (
    <BaseField.Error
      className={cn("text-sm text-danger", className)}
      match
      {...props}
    >
      {children}
    </BaseField.Error>
  );
}

// Field Description
type FieldDescriptionProps = ComponentPropsWithoutRef<
  typeof BaseField.Description
> & {
  children: ReactNode;
};

function FieldDescription({
  children,
  className,
  ...props
}: FieldDescriptionProps) {
  return (
    <BaseField.Description
      className={cn("text-sm text-muted", className)}
      {...props}
    >
      {children}
    </BaseField.Description>
  );
}

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Error: FieldError,
  Description: FieldDescription,
};
