import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Frame,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
} from "lucide-react";
import { Lightbulb, X } from "lucide-react";
import { useResultsStore } from "../../store/resultsStore";
import { layoutPlan } from "./layout";
import { PlanCanvas } from "./PlanCanvas";
import { PlanLegend } from "./PlanLegend";
import { PlanMiniMap } from "./PlanMiniMap";
import { NODE_COLORS, captionFor, executionOrder, topHint } from "./planVisuals";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.15;
const STEP_MS = 800;
const CANVAS_PADDING = 80;
const DRAG_THRESHOLD = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function PlanGraph() {
  const plan = useResultsStore((s) => s.lastPlan);
  const lastResult = useResultsStore((s) => s.lastResult);
  const selected = useResultsStore((s) => s.selectedPlanNodeId);
  const setSelected = useResultsStore((s) => s.setSelectedPlanNodeId);
  const [zoom, setZoom] = useState(1);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldAutoFit, setShouldAutoFit] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
    captured: boolean;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const [prevPlan, setPrevPlan] = useState(plan);
  if (prevPlan !== plan) {
    setPrevPlan(plan);
    setActiveStep(0);
    setIsPlaying(false);
    setShouldAutoFit(true);
  }

  const layout = useMemo(() => (plan ? layoutPlan(plan) : null), [plan]);
  const steps = useMemo(() => (plan ? executionOrder(plan) : []), [plan]);
  const hint = useMemo(() => topHint(plan), [plan]);
  const navGraph = useMemo(() => {
    const childrenOf = new Map<number | null, number[]>();
    const parentOf = new Map<number, number | null>();
    if (layout) {
      for (const n of layout.nodes) {
        parentOf.set(n.id, n.parentId);
        const key = n.parentId;
        if (!childrenOf.has(key)) childrenOf.set(key, []);
        childrenOf.get(key)!.push(n.id);
      }
    }
    return { childrenOf, parentOf };
  }, [layout]);
  const currentStep = steps.length === 0 ? 0 : clamp(activeStep, 0, steps.length - 1);
  const activeNode = steps[currentStep];
  const activeNodeId = activeNode?.id ?? null;
  const selectedNode = selected == null ? null : layout?.nodes.find((node) => node.id === selected);
  const completedNodeIds = new Set(steps.slice(0, currentStep + 1).map((step) => step.id));
  const playbackCaption = captionFor(activeNode, currentStep, steps.length);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return undefined;
    const interval = window.setInterval(() => {
      setActiveStep((step) => {
        if (step >= steps.length - 1) {
          setIsPlaying(false);
          return step;
        }
        return step + 1;
      });
    }, STEP_MS);
    return () => window.clearInterval(interval);
  }, [isPlaying, steps.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      setShouldAutoFit(false);
      setZoom((current) => clamp(current + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (!shouldAutoFit || !layout) return undefined;
    const frame = requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (!container) return;
      const availableW = container.clientWidth - 24;
      const availableH = container.clientHeight - 24;
      const contentW = layout.width + CANVAS_PADDING * 2;
      const contentH = layout.height + CANVAS_PADDING * 2;
      if (contentW <= 0 || contentH <= 0) return;
      const next = clamp(
        Math.min(1, Math.min(availableW / contentW, availableH / contentH)),
        MIN_ZOOM,
        MAX_ZOOM,
      );
      setZoom(next);
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
        el.scrollTop = 0;
      });
      setShouldAutoFit(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [shouldAutoFit, layout]);

  if (!plan || !layout) {
    if (lastResult?.error) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="max-w-md rounded-lg border border-error/30 bg-error/5 p-4 text-sm">
            <div className="mb-1 font-mono text-xs uppercase tracking-wider text-error">
              Query failed
            </div>
            <p className="text-text-primary">
              Fix the SQL in the editor and run again — the execution plan will appear here.
            </p>
          </div>
        </div>
      );
    }
    if (lastResult) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="max-w-md rounded-lg border border-border bg-bg-elevated p-4 text-sm">
            <div className="mb-1 font-mono text-xs uppercase tracking-wider text-text-muted">
              No plan available
            </div>
            <p className="text-text-primary">
              SQLite didn&apos;t produce an execution plan for this query. DDL (
              <code className="font-mono text-xs">CREATE</code>,{" "}
              <code className="font-mono text-xs">DROP</code>), <code className="font-mono text-xs">PRAGMA</code>,
              and other non-SELECT statements don&apos;t go through the query planner.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Run a query to see its execution plan.
      </div>
    );
  }

  const playOrPause = () => {
    if (steps.length === 0) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (currentStep >= steps.length - 1) {
      setActiveStep(0);
    }
    setIsPlaying(true);
  };

  const stepBackward = () => {
    setIsPlaying(false);
    setActiveStep((step) => Math.max(0, step - 1));
  };

  const stepForward = () => {
    setIsPlaying(false);
    setActiveStep((step) => Math.min(steps.length - 1, step + 1));
  };

  const fitToView = () => {
    const container = scrollRef.current;
    if (!container || !layout) return;
    const availableW = container.clientWidth - 24;
    const availableH = container.clientHeight - 24;
    const contentW = layout.width + CANVAS_PADDING * 2;
    const contentH = layout.height + CANVAS_PADDING * 2;
    if (contentW <= 0 || contentH <= 0) return;
    const next = clamp(
      Math.min(1, Math.min(availableW / contentW, availableH / contentH)),
      MIN_ZOOM,
      MAX_ZOOM,
    );
    setZoom(next);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      el.scrollTop = 0;
    });
  };

  const handleManualZoom = (next: number) => {
    setShouldAutoFit(false);
    setZoom(clamp(next, MIN_ZOOM, MAX_ZOOM));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea, [data-plan-node]")) return;
    const el = scrollRef.current;
    if (!el) return;
    const overflowsX = el.scrollWidth > el.clientWidth;
    const overflowsY = el.scrollHeight > el.clientHeight;
    if (!overflowsX && !overflowsY && event.button === 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      captured: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const el = scrollRef.current;
    if (!drag || !el) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.captured) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.captured = true;
      el.setPointerCapture(drag.pointerId);
      setIsPanning(true);
    }
    el.scrollLeft = drag.scrollLeft - dx;
    el.scrollTop = drag.scrollTop - dy;
  };

  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.captured) {
      scrollRef.current?.releasePointerCapture(event.pointerId);
      setIsPanning(false);
    }
    dragStateRef.current = null;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement) {
      const tag = event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
    }
    if (event.key === "Escape") {
      if (selected !== null) {
        event.preventDefault();
        setSelected(null);
      }
      return;
    }
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      playOrPause();
      return;
    }
    if (event.key === "Enter" && activeNodeId != null) {
      event.preventDefault();
      setSelected(activeNodeId);
      return;
    }
    const currentId = selected ?? activeNodeId;
    if (currentId == null) return;
    const { childrenOf, parentOf } = navGraph;
    let nextId: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const parentId = parentOf.get(currentId) ?? null;
      const siblings = childrenOf.get(parentId) ?? [];
      const idx = siblings.indexOf(currentId);
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const target = siblings[idx + delta];
      if (target != null) nextId = target;
    } else if (event.key === "ArrowUp") {
      const parentId = parentOf.get(currentId);
      if (parentId != null) nextId = parentId;
    } else if (event.key === "ArrowDown") {
      const kids = childrenOf.get(currentId) ?? [];
      if (kids.length > 0) nextId = kids[0];
    }
    if (nextId != null) {
      event.preventDefault();
      setSelected(nextId);
    }
  };

  return (
    <div
      className="flex h-full w-full flex-col outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="font-mono text-xs text-text-muted whitespace-nowrap">
            {layout.nodes.length} plan nodes
          </div>
          <div className="min-w-0 truncate text-sm text-text-muted">
            {playbackCaption}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border bg-bg-elevated p-1">
            <button
              type="button"
              aria-label="Previous plan step"
              disabled={currentStep === 0}
              onClick={stepBackward}
              className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              aria-label={isPlaying ? "Pause plan playback" : "Play plan playback"}
              onClick={playOrPause}
              className="flex h-7 w-7 items-center justify-center rounded bg-accent text-white transition-colors hover:bg-accent/90"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              type="button"
              aria-label="Next plan step"
              disabled={currentStep >= steps.length - 1}
              onClick={stepForward}
              className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Fit plan to view"
            onClick={fitToView}
            title="Fit to view"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-bg-elevated text-text-muted transition-colors hover:border-border-glow hover:text-text-primary"
          >
            <Frame size={14} />
          </button>
          <div className="flex items-center gap-1 rounded-md border border-border bg-bg-elevated p-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => handleManualZoom(zoom - ZOOM_STEP)}
              className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={() => handleManualZoom(1)}
              className="flex h-7 min-w-12 items-center justify-center gap-1 rounded px-2 font-mono text-[11px] text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <Maximize2 size={12} />
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => handleManualZoom(zoom + ZOOM_STEP)}
              className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
      {hint && (
        <button
          type="button"
          onClick={() => setSelected(hint.node.id)}
          className="flex items-start gap-2 border-b border-warning/30 bg-warning/5 px-3 py-2 text-left text-sm text-warning transition-colors hover:bg-warning/10"
        >
          <Lightbulb size={14} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="font-medium">
              {NODE_COLORS[hint.node.type].label}
              {hint.node.tableName ? ` · ${hint.node.tableName}` : ""}:
            </span>{" "}
            <span className="text-text-primary">{hint.hint}</span>
          </span>
        </button>
      )}
      <PlanLegend />
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className={`absolute inset-0 overflow-auto p-4 ${isPanning ? "cursor-grabbing select-none" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          <PlanCanvas
            plan={plan}
            zoom={zoom}
            selectedId={selected}
            activeNodeId={activeNodeId}
            completedNodeIds={completedNodeIds}
            onSelect={(id) => setSelected(selected === id ? null : id)}
          />
        </div>

        {selectedNode && (
          <div className="pointer-events-none absolute right-4 top-4 z-10 w-80 max-w-[calc(100%-2rem)]">
            <div className="pointer-events-auto rounded-lg border border-border bg-bg-elevated/95 p-4 text-sm shadow-xl backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono text-xs uppercase tracking-wider text-text-muted">
                  Node Detail
                </div>
                <div className="flex items-center gap-2">
                  {selectedNode.node.isExpensive && (
                    <span className="rounded bg-warning/15 px-2 py-0.5 font-mono text-[11px] uppercase text-warning">
                      Expensive
                    </span>
                  )}
                  <span className="rounded bg-bg-secondary px-2 py-0.5 font-mono text-[11px] uppercase text-text-muted">
                    {NODE_COLORS[selectedNode.node.type].label}
                  </span>
                  <button
                    type="button"
                    aria-label="Close node detail"
                    onClick={() => setSelected(null)}
                    className="rounded p-0.5 text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
                {selectedNode.node.tableName && (
                  <>
                    <dt className="text-text-muted">Table</dt>
                    <dd className="text-text-primary">{selectedNode.node.tableName}</dd>
                  </>
                )}
                {selectedNode.node.indexName && (
                  <>
                    <dt className="text-text-muted">Index</dt>
                    <dd className="text-text-primary">{selectedNode.node.indexName}</dd>
                  </>
                )}
                {selectedNode.node.estimatedRows != null && (
                  <>
                    <dt className="text-text-muted">Est. rows</dt>
                    <dd className="text-text-primary">
                      {selectedNode.node.estimatedRows.toLocaleString()}
                    </dd>
                  </>
                )}
              </dl>
              <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs text-text-primary">
                {selectedNode.node.detail}
              </pre>
              {selectedNode.node.hint && (
                <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                  <span className="font-medium">Hint:</span> {selectedNode.node.hint}
                </div>
              )}
            </div>
          </div>
        )}

        <PlanMiniMap
          layout={layout}
          scrollRef={scrollRef}
          zoom={zoom}
          activeNodeId={activeNodeId}
          selectedId={selected}
        />
      </div>
    </div>
  );
}
