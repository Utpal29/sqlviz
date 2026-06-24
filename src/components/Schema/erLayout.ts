import type { TableInfo } from "../../types/database";

export interface ColumnAnchor {
  x: number;
  y: number;
}

export interface TableLayout {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  columnAnchors: Record<string, ColumnAnchor>;
}

export interface EdgeLayout {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface ERLayout {
  tables: TableLayout[];
  edges: EdgeLayout[];
  width: number;
  height: number;
}

const TABLE_WIDTH = 240;
const HEADER_H = 36;
const ROW_H = 22;
const ROW_PADDING = 8;
const H_GAP = 60;
const V_GAP = 56;
const COLS = 3;

export function layoutERDiagram(tables: TableInfo[]): ERLayout {
  const positions: TableLayout[] = [];
  const rows: TableInfo[][] = [];
  for (let i = 0; i < tables.length; i += COLS) {
    rows.push(tables.slice(i, i + COLS));
  }

  let cursorY = 0;
  let totalW = 0;

  for (const row of rows) {
    const heights = row.map(
      (t) => HEADER_H + t.columns.length * ROW_H + ROW_PADDING * 2,
    );
    const rowHeight = Math.max(...heights);
    row.forEach((table, colIndex) => {
      const x = colIndex * (TABLE_WIDTH + H_GAP);
      const height = HEADER_H + table.columns.length * ROW_H + ROW_PADDING * 2;
      const anchors: Record<string, ColumnAnchor> = {};
      table.columns.forEach((c, i) => {
        anchors[c.name] = {
          x,
          y: cursorY + HEADER_H + ROW_PADDING + i * ROW_H + ROW_H / 2,
        };
      });
      positions.push({
        name: table.name,
        x,
        y: cursorY,
        width: TABLE_WIDTH,
        height,
        columnAnchors: anchors,
      });
      totalW = Math.max(totalW, x + TABLE_WIDTH);
    });
    cursorY += rowHeight + V_GAP;
  }

  const edges: EdgeLayout[] = [];
  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      edges.push({
        id: `${table.name}-${fk.fromColumn}->${fk.toTable}-${fk.toColumn}`,
        fromTable: table.name,
        fromColumn: fk.fromColumn,
        toTable: fk.toTable,
        toColumn: fk.toColumn,
      });
    }
  }

  return { tables: positions, edges, width: totalW, height: cursorY - V_GAP };
}

export function edgeFkPath(
  from: TableLayout,
  fromAnchor: ColumnAnchor,
  to: TableLayout,
  toAnchor: ColumnAnchor,
): string {
  const fromOnLeft = from.x + from.width / 2 < to.x + to.width / 2;
  const sx = fromOnLeft ? from.x + from.width : from.x;
  const sy = fromAnchor.y;
  const tx = fromOnLeft ? to.x : to.x + to.width;
  const ty = toAnchor.y;
  const dx = Math.max(40, Math.abs(tx - sx) * 0.4);
  const c1x = sx + (fromOnLeft ? dx : -dx);
  const c2x = tx + (fromOnLeft ? -dx : dx);
  return `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x} ${ty}, ${tx} ${ty}`;
}
