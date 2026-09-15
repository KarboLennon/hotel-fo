import Link from "next/link";
import { cn } from "@/lib/cn";
import { STATUS_FILTERS, STATUS_FILTER_LABEL, type StatusFilter } from "@/lib/constants";
import { buildDashboardHref } from "@/server/queries/dashboard";

export function StatusCounters({ counters, active, params }: { counters: Record<StatusFilter, number>; active: StatusFilter; params: Record<string, string | undefined> }) {
  return (
    // 4 per row on phones, all 7 in one row from md up; the wrapper's negative gap hides doubled borders.
    <div className="grid grid-cols-4 md:grid-cols-7 border border-line gap-px bg-line">
      {STATUS_FILTERS.map((f) => (
        <Link key={f} href={buildDashboardHref({ status: f === "ALL" ? undefined : f }, params)} aria-current={active === f ? "true" : undefined}
          className={cn("px-3 py-2 bg-paper hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent", active === f && "bg-paper-2")}>
          <span className="label">{STATUS_FILTER_LABEL[f]}</span>
          <span className={cn("display block text-xl leading-tight", active === f && "text-accent-2")}>{counters[f]}</span>
        </Link>
      ))}
    </div>
  );
}
