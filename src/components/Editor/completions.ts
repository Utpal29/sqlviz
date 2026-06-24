import type { Monaco } from "@monaco-editor/react";
import type * as MonacoEditor from "monaco-editor";
import { useDatabaseStore } from "../../store/databaseStore";
import type { ColumnInfo, DatabaseSchema, TableInfo } from "../../types/database";

let completionProviderRegistered = false;
let hoverProviderRegistered = false;

const KEYWORDS = new Map([
  ["SELECT", "Read rows from one or more tables."],
  ["FROM", "Choose the source table for a query."],
  ["WHERE", "Filter rows before grouping."],
  ["JOIN", "Combine rows from another table."],
  ["LEFT JOIN", "Keep all rows from the left side and match rows from the right side."],
  ["INNER JOIN", "Keep only matching rows from both sides."],
  ["ON", "Define a join condition."],
  ["GROUP BY", "Group rows before aggregate functions run."],
  ["ORDER BY", "Sort the final result set."],
  ["HAVING", "Filter grouped rows after aggregation."],
  ["LIMIT", "Restrict the number of returned rows."],
  ["WITH", "Define a common table expression."],
  ["COUNT", "Count rows or non-null values."],
  ["SUM", "Add numeric values."],
  ["AVG", "Average numeric values."],
  ["MIN", "Find the smallest value."],
  ["MAX", "Find the largest value."],
  ["CASE", "Start a conditional expression."],
  ["WHEN", "Add a condition branch."],
  ["THEN", "Return a value for a matching condition."],
  ["ELSE", "Return a fallback value."],
  ["END", "End a CASE expression."],
  ["AS", "Assign an alias."],
]);

const SNIPPETS = [
  {
    label: "select-from",
    detail: "SELECT query",
    insertText: "SELECT ${1:*}\nFROM ${2:table}\nLIMIT ${3:10};",
    documentation: "Start a read-only SELECT query.",
  },
  {
    label: "join-on",
    detail: "JOIN clause",
    insertText: "JOIN ${1:table} ${2:alias} ON ${3:condition}",
    documentation: "Join another table with an explicit condition.",
  },
  {
    label: "group-count",
    detail: "GROUP BY with COUNT",
    insertText: "SELECT ${1:column}, COUNT(*) AS count\nFROM ${2:table}\nGROUP BY ${1:column}\nORDER BY count DESC;",
    documentation: "Count rows per group.",
  },
  {
    label: "case-when",
    detail: "CASE expression",
    insertText: "CASE\n  WHEN ${1:condition} THEN ${2:value}\n  ELSE ${3:fallback}\nEND",
    documentation: "Create a conditional value in SELECT, WHERE, or ORDER BY.",
  },
];

const TABLE_CONTEXT_PATTERN = /\b(?:FROM|JOIN|UPDATE|INTO)\s+$/i;
const RESERVED_ALIAS_WORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "LEFT",
  "INNER",
  "RIGHT",
  "FULL",
  "OUTER",
  "ON",
  "GROUP",
  "ORDER",
  "HAVING",
  "LIMIT",
  "WITH",
  "AS",
]);

type Suggestion = MonacoEditor.languages.CompletionItem;

interface AliasInfo {
  alias: string;
  table: TableInfo;
}

export interface CompletionDebugInfo {
  aliases: Array<{ alias: string; table: string }>;
  dotOwner: string | null;
  dotTable: string | null;
  tableOnly: boolean;
}

function completionRange(
  monaco: Monaco,
  model: MonacoEditor.editor.ITextModel,
  position: MonacoEditor.Position
) {
  const word = model.getWordUntilPosition(position);
  return new monaco.Range(
    position.lineNumber,
    word.startColumn,
    position.lineNumber,
    word.endColumn
  );
}

function linePrefix(model: MonacoEditor.editor.ITextModel, position: MonacoEditor.Position): string {
  return model.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });
}

function dotContext(prefix: string): string | null {
  const match = prefix.match(/([a-zA-Z_][\w]*)\.$/);
  return match?.[1] ?? null;
}

