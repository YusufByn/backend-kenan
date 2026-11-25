import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { ORDER_STATUSES, type OrderStatus } from "../../domain/order.js";

/** Query params de GET /admin/orders. */
export class AdminListOrdersQuery {
  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
