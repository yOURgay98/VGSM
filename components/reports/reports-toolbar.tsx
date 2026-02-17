"use client";

import { SavedViewScope } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CreateReportDialog } from "@/components/forms/create-report-dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ViewsMenu } from "@/components/views/views-menu";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "Review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

const assignedOptions = [
  { value: "all", label: "All" },
  { value: "unassigned", label: "Unassigned" },
  { value: "mine", label: "Mine" },
];

export function ReportsToolbar({
  status,
  assigned,
  views,
  currentFilters,
  players,
}: {
  status: string;
  assigned: string;
  views: Array<{ id: string; name: string; filtersJson: unknown }>;
  currentFilters: Record<string, string>;
  players: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === "all" || value.trim() === "") params.delete(key);
    else params.set(key, value);
    // Changing filters clears the current inspector selection.
    params.delete("reportId");
    params.delete("cursor");

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        ariaLabel="Report status filter"
        value={status}
        onChange={(next) => setParam("status", next)}
        options={statusOptions}
      />
      <SegmentedControl
        ariaLabel="Report assignment filter"
        value={assigned}
        onChange={(next) => setParam("assigned", next)}
        options={assignedOptions}
      />
      <ViewsMenu
        scope={SavedViewScope.REPORTS}
        views={views}
        currentFilters={currentFilters}
        clearKeysOnApply={["reportId", "cursor"]}
      />
      <CreateReportDialog players={players} />
    </div>
  );
}
