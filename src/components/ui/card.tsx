import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Cards Forma.
 *
 * Superfície quente, hairline e raio generoso. A elevação aparece no hover,
 * nunca o tempo todo. `feature` inverte para tinta; `lime` é a assinatura.
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "feature" | "glass" | "outline" | "lime" | "media";
    hoverable?: boolean;
  }
>(
  (
    { className, variant = "default", hoverable = true, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-[26px] border border-border-soft bg-card text-card-foreground shadow-card",
        variant === "feature" && "border-white/10 bg-ink text-cream",
        variant === "glass" &&
          "glass-dark border-white/10 text-cream shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]",
        variant === "outline" && "bg-transparent shadow-none",
        variant === "lime" && "border-lime bg-lime text-lime-ink shadow-lime",
        variant === "media" && "overflow-hidden p-0",
        hoverable &&
          variant !== "feature" &&
          variant !== "glass" &&
          variant !== "lime" &&
          "transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:border-foreground/20 hover:shadow-raised",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-body text-[17px] font-semibold leading-tight tracking-[-0.025em]",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
