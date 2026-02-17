"use server";

import { revalidatePath } from "next/cache";

import { createPlayerSchema, updatePlayerSchema } from "@/lib/validations/player";
import { createPlayer, updatePlayer } from "@/lib/services/player";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

interface MutationResult {
  success: boolean;
  message: string;
}

export async function createPlayerAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.PLAYERS_EDIT);

  const parsed = createPlayerSchema.safeParse({
    name: formData.get("name"),
    robloxId: formData.get("robloxId"),
    discordId: formData.get("discordId"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid player payload.",
    };
  }

  await createPlayer({
    ...parsed.data,
    communityId: user.communityId,
    actorUserId: user.id,
  });

  revalidatePath("/app/players");
  revalidatePath("/app/dashboard");

  return { success: true, message: "Player added." };
}

export async function updatePlayerAction(
  playerId: string,
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.PLAYERS_EDIT);

  const parsed = updatePlayerSchema.safeParse({
    status: formData.get("status"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid player payload.",
    };
  }

  await updatePlayer({
    communityId: user.communityId,
    playerId,
    status: parsed.data.status,
    notes: parsed.data.notes,
    actorUserId: user.id,
  });

  revalidatePath("/app/players");
  revalidatePath(`/app/players/${playerId}`);
  revalidatePath("/app/dashboard");

  return { success: true, message: "Player updated." };
}
