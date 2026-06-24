import { motion } from "framer-motion";
import { useMemo } from "react";
import { layoutPlan, type NodeLayout } from "./layout";
import { NODE_COLORS, planSignature } from "./planVisuals";
import type { PlanNode } from "../../types/plan";

const PADDING = 40;

function truncateLabel(input: string, max: number): string {
  const clean = input.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1))}…`;
}

function formatRows(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function edgePath(parent: NodeLayout, child: NodeLayout): string {
  const px = parent.x + parent.width / 2;
  const py = parent.y + parent.height;
  const cx = child.x + child.width / 2;
  const cy = child.y;
  const midY = (py + cy) / 2;
  return `M ${px} ${py} C ${px} ${midY}, ${cx} ${midY}, ${cx} ${cy}`;
}

export interface PlanCanvasProps {
  plan: PlanNode;
  zoom: number;
  selectedId?: number | null;
  activeNodeId?: number | null;
  completedNodeIds?: Set<number>;
  diffSignatures?: Set<string>;
  onSelect?: (id: number) => void;
  compact?: boolean;
}

export function PlanCanvas({
  plan,
  zoom,
  selectedId = null,
  activeNodeId = null,
  completedNodeIds,
  diffSignatures,
  onSelect,
  compact = false,
}: PlanCanvasProps) {
  const layout = useMemo(() => layoutPlan(plan), [plan]);
  const nodeMap = new Map(layout.nodes.map((node) => [node.id, node]));
  const width = layout.width + PADDING * 2;
  const height = layout.height + PADDING * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto block transition-[width,height] duration-200 ease-apple"
      style={{ width: width * zoom, height: height * zoom, minWidth: width * zoom }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={`translate(${PADDING}, ${PADDING})`}>
        {layout.nodes.map((node) => {
          if (node.parentId == null) return null;
          const parent = nodeMap.get(node.parentId);
          if (!parent) return null;
          const complete = completedNodeIds?.has(node.id) ?? true;
          const active = node.id === activeNodeId;
          const color = NODE_COLORS[node.node.type];
          return (
            <motion.path
              key={`edge-${node.id}`}
              d={edgePath(parent, node)}
              stroke={complete ? color.stroke : "rgb(var(--plan-stroke))"}
              strokeWidth={active ? 2.5 : 1.5}
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: complete ? 1 : 0.45 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}

        {layout.nodes.map((node, index) => {
          const color = NODE_COLORS[node.node.type];
          const selected = selectedId === node.id;
          const active = node.id === activeNodeId;
          const complete = completedNodeIds?.has(node.id) ?? true;
          const changed = diffSignatures?.has(planSignature(node.node)) ?? false;
          const isRoot = node.node.type === "root";
          const primaryLabel = node.node.tableName ?? node.node.detail;
          const secondaryParts: string[] = [];
          if (node.node.indexName) secondaryParts.push(`via ${node.node.indexName}`);
          if (node.node.estimatedRows != null) {
            secondaryParts.push(`≈ ${formatRows(node.node.estimatedRows)} rows`);
          }
          const secondaryLabel = secondaryParts.length > 0 ? secondaryParts.join(" · ") : undefined;
          const titleParts = [
            color.label,
            node.node.tableName,
            node.node.indexName ? `via ${node.node.indexName}` : null,
            node.node.detail,
          ].filter(Boolean) as string[];

          return (
            <g
              key={`node-${node.id}`}
              transform={`translate(${node.x}, ${node.y})`}
            >
              <motion.g
                data-plan-node="1"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: compact ? 0 : index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => onSelect?.(node.id)}
                style={{ cursor: onSelect ? "pointer" : "default" }}
              >
                <title>{titleParts.join(" — ")}</title>
                {changed && (
                  <rect
                    x={-6}
                    y={-6}
                    width={node.width + 12}
                    height={node.height + 12}
                    rx={16}
                    fill="none"
                    stroke="#F59E0B"
                    strokeDasharray="5 4"
                    strokeWidth={2}
                  />
                )}
                <rect
                  width={node.width}
                  height={node.height}
                  rx={12}
                  fill={
                    active
                      ? "rgb(var(--accent) / 0.16)"
                      : "rgb(var(--plan-surface) / 0.95)"
                  }
                  stroke={
                    active || selected
                      ? color.stroke
                      : complete
                        ? "rgb(var(--plan-stroke))"
                        : "rgb(var(--border))"
                  }
                  strokeWidth={active ? 2.5 : selected ? 2 : 1}
                  filter={node.node.isExpensive && !isRoot || active ? "url(#glow)" : undefined}
                />
                <rect x={0} y={0} width={4} height={node.height} rx={2} fill={color.fill} />
                <g
                  transform={`translate(${node.width - 28}, 12)`}
                  color={color.stroke}
                  style={{ opacity: 0.85 }}
                >
                  <color.Icon size={16} strokeWidth={2} />
                </g>
                <text
                  x={16}
                  y={22}
                  fontFamily="JetBrains Mono"
                  fontSize="10"
                  fontWeight="700"
                  fill={color.stroke}
                  letterSpacing="0.08em"
                >
                  {color.label}
                  {node.node.isExpensive && !isRoot && " · EXPENSIVE"}
                </text>
                <text
                  x={16}
                  y={42}
                  fontFamily="Inter"
                  fontSize="13"
                  fontWeight="500"
                  fill="rgb(var(--text-primary))"
                >
                  {truncateLabel(primaryLabel, 26)}
                </text>
                {secondaryLabel && (
                  <text
                    x={16}
                    y={56}
                    fontFamily="JetBrains Mono"
                    fontSize="10"
                    fill="rgb(var(--text-muted))"
                  >
                    {truncateLabel(secondaryLabel, 30)}
                  </text>
                )}
              </motion.g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
