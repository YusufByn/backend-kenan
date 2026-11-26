import { IsIn, IsOptional } from "class-validator";
import { PaginationQuery } from "@core/http/pagination.js";
import { ORDER_STATUSES, type OrderStatus } from "../../domain/order.js";

/** Query params de GET /me/sales : ?status=paid pour voir ce qu'il reste à expédier. */
export class ListMySalesQuery extends PaginationQuery {
  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: OrderStatus;
}
