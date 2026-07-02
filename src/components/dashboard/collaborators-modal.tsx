"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface CollaboratorsModalProps {
  open: boolean;
  onClose: () => void;
  collaborators: string[];
  onSave: (list: string[]) => void;
}

export function CollaboratorsModal({ open, onClose, collaborators, onSave }: CollaboratorsModalProps) {
  const [list, setList] = useState<string[]>(collaborators);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const atMax = list.length >= 3;
  const valid = input.trim().length > 0 && !input.includes(" ") && !input.includes("@");

  function add() {
    if (!valid) {
      if (input.includes("@") || input.includes(" ")) {
        setError("Username must not contain spaces or @ symbol");
      }
      return;
    }
    if (atMax) return;
    setList([...list, input.trim()]);
    setInput("");
    setError(null);
  }

  function remove(idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  function handleSave() {
    onSave(list);
    onClose();
  }

  function handleCancel() {
    setList(collaborators);
    setInput("");
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={`Add Collaborators (${list.length}/3)`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 h-9 text-sm font-medium hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-md bg-zinc-950 hover:bg-zinc-800 text-white px-4 h-9 text-sm font-medium"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50/50 p-3">
          <Info className="size-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-700">
            Works only for <strong>Instagram</strong> posts. Max 3 collaborators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">@</span>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid && !atMax) add();
              }}
              placeholder="username"
              className="w-full h-10 pl-8 pr-3 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
            />
          </div>
          <button
            type="button"
            disabled={!valid || atMax}
            onClick={add}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-zinc-200 px-4 h-10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-300"
          >
            Add
          </button>
        </div>

        {list.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">Added collaborators:</p>
            <div className="space-y-1.5">
              {list.map((c, i) => (
                <div
                  key={`${c}-${i}`}
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                >
                  <span>@{c}</span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={`Remove ${c}`}
                    className="inline-flex items-center justify-center size-6 rounded hover:bg-zinc-200"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-xs text-zinc-500">Username must not contain spaces or @ symbol</p>
      </div>
    </Modal>
  );
}