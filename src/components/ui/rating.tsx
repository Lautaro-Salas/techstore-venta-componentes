import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_STARS = 5;

export function Rating({ value, count, size = "sm", className }: { value: number; count?: number; size?: "sm" | "md"; className?: string }) {
  const iconSize = size === "sm" ? "size-3.5" : "size-5";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" role="img" aria-label={`${value.toFixed(1)} de ${MAX_STARS} estrellas`}>
        {Array.from({ length: MAX_STARS }, (_, i) => {
          const fill = Math.min(Math.max(value - i, 0), 1);
          return (
            <span key={i} className="relative inline-block">
              <Star className={cn(iconSize, "text-border")} fill="currentColor" strokeWidth={0} aria-hidden />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star className={cn(iconSize, "text-amber-400")} fill="currentColor" strokeWidth={0} aria-hidden />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {count !== undefined && <span className="text-xs text-muted">({count})</span>}
    </div>
  );
}
