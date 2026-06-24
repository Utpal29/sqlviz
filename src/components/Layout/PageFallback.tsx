export function PageFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-sm text-text-muted">
        <div className="h-1 w-32 overflow-hidden rounded-full bg-bg-elevated">
          <div className="h-full w-1/3 animate-pulse bg-accent" />
        </div>
        Loading…
      </div>
    </div>
  );
}
