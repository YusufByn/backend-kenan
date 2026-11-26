import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@catalog";
import { IdentityModule } from "@identity";
import { MediaModule } from "@media";
import { MessagingModule } from "@messaging";
import { NotificationsModule } from "@notifications";
import { OrderingModule } from "@ordering";
import { ReviewsModule } from "@reviews";
import { env } from "@core/config/env.js";
import { EventsModule } from "@core/events/events.module.js";
import { DEFAULT_RATE_LIMIT } from "@core/http/rate-limit.js";
import { RequestLoggerMiddleware } from "@core/http/request-logger.middleware.js";
import { AppController } from "./app.controller.js";

@Module({
  imports: [
    // Base SQLite locale : un simple fichier à la racine du projet, rien à installer.
    TypeOrmModule.forRoot({
      type: "better-sqlite3",
      database: env.databasePath,
      // Chaque contexte déclare ses entités via TypeOrmModule.forFeature(...).
      autoLoadEntities: true,
      // Crée / met à jour les tables à partir des entités au démarrage. Pratique en dev,
      // à remplacer par des migrations avant toute vraie mise en prod.
      synchronize: true,
    }),
    // Limite de requêtes par IP sur toutes les routes (ThrottlerGuard ci-dessous). Plus stricte sur les routes sensibles : @StrictRateLimit().
    ThrottlerModule.forRoot({
      throttlers: [{ name: "default", ...DEFAULT_RATE_LIMIT }],
      errorMessage: "Trop de requêtes : réessaie dans une minute",
      skipIf: () => !env.rateLimitEnabled,
    }),
    // Tâches planifiées (@Cron) : expiration des commandes, livraison confirmée d'office, ménage des sessions.
    ScheduleModule.forRoot(),
    // core/ : le bus d'événements, injectable partout
    EventsModule,
    // generic/
    IdentityModule,
    // supporting/
    NotificationsModule,
    MediaModule,
    // core-domain/
    CatalogModule,
    OrderingModule,
    ReviewsModule,
    MessagingModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*path");
  }
}
