"use client";

import { useActionState, useState, useTransition } from "react";

import {
  createErlcTokenAction,
  sendErlcTestEventAction,
  setErlcEnabledAction,
} from "@/app/actions/erlc-integration-actions";
import { DisabledAction } from "@/components/shared/disabled-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDateTime } from "@/lib/utils";

const initialEventState = { ok: false, message: "" };

interface ErlcCardProps {
  enabled: boolean;
  lastEventReceivedAt: string | null;
  lastSyncAt: string | null;
  ingestApiKeyId: string | null;
  canManageSettings: boolean;
  canManageKeys: boolean;
}

export function ErlcIntegrationCard({
  enabled,
  lastEventReceivedAt,
  lastSyncAt,
  ingestApiKeyId,
  canManageSettings,
  canManageKeys,
}: ErlcCardProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [creatingToken, startCreateToken] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [eventState, eventAction, eventPending] = useActionState(
    sendErlcTestEventAction,
    initialEventState,
  );

  return (
    <div className="space-y-3 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 shadow-[var(--panel-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-[color:var(--text-main)]">ERLC Integration</p>
          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
            Stub boundary for token-based event ingestion and audit mapping.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[color:var(--text-muted)]">Enabled</span>
          <Switch
            checked={isEnabled}
            disabled={!canManageSettings}
            onCheckedChange={(next) => {
              setIsEnabled(next);
              startCreateToken(async () => {
                await setErlcEnabledAction(next);
              });
            }}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Snapshot label="Status" value={isEnabled ? "Connected (stub)" : "Not connected"} />
        <Snapshot
          label="Last event"
          value={lastEventReceivedAt ? formatDateTime(new Date(lastEventReceivedAt)) : "-"}
        />
        <Snapshot
          label="Last sync"
          value={lastSyncAt ? formatDateTime(new Date(lastSyncAt)) : "-"}
        />
      </div>

      <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
        <p className="text-xs text-[color:var(--text-muted)]">
          Ingestion token status:{" "}
          <span className="font-medium text-[color:var(--text-main)]">
            {ingestApiKeyId ? `Configured (${ingestApiKeyId.slice(0, 10)}...)` : "Not generated"}
          </span>
        </p>
        {canManageKeys ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={creatingToken}
              onClick={() => {
                startCreateToken(async () => {
                  const created = await createErlcTokenAction();
                  if (created.ok && created.key) {
                    setToken(created.key);
                  }
                });
              }}
            >
              {creatingToken ? "Generating..." : "Generate / Rotate token"}
            </Button>
            {token ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void navigator.clipboard?.writeText(token)}
              >
                Copy token
              </Button>
            ) : null}
          </div>
        ) : (
          <DisabledAction label="Generate token" />
        )}

        {token ? (
          <div className="mt-2 rounded-[var(--radius-control)] border border-emerald-500/25 bg-emerald-500/10 p-2">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              Token shown once
            </p>
            <code className="mt-1 block truncate text-[12px] text-emerald-900 dark:text-emerald-100">
              {token}
            </code>
          </div>
        ) : null}
      </div>

      {canManageKeys ? (
        <form action={eventAction} className="space-y-2 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
          <p className="text-xs font-medium text-[color:var(--text-main)]">Event ingestion test</p>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <Label htmlFor="eventType">Event type</Label>
              <Input id="eventType" name="eventType" className="mt-1 h-8" defaultValue="moderation.action" />
            </div>
            <div>
              <Label htmlFor="payload">Payload JSON</Label>
              <Input
                id="payload"
                name="payload"
                className="mt-1 h-8"
                defaultValue='{\"playerName\":\"Demo Player\",\"action\":\"warn\"}'
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-xs ${eventState.ok ? "text-emerald-600 dark:text-emerald-300" : "text-[color:var(--text-muted)]"}`}
            >
              {eventState.message || " "}
            </p>
            <Button type="submit" variant="outline" size="sm" disabled={eventPending}>
              {eventPending ? "Sending..." : "Send test event"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-medium text-[color:var(--text-main)]">{value}</p>
    </div>
  );
}

