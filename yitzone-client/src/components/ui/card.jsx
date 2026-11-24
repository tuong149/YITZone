import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground",
        interactive &&
          "cursor-pointer transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-primary/45 hover:shadow-popover active:scale-[0.995]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef(
  ({ className,...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef(
  ({ className,...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display text-lg font-medium leading-snug tracking-tight text-card-foreground", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef(({ className,...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef(
  ({ className,...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef(
  ({ className,...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2 p-5 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
