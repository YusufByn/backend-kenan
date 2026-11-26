import { IsNotEmpty, IsString } from "class-validator";

export class ReplyToReviewDto {
  @IsString()
  @IsNotEmpty()
  reply!: string;
}
