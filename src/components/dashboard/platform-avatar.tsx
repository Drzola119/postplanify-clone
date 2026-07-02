import { cn } from "@/lib/utils";
import type { PlatformMeta } from "@/lib/platforms";

interface PlatformAvatarProps {
  platform: PlatformMeta;
  size?: number;
  className?: string;
}

export function PlatformAvatar({ platform, size = 40, className }: PlatformAvatarProps) {
  const hasImage = platform.avatar && platform.avatar.length > 0;
  return (
    <div
      className={cn("relative flex-shrink-0 rounded-full ring-1 ring-border overflow-hidden bg-zinc-100", className)}
      style={{ width: size, height: size }}
    >
      {hasImage ? (
        <img src={platform.avatar!} alt={platform.handle} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs font-medium">
          {platform.handle.charAt(0).toUpperCase()}
        </div>
      )}
      <div
        className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full shadow-sm flex items-center justify-center text-[10px] font-semibold border border-border",
          platform.textClass
        )}
      >
        {platform.icon}
      </div>
    </div>
  );
}