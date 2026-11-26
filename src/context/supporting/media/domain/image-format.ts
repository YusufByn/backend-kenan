export type ImageFormat = "jpg" | "png" | "webp";

/** 5 Mo : une photo de téléphone compressée tient largement dedans. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Format réel d'une image, lu dans ses premiers octets ("magic numbers"), ou null si ce n'est pas une image acceptée.
 * On ne fait pas confiance à l'extension ni au Content-Type envoyés par le client : ils se falsifient trivialement.
 */
export function detectImageFormat(content: Uint8Array): ImageFormat | null {
  const startsWith = (bytes: number[], offset = 0) => bytes.every((byte, i) => content[offset + i] === byte);
  if (startsWith([0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // "RIFF" .... "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}
