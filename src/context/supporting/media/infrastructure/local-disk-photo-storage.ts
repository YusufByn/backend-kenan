import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import { env } from "@core/config/env.js";
import type { ImageFormat } from "../domain/image-format.js";
import { PhotoStorage } from "../domain/photo-storage.js";

/**
 * Photos dans le dossier UPLOADS_DIR, servies par main.ts sur /uploads.
 * Nom = UUID : impossible de deviner les autres photos ou d'écraser un fichier existant.
 */
@Injectable()
export class LocalDiskPhotoStorage extends PhotoStorage {
  async save(content: Buffer, format: ImageFormat): Promise<string> {
    await mkdir(env.uploadsDir, { recursive: true });
    const filename = `${randomUUID()}.${format}`;
    await writeFile(join(env.uploadsDir, filename), content, { flag: "wx" });
    return `${env.publicUrl}/uploads/${filename}`;
  }
}
