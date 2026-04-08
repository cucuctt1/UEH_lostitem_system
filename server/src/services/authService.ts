import bcrypt from "bcryptjs";
import { signAccessToken } from "../config/jwt";
import { AppError } from "../utils/http";
import { createUser, findUserByEmail } from "../models/userModel";
import { AuthSession, User } from "../domain/entities";

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.is_locked) {
    throw new AppError(403, "Your account is locked by admin");
  }

  const token = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name
  });

  const userEntity = User.fromDb(user);
  const session = new AuthSession(token, userEntity);

  return session.toApiView();
}

export async function register(email: string, password: string, fullName: string) {
  const normalizedEmail = email.toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new AppError(409, "Email already exists");
  }

  const hash = await bcrypt.hash(password, 10);
  const userId = await createUser(normalizedEmail, hash, fullName, "user");

  const token = signAccessToken({
    id: userId,
    email: normalizedEmail,
    role: "user",
    fullName
  });

  const userEntity = new User(userId, normalizedEmail, fullName, "user");
  const session = new AuthSession(token, userEntity);

  return session.toApiView();
}
