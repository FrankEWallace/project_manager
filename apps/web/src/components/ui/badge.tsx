import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-border text-foreground",
        // Soft tonal status variants (Notion/Linear style)
        success: "border-transparent bg-success/12 text-success",
        warning: "border-transparent bg-warning/20 text-warning-foreground",
        info: "border-transparent bg-info/12 text-info",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

/** Domain status → soft badge variant + human label. Single source of truth. */
const STATUS_VARIANT: Record<string, { variant: BadgeVariant; label: string }> = {
  active: { variant: "info", label: "Active" },
  completed: { variant: "success", label: "Completed" },
  on_hold: { variant: "warning", label: "On hold" },
  draft: { variant: "muted", label: "Draft" },
  cancelled: { variant: "destructive", label: "Cancelled" },
}

const PRIORITY_VARIANT: Record<string, { variant: BadgeVariant; label: string }> = {
  low: { variant: "muted", label: "Low" },
  medium: { variant: "info", label: "Medium" },
  high: { variant: "warning", label: "High" },
  critical: { variant: "destructive", label: "Critical" },
}

function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const s = STATUS_VARIANT[status] ?? {
    variant: "muted" as BadgeVariant,
    label: status.replace(/_/g, " "),
  }
  return (
    <Badge variant={s.variant} className={cn("capitalize", className)}>
      {s.label}
    </Badge>
  )
}

function PriorityBadge({
  priority,
  className,
}: {
  priority: string
  className?: string
}) {
  const p = PRIORITY_VARIANT[priority] ?? {
    variant: "muted" as BadgeVariant,
    label: priority,
  }
  return (
    <Badge variant={p.variant} className={cn("capitalize", className)}>
      {p.label}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge, PriorityBadge, STATUS_VARIANT, PRIORITY_VARIANT }
