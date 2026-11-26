import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailDto {
  /** Le jeton reçu dans le lien de l'email. */
  @IsString()
  @IsNotEmpty()
  token!: string;
}
