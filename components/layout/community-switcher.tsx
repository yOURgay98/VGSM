"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Server } from "lucide-react";

import { switchCommunityAction } from "@/app/actions/community-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CommunitySwitcher({
  community,
  communities,
}: {
  community: { id: string; name: string; slug: string };
  communities: Array<{
    id: string;
    name: string;
    slug: string;
    roleName: string;
    rolePriority: number;
  }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 max-w-[220px] justify-between gap-2 px-2"
          aria-label="Switch community"
          disabled={pending || communities.length <= 1}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Server className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate text-[13px] font-medium">{community.name}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-[color:var(--text-muted)]">
          Communities
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {communities.map((c) => {
          const active = c.id === community.id;
          return (
            <DropdownMenuItem
              key={c.id}
              disabled={pending}
              onSelect={(e) => {
                e.preventDefault();
                if (active) return;
                startTransition(async () => {
                  try {
                    await switchCommunityAction(c.id);
                    router.refresh();
                  } catch (err) {
                    console.error("[community] switch failed", err);
                  }
                });
              }}
              className={cn("gap-2", active && "bg-black/[0.03] dark:bg-white/[0.06]")}
            >
              <span className="flex h-4 w-4 items-center justify-center">
                {active ? <Check className="h-4 w-4" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{c.name}</span>
                <span className="block truncate text-xs text-[color:var(--text-muted)]">
                  {c.slug} · {c.roleName}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
