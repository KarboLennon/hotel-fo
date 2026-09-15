import Link from "next/link";
import { cn } from "@/lib/cn";
import { STATUS_FILTERS, STATUS_FILTER_LABEL, type StatusFilter } from "@/lib/constants";
import { buildDashboardHref } from "@/server/queries/dashboard";

export function StatusCounters({ counters, active, params }: { counters: Record<StatusFilter, number>; active: StatusFilter; params: Record<string, string | undefined> }) {
  return (
    <div className="flex border border-line">
      {STATUS_FILTERS.map((f) => (
        <Link key={f} href={buildDashboardHref({ status: f === "ALL" ? undefined : f }, params)} aria-pressed={active === f}
          className={cn("flex-1 px-3 py-2 border-r border-line last:border-r-0 hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent", active === f && "bg-paper-2")}>
          <span className="label">{STATUS_FILTER_LABEL[f]}</span>
          <span className={cn("display block text-xl leading-tight", active === f && "text-accent-2")}>{counters[f]}</span>
        </Link>
      ))}
    </div>
  );
}
