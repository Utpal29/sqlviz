import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { PlanLayout } from "./layout";
import { NODE_COLORS } from "./planVisuals";

const MAP_W = 180;
const MAP_H = 120;
const CANVAS_PADDING = 80;

interface PlanMiniMapProps {
  layout: PlanLayout | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  activeNodeId: number | null;
  selectedId: number | null;
}

export function PlanMiniMap({ layout, scrollRef, zoom, activeNodeId, selectedId }: PlanMiniMapProps) {
  const [viewport, setViewport] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const dragRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !layout) return undefined;
    const update = () => {
      setViewport({
        x: el.scrollLeft,
        y: el.scrollTop,
        w: el.clientWidth,
        h: el.clientHeight,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [scrollRef, layout, zoom]);

  if (!layout || layout.nodes.length <= 3) return null;

  const contentW = (layout.width + CANVAS_PADDING * 2) * zoom;
  const contentH = (layout.height + CANVAS_PADDING * 2) * zoom;
  if (contentW <= 0 || contentH <= 0) return null;

  const scale = Math.min(MAP_W / contentW, MAP_H / contentH);
  const renderW = contentW * scale;
  const renderH = contentH * scale;

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / scale - viewport.w / 2;
    const py = (event.clientY - rect.top) / scale - viewport.h / 2;
    el.scrollLeft = Math.max(0, Math.min(contentW - viewport.w, px));
    el.scrollTop = Math.max(0, Math.min(contentH - viewport.h, py));
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    const el = scrollRef.current;
    if (!drag || !el) return;
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;
    el.scrollLeft = Math.max(0, Math.min(contentW - viewport.w, drag.scrollLeft + dx));
    el.scrollTop = Math.max(0, Math.min(contentH - viewport.h, drag.scrollTop + dy));
  };

  const onPointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragRef.current = null;
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10">
      <div
        className="pointer-events-auto rounded-md border border-border bg-bg-elevated/90 p-1 shadow-lg backdrop-blur"
        style={{ width: renderW + 8, height: renderH + 8 }}
      >
        <svg
          width={renderW}
          height={renderH}
          viewBox={`0 0 ${contentW} ${contentH}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: "crosshair", display: "block" }}
        >
          <rect width={contentW} height={contentH} fill="rgb(var(--plan-surface-muted) / 0.5)" />
          <g transform={`translate(${CANVAS_PADDING * zoom}, ${CANVAS_PADDING * zoom})`}>
            {layout.nodes.map((n) => {
              const color = NODE_COLORS[n.node.type];
              const active = n.id === activeNodeId;
              const selected = n.id === selectedId;
              return (
                <rect
                  key={n.id}
                  x={n.x * zoom}
                  y={n.y * zoom}
                  width={n.width * zoom}
                  height={n.height * zoom}
                  rx={6 * zoom}
                  fill={color.fill}
                  fillOpacity={active || selected ? 1 : 0.7}
                  stroke={selected ? "rgb(var(--text-primary))" : "none"}
                  strokeWidth={3}
                />
              );
            })}
          </g>
          <rect
            x={viewport.x}
            y={viewport.y}
            width={viewport.w}
            height={viewport.h}
            fill="rgba(59,130,246,0.12)"
            stroke="#3B82F6"
            strokeWidth={3}
          />
        </svg>
      </div>
    </div>
  );
}
