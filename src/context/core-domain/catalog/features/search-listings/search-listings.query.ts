import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import {
  CATEGORIES,
  CONDITIONS,
  FRAME_SIZES,
  WHEEL_SIZES,
  type Category,
  type Condition,
  type FrameSize,
  type WheelSize,
} from "../../domain/listing.entity.js";
import { LISTING_SORTS, type ListingSort } from "../../domain/listing.repository.js";

/** Query params de GET /listings. Les nombres arrivent en texte : @Type les convertit. */
export class SearchListingsQuery {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn([...CATEGORIES])
  category?: Category;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsIn([...FRAME_SIZES])
  frameSize?: FrameSize;

  @IsOptional()
  @IsIn([...WHEEL_SIZES])
  wheelSize?: WheelSize;

  @IsOptional()
  @IsIn([...CONDITIONS])
  condition?: Condition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPriceCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPriceCents?: number;

  @IsOptional()
  @IsIn([...LISTING_SORTS])
  sort: ListingSort = "recent";

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
