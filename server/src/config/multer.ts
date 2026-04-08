import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "./env";

const uploadRoot = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, uploadRoot);
  },
  filename(_request, file, callback) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    callback(null, `${Date.now()}_${safeName}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024
  }
});

export function toUploadUrl(filename: string): string {
  return `${env.uploadBaseUrl}/${filename}`;
}
