"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

type ButtonMode = "fill" | "accent" | "icon";

const buttonModes: Record<ButtonMode, string> = {
  fill: "btn-fill rounded-[20px] bg-surface-control text-text-primary px-5 py-3 disabled:opacity-50",
  accent:
    "btn-fill rounded-[20px] bg-surface-inverse px-5 py-3 text-text-on-inverse disabled:opacity-50",
  icon: "btn-icon h-14 w-14 shrink-0 rounded-[20px] border border-border-default bg-surface-overlay text-icon-primary backdrop-blur-[12px] hover:text-accent-primary active:scale-[0.98] disabled:hover:text-icon-primary disabled:active:scale-100",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  mode?: ButtonMode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      mode = "fill",
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:cursor-default text-subheadline",
          buttonModes[mode],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
