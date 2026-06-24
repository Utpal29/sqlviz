import * as Dialog from "@radix-ui/react-dialog";
import { Key, Link2, Network, X } from "lucide-react";
import { useMemo } from "react";
import { useDatabaseStore } from "../../store/databaseStore";
import { edgeFkPath, layoutERDiagram, type TableLayout } from "./erLayout";

const PADDING = 40;

interface ERDiagramProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ERDiagram({ open, onOpenChange }: ERDiagramProps) {
  const schema = useDatabaseStore((s) => s.schema);
  const datasetName = useDatabaseStore((s) => s.currentDataset);

  const layout = useMemo(
    () => (schema ? layoutERDiagram(schema.tables) : null),
    [schema],
  );
  const tableByName = useMemo(() => {
    if (!layout) return new Map<string, TableLayout>();
    return new Map(layout.tables.map((t) => [t.name, t]));
  }, [layout]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex h-[85vh] w-[90vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Network size={16} className="text-accent" />
              <Dialog.Title className="text-sm font-medium text-text-primary">
                ER diagram — {datasetName}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close ER diagram"
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {layout && schema ? (
              <svg
                viewBox={`0 0 ${layout.width + PADDING * 2} ${layout.height + PADDING * 2}`}
                style={{
                  width: layout.width + PADDING * 2,
                  height: layout.height + PADDING * 2,
                  minWidth: "100%",
                }}
                className="mx-auto block"
              >
                <defs>
                  <marker
                    id="er-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#06B6D4" />
                  </marker>
                </defs>
                <g transform={`translate(${PADDING}, ${PADDING})`}>
                  {layout.edges.map((edge) => {
                    const from = tableByName.get(edge.fromTable);
                    const to = tableByName.get(edge.toTable);
                    if (!from || !to) return null;
                    const fromAnchor = from.columnAnchors[edge.fromColumn];
                    const toAnchor = to.columnAnchors[edge.toColumn];
                    if (!fromAnchor || !toAnchor) return null;
                    return (
                      <path
                        key={edge.id}
                        d={edgeFkPath(from, fromAnchor, to, toAnchor)}
                        stroke="#06B6D4"
                        strokeWidth={1.5}
                        fill="none"
                        markerEnd="url(#er-arrow)"
                        opacity={0.75}
                      />
                    );
                  })}
                  {layout.tables.map((tableLayout) => {
                    const table = schema.tables.find((t) => t.name === tableLayout.name);
                    if (!table) return null;
                    return (
                      <g key={table.name} transform={`translate(${tableLayout.x}, ${tableLayout.y})`}>
                        <rect
                          width={tableLayout.width}
                          height={tableLayout.height}
                          rx={10}
                          fill="rgba(26,34,51,0.95)"
                          stroke="#1E293B"
                          strokeWidth={1}
                        />
                        <rect
                          width={tableLayout.width}
                          height={36}
                          rx={10}
                          fill="rgba(59,130,246,0.18)"
                        />
                        <rect width={tableLayout.width} height={36 - 10} y={10} fill="rgba(59,130,246,0.18)" />
                        <text
                          x={14}
                          y={23}
                          fontFamily="Inter"
                          fontWeight="600"
                          fontSize="13"
                          fill="#E2E8F0"
                        >
                          {table.name}
                        </text>
                        <text
                          x={tableLayout.width - 14}
                          y={23}
                          fontFamily="JetBrains Mono"
                          fontSize="10"
                          fill="#64748B"
                          textAnchor="end"
                        >
                          {table.rowCount.toLocaleString()} rows
                        </text>
                        {table.columns.map((c, i) => {
                          const y = 36 + 8 + i * 22 + 14;
                          const isFk = table.foreignKeys.some((fk) => fk.fromColumn === c.name);
                          return (
                            <g key={c.name}>
                              <text
                                x={14}
                                y={y}
                                fontFamily="JetBrains Mono"
                                fontSize="11"
                                fill={c.isPrimaryKey ? "#FBBF24" : "#E2E8F0"}
                              >
                                {c.name}
                              </text>
                              <text
                                x={tableLayout.width - 14}
                                y={y}
                                fontFamily="JetBrains Mono"
                                fontSize="10"
                                fill="#64748B"
                                textAnchor="end"
                              >
                                {c.type}
                              </text>
                              {c.isPrimaryKey && (
                                <g transform={`translate(${tableLayout.width - 60}, ${y - 10})`}>
                                  <Key size={11} color="#FBBF24" />
                                </g>
                              )}
                              {isFk && !c.isPrimaryKey && (
                                <g transform={`translate(${tableLayout.width - 60}, ${y - 10})`}>
                                  <Link2 size={11} color="#06B6D4" />
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </g>
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">
                Loading schema…
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
