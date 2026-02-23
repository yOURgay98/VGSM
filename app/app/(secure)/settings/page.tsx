import { AppearanceSettings } from "@/components/forms/appearance-settings";
import { GeneralSettingsForm } from "@/components/forms/general-settings-form";
import { MapSettingsForm } from "@/components/forms/map-settings-form";
import { SecuritySettingsForm } from "@/components/forms/security-settings-form";
import { MacWindow } from "@/components/layout/mac-window";
import { getMapSettings } from "@/lib/services/map-settings";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { getGeneralSettings } from "@/lib/services/settings";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function SettingsPage() {
  const actor = await requirePermission(Permission.SETTINGS_EDIT);
  const [settings, security, mapSettings] = await Promise.all([
    getGeneralSettings(actor.communityId),
    getSecuritySettings(actor.communityId),
    getMapSettings(actor.communityId),
  ]);

  return (
    <div className="space-y-3">
      <MacWindow title="Appearance" subtitle="Theme + accent preview">
        <AppearanceSettings />
      </MacWindow>

      <MacWindow
        title="General Settings"
        subtitle="Community-level defaults and moderation presets"
      >
        <GeneralSettingsForm initialValues={settings} />
      </MacWindow>

      <MacWindow title="Security" subtitle="2FA enforcement, approvals, and lockout thresholds">
        <SecuritySettingsForm
          initialValues={security}
          encryptionKeyConfigured={Boolean(process.env.AUTH_ENCRYPTION_KEY)}
        />
      </MacWindow>

      <MacWindow title="Map" subtitle="Tactical map style configuration (community-scoped)">
        <MapSettingsForm initialValues={mapSettings} />
      </MacWindow>

      <MacWindow
        title="Access Control"
        subtitle="Manage roles and invite templates for this community"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/roles">Roles</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/invites">Invites</Link>
          </Button>
          {actor.permissions.includes(Permission.API_KEYS_MANAGE) &&
          actor.membership.role.name === "OWNER" ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/app/settings/access-keys">Access Keys</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/integrations">Integrations</Link>
          </Button>
        </div>
      </MacWindow>
    </div>
  );
}
