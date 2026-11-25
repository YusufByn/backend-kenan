import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
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

/** Forme de la requête. Les règles (prix, année, URLs des photos) sont dans l'entité Listing. */
export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  brand!: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsIn([...CATEGORIES])
  category!: Category;

  @IsIn([...FRAME_SIZES])
  frameSize!: FrameSize;

  @IsIn([...WHEEL_SIZES])
  wheelSize!: WheelSize;

  @IsIn([...CONDITIONS])
  condition!: Condition;

  @IsInt()
  year!: number;

  @IsInt()
  priceCents!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
