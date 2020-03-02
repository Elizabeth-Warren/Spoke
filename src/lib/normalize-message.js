export default function normalizeMessage(rawText) {
  return rawText.trim().replace(/[\u2018\u2019]/g, "'");
}
