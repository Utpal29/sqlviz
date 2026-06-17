import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { type EditorBuffer, useEditorStore } from "../../store/editorStore";
import { useResultsStore } from "../../store/resultsStore";
import { useCompareStore } from "../../store/compareStore";
import { registerSchemaCompletions } from "./completions";

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme("sqlviz-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword.sql", foreground: "3B82F6", fontStyle: "bold" },
      { token: "operator.sql", foreground: "64748B" },
      { token: "string.sql", foreground: "10B981" },
      { token: "number.sql", foreground: "F59E0B" },
      { token: "comment", foreground: "64748B", fontStyle: "italic" },
    ],
    colors: {
      "editor.background": "#0A0E17",
      "editor.foreground": "#E2E8F0",
      "editorLineNumber.foreground": "#334155",
      "editorLineNumber.activeForeground": "#64748B",
      "editor.lineHighlightBackground": "#111827",
      "editorCursor.foreground": "#3B82F6",
      "editor.selectionBackground": "#3B82F640",
      "editorIndentGuide.background": "#1E293B",
    },
  });
}

interface EditorPaneProps {
  editorId: string;
  value: string;
  onChange: (value: string) => void;
  onRun: (value: string) => void;
  buffer: EditorBuffer;
}

function EditorPane({ editorId, value, onChange, onRun, buffer }: EditorPaneProps) {
  const setActiveBuffer = useEditorStore((s) => s.setActiveBuffer);

  const handleMount: OnMount = (editor, monaco) => {
    defineTheme(monaco);
    registerSchemaCompletions(monaco);
    monaco.editor.setTheme("sqlviz-dark");
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun(editor.getValue());
    });
    editor.onDidFocusEditorText(() => setActiveBuffer(buffer));
  };

  return (
    <div className="h-full w-full">
      <Editor
        language="sql"
        path={editorId}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontFamily: "JetBrains Mono",
          fontSize: 14,
          fontLigatures: true,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          renderLineHighlight: "all",
          lineNumbers: "on",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          tabSize: 2,
        }}
      />
    </div>
  );
}

export function SQLEditor() {
  const query = useEditorStore((s) => s.query);
  const setQuery = useEditorStore((s) => s.setQuery);
  const runQuery = useResultsStore((s) => s.runQuery);
  const isCompareMode = useCompareStore((s) => s.isCompareMode);
  const queryA = useCompareStore((s) => s.queryA);
  const queryB = useCompareStore((s) => s.queryB);
  const setQueryA = useCompareStore((s) => s.setQueryA);
  const setQueryB = useCompareStore((s) => s.setQueryB);
  const runCompare = useCompareStore((s) => s.runCompare);

  if (isCompareMode) {
    return (
      <div className="grid h-full grid-cols-2 divide-x divide-border">
        <div className="flex min-w-0 flex-col">
          <div className="border-b border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-muted">
            Query A
          </div>
          <div className="min-h-0 flex-1">
            <EditorPane
              editorId="compare-a.sql"
              value={queryA}
              onChange={setQueryA}
              onRun={runCompare}
              buffer="compareA"
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="border-b border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-muted">
            Query B
          </div>
          <div className="min-h-0 flex-1">
            <EditorPane
              editorId="compare-b.sql"
              value={queryB}
              onChange={setQueryB}
              onRun={runCompare}
              buffer="compareB"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <EditorPane
      editorId="main.sql"
      value={query}
      onChange={setQuery}
      onRun={runQuery}
      buffer="main"
    />
  );
}
