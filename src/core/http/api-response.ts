import type { FieldErrors } from "../errors/domain-error.js";
import type { Page } from "./pagination.js";

/** Toute réponse réussie. Construite automatiquement par ApiResponseInterceptor. */
export interface ApiSuccess<T = unknown, M = unknown> {
  code: number;
  data: T;
  meta: M | null;
}

/** Toute réponse en erreur. Construite uniquement par ApiExceptionFilter. */
export interface ApiError {
  code: number;
  message: string;
  fields: FieldErrors | null;
  errcode: string;
}

/** Données accompagnées d'infos annexes (ex. pagination). Reconnu par ApiResponseInterceptor. */
export class WithMeta<T, M> {
  constructor(
    readonly data: T,
    readonly meta: M,
  ) {}
}

/** À renvoyer depuis un controller quand la réponse a un `meta` : return withMeta(items, { page, limit, total }). */
export function withMeta<T, M>(data: T, meta: M): WithMeta<T, M> {
  return new WithMeta(data, meta);
}

/** Une page de résultats : `data` = les éléments, `meta` = { page, limit, total, totalPages }. */
export function withPage<T>({ items, page, limit, total }: Page<T>) {
  return withMeta(items, { page, limit, total, totalPages: Math.ceil(total / limit) });
}
