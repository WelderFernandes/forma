import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>((props, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-[13px] font-body font-medium leading-none tracking-[-0.01em] peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
      props.className,
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>((props, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={props.decorative ?? true}
    orientation={props.orientation ?? "horizontal"}
    className={cn(
      "shrink-0 bg-border-soft",
      props.orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      props.className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>((props, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200",
      "focus-visible:ring-4 focus-visible:ring-lime/30 focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-lime data-[state=unchecked]:bg-foreground/15",
      props.className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block size-5 rounded-full bg-cream shadow-lg ring-0 transition-transform duration-200 ease-[cubic-bezier(.22,1,.36,1)]",
        "data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-lime-ink data-[state=unchecked]:translate-x-1",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
  }
>((props, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-foreground/10",
      props.className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 rounded-full bg-lime transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
        props.indicatorClassName,
      )}
      style={{
        transform: `translateX(-${100 - (props.value ?? 0)}%)`,
      }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Label, Separator, Switch, Progress };
