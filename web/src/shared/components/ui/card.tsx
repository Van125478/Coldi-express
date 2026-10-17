import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn("rounded-2xl border border-border bg-card text-card-foreground", className)} {...props} />;
}

export { Card };
