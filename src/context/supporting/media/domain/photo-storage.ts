import type { ImageFormat } from "./image-format.js";

/** Port : où sont rangées les photos. Disque local en dev ; S3 / Cloudinary en prod = un nouvel adapter. */
export abstract class PhotoStorage {
  /** Enregistre la photo sous un nom aléatoire et renvoie son URL publique. */
  abstract save(content: Buffer, format: ImageFormat): Promise<string>;
}
