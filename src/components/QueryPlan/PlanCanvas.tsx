import { motion } from "framer-motion";
import { useMemo } from "react";
import { layoutPlan, type NodeLayout } from "./layout";
import { NODE_COLORS, planSignature } from "./planVisuals";
import type { PlanNode } from "../../types/plan";

const PADDING = 40;

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
              stroke={complete ? color.stroke : "#334155"}
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

          return (
            <motion.g
              key={`node-${node.id}`}
              transform={`translate(${node.x}, ${node.y})`}
              initial={{ opacity: 0, y: node.y - 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: compact ? 0 : index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => onSelect?.(node.id)}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
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
                fill={active ? "rgba(59,130,246,0.16)" : "rgba(26,34,51,0.85)"}
                stroke={
                  active || selected ? color.stroke : complete ? "#334155" : "#1E293B"
                }
                strokeWidth={active ? 2.5 : selected ? 2 : 1}
                filter={node.node.isExpensive || active ? "url(#glow)" : undefined}
              />
              <rect x={0} y={0} width={4} height={node.height} rx={2} fill={color.fill} />
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
                {node.node.isExpensive && " · EXPENSIVE"}
              </text>
              <text
                x={16}
                y={42}
                fontFamily="Inter"
                fontSize="13"
                fontWeight="500"
                fill="#E2E8F0"
              >
                {node.node.tableName ?? node.node.detail.slice(0, 24)}
              </text>
              {node.node.indexName && (
                <text x={16} y={56} fontFamily="JetBrains Mono" fontSize="10" fill="#64748B">
                  via {node.node.indexName}
                </text>
              )}
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
}
