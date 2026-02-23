"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_PAYLOAD = JSON.stringify(
  {
    playerName: "Demo Player",
    action: "warn",
    reason: "Sandbox test event",
  },
  null,
  2,
);

export function ErlcSandbox() {
  const [token, setToken] = useState("");
  const [eventType, setEventType] = useState("moderation.action");
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setMessage(null);
    try {
      const parsedPayload = JSON.parse(payload || "{}");
      const res = await fetch("/api/integrations/erlc/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": token.trim(),
        },
        body: JSON.stringify({ eventType, payload: parsedPayload }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      setMessage("Test event accepted. Check Audit for integrations.erlc.event_ingested.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit test event.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
      <div>
        <p className="text-[13px] font-medium text-[color:var(--text-main)]">ERLC Event Sandbox</p>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Use an ERLC ingestion API key to post test events into the stub endpoint.
        </p>
      </div>

      <div className="grid gap-3">
        <div>
          <Label htmlFor="sandbox-token">Ingestion token</Label>
          <Input
            id="sandbox-token"
            className="mt-1"
            placeholder="Paste the one-time key value"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sandbox-event-type">Event type</Label>
          <Input
            id="sandbox-event-type"
            className="mt-1"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sandbox-payload">Payload (JSON)</Label>
          <textarea
            id="sandbox-payload"
            className="input-neutral ui-transition mt-1 min-h-[170px] w-full rounded-[var(--radius-control)] px-3 py-2 text-[12px] font-mono"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[color:var(--text-muted)]">{message ?? " "}</p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={pending || token.trim().length < 16}
          onClick={() => void submit()}
        >
          {pending ? "Sending..." : "Send Test Event"}
        </Button>
      </div>
    </div>
  );
}

