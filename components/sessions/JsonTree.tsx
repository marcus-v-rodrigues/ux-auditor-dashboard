"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function valueLabel(value: unknown): string {
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }

  if (isRecord(value)) {
    return `Object(${Object.keys(value).length})`;
  }

  return JSON.stringify(value);
}

function JsonTreeNode({
  label,
  value,
  level = 0,
}: {
  label: string;
  value: unknown;
  level?: number;
}) {
  const expandable = Array.isArray(value) || isRecord(value);
  const [isOpen, setIsOpen] = useState(level < 1);

  if (!expandable) {
    return (
      <div className="app-heading font-mono text-xs leading-6">
        <span className="app-icon-accent">{label}</span>
        <span className="app-text-muted">: </span>
        <span>{valueLabel(value)}</span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="app-heading flex items-center gap-2 font-mono text-xs leading-6"
      >
        {isOpen ? (
          <ChevronDown className="app-text-soft h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="app-text-soft h-3.5 w-3.5" />
        )}
        <span className="app-icon-accent">{label}</span>
        <span className="app-text-muted">{valueLabel(value)}</span>
      </button>

      {isOpen ? (
        <div className="app-tree-line ml-5 border-l pl-3">
          {entries.map(([entryLabel, entryValue]) => (
            <JsonTreeNode
              key={`${label}-${entryLabel}`}
              label={entryLabel}
              value={entryValue}
              level={level + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function JsonTree({ value }: { value: unknown }) {
  return <JsonTreeNode label="root" value={value} />;
}
