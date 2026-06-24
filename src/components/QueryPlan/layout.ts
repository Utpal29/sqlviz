import type { PlanNode } from "../../types/plan";

export interface NodeLayout {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  node: PlanNode;
  parentId: number | null;
}

export interface PlanLayout {
  nodes: NodeLayout[];
  width: number;
  height: number;
}

const NODE_W = 220;
const NODE_H = 64;
const H_GAP = 28;
const V_GAP = 56;

interface Subtree {
  width: number;
  positions: NodeLayout[];
}

function layoutSubtree(node: PlanNode, depth: number, parentId: number | null): Subtree {
  if (node.children.length === 0) {
    return {
      width: NODE_W,
      positions: [
        {
          id: node.id,
          x: 0,
          y: depth * (NODE_H + V_GAP),
          width: NODE_W,
          height: NODE_H,
          node,
          parentId,
        },
      ],
    };
  }

  const childSubtrees = node.children.map((c) => layoutSubtree(c, depth + 1, node.id));
  const childrenTotal =
    childSubtrees.reduce((sum, st) => sum + st.width, 0) +
    H_GAP * (childSubtrees.length - 1);
  const myWidth = Math.max(NODE_W, childrenTotal);

  let cursor = (myWidth - childrenTotal) / 2;
  const positions: NodeLayout[] = [];
  const childCenters: number[] = [];

  for (let i = 0; i < childSubtrees.length; i += 1) {
    const st = childSubtrees[i];
    const childNodeId = node.children[i].id;
    for (const p of st.positions) {
      positions.push({ ...p, x: p.x + cursor });
    }
    const childRoot = positions.find((p) => p.id === childNodeId);
    if (childRoot) childCenters.push(childRoot.x + childRoot.width / 2);
    cursor += st.width + H_GAP;
  }

  const centerOfChildren =
    childCenters.length > 0
      ? (childCenters[0] + childCenters[childCenters.length - 1]) / 2
      : myWidth / 2;
  const parentX = centerOfChildren - NODE_W / 2;

  positions.push({
    id: node.id,
    x: parentX,
    y: depth * (NODE_H + V_GAP),
    width: NODE_W,
    height: NODE_H,
    node,
    parentId,
  });

  return { width: myWidth, positions };
}

export function layoutPlan(root: PlanNode): PlanLayout {
  const subtree = layoutSubtree(root, 0, null);
  const maxY = subtree.positions.reduce((m, p) => Math.max(m, p.y + p.height), 0);
  return {
    nodes: subtree.positions,
    width: subtree.width,
    height: maxY,
  };
}