function findAliases(sql: string, schema: DatabaseSchema): AliasInfo[] {
  const byName = new Map(schema.tables.map((table) => [table.name.toLowerCase(), table]));
  const aliases = new Map<string, TableInfo>();
  const pattern = /\b(?:FROM|JOIN)\s+([a-zA-Z_][\w]*)(?:\s+(?:AS\s+)?([a-zA-Z_][\w]*))?/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(sql)) !== null) {
    const table = byName.get(match[1].toLowerCase());
    const alias = match[2];
    if (!table || !alias || RESERVED_ALIAS_WORDS.has(alias.toUpperCase())) continue;
    aliases.set(alias, table);
  }

  return [...aliases.entries()].map(([alias, table]) => ({ alias, table }));
}

export function getCompletionDebugInfo(
  sqlPrefix: string,
  schema: DatabaseSchema
): CompletionDebugInfo {
  const aliases = findAliases(sqlPrefix, schema);
  const dotOwner = dotContext(sqlPrefix);
  const tableByName = new Map(schema.tables.map((table) => [table.name.toLowerCase(), table]));
  const aliasByName = new Map(aliases.map((alias) => [alias.alias.toLowerCase(), alias]));
  const dotTable =
    dotOwner == null
      ? null
      : aliasByName.get(dotOwner.toLowerCase())?.table ??
        tableByName.get(dotOwner.toLowerCase()) ??
        null;

  return {
    aliases: aliases.map((alias) => ({ alias: alias.alias, table: alias.table.name })),
    dotOwner,
    dotTable: dotTable?.name ?? null,
    tableOnly: TABLE_CONTEXT_PATTERN.test(sqlPrefix),
  };
}

function tableDocumentation(table: TableInfo): string {
  const columns = table.columns
    .map((column) => `${column.name} ${column.type}${column.isPrimaryKey ? " primary key" : ""}`)
    .join("\n");
  return `${table.rowCount} rows\n\n${columns}`;
}

function columnDocumentation(table: TableInfo, column: ColumnInfo): string {
  const parts = [`${table.name}.${column.name}`, column.type];
  if (column.isPrimaryKey) parts.push("primary key");
  if (column.isNotNull) parts.push("not null");
  if (column.defaultValue) parts.push(`default ${column.defaultValue}`);
  return parts.join(" - ");
}

function dedupeSuggestions(suggestions: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key =
      typeof suggestion.label === "string"
        ? suggestion.label
        : suggestion.label.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function tableHoverMarkdown(table: TableInfo): string {
  const cols = table.columns
    .map((c) => {
      const flags: string[] = [];
      if (c.isPrimaryKey) flags.push("PK");
      if (c.isNotNull) flags.push("NOT NULL");
      return `- \`${c.name}\` _${c.type}_${flags.length ? ` · ${flags.join(", ")}` : ""}`;
    })
    .join("\n");
  const indexes = table.indexes.length
    ? `\n\n**Indexes:** ${table.indexes.map((i) => `\`${i.name}\` (${i.columns.join(", ")})${i.isUnique ? " · unique" : ""}`).join(", ")}`
    : "";
  return `**Table \`${table.name}\`** — ${table.rowCount.toLocaleString()} rows\n\n${cols}${indexes}`;
}

function columnHoverMarkdown(table: TableInfo, column: ColumnInfo): string {
  const flags: string[] = [];
  if (column.isPrimaryKey) flags.push("primary key");
  if (column.isNotNull) flags.push("not null");
  if (column.defaultValue) flags.push(`default \`${column.defaultValue}\``);
  return `**\`${table.name}.${column.name}\`** — _${column.type}_${flags.length ? `\n\n${flags.join(" · ")}` : ""}`;
}

