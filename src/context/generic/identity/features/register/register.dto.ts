import { IsNotEmpty, IsString } from "class-validator";

/** Forme de la requête HTTP. Les règles métier (format d'email, longueur du mot de passe) sont dans l'entité. */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
