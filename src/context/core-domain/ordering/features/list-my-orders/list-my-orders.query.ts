import { IsIn, IsOptional } from "class-validator";
import { PaginationQuery } from "@core/http/pagination.js";
import { ORDER_STATUSES, type OrderStatus } from "../../domain/order.js";

/** Query params de GET /orders et GET /me/sales : ?status=paid&page=1&limit=20 */
export class ListMyOrdersQuery extends PaginationQuery {
  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: OrderStatus;
}
