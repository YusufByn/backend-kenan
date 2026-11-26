import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export const MAX_PAGE_SIZE = 50;

/** Query params communs à toutes les listes paginées : ?page=2&limit=20. À étendre par les query DTO des slices. */
export class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 20;
}

export type PageRequest = { page: number; limit: number };

/** Une page de résultats. Le controller la renvoie avec withPage() : items dans `data`, le reste dans `meta`. */
export type Page<T> = { items: T[]; page: number; limit: number; total: number };

/** Nombre de lignes à sauter pour arriver à la page demandée. */
export const offsetOf = ({ page, limit }: PageRequest): number => (page - 1) * limit;
