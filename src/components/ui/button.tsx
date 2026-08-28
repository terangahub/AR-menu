import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Boutons - spec reflect.app mesurée (voir CONTEXT.md) :
// primaire = solide, radius 7px (--radius), padding 12px 24px, weight 500,
// hover = variation de luminosité ±8% sur 150ms ; secondaire = "ghost",
// fond transparent, bordure 1px blanc 25% d'opacité.
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Encre pleine et non l'aplat lavande de `--primary` : c'est la
        // règle appliquée au menu public (états actifs en `bg-foreground`),
        // et elle vaut des deux côtés du produit. En sombre les deux
        // valeurs sont de toute façon quasi identiques (#efedfd contre
        // #f0d8f0), la différence se voit surtout en clair, où la lavande
        // pâle donnait un bouton délavé.
        default: "bg-foreground text-background hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
        // `border-white/25` venait de la landing, qui force le mode sombre :
        // sur le fond clair du dashboard, une bordure blanche à 25 % est
        // purement et simplement invisible, et le bouton disparaissait. Les
        // tokens sémantiques donnent le même rendu en sombre (--border vaut
        // #484860, très proche de blanc 25 % sur ce fond) et un contour réel
        // en clair.
        outline:
          "border border-border bg-transparent text-foreground hover:border-foreground/40 hover:bg-foreground/[0.04]",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-110",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-auto px-6 py-3",
        sm: "h-auto rounded-lg px-4 py-2 text-xs",
        lg: "h-auto px-8 py-4",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
