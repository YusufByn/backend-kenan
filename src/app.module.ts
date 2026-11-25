import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@catalog";
import { IdentityModule } from "@identity";
import { NotificationsModule } from "@notifications";
import { OrderingModule } from "@ordering";
import { ReviewsModule } from "@reviews";
import { env } from "@core/config/env.js";
import { EventsModule } from "@core/events/events.module.js";
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
    // shared/ : le bus d'événements, injectable partout
    EventsModule,
    // generic/
    IdentityModule,
    // supporting/
    NotificationsModule,
    // core/
    CatalogModule,
    OrderingModule,
    ReviewsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
