"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Map as MapIcon } from "lucide-react";

import { CreateDispatchCallDialog } from "@/components/forms/create-dispatch-call-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ENROUTE", label: "Enroute" },
  { value: "ON_SCENE", label: "On Scene" },
  { value: "CLEARED", label: "Cleared" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function DispatchToolbar({ status, q }: { status: string; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(q);
  const mapEnabled = searchParams.get("map") === "1";

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
      params.delete("callId");
      params.delete("cursor");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 200);
    return () => clearTimeout(handle);
  }, [pathname, query, router, searchParams]);

  const placeholder = useMemo(() => "Search calls...", []);

  function setStatus(nextStatus: string) {
    const params = new URLSearchParams(searchParams);
    if (nextStatus === "all") params.delete("status");
    else params.set("status", nextStatus);
    params.delete("callId");
    params.delete("cursor");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        ariaLabel="Call status filter"
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
      <Button
        type="button"
        variant={mapEnabled ? "default" : "outline"}
        onClick={() => {
          const params = new URLSearchParams(searchParams);
          if (mapEnabled) {
            params.delete("map");
          } else {
            params.set("map", "1");
          }
          params.delete("cursor");
          const qs = params.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        aria-label={mapEnabled ? "Hide map" : "Show map"}
        title={mapEnabled ? "Hide map" : "Show map"}
      >
        <MapIcon className="mr-1 h-4 w-4" />
        Map
      </Button>

      <Button asChild variant="outline">
        <Link href="/app/dispatch/units">Units</Link>
      </Button>
      <CreateDispatchCallDialog />
    </div>
  );
}
