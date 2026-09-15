import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { ViewTabs } from "@/components/dashboard/view-tabs";
import { DateNav } from "@/components/dashboard/date-nav";
import { StatusCounters } from "@/components/dashboard/status-counters";
import { FloorTabs } from "@/components/dashboard/floor-tabs";
import { RoomGrid } from "@/components/dashboard/room-grid";
import { getDashboard, parseDateParam } from "@/server/queries/dashboard";
import { matchesFilter } from "@/server/services/room-status";
import { STATUS_FILTERS, type StatusFilter } from "@/lib/constants";

type Search = { view?: string; date?: string; status?: string; floor?: string; days?: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const view = sp.view === "list" || sp.view === "stay" ? sp.view : "room";
  const date = parseDateParam(sp.date);
  const dateStr = format(date, "yyyy-MM-dd");
  const status = (STATUS_FILTERS as readonly string[]).includes(sp.status ?? "") ? (sp.status as StatusFilter) : "ALL";
  const params = { view, date: dateStr, status: status === "ALL" ? undefined : status, floor: sp.floor, days: sp.days };

  const { rooms, counters, floors } = await getDashboard(date);
  const floor = floors.includes(sp.floor ?? "") ? sp.floor! : floors[0];
  const title = view === "list" ? "List View" : view === "stay" ? "Stay View" : "Room View";

  return (
    <>
      <PageHeader eyebrow="Dashboard" title={title} actions={<><ViewTabs current={view} params={params} /><DateNav date={dateStr} /></>} />
      <StatusCounters counters={counters} active={status} params={params} />
      {view === "room" && (
        <>
          <FloorTabs floors={floors} active={floor} params={params} />
          <RoomGrid rooms={rooms.filter((r) => r.floor === floor && matchesFilter(r.state, status))} date={dateStr} />
        </>
      )}
      {view === "list" && <p className="mt-4 text-muted">List View — Task 9</p>}
      {view === "stay" && <p className="mt-4 text-muted">Stay View — Task 10</p>}
    </>
  );
}
