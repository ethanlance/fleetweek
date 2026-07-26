const COLORS: Record<string, string> = {
  active: "bg-accent",
  ok: "bg-accent",
  "standing-up": "bg-amber-400",
  paused: "bg-faint",
  error: "bg-red-400",
  skipped: "bg-faint",
};

const LABELS: Record<string, string> = {
  active: "active",
  ok: "ok",
  "standing-up": "standing up",
  paused: "paused",
  error: "error",
  skipped: "skipped",
};

export function StatusDot({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${COLORS[status] ?? "bg-faint"}`}
      />
      {LABELS[status] ?? status}
    </span>
  );
}
