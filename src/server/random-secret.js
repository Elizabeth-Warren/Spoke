import crypto from "crypto";

export default function randomSecret() {
  return crypto.randomBytes(32).toString("hex");
}
