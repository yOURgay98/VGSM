"use client";

import { SavedViewScope } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { CreatePlayerDialog } from "@/components/forms/create-player-dialog";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ViewsMenu } from "@/components/views/views-menu";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "WATCHED", label: "Watched" },
];

export function PlayersToolbar({
  status,
  q,
  views,
  currentFilters,
}: {
  status: string;
  q: string;
  views: Array<{ id: string; name: string; filtersJson: unknown }>;
  currentFilters: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = query.trim();
      const currentQuery = (searchParams.get("q") ?? "").trim();
      if (trimmed === currentQuery) {
        return;
      }
      const params = new URLSearchParams(searchParams);
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      params.delete("playerId");
      params.delete("cursor");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 200);
    return () => clearTimeout(handle);
  }, [pathname, query, router, searchParams]);

  const placeholder = useMemo(() => "Search players...", []);

  function setStatus(nextStatus: string) {
    const params = new URLSearchParams(searchParams);
    if (nextStatus === "all") params.delete("status");
    else params.set("status", nextStatus);
    params.delete("playerId");
    params.delete("cursor");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        ariaLabel="Player status filter"
        value={status}
        onChange={setStatus}
        options={statusOptions}
      />
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8 w-[220px] pl-9"
        />
      </div>
      <ViewsMenu
        scope={SavedViewScope.PLAYERS}
        views={views}
        currentFilters={currentFilters}
        clearKeysOnApply={["playerId", "cursor"]}
      />
      <CreatePlayerDialog />
    </div>
  );
}