export function registerSchemaHovers(monaco: Monaco): void {
  if (hoverProviderRegistered) return;
  hoverProviderRegistered = true;

  monaco.languages.registerHoverProvider("sql", {
    provideHover: (
      model: MonacoEditor.editor.ITextModel,
      position: MonacoEditor.Position,
    ) => {
      const schema = useDatabaseStore.getState().schema;
      if (!schema) return null;
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );
      const tableByName = new Map(schema.tables.map((t) => [t.name.toLowerCase(), t]));
      const sql = model.getValue();
      const aliases = findAliases(sql, schema);
      const aliasByName = new Map(aliases.map((a) => [a.alias.toLowerCase(), a.table]));
      const target = word.word.toLowerCase();

      // Qualified column?  look at character before the word.
      const beforeText = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: word.startColumn,
      });
      const qualifiedMatch = beforeText.match(/([a-zA-Z_][\w]*)\.$/);
      if (qualifiedMatch) {
        const owner = qualifiedMatch[1].toLowerCase();
        const ownerTable = aliasByName.get(owner) ?? tableByName.get(owner);
        if (ownerTable) {
          const col = ownerTable.columns.find((c) => c.name.toLowerCase() === target);
          if (col) {
            return {
              range,
              contents: [{ value: columnHoverMarkdown(ownerTable, col) }],
            };
          }
        }
      }

      const table = tableByName.get(target);
      if (table) {
        return { range, contents: [{ value: tableHoverMarkdown(table) }] };
      }

      for (const t of schema.tables) {
        const col = t.columns.find((c) => c.name.toLowerCase() === target);
        if (col) {
          return { range, contents: [{ value: columnHoverMarkdown(t, col) }] };
        }
      }
      return null;
    },
  });
}

export function registerSchemaCompletions(monaco: Monaco): void {
  if (completionProviderRegistered) return;
  completionProviderRegistered = true;

  monaco.languages.registerCompletionItemProvider("sql", {
    triggerCharacters: [".", " "],
    provideCompletionItems: (
      model: MonacoEditor.editor.ITextModel,
      position: MonacoEditor.Position
    ) => {
      const schema = useDatabaseStore.getState().schema;
      const range = completionRange(monaco, model, position);
      const prefix = linePrefix(model, position);
      const tableOnly = TABLE_CONTEXT_PATTERN.test(prefix);
      const dotOwner = dotContext(prefix);

      const snippetSuggestions = SNIPPETS.map((snippet) => ({
        label: snippet.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: snippet.insertText,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: snippet.detail,
        documentation: snippet.documentation,
        range,
      }));

      const keywordSuggestions = [...KEYWORDS.entries()].map(([keyword, documentation]) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        documentation,
        range,
      }));

      if (!schema) {
        return { suggestions: [...snippetSuggestions, ...keywordSuggestions] };
      }

      const tableSuggestions = schema.tables.map((table) => ({
        label: table.name,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: table.name,
        detail: `table - ${table.rowCount} rows`,
        documentation: tableDocumentation(table),
        range,
      }));

      const aliases = findAliases(prefix, schema);
      const aliasByName = new Map(aliases.map((alias) => [alias.alias.toLowerCase(), alias]));
      const tableByName = new Map(schema.tables.map((table) => [table.name.toLowerCase(), table]));
      const dotTable =
        dotOwner == null
          ? null
          : aliasByName.get(dotOwner.toLowerCase())?.table ??
            tableByName.get(dotOwner.toLowerCase()) ??
            null;

      if (dotOwner && dotTable) {
        return {
          suggestions: dotTable.columns.map((column) => ({
            label: column.name,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: column.name,
            detail: columnDocumentation(dotTable, column),
            documentation: columnDocumentation(dotTable, column),
            range,
          })),
        };
      }

      const columnSuggestions = schema.tables.flatMap((table) =>
        table.columns.map((column) => ({
          label: column.name,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: column.name,
          detail: `${table.name}.${column.name} - ${column.type}`,
          documentation: columnDocumentation(table, column),
          range,
        }))
      );

      const qualifiedColumnSuggestions = schema.tables.flatMap((table) =>
        table.columns.map((column) => ({
          label: `${table.name}.${column.name}`,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `${table.name}.${column.name}`,
          detail: columnDocumentation(table, column),
          documentation: columnDocumentation(table, column),
          range,
        }))
      );

      const aliasSuggestions = aliases.flatMap(({ alias, table }) =>
        table.columns.map((column) => ({
          label: `${alias}.${column.name}`,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `${alias}.${column.name}`,
          detail: `${table.name}.${column.name} - ${column.type}`,
          documentation: columnDocumentation(table, column),
          range,
        }))
      );

      return {
        suggestions: dedupeSuggestions(
          tableOnly
            ? tableSuggestions
            : [
                ...snippetSuggestions,
                ...keywordSuggestions,
                ...tableSuggestions,
                ...columnSuggestions,
                ...qualifiedColumnSuggestions,
                ...aliasSuggestions,
              ]
        ),
      };
    },
  });
}
