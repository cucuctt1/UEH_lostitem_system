import { createNotification } from "../models/notificationModel";
import { getMatchWithOwnersById, setMatchStatus } from "../models/matchModel";
import { AppError } from "../utils/http";

export async function verifyMatchWorkflow(
  matchId: number,
  requesterId: number,
  status: "accepted" | "rejected"
): Promise<void> {
  const match = await getMatchWithOwnersById(matchId);
  if (!match) {
    throw new AppError(404, "Match not found");
  }

  const canVerify = requesterId === match.lost_owner_id || requesterId === match.found_owner_id;
  if (!canVerify) {
    throw new AppError(403, "Only post owners in this match can verify");
  }

  if (match.status === "returned") {
    throw new AppError(400, "Cannot verify a match that is already returned");
  }

  if (match.status === status) {
    return;
  }

  await setMatchStatus(matchId, status);

  const otherOwnerId = requesterId === match.lost_owner_id ? match.found_owner_id : match.lost_owner_id;
  const statusMessage = status === "accepted" ? "đã xác minh khớp" : "đã từ chối khớp";

  await createNotification({
    userId: otherOwnerId,
    type: "matching_result",
    title: status === "accepted" ? "Match đã được xác minh" : "Match bị từ chối",
    body: `Người đăng phía còn lại ${statusMessage} cho cặp #${matchId}.`,
    referenceType: "match",
    referenceId: matchId
  });
}