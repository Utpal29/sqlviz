import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { type EditorBuffer, useEditorStore } from "../../store/editorStore";
import { registerSchemaCompletions, registerSchemaHovers } from "./completions";
import { useThemeStore } from "../../store/themeStore";
import { formatSql } from "../../utils/sqlFormatter";

function defineThemes(monaco: Monaco) {
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
  monaco.editor.defineTheme("sqlviz-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword.sql", foreground: "2563EB", fontStyle: "bold" },
      { token: "operator.sql", foreground: "64748B" },
      { token: "string.sql", foreground: "059669" },
      { token: "number.sql", foreground: "B45309" },
      { token: "comment", foreground: "94A3B8", fontStyle: "italic" },
    ],
    colors: {
      "editor.background": "#FFFFFF",
      "editor.foreground": "#0F172A",
      "editorLineNumber.foreground": "#CBD5E1",
      "editorLineNumber.activeForeground": "#64748B",
      "editor.lineHighlightBackground": "#F1F5F9",
      "editorCursor.foreground": "#2563EB",
      "editor.selectionBackground": "#3B82F633",
      "editorIndentGuide.background": "#E2E8F0",
    },
  });
}

function themeIdFor(mode: "dark" | "light"): string {
  return mode === "dark" ? "sqlviz-dark" : "sqlviz-light";
}

interface EditorPaneProps {
  editorId: string;
  value: string;
  onChange: (value: string) => void;
  onRun: (value: string) => void;
  buffer: EditorBuffer;
}

export default function EditorPane({ editorId, value, onChange, onRun, buffer }: EditorPaneProps) {
  const setActiveBuffer = useEditorStore((s) => s.setActiveBuffer);
  const themeMode = useThemeStore((s) => s.mode);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    monacoRef.current?.editor.setTheme(themeIdFor(themeMode));
  }, [themeMode]);

  const handleMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
    defineThemes(monaco);
    registerSchemaCompletions(monaco);
    registerSchemaHovers(monaco);
    monaco.editor.setTheme(themeIdFor(themeMode));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun(editor.getValue());
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const current = editor.getValue();
      void formatSql(current)
        .then((formatted) => {
          if (formatted !== current) {
            editor.executeEdits("format-on-save", [
              {
                range: editor.getModel()!.getFullModelRange(),
                text: formatted,
                forceMoveMarkers: true,
              },
            ]);
          }
        })
        .catch(() => {
          // Leave SQL untouched if the formatter cannot parse it.
        });
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
