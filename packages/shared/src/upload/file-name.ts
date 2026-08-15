const MAX_SLUG_LENGTH = 60;
const FALLBACK_SLUG = "fichier";
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Le nom d'origine n'est jamais réutilisé tel quel dans une clé S3 : il est translittéré
 * en ASCII minuscule pour rester inoffensif dans une URL et dans un en-tête HTTP.
 */
export function slugifyFileName(originalFilename: string): string {
  const withoutExtension = originalFilename.replace(/\.[^.]+$/, "");
  const slug = withoutExtension
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug.length > 0 ? slug : FALLBACK_SLUG;
}

const BYTE_UNITS = ["o", "ko", "Mo", "Go"] as const;

export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${BYTE_UNITS[unitIndex] ?? "o"}`;
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
