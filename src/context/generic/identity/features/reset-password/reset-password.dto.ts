import { IsNotEmpty, IsString } from "class-validator";

export class ResetPasswordDto {
  /** Le jeton reçu dans le lien de l'email. */
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}
