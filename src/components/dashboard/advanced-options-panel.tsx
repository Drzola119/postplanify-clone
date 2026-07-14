"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Settings2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PPInput } from "@/components/ui/pp-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { type FieldSpec, type PlatformAdvancedOptions, getVisibleSpecs } from "@/lib/publishing/advanced-options";
import type { MediaKind } from "@/lib/publishing/capability-matrix";
import type { PlatformId } from "@/lib/platforms";

interface AdvancedOptionsPanelProps {
  platform: PlatformId;
  platformName: string;
  mediaKind: MediaKind;
  value: PlatformAdvancedOptions;
  onChange: (next: PlatformAdvancedOptions) => void;
  collapsible?: boolean;
  className?: string;
  defaultOpen?: boolean;
}

export function AdvancedOptionsPanel({
  platform,
  platformName,
  mediaKind,
  value,
  onChange,
  collapsible = true,
  className,
  defaultOpen = false,
}: AdvancedOptionsPanelProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const visible = React.useMemo(
    () => getVisibleSpecs(platform, mediaKind, value, true),
    [platform, mediaKind, value]
  );
  const coreSpecs = visible.filter((s) => !s.advanced);
  const advancedSpecs = visible.filter((s) => s.advanced);
  const hasAdvanced = advancedSpecs.length > 0;

  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white overflow-hidden", className)}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <Settings2 className="size-3.5 text-zinc-500" />
            Advanced options for {platformName}
          </span>
          {open ? (
            <ChevronDown className="size-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="size-3.5 text-zinc-500" />
          )}
        </button>
      ) : null}
      {open ? (
        <div className="border-t border-zinc-200 p-3 space-y-3 bg-zinc-50/30">
          {coreSpecs.map((spec) => (
            <FieldRenderer
              key={spec.key}
              spec={spec}
              value={value[spec.key]}
              onChange={(v) => onChange({ ...value, [spec.key]: v })}
            />
          ))}
          {hasAdvanced ? (
            <>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {showAdvanced
                  ? "Hide advanced options"
                  : `Show ${advancedSpecs.length} advanced option${advancedSpecs.length === 1 ? "" : "s"}`}
              </button>
              {showAdvanced ? (
                <div className="space-y-3 pt-2 border-t border-zinc-200">
                  {advancedSpecs.map((spec) => (
                    <FieldRenderer
                      key={spec.key}
                      spec={spec}
                      value={value[spec.key]}
                      onChange={(v) => onChange({ ...value, [spec.key]: v })}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FieldRenderer({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: string | number | boolean | string[] | undefined;
  onChange: (v: string | number | boolean | string[] | undefined) => void;
}) {
  switch (spec.kind) {
    case "segmented":
      return (
        <div>
          <Label spec={spec} />
          <SegmentedControl
            size="sm"
            value={String(value ?? spec.default ?? "")}
            onChange={(v) => onChange(v)}
            options={(spec.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
          />
          <Help spec={spec} />
        </div>
      );
    case "select":
      return (
        <div>
          <Label spec={spec} />
          <select
            value={String(value ?? spec.default ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
          >
            {(spec.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Help spec={spec} />
        </div>
      );
    case "text":
      return (
        <div>
          <Label spec={spec} />
          <PPInput
            value={String(value ?? "")}
            placeholder={spec.placeholder}
            maxLength={spec.maxLength}
            onChange={(e) => onChange(e.target.value)}
          />
          <Help spec={spec} />
        </div>
      );
    case "number":
      return (
        <div>
          <Label spec={spec} />
          <PPInput
            type="number"
            value={value == null ? "" : String(value)}
            placeholder={spec.placeholder}
            min={spec.min}
            max={spec.max}
            onChange={(e) => {
              const n = e.target.value === "" ? undefined : Number(e.target.value);
              onChange(n);
            }}
          />
          <Help spec={spec} />
        </div>
      );
    case "switch":
      return (
        <label className="flex items-start justify-between gap-3 cursor-pointer rounded-md p-2 -mx-2 hover:bg-white">
          <div className="flex-1 min-w-0">
            <Label spec={spec} inline />
            <Help spec={spec} />
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(value ?? spec.default)}
            onClick={() => onChange(!(value ?? (spec.default as boolean | undefined) ?? false))}
            className={cn(
              "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
              (value ?? (spec.default as boolean | undefined) ?? false) ? "bg-zinc-900" : "bg-zinc-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                (value ?? (spec.default as boolean | undefined) ?? false) ? "translate-x-5" : "translate-x-1"
              )}
            />
          </button>
        </label>
      );
    case "multiselect":
      return (
        <div>
          <Label spec={spec} />
          <div className="flex flex-wrap gap-1.5">
            {(spec.options ?? []).map((o) => {
              const arr = Array.isArray(value) ? value : [];
              const active = arr.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onChange(active ? arr.filter((v) => v !== o.value) : [...arr, o.value])}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
                    active ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <Help spec={spec} />
        </div>
      );
    case "list":
      return <ListField spec={spec} value={value} onChange={onChange} />;
  }
}

function ListField({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: string | number | boolean | string[] | undefined;
  onChange: (v: string[] | undefined) => void;
}) {
  const items: string[] = Array.isArray(value) ? value : [];
  const [draft, setDraft] = React.useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft("");
  };

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <Label spec={spec} />
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Remove ${item}`}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <PPInput
          value={draft}
          placeholder={spec.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Add"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Help spec={spec} />
    </div>
  );
}

function Label({ spec, inline }: { spec: FieldSpec; inline?: boolean }) {
  return (
    <span className={cn("block text-xs font-semibold text-zinc-700", inline ? "mb-0.5" : "mb-1.5")}>
      {spec.label}
    </span>
  );
}

function Help({ spec }: { spec: FieldSpec }) {
  if (!spec.help) return null;
  return <p className="text-xs text-zinc-500 mt-1.5">{spec.help}</p>;
}