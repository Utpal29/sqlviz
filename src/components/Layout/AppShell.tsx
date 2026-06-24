import { useState } from "react";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { SchemaExplorer } from "../Schema/SchemaExplorer";
import { SQLEditor } from "../Editor/SQLEditor";
import { EditorToolbar } from "../Editor/EditorToolbar";
import { ResultsTabs } from "../Results/ResultsTabs";
import { CommandPalette } from "../CommandPalette/CommandPalette";
import { ChallengeBanner } from "../Challenges/ChallengeBanner";
import { ChallengeComplete } from "../Challenges/ChallengeComplete";

const MIN_SCHEMA_WIDTH = 208;
const MAX_SCHEMA_WIDTH = 420;
const MIN_EDITOR_PERCENT = 28;
const MAX_EDITOR_PERCENT = 72;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function AppShell() {
  const [schemaWidth, setSchemaWidth] = useState(256);
  const [editorPercent, setEditorPercent] = useState(50);

  const startSchemaResize = () => {
    const onPointerMove = (event: PointerEvent) => {
      setSchemaWidth(clamp(event.clientX, MIN_SCHEMA_WIDTH, MAX_SCHEMA_WIDTH));
    };
    const stop = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stop);
  };

  const startEditorResize = (startEvent: React.PointerEvent<HTMLDivElement>) => {
    const container = startEvent.currentTarget.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const onPointerMove = (event: PointerEvent) => {
      const next = ((event.clientY - rect.top) / rect.height) * 100;
      setEditorPercent(clamp(next, MIN_EDITOR_PERCENT, MAX_EDITOR_PERCENT));
    };
    const stop = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stop);
  };

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className="shrink-0 bg-bg-secondary/40 backdrop-blur-sm"
          style={{ width: schemaWidth }}
        >
          <SchemaExplorer />
        </aside>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize schema panel"
          tabIndex={0}
          onPointerDown={startSchemaResize}
          className="w-1 cursor-col-resize border-x border-border/70 bg-bg-primary transition-colors hover:bg-accent/40"
        />
        <main className="flex flex-1 flex-col overflow-hidden">
          <ChallengeBanner />
          <section
            className="flex min-h-0 flex-col"
            style={{ height: `${editorPercent}%` }}
          >
            <EditorToolbar />
            <div className="flex-1 overflow-hidden">
              <SQLEditor />
            </div>
          </section>
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize editor and results panels"
            tabIndex={0}
            onPointerDown={startEditorResize}
            className="h-1 cursor-row-resize border-y border-border/70 bg-bg-primary transition-colors hover:bg-accent/40"
          />
          <section className="flex min-h-0 flex-1 flex-col">
            <ResultsTabs />
          </section>
        </main>
      </div>
      <StatusBar />
      <CommandPalette />
      <ChallengeComplete />
    </div>
  );
}
