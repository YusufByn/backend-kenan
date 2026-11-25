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
} from "../../domain/listing.js";

/** Tous les champs sont optionnels : seuls ceux envoyés sont modifiés. */
export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsIn([...CATEGORIES])
  category?: Category;

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
  @IsInt()
  year?: number;

  @IsOptional()
  @IsInt()
  priceCents?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
