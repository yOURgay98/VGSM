"use client";

import { useState } from "react";

import { CreatePlayerForm } from "@/components/forms/create-player-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreatePlayerDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">Add Player</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Player</DialogTitle>
          <DialogDescription>Track a player profile and baseline notes.</DialogDescription>
        </DialogHeader>
        <CreatePlayerForm />
      </DialogContent>
    </Dialog>
  );
}
