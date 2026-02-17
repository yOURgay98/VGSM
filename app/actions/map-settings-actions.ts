"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/services/auth";
import { updateMapSettings } from "@/lib/services/map-settings";
import { mapSettingsSchema } from "@/lib/validations/map";
import { Permission } from "@/lib/security/permissions";

interface MutationResult {
  success: boolean;
  message: string;
}

export async function updateMapSettingsAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.SETTINGS_EDIT);

  const parsed = mapSettingsSchema.safeParse({
    styleUrl: formData.get("styleUrl"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid map settings payload.",
    };
  }

  await updateMapSettings({
    actorUserId: user.id,
    communityId: user.communityId,
    payload: parsed.data,
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/dispatch");

  return { success: true, message: "Map settings updated." };
}
