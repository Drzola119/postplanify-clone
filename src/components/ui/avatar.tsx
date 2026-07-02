import * as React from "react";
import Image from "next/image";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const SIZE: Record<Size, { container: string; px: number }> = {
  xs: { container: "size-7", px: 28 },
  sm: { container: "size-8", px: 32 },
  md: { container: "size-9", px: 36 },
  lg: { container: "size-10", px: 40 },
  xl: { container: "size-12", px: 48 },
};

export function Avatar({
  src,
  alt,
  size = "md",
  className,
  ring = true,
}: {
  src: string;
  alt: string;
  size?: Size;
  className?: string;
  ring?: boolean;
}) {
  const s = SIZE[size];
  return (
    <div
      className={`relative ${s.container} rounded-full overflow-hidden bg-muted shrink-0 ${
        ring ? "border-2 border-background" : ""
      } ${className ?? ""}`}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes={`${s.px}px`} />
    </div>
  );
}