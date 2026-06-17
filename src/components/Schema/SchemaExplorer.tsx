import { useState } from "react";
import { ChevronRight, Table2, Key, Link2 } from "lucide-react";
import { useDatabaseStore } from "../../store/databaseStore";

export function SchemaExplorer() {
  const schema = useDatabaseStore((s) => s.schema);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (!schema) {
    return <div className="p-4 text-sm text-text-muted">Loading schema…</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-3 font-mono text-sm">
      <div className="px-2 pb-2 text-xs uppercase tracking-wider text-text-muted">
        Tables
      </div>
      {schema.tables.map((t) => {
        const isOpen = open[t.name] ?? false;
        return (
          <div key={t.name} className="mb-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-bg-elevated"
              onClick={() => setOpen((o) => ({ ...o, [t.name]: !isOpen }))}
            >
              <ChevronRight
                size={14}
                className={`text-text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
              <Table2 size={14} className="text-accent" />
              <span className="flex-1 truncate">{t.name}</span>
              <span className="text-xs text-text-muted">{t.rowCount}</span>
            </button>
            {isOpen && (
              <ul className="ml-6 mt-1 space-y-0.5">
                {t.columns.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center gap-2 px-2 py-0.5 text-xs text-text-muted"
                  >
                    {c.isPrimaryKey && (
                      <Key size={11} className="text-warning" />
                    )}
                    <span className="text-text-primary">{c.name}</span>
                    <span className="text-text-muted">{c.type}</span>
                  </li>
                ))}
                {t.foreignKeys.length > 0 &&
                  t.foreignKeys.map((fk) => (
                    <li
                      key={`${fk.fromColumn}-${fk.toTable}`}
                      className="flex items-center gap-2 px-2 py-0.5 text-xs text-text-muted"
                    >
                      <Link2 size={11} className="text-node-search" />
                      <span>
                        {fk.fromColumn} → {fk.toTable}.{fk.toColumn}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
