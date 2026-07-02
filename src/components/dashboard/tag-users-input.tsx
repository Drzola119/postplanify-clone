"use client";

import { AtSign, Users } from "lucide-react";

interface TagUsersInputProps {
  value: string;
  onChange: (v: string) => void;
}

const MAX = 200;

export function TagUsersInput({ value, onChange }: TagUsersInputProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1">
        <Users className="size-4 text-zinc-500 flex-shrink-0" />
        <span className="text-sm text-zinc-700">Tag Users</span>
        <span className="text-xs text-zinc-400">(optional)</span>
      </div>
      <div className="relative">
        <AtSign className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX))}
          placeholder="@username1, @username2, ..."
          className="w-full h-10 pl-9 pr-16 rounded-md border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-300"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
          {value.length}/{MAX}
        </span>
      </div>
      <p className="text-xs text-zinc-500 pl-6">Tag up to 10 users in your media.</p>
    </div>
  );
}