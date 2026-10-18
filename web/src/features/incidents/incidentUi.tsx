import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { formatIncidentWhen } from "@/features/incidents/incidentPresentation";
import { StatusBadge } from "@/features/workspace/ui";

export function incidentTone(status: string): "open" | "waiting" | "assigned" | "neutral" {
  if (status === "OPEN") return "waiting";
  if (status === "ACKNOWLEDGED") return "open";
  if (status === "IN_PROGRESS") return "assigned";
  return "neutral";
}

export function formatWhen(value: string | null): string {
  return formatIncidentWhen(value);
}

export function Field({
  id,
  label,
  error,
  hint,
  required = true,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const errorId = `${id}-error`;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean; className?: string }>, {
        "aria-describedby": error ? errorId : undefined,
        "aria-invalid": error ? true : undefined,
        className: `${(children.props as { className?: string }).className ?? ""} ${error ? "border-danger" : ""}`.trim(),
      })
    : children;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-danger"> *</span> : <span className="font-normal text-muted"> (không bắt buộc)</span>}
      </Label>
      {control}
      {error ? (
        <p id={errorId} className="text-sm text-ink">
          {error}
        </p>
      ) : null}
      {hint && !error ? <p className="text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function IncidentBadges({ status, statusLabel, categoryLabel }: { status: string; statusLabel: string; categoryLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge tone={incidentTone(status)}>
        <span className="text-sm">{statusLabel}</span>
      </StatusBadge>
      <span className="inline-flex items-center rounded-full border border-line bg-canvas px-3 py-1 text-sm font-semibold text-ink">{categoryLabel}</span>
    </div>
  );
}
