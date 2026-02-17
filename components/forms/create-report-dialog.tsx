"use client";

import { useState } from "react";

import { CreateReportForm } from "@/components/forms/create-report-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateReportDialog({ players }: { players: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">New Report</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Report</DialogTitle>
          <DialogDescription>Record an incoming report for triage.</DialogDescription>
        </DialogHeader>
        <CreateReportForm players={players} />
      </DialogContent>
    </Dialog>
  );
}
