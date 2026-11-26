import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IdentityModule } from "@identity";
import { FavoriteRepository } from "./domain/favorite.repository.js";
import { ListingRepository } from "./domain/listing.repository.js";
import { AddFavoriteController } from "./features/add-favorite/add-favorite.controller.js";
import { AddFavoriteUseCase } from "./features/add-favorite/add-favorite.use-case.js";
import { AdminArchiveListingController } from "./features/admin-archive-listing/admin-archive-listing.controller.js";
import { AdminArchiveListingUseCase } from "./features/admin-archive-listing/admin-archive-listing.use-case.js";
import { ArchiveListingController } from "./features/archive-listing/archive-listing.controller.js";
import { ArchiveListingUseCase } from "./features/archive-listing/archive-listing.use-case.js";
import { CreateListingController } from "./features/create-listing/create-listing.controller.js";
import { CreateListingUseCase } from "./features/create-listing/create-listing.use-case.js";
import { GetListingController } from "./features/get-listing/get-listing.controller.js";
import { GetListingUseCase } from "./features/get-listing/get-listing.use-case.js";
import { ListMyFavoritesController } from "./features/list-my-favorites/list-my-favorites.controller.js";
import { ListMyFavoritesUseCase } from "./features/list-my-favorites/list-my-favorites.use-case.js";
import { ListMyListingsController } from "./features/list-my-listings/list-my-listings.controller.js";
import { ListMyListingsUseCase } from "./features/list-my-listings/list-my-listings.use-case.js";
import { PublishListingController } from "./features/publish-listing/publish-listing.controller.js";
import { PublishListingUseCase } from "./features/publish-listing/publish-listing.use-case.js";
import { RemoveFavoriteController } from "./features/remove-favorite/remove-favorite.controller.js";
import { RemoveFavoriteUseCase } from "./features/remove-favorite/remove-favorite.use-case.js";
import { SearchListingsController } from "./features/search-listings/search-listings.controller.js";
import { SearchListingsUseCase } from "./features/search-listings/search-listings.use-case.js";
import { UpdateListingController } from "./features/update-listing/update-listing.controller.js";
import { UpdateListingUseCase } from "./features/update-listing/update-listing.use-case.js";
import { WithdrawSuspendedSellerListingsListener } from "./features/withdraw-suspended-seller-listings/withdraw-suspended-seller-listings.listener.js";
import { FavoriteOrmEntity } from "./infrastructure/favorite.orm-entity.js";
import { ListingOrmEntity } from "./infrastructure/listing.orm-entity.js";
import { TypeOrmFavoriteRepository } from "./infrastructure/typeorm-favorite.repository.js";
import { TypeOrmListingRepository } from "./infrastructure/typeorm-listing.repository.js";
import { CatalogListingQueries } from "./public/catalog-listing-queries.js";
import { CatalogListingReservations } from "./public/catalog-listing-reservations.js";
import { ListingQueries } from "./public/listing-queries.js";
import { ListingReservations } from "./public/listing-reservations.js";

@Module({
  // IdentityModule : JwtAuthGuard / RequirePermission (routes protégées) et UserQueries (nom du vendeur).
  // IdentityModule : aussi l'événement UserSuspended (annonces retirées de la vente).
  imports: [TypeOrmModule.forFeature([ListingOrmEntity, FavoriteOrmEntity]), IdentityModule],
  controllers: [
    SearchListingsController,
    GetListingController,
    CreateListingController,
    UpdateListingController,
    PublishListingController,
    ArchiveListingController,
    ListMyListingsController,
    AddFavoriteController,
    RemoveFavoriteController,
    ListMyFavoritesController,
    AdminArchiveListingController,
  ],
  providers: [
    SearchListingsUseCase,
    GetListingUseCase,
    CreateListingUseCase,
    UpdateListingUseCase,
    PublishListingUseCase,
    ArchiveListingUseCase,
    ListMyListingsUseCase,
    AddFavoriteUseCase,
    RemoveFavoriteUseCase,
    ListMyFavoritesUseCase,
    AdminArchiveListingUseCase,
    // Sans route : réagit aux événements
    WithdrawSuspendedSellerListingsListener,

    { provide: ListingRepository, useClass: TypeOrmListingRepository },
    { provide: FavoriteRepository, useClass: TypeOrmFavoriteRepository },

    { provide: ListingQueries, useClass: CatalogListingQueries },
    { provide: ListingReservations, useClass: CatalogListingReservations },
  ],
  exports: [ListingQueries, ListingReservations],
})
export class CatalogModule {}
