"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchResult {
  players: Array<{ id: string; name: string; status: string }>;
  cases: Array<{ id: string; title: string; status: string }>;
  reports: Array<{ id: string; status: string; summary: string }>;
}

const initialResult: SearchResult = { players: [], cases: [], reports: [] };

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>(initialResult);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(initialResult);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as SearchResult;
        setResults(payload);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  const hasResults =
    results.players.length > 0 || results.cases.length > 0 || results.reports.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[420px]">
      <label className="sr-only" htmlFor="global-search">
        Global Search
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
        <input
          id="global-search"
          aria-label="Global search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search players, cases, reports"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className="input-neutral ui-transition h-8 w-full rounded-full pl-9 pr-4 text-[13px]"
        />
      </div>
      {open && query.length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2 shadow-[var(--panel-shadow)] backdrop-blur-xl">
          {loading ? (
            <p className="px-2 py-1 text-sm text-[color:var(--text-muted)]">Searching...</p>
          ) : null}
          {!loading && !hasResults ? (
            <p className="px-2 py-1 text-sm text-[color:var(--text-muted)]">No results.</p>
          ) : null}
          {results.players.length > 0 ? (
            <SearchGroup title="Players">
              {results.players.map((player) => (
                <Link
                  key={player.id}
                  href={`/app/players/${player.id}`}
                  className="ui-transition block rounded-md px-2 py-1.5 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.08]"
                  onClick={() => setOpen(false)}
                >
                  {player.name}
                </Link>
              ))}
            </SearchGroup>
          ) : null}
          {results.cases.length > 0 ? (
            <SearchGroup title="Cases">
              {results.cases.map((caseRecord) => (
                <Link
                  key={caseRecord.id}
                  href={`/app/cases/${caseRecord.id}`}
                  className="ui-transition block rounded-md px-2 py-1.5 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.08]"
                  onClick={() => setOpen(false)}
                >
                  {caseRecord.title}
                </Link>
              ))}
            </SearchGroup>
          ) : null}
          {results.reports.length > 0 ? (
            <SearchGroup title="Reports">
              {results.reports.map((report) => (
                <Link
                  key={report.id}
                  href="/app/reports"
                  className="ui-transition block rounded-md px-2 py-1.5 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.08]"
                  onClick={() => setOpen(false)}
                >
                  {report.summary.slice(0, 80)}
                </Link>
              ))}
            </SearchGroup>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
