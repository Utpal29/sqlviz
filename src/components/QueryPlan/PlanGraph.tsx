import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
} from "lucide-react";
import { useResultsStore } from "../../store/resultsStore";
import { layoutPlan } from "./layout";
import { PlanCanvas } from "./PlanCanvas";
import { PlanLegend } from "./PlanLegend";
import { NODE_COLORS, captionFor, executionOrder } from "./planVisuals";

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 1.7;
const ZOOM_STEP = 0.15;
const STEP_MS = 800;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function PlanGraph() {
  const plan = useResultsStore((s) => s.lastPlan);
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const layout = useMemo(() => (plan ? layoutPlan(plan) : null), [plan]);
  const steps = useMemo(() => (plan ? executionOrder(plan) : []), [plan]);
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

  if (!plan || !layout) {
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

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="font-mono text-xs text-text-muted">
            {layout.nodes.length} plan nodes
          </div>
          <div className="hidden max-w-xl truncate text-sm text-text-muted lg:block">
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
          <div className="flex items-center gap-1 rounded-md border border-border bg-bg-elevated p-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => clamp(z - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
              className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={() => setZoom(1)}
              className="flex h-7 min-w-12 items-center justify-center gap-1 rounded px-2 font-mono text-[11px] text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <Maximize2 size={12} />
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => clamp(z + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
              className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
      <div className="border-b border-border/50 px-3 py-2 text-sm text-text-muted lg:hidden">
        {playbackCaption}
      </div>
      <PlanLegend />
      <div className="flex-1 overflow-auto p-4">
        <PlanCanvas
          plan={plan}
          zoom={zoom}
          selectedId={selected}
          activeNodeId={activeNodeId}
          completedNodeIds={completedNodeIds}
          onSelect={(id) => setSelected(selected === id ? null : id)}
        />

        {selectedNode && (
          <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-border bg-bg-elevated p-4 text-sm shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-xs uppercase tracking-wider text-text-muted">
                Node Detail
              </div>
              <span className="rounded bg-bg-secondary px-2 py-0.5 font-mono text-[11px] uppercase text-text-muted">
                {NODE_COLORS[selectedNode.node.type].label}
              </span>
            </div>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-text-primary">
              {selectedNode.node.detail}
            </pre>
            {selectedNode.node.hint && (
              <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-warning">
                <span className="font-medium">Hint:</span> {selectedNode.node.hint}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
