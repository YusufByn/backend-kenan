import { Module } from "@nestjs/common";
import { IdentityModule } from "@identity";
import { PhotoStorage } from "./domain/photo-storage.js";
import { UploadPhotoController } from "./features/upload-photo/upload-photo.controller.js";
import { UploadPhotoUseCase } from "./features/upload-photo/upload-photo.use-case.js";
import { LocalDiskPhotoStorage } from "./infrastructure/local-disk-photo-storage.js";

/** Stockage des photos. Ne connaît pas les annonces : il renvoie une URL, catalog la stocke. */
@Module({
  imports: [IdentityModule], // RequirePermission
  controllers: [UploadPhotoController],
  providers: [UploadPhotoUseCase, { provide: PhotoStorage, useClass: LocalDiskPhotoStorage }],
})
export class MediaModule {}
