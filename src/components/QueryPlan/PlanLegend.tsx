import { NODE_COLORS } from "./planVisuals";

export function PlanLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-3 py-2">
      {Object.entries(NODE_COLORS).map(([type, color]) => (
        <div
          key={type}
          className="flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-2 py-1"
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color.fill }} />
          <span className="font-mono text-[10px] uppercase text-text-muted">
            {color.label}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1">
        <span className="h-2.5 w-2.5 rounded-full border border-warning" />
        <span className="font-mono text-[10px] uppercase text-warning">Diff</span>
      </div>
    </div>
  );
}
