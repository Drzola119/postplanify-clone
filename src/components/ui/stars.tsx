import * as React from "react";
import { Star } from "lucide-react";

export function Stars({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={`flex text-yellow-500 ${className ?? ""}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="size-3.5 fill-current" />
      ))}
    </div>
  );
}