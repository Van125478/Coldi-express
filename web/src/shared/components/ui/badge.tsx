import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap", {
  variants: {
    tone: {
      open: "bg-canvas text-navy",
      waiting: "bg-warning-bg text-warning",
      assigned: "bg-success-bg text-success",
      neutral: "bg-canvas text-ink",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge };
