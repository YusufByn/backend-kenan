const PREVIEW_LENGTH = 120;

/** Début d'un message, sur une ligne, pour une liste ou un email. */
export function previewOf(body: string): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  return oneLine.length > PREVIEW_LENGTH ? `${oneLine.slice(0, PREVIEW_LENGTH - 1)}…` : oneLine;
}
