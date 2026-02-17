"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function DiscordLinkButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await signIn("discord", { callbackUrl: "/app/settings/integrations/discord" });
        });
      }}
    >
      {pending ? "Linking..." : "Link Discord"}
    </Button>
  );
}
