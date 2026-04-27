import { AppError } from "../utils/http";
import {
  findUserById,
  getUserPostHistory,
  getUserReturnHistory,
  updateUserPassword,
  updateUserProfile
} from "../models/userModel";
import { User, UserPostHistory, UserReturnHistory } from "../domain/entities";
import bcrypt from "bcryptjs";

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

export async function changeMyPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const currentPasswordMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!currentPasswordMatch) {
    throw new AppError(400, "Current password is incorrect");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
  if (isSamePassword) {
    throw new AppError(400, "New password must be different from current password");
  }

  const nextHash = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(userId, nextHash);
}
