"use client";

import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/use-sound";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 text-subheadline",
  {
    variants: {
      mode: {
        fill: "btn-fill rounded-[20px] bg-surface-control text-text-primary px-5 py-3",
        icon: "size-14 rounded-[20px] border border-border-default bg-surface-page/80 text-icon-primary backdrop-blur-sm hover:text-accent-primary active:scale-[0.98]",
      },
    },
    defaultVariants: {
      mode: "fill",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  soundKind?: "button" | "card" | "theme";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      mode,
      asChild = false,
      soundKind = "button",
      onClick,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const { play } = useSound();

    return (
      <Comp
        className={cn(buttonVariants({ mode }), className)}
        ref={ref}
        onClick={(e) => {
          play(soundKind);
          onClick?.(e as React.MouseEvent<HTMLButtonElement>);
        }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
