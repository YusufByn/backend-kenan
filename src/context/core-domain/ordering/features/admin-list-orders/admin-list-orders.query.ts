import { IsIn, IsOptional, IsUUID } from "class-validator";
import { PaginationQuery } from "@core/http/pagination.js";
import { ORDER_STATUSES, type OrderStatus } from "../../domain/order.js";

/** Query params de GET /admin/orders. */
export class AdminListOrdersQuery extends PaginationQuery {
  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsOptional()
  @IsUUID()
  sellerId?: string;
}
