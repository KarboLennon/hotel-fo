import Link from "next/link";
import { cn } from "@/lib/cn";
import { buildDashboardHref } from "@/server/queries/dashboard";

export function FloorTabs({ floors, active, params }: { floors: string[]; active: string; params: Record<string, string | undefined> }) {
  return (
    <div className="flex gap-5 border-b border-line mt-4 mb-3" role="tablist">
      {floors.map((f) => (
        <Link key={f} role="tab" aria-selected={active === f} href={buildDashboardHref({ floor: f }, params)}
          className={cn("label py-2 border-b-2 border-transparent -mb-px hover:text-ink", active === f && "text-ink border-accent")}>{f}</Link>
      ))}
    </div>
  );
}
