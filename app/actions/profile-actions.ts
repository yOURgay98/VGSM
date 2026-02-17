"use server";

import { revalidatePath } from "next/cache";

import { changePasswordSchema } from "@/lib/validations/auth";
import { changeUserPassword } from "@/lib/services/user";
import { requireSessionUser } from "@/lib/services/auth";

interface MutationResult {
  success: boolean;
  message: string;
}

export async function changePasswordAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  let user: Awaited<ReturnType<typeof requireSessionUser>>;
  try {
    user = await requireSessionUser();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Authentication required.",
    };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid password payload.",
    };
  }

  try {
    await changeUserPassword({
      userId: user.id,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to change password.",
    };
  }

  revalidatePath("/app/profile");

  return { success: true, message: "Password changed." };
}
