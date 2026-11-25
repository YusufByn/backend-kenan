import type { ValidationError } from "class-validator";
import { DomainError, type FieldErrors } from "../errors/domain-error.js";

/** DTO refusé par le ValidationPipe : champs manquants, mauvais type, champ inconnu... */
export class RequestValidationError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "VALIDATION_FAILED";

  constructor(errors: ValidationError[]) {
    super("Certains champs sont invalides", toFieldErrors(errors));
  }
}

/** Aplatit les erreurs imbriquées : shippingAddress → city devient "shippingAddress.city", photoUrls[0] devient "photoUrls.0". */
function toFieldErrors(errors: ValidationError[], parent = ""): FieldErrors {
  const fields: FieldErrors = {};
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) fields[path] = Object.values(error.constraints);
    if (error.children?.length) Object.assign(fields, toFieldErrors(error.children, path));
  }
  return fields;
}
