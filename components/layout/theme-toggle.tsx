"use client";

import type { ReactNode } from "react";
import { Circle, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/layout/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const icon =
    resolvedTheme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : resolvedTheme === "gray" ? (
      <Circle className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  return <ThemeToggleMenu currentIcon={icon} setTheme={setTheme} includeGray />;
}

export function ThemeToggleLightDark() {
  const { resolvedTheme, setTheme } = useTheme();
  const icon =
    resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;

  return <ThemeToggleMenu currentIcon={icon} setTheme={setTheme} includeGray={false} />;
}

function ThemeToggleMenu({
  currentIcon,
  setTheme,
  includeGray,
}: {
  currentIcon: ReactNode;
  setTheme: (theme: "light" | "dark" | "gray") => void;
  includeGray: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          {currentIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="h-4 w-4" /> Dark
        </DropdownMenuItem>
        {includeGray ? (
          <DropdownMenuItem onClick={() => setTheme("gray")}>
            <Circle className="h-4 w-4" /> Gray
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
