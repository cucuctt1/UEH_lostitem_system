import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { apiRateLimiter } from "./middleware/rateLimit";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import postRoutes from "./routes/postRoutes";
import searchRoutes from "./routes/searchRoutes";
import messageRoutes from "./routes/messageRoutes";
import adminRoutes from "./routes/adminRoutes";
import matchRoutes from "./routes/matchRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import reportRoutes from "./routes/reportRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import lookupRoutes from "./routes/lookupRoutes";
import bookmarkRoutes from "./routes/bookmarkRoutes";

export const app = express();

const allowedOrigins = new Set(env.clientOrigins);
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/;
const ngrokOriginPattern = /^https?:\/\/[a-z0-9-]+\.(?:ngrok-free\.app|ngrok\.io)(?::\d+)?$/i;

app.use(
  helmet({
    // Upload images are rendered by a different origin (frontend host), so keep CORP permissive.
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowedNgrokOrigin = env.allowNgrokOrigins && ngrokOriginPattern.test(origin);

      if (allowedOrigins.has(origin) || localDevOriginPattern.test(origin) || isAllowedNgrokOrigin) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

app.use(
  "/uploads",
  (_request, response, next) => {
    response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.resolve(__dirname, "../uploads"))
);

app.get("/health", (_request, response) => {
  response.json({ success: true, message: "Server is healthy" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/search", searchRoutes);
app.use("/messages", messageRoutes);
app.use("/matches", matchRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reports", reportRoutes);
app.use("/admin", adminRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/lookup", lookupRoutes);
app.use("/bookmarks", bookmarkRoutes);

app.use(notFound);
app.use(errorHandler);
