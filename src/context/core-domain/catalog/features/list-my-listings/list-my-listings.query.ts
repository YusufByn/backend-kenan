import { IsIn, IsOptional } from "class-validator";
import { PaginationQuery } from "@core/http/pagination.js";
import { LISTING_STATUSES, type ListingStatus } from "../../domain/listing.js";

/** Query params de GET /me/listings : ?status=draft&page=1&limit=20 */
export class ListMyListingsQuery extends PaginationQuery {
  @IsOptional()
  @IsIn([...LISTING_STATUSES])
  status?: ListingStatus;
}
