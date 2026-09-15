import Link from "next/link";
import { cn } from "@/lib/cn";
import { buildDashboardHref } from "@/server/queries/dashboard";

const VIEWS = [["room", "Room"], ["list", "List"], ["stay", "Stay"]] as const;

export function ViewTabs({ current, params }: { current: string; params: Record<string, string | undefined> }) {
  return (
    <div className="flex gap-5" role="tablist">
      {VIEWS.map(([v, label]) => (
        <Link key={v} role="tab" aria-selected={current === v} href={buildDashboardHref({ view: v, status: undefined, floor: undefined }, params)}
          className={cn("label pb-1 border-b-2 border-transparent hover:text-ink", current === v && "text-ink border-accent")}>
          {label} View
        </Link>
      ))}
    </div>
  );
}
