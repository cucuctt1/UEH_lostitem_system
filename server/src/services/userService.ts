import { AppError } from "../utils/http";
import {
  findUserById,
  getUserPostHistory,
  getUserReturnHistory,
  updateUserProfile
} from "../models/userModel";
import { User, UserPostHistory, UserReturnHistory } from "../domain/entities";

export async function getMyProfile(userId: number) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return User.fromDb(user).toProfileView();
}

export async function updateMyProfile(
  userId: number,
  payload: { fullName?: string; bio?: string; avatarUrl?: string }
): Promise<void> {
  await updateUserProfile(userId, payload);
}

export async function getMyHistory(userId: number) {
  const [posts, returns] = await Promise.all([
    getUserPostHistory(userId),
    getUserReturnHistory(userId)
  ]);

  return {
    posts: posts.map((post) => UserPostHistory.fromDb(post).toApiView()),
    returns: returns.map((entry) => UserReturnHistory.fromDb(entry).toApiView())
  };
}
