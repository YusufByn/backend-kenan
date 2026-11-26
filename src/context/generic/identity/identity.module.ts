import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "@core/config/env.js";
import { AccessTokens } from "./domain/access-tokens.js";
import { AdminEmails } from "./domain/admin-emails.js";
import { OneTimeTokenIssuer } from "./domain/one-time-token-issuer.js";
import { OneTimeTokenRepository } from "./domain/one-time-token.repository.js";
import { PasswordHasher } from "./domain/password-hasher.js";
import { SecretTokens } from "./domain/secret-tokens.js";
import { SessionIssuer } from "./domain/session-issuer.js";
import { SessionRepository } from "./domain/session.repository.js";
import { UserRepository } from "./domain/user.repository.js";
import { AdminChangeUserPermissionsController } from "./features/admin-change-user-permissions/admin-change-user-permissions.controller.js";
import { AdminChangeUserPermissionsUseCase } from "./features/admin-change-user-permissions/admin-change-user-permissions.use-case.js";
import { AdminChangeUserRoleController } from "./features/admin-change-user-role/admin-change-user-role.controller.js";
import { AdminChangeUserRoleUseCase } from "./features/admin-change-user-role/admin-change-user-role.use-case.js";
import { AdminListUsersController } from "./features/admin-list-users/admin-list-users.controller.js";
import { AdminListUsersUseCase } from "./features/admin-list-users/admin-list-users.use-case.js";
import { AdminReactivateUserController } from "./features/admin-reactivate-user/admin-reactivate-user.controller.js";
import { AdminReactivateUserUseCase } from "./features/admin-reactivate-user/admin-reactivate-user.use-case.js";
import { AdminSuspendUserController } from "./features/admin-suspend-user/admin-suspend-user.controller.js";
import { AdminSuspendUserUseCase } from "./features/admin-suspend-user/admin-suspend-user.use-case.js";
import { BootstrapAdminsUseCase } from "./features/bootstrap-admins/bootstrap-admins.use-case.js";
import { ChangePasswordController } from "./features/change-password/change-password.controller.js";
import { ChangePasswordUseCase } from "./features/change-password/change-password.use-case.js";
import { ForgotPasswordController } from "./features/forgot-password/forgot-password.controller.js";
import { ForgotPasswordUseCase } from "./features/forgot-password/forgot-password.use-case.js";
import { GetMeController } from "./features/get-me/get-me.controller.js";
import { GetMeUseCase } from "./features/get-me/get-me.use-case.js";
import { GetPublicProfileController } from "./features/get-public-profile/get-public-profile.controller.js";
import { GetPublicProfileUseCase } from "./features/get-public-profile/get-public-profile.use-case.js";
import { ListMySessionsController } from "./features/list-my-sessions/list-my-sessions.controller.js";
import { ListMySessionsUseCase } from "./features/list-my-sessions/list-my-sessions.use-case.js";
import { LoginController } from "./features/login/login.controller.js";
import { LoginUseCase } from "./features/login/login.use-case.js";
import { LogoutAllController } from "./features/logout-all/logout-all.controller.js";
import { LogoutAllUseCase } from "./features/logout-all/logout-all.use-case.js";
import { LogoutController } from "./features/logout/logout.controller.js";
import { LogoutUseCase } from "./features/logout/logout.use-case.js";
import { PurgeExpiredAuthDataJob } from "./features/purge-expired-auth-data/purge-expired-auth-data.job.js";
import { RefreshSessionController } from "./features/refresh-session/refresh-session.controller.js";
import { RefreshSessionUseCase } from "./features/refresh-session/refresh-session.use-case.js";
import { RegisterController } from "./features/register/register.controller.js";
import { RegisterUseCase } from "./features/register/register.use-case.js";
import { ResendVerificationController } from "./features/resend-verification/resend-verification.controller.js";
import { ResendVerificationUseCase } from "./features/resend-verification/resend-verification.use-case.js";
import { ResetPasswordController } from "./features/reset-password/reset-password.controller.js";
import { ResetPasswordUseCase } from "./features/reset-password/reset-password.use-case.js";
import { RevokeMySessionController } from "./features/revoke-my-session/revoke-my-session.controller.js";
import { RevokeMySessionUseCase } from "./features/revoke-my-session/revoke-my-session.use-case.js";
import { UpdateMeController } from "./features/update-me/update-me.controller.js";
import { UpdateMeUseCase } from "./features/update-me/update-me.use-case.js";
import { VerifyEmailController } from "./features/verify-email/verify-email.controller.js";
import { VerifyEmailUseCase } from "./features/verify-email/verify-email.use-case.js";
import { CryptoSecretTokens } from "./infrastructure/crypto-secret-tokens.js";
import { EnvAdminEmails } from "./infrastructure/env-admin-emails.js";
import { JwtAccessTokens } from "./infrastructure/jwt-access-tokens.js";
import { OneTimeTokenOrmEntity } from "./infrastructure/one-time-token.orm-entity.js";
import { ScryptPasswordHasher } from "./infrastructure/scrypt-password-hasher.js";
import { SessionOrmEntity } from "./infrastructure/session.orm-entity.js";
import { TypeOrmOneTimeTokenRepository } from "./infrastructure/typeorm-one-time-token.repository.js";
import { TypeOrmSessionRepository } from "./infrastructure/typeorm-session.repository.js";
import { TypeOrmUserRepository } from "./infrastructure/typeorm-user.repository.js";
import { UserOrmEntity } from "./infrastructure/user.orm-entity.js";
import { IdentityUserQueries } from "./public/identity-user-queries.js";
import { UserQueries } from "./public/user-queries.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, SessionOrmEntity, OneTimeTokenOrmEntity]),
    JwtModule.register({ secret: env.jwtSecret, signOptions: { expiresIn: env.jwtExpiresIn } }),
  ],
  controllers: [
    // Connexion et sessions
    RegisterController,
    LoginController,
    RefreshSessionController,
    LogoutController,
    LogoutAllController,
    // Email et mot de passe
    VerifyEmailController,
    ResendVerificationController,
    ForgotPasswordController,
    ResetPasswordController,
    // Mon compte
    GetMeController,
    UpdateMeController,
    ChangePasswordController,
    ListMySessionsController,
    RevokeMySessionController,
    GetPublicProfileController,
    // Modération
    AdminListUsersController,
    AdminChangeUserRoleController,
    AdminChangeUserPermissionsController,
    AdminSuspendUserController,
    AdminReactivateUserController,
  ],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    LogoutAllUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GetMeUseCase,
    UpdateMeUseCase,
    ChangePasswordUseCase,
    ListMySessionsUseCase,
    RevokeMySessionUseCase,
    GetPublicProfileUseCase,
    AdminListUsersUseCase,
    AdminChangeUserRoleUseCase,
    AdminChangeUserPermissionsUseCase,
    AdminSuspendUserUseCase,
    AdminReactivateUserUseCase,
    // Sans route : démarrage et horloge
    BootstrapAdminsUseCase,
    PurgeExpiredAuthDataJob,

    // Ports -> adapters. Changer d'implémentation = changer une ligne ici.
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: SessionRepository, useClass: TypeOrmSessionRepository },
    { provide: OneTimeTokenRepository, useClass: TypeOrmOneTimeTokenRepository },
    { provide: PasswordHasher, useClass: ScryptPasswordHasher },
    { provide: AccessTokens, useClass: JwtAccessTokens },
    { provide: SecretTokens, useClass: CryptoSecretTokens },
    { provide: AdminEmails, useClass: EnvAdminEmails },

    // Services du domaine (purs, sans décorateur Nest) : construits ici avec leurs ports.
    {
      provide: SessionIssuer,
      inject: [SessionRepository, SecretTokens, AccessTokens],
      useFactory: (sessions: SessionRepository, secrets: SecretTokens, tokens: AccessTokens) =>
        new SessionIssuer(sessions, secrets, tokens, env.sessionTtlDays * 24 * 60 * 60 * 1000),
    },
    {
      provide: OneTimeTokenIssuer,
      inject: [OneTimeTokenRepository, SecretTokens],
      useFactory: (tokens: OneTimeTokenRepository, secrets: SecretTokens) => new OneTimeTokenIssuer(tokens, secrets),
    },

    // Contrat public -> implémentation.
    { provide: UserQueries, useClass: IdentityUserQueries },
  ],
  // UserQueries : lire un user depuis un autre contexte.
  // AccessTokens + SessionRepository + UserRepository : requis par JwtAuthGuard (et donc @RequirePermission) quand un autre
  // contexte l'utilise sur ses routes. Exportés côté Nest seulement : ils ne sont pas dans
  // public-api.ts, donc aucun autre contexte ne peut les importer pour s'en servir directement.
  exports: [UserQueries, AccessTokens, SessionRepository, UserRepository],
})
export class IdentityModule {}
