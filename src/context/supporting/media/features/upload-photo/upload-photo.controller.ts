import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { CurrentUserId, RequirePermission } from "@identity";
import { MAX_PHOTO_BYTES } from "../../domain/image-format.js";
import { UploadPhotoUseCase } from "./upload-photo.use-case.js";

@Controller("uploads")
@RequirePermission("LISTING_SELL") // seuls ceux qui peuvent vendre ont besoin d'envoyer des photos
export class UploadPhotoController {
  constructor(private readonly useCase: UploadPhotoUseCase) {}

  /** Fichier gardé en mémoire (pas de fichier temporaire), refusé au-delà de 5 Mo (413) avant même d'arriver ici. */
  @Post("photos")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } })
  handle(@CurrentUserId() userId: string, @UploadedFile() file?: Express.Multer.File) {
    return this.useCase.execute(userId, file);
  }
}
