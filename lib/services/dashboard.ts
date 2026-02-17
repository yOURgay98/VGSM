import { prisma } from "@/lib/db";
import { getOpenReportCount } from "@/lib/services/report";
import { getRecentActions, getStaffActivity } from "@/lib/services/action";
import { getFlaggedPlayers } from "@/lib/services/player";

export async function getDashboardData(input: { communityId: string }) {
  const [openReports, recentActions, staffActivity, flaggedPlayers] = await Promise.all([
    getOpenReportCount({ communityId: input.communityId }),
    getRecentActions({ communityId: input.communityId, limit: 8 }),
    getStaffActivity({ communityId: input.communityId, days: 7 }),
    getFlaggedPlayers({ communityId: input.communityId, limit: 8 }),
  ]);

  const totalCasesOpen = await prisma.case.count({
    where: { communityId: input.communityId, status: { in: ["OPEN", "IN_REVIEW"] } },
  });

  return {
    openReports,
    totalCasesOpen,
    recentActions,
    staffActivity,
    flaggedPlayers,
  };
}
