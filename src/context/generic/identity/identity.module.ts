import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "@core/config/env.js";
import { AccessTokens } from "./domain/access-tokens.js";
import { PasswordHasher } from "./domain/password-hasher.js";
import { UserRepository } from "./domain/user.repository.js";
import { GetMeController } from "./features/get-me/get-me.controller.js";
import { GetMeHandler } from "./features/get-me/get-me.handler.js";
import { GetPublicProfileController } from "./features/get-public-profile/get-public-profile.controller.js";
import { GetPublicProfileHandler } from "./features/get-public-profile/get-public-profile.handler.js";
import { LoginController } from "./features/login/login.controller.js";
import { LoginHandler } from "./features/login/login.handler.js";
import { RegisterController } from "./features/register/register.controller.js";
import { RegisterHandler } from "./features/register/register.handler.js";
import { UpdateMeController } from "./features/update-me/update-me.controller.js";
import { UpdateMeHandler } from "./features/update-me/update-me.handler.js";
import { JwtAccessTokens } from "./infrastructure/jwt-access-tokens.js";
import { ScryptPasswordHasher } from "./infrastructure/scrypt-password-hasher.js";
import { TypeOrmUserRepository } from "./infrastructure/typeorm-user.repository.js";
import { UserOrmEntity } from "./infrastructure/user.orm-entity.js";
import { IdentityUserQueries } from "./public/identity-user-queries.js";
import { UserQueries } from "./public/user-queries.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.register({ secret: env.jwtSecret, signOptions: { expiresIn: env.jwtExpiresIn } }),
  ],
  controllers: [
    RegisterController,
    LoginController,
    GetMeController,
    UpdateMeController,
    GetPublicProfileController,
  ],
  providers: [
    RegisterHandler,
    LoginHandler,
    GetMeHandler,
    UpdateMeHandler,
    GetPublicProfileHandler,

    // Ports -> adapters. Changer d'implémentation = changer une ligne ici.
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
    { provide: AccessTokens, useClass: JwtAccessTokens },

    // Contrat public -> implémentation.
    { provide: UserQueries, useClass: IdentityUserQueries },
  ],
  // UserQueries : lire un user depuis un autre contexte.
  // AccessTokens : requis par JwtAuthGuard quand un autre contexte l'utilise sur ses routes.
  exports: [UserQueries, AccessTokens],
})
export class IdentityModule {}
