import Link from "next/link";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  name,
  logoUrl,
  className,
  href = "/",
}: {
  name: string;
  logoUrl?: string;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2 font-bold tracking-tight", className)}
      aria-label={`${name} - inicio`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo configurable (URL arbitraria)
        <img src={logoUrl} alt="" className="h-8 w-auto" />
      ) : (
        <span className="bg-cta text-primary-foreground grid size-8 place-items-center rounded-lg shadow-sm">
          <Cpu className="size-4.5" aria-hidden />
        </span>
      )}
      <span className="text-lg">{name}</span>
    </Link>
  );
}
