import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class StartConversationDto {
  @IsUUID()
  listingId!: string;

  /** Premier message au vendeur. */
  @IsString()
  @IsNotEmpty()
  message!: string;
}
