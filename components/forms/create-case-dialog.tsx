"use client";

import { useState } from "react";

import { CreateCaseForm } from "@/components/forms/create-case-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateCaseDialog({
  users,
  players,
  reports,
}: {
  users: Array<{ id: string; name: string }>;
  players: Array<{ id: string; name: string }>;
  reports: Array<{ id: string; summary: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">New Case</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Case</DialogTitle>
          <DialogDescription>Open a case and link players/reports immediately.</DialogDescription>
        </DialogHeader>
        <CreateCaseForm users={users} players={players} reports={reports} />
      </DialogContent>
    </Dialog>
  );
}
