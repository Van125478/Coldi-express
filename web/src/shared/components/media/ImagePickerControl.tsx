import { cn } from "@/lib/utils";

export function ImagePickerControl({
  id,
  buttonLabel,
  hintId,
  hint,
  optionalNote,
  accept = "image/jpeg,image/png,image/webp",
  multiple = true,
  disabled = false,
  describedBy,
  invalid = false,
  onFiles,
}: {
  id: string;
  buttonLabel: string;
  hintId?: string;
  hint?: string;
  optionalNote?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="sr-only"
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <label
          htmlFor={id}
          className={cn(
            "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          {buttonLabel}
        </label>
        {optionalNote ? <p className="text-sm font-semibold text-muted">{optionalNote}</p> : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-sm leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
