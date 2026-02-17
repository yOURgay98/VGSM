"use client";

import { SavedViewScope } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CreateCaseDialog } from "@/components/forms/create-case-dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ViewsMenu } from "@/components/views/views-menu";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_REVIEW", label: "Review" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const assignedOptions = [
  { value: "all", label: "All" },
  { value: "unassigned", label: "Unassigned" },
  { value: "mine", label: "Mine" },
];

export function CasesToolbar({
  status,
  assigned,
  views,
  currentFilters,
  dialogProps,
}: {
  status: string;
  assigned: string;
  views: Array<{ id: string; name: string; filtersJson: unknown }>;
  currentFilters: Record<string, string>;
  dialogProps: React.ComponentProps<typeof CreateCaseDialog>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === "all" || value.trim() === "") params.delete(key);
    else params.set(key, value);
    params.delete("caseId");
    params.delete("cursor");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        ariaLabel="Case status filter"
        value={status}
        onChange={(next) => setParam("status", next)}
        options={statusOptions}
      />
      <SegmentedControl
        ariaLabel="Case assignment filter"
        value={assigned}
        onChange={(next) => setParam("assigned", next)}
        options={assignedOptions}
      />
      <ViewsMenu
        scope={SavedViewScope.CASES}
        views={views}
        currentFilters={currentFilters}
        clearKeysOnApply={["caseId", "cursor"]}
      />
      <CreateCaseDialog {...dialogProps} />
    </div>
  );
}
