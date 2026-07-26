const COLORS: Record<string, string> = {
  active: "bg-accent",
  ok: "bg-accent",
  live: "bg-accent",
  building: "bg-amber-400",
  "standing-up": "bg-amber-400",
  "pre-launch": "bg-sky-400",
  paused: "bg-faint",
  sunset: "bg-faint",
  error: "bg-red-400",
  skipped: "bg-faint",
};

const LABELS: Record<string, string> = {
  active: "active",
  ok: "ok",
  live: "live",
  building: "building",
  "standing-up": "standing up",
  "pre-launch": "pre-launch",
  paused: "paused",
  sunset: "sunset",
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
