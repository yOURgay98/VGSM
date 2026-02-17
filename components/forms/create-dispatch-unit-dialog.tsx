"use client";

import { useState } from "react";

import { CreateDispatchUnitForm } from "@/components/forms/create-dispatch-unit-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateDispatchUnitDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New Unit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Dispatch Unit</DialogTitle>
          <DialogDescription>Add a unit to the dispatch board.</DialogDescription>
        </DialogHeader>
        <CreateDispatchUnitForm />
      </DialogContent>
    </Dialog>
  );
}
