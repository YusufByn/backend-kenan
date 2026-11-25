import { IsInt, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateReviewDto {
  @IsUUID()
  orderId!: string;

  @IsInt()
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
