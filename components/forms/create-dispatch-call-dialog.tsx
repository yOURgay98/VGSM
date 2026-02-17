"use client";

import { useState } from "react";

import { CreateDispatchCallForm } from "@/components/forms/create-dispatch-call-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateDispatchCallDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" data-tour="dispatch-create-call">
          New Call
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Dispatch Call</DialogTitle>
          <DialogDescription>Open a new call and dispatch units.</DialogDescription>
        </DialogHeader>
        <CreateDispatchCallForm
          onCreated={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
