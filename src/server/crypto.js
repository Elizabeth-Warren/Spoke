import crypto from "crypto";

export function secureRandomString(size) {
  return crypto.randomBytes(size).toString("hex");
}
