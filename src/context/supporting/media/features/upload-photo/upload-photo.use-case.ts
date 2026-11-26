import { Injectable, Logger } from "@nestjs/common";
import { detectImageFormat } from "../../domain/image-format.js";
import { InvalidPhotoError } from "../../domain/media.errors.js";
import { PhotoStorage } from "../../domain/photo-storage.js";

/**
 * Upload d'une photo d'annonce. Renvoie son URL, à mettre dans `photoUrls` de POST/PATCH /listings.
 * Les deux étapes sont séparées : l'annonce ne stocke que des URLs, peu importe où vivent les fichiers.
 */
@Injectable()
export class UploadPhotoUseCase {
  private readonly logger = new Logger("UploadPhoto");

  constructor(private readonly storage: PhotoStorage) {}

  async execute(userId: string, file: { buffer: Buffer; size: number } | undefined): Promise<{ url: string }> {
    if (!file || file.size === 0) throw new InvalidPhotoError("Envoie une image dans le champ \"file\" (multipart/form-data)");
    const format = detectImageFormat(file.buffer);
    if (!format) throw new InvalidPhotoError("Format non accepté : JPEG, PNG ou WebP uniquement");

    const url = await this.storage.save(file.buffer, format);
    this.logger.log(`Photo ${format} de ${Math.round(file.size / 1024)} Ko envoyée par ${userId}`);
    return { url };
  }
}
