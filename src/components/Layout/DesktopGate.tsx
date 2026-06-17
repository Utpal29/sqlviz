import { Monitor } from "lucide-react";

export function DesktopGate() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Monitor size={24} />
      </div>
      <h1 className="font-display text-2xl font-bold">SQLViz needs a bigger canvas</h1>
      <p className="max-w-sm text-sm text-text-muted">
        Writing SQL and exploring execution plans is a desktop experience. Come back
        on a laptop or desktop browser.
      </p>
    </div>
  );
}
