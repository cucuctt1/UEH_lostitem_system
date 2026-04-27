import bcrypt from "bcryptjs";
import { signAccessToken } from "../config/jwt";
import { AppError } from "../utils/http";
import { findUserByEmail } from "../models/userModel";
import { AuthSession, User } from "../domain/entities";

const REQUIRED_EMAIL_DOMAIN = "@st.ueh.edu.vn";

function normalizeSchoolEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized.endsWith(REQUIRED_EMAIL_DOMAIN)) {
    throw new AppError(400, "Email must end with @st.ueh.edu.vn");
  }

  return normalized;
}

export async function login(email: string, password: string) {
  const normalizedEmail = normalizeSchoolEmail(email);
  const user = await findUserByEmail(normalizedEmail);
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
