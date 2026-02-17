"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/services/auth";
import { ensureCommunitySystemRoles } from "@/lib/services/community";
import { getCurrentSessionToken } from "@/lib/services/session";

type CreateCommunityResult = {
  success: boolean;
  message: string;
  communityId?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueSlug(base: string) {
  let candidate = base || "community";
  let index = 1;
  while (true) {
    const exists = await prisma.community.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    index += 1;
    candidate = `${base || "community"}-${index}`;
  }
}

export async function createCommunityFromOnboardingAction(
  _prev: CreateCommunityResult,
  formData: FormData,
): Promise<CreateCommunityResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) {
    return { success: false, message: "Community name must be at least 3 characters." };
  }

  const slug = await uniqueSlug(slugify(name));

  try {
    const community = await prisma.community.create({
      data: {
        name,
        slug,
        settingsJson: {},
      },
      select: { id: true },
    });

    await ensureCommunitySystemRoles(community.id);
    const ownerRole = await prisma.communityRole.findUnique({
      where: {
        communityId_name: {
          communityId: community.id,
          name: Role.OWNER,
        },
      },
      select: { id: true },
    });

    if (!ownerRole) {
      return { success: false, message: "Unable to initialize OWNER role." };
    }

    await prisma.communityMembership.upsert({
      where: {
        communityId_userId: {
          communityId: community.id,
          userId: user.id,
        },
      },
      update: { roleId: ownerRole.id },
      create: {
        communityId: community.id,
        userId: user.id,
        roleId: ownerRole.id,
      },
    });

    const token = await getCurrentSessionToken();
    if (token) {
      await prisma.session.updateMany({
        where: { sessionToken: token, userId: user.id },
        data: { activeCommunityId: community.id },
      });
    }

    revalidatePath("/onboarding");
    revalidatePath("/app");
    return { success: true, message: "Community created.", communityId: community.id };
  } catch {
    return { success: false, message: "Failed to create community." };
  }
}

export async function switchCommunityAction(communityId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const targetId = communityId.trim();
  if (!targetId) {
    throw new Error("Community id is required.");
  }

  const membership = await prisma.communityMembership.findUnique({
    where: {
      communityId_userId: {
        communityId: targetId,
        userId: user.id,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("You are not a member of that community.");
  }

  const token = await getCurrentSessionToken();
  if (!token) {
    throw new Error("Session missing.");
  }

  await prisma.session.updateMany({
    where: { sessionToken: token, userId: user.id },
    data: { activeCommunityId: targetId },
  });

  revalidatePath("/app");
}
