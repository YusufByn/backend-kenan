import { DomainError } from "@core/errors/domain-error.js";

export class InvalidPhotoError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "PHOTO_INVALID";

  constructor(message: string) {
    super(message, "file");
  }
}
