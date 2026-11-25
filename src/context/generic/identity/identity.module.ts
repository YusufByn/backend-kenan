import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "@core/config/env.js";
import { AccessTokens } from "./domain/access-tokens.js";
import { AdminEmails } from "./domain/admin-emails.js";
import { PasswordHasher } from "./domain/password-hasher.js";
import { UserRepository } from "./domain/user.repository.js";
import { AdminChangeUserRoleController } from "./features/admin-change-user-role/admin-change-user-role.controller.js";
import { AdminChangeUserRoleUseCase } from "./features/admin-change-user-role/admin-change-user-role.use-case.js";
import { AdminListUsersController } from "./features/admin-list-users/admin-list-users.controller.js";
import { AdminListUsersUseCase } from "./features/admin-list-users/admin-list-users.use-case.js";
import { AdminReactivateUserController } from "./features/admin-reactivate-user/admin-reactivate-user.controller.js";
import { AdminReactivateUserUseCase } from "./features/admin-reactivate-user/admin-reactivate-user.use-case.js";
import { AdminSuspendUserController } from "./features/admin-suspend-user/admin-suspend-user.controller.js";
import { AdminSuspendUserUseCase } from "./features/admin-suspend-user/admin-suspend-user.use-case.js";
import { BootstrapAdminsUseCase } from "./features/bootstrap-admins/bootstrap-admins.use-case.js";
import { GetMeController } from "./features/get-me/get-me.controller.js";
import { GetMeUseCase } from "./features/get-me/get-me.use-case.js";
import { GetPublicProfileController } from "./features/get-public-profile/get-public-profile.controller.js";
import { GetPublicProfileUseCase } from "./features/get-public-profile/get-public-profile.use-case.js";
import { LoginController } from "./features/login/login.controller.js";
import { LoginUseCase } from "./features/login/login.use-case.js";
import { RegisterController } from "./features/register/register.controller.js";
import { RegisterUseCase } from "./features/register/register.use-case.js";
import { UpdateMeController } from "./features/update-me/update-me.controller.js";
import { UpdateMeUseCase } from "./features/update-me/update-me.use-case.js";
import { EnvAdminEmails } from "./infrastructure/env-admin-emails.js";
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
    AdminListUsersController,
    AdminChangeUserRoleController,
    AdminSuspendUserController,
    AdminReactivateUserController,
  ],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    GetMeUseCase,
    UpdateMeUseCase,
    GetPublicProfileUseCase,
    AdminListUsersUseCase,
    AdminChangeUserRoleUseCase,
    AdminSuspendUserUseCase,
    AdminReactivateUserUseCase,
    BootstrapAdminsUseCase,

    // Ports -> adapters. Changer d'implémentation = changer une ligne ici.
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
    { provide: AccessTokens, useClass: JwtAccessTokens },
    { provide: AdminEmails, useClass: EnvAdminEmails },

    // Contrat public -> implémentation.
    { provide: UserQueries, useClass: IdentityUserQueries },
  ],
  // UserQueries : lire un user depuis un autre contexte.
  // AccessTokens + UserRepository : requis par JwtAuthGuard (et donc @RequireRole) quand un autre
  // contexte l'utilise sur ses routes. Exportés côté Nest seulement : ils ne sont pas dans
  // public-api.ts, donc aucun autre contexte ne peut les importer pour s'en servir directement.
  exports: [UserQueries, AccessTokens, UserRepository],
})
export class IdentityModule {}
