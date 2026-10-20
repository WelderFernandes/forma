import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * Botões Forma.
 *
 * A ação primária é uma cápsula citron com texto tinta — a assinatura da
 * marca. Ação neutra é tinta sólida; contornos usam hairlines quentes.
 * Tudo desacelera e assenta: sem bounce, pressão a 0.98.
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent font-body text-sm font-medium tracking-[-0.01em] outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(.22,1,.36,1)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:ring-4 focus-visible:ring-lime/35",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
        brand:
          "bg-lime text-lime-ink shadow-[0_14px_34px_-16px_rgba(190,220,60,0.75)] hover:bg-lime-bright",
        accent:
          "bg-lime text-lime-ink shadow-[0_14px_34px_-16px_rgba(190,220,60,0.75)] hover:bg-lime-bright",
        outline:
          "border-border bg-transparent text-foreground hover:border-foreground/25 hover:bg-surface",
        secondary:
          "border-border-soft bg-surface text-foreground hover:bg-surface-warm",
        ghost: "text-foreground hover:bg-surface",
        destructive:
          "bg-danger text-white shadow-[0_10px_30px_-14px_rgba(180,70,45,0.7)] hover:opacity-90",
        link: "h-auto rounded-none p-0 text-brand underline-offset-4 hover:underline",
        brandGhost: "text-brand hover:bg-brand-soft",
        contrast: "bg-cream text-ink hover:bg-white",
        pill:
          "h-13 rounded-full bg-lime px-7 text-[15px] text-lime-ink shadow-[0_18px_44px_-18px_rgba(190,220,60,0.8)] hover:bg-lime-bright",
        "pill-outline":
          "h-13 rounded-full border-foreground/20 px-7 text-[15px] text-foreground hover:border-foreground/40 hover:bg-surface",
      },
      size: {
        sm: "h-9 px-4 text-[13px] [&_svg]:size-3.5",
        default: "h-11 px-5 [&_svg]:size-4",
        lg: "h-13 px-7 text-[15px] [&_svg]:size-4",
        icon: "size-11 [&_svg]:size-4",
        "icon-sm": "size-9 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
