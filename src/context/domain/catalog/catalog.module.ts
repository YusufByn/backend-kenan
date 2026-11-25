import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IdentityModule } from "@identity";
import { ListingRepository } from "./domain/listing.repository.js";
import { ArchiveListingController } from "./features/archive-listing/archive-listing.controller.js";
import { ArchiveListingHandler } from "./features/archive-listing/archive-listing.handler.js";
import { CreateListingController } from "./features/create-listing/create-listing.controller.js";
import { CreateListingHandler } from "./features/create-listing/create-listing.handler.js";
import { GetListingController } from "./features/get-listing/get-listing.controller.js";
import { GetListingHandler } from "./features/get-listing/get-listing.handler.js";
import { ListMyListingsController } from "./features/list-my-listings/list-my-listings.controller.js";
import { ListMyListingsHandler } from "./features/list-my-listings/list-my-listings.handler.js";
import { PublishListingController } from "./features/publish-listing/publish-listing.controller.js";
import { PublishListingHandler } from "./features/publish-listing/publish-listing.handler.js";
import { SearchListingsController } from "./features/search-listings/search-listings.controller.js";
import { SearchListingsHandler } from "./features/search-listings/search-listings.handler.js";
import { UpdateListingController } from "./features/update-listing/update-listing.controller.js";
import { UpdateListingHandler } from "./features/update-listing/update-listing.handler.js";
import { ListingOrmEntity } from "./infrastructure/listing.orm-entity.js";
import { TypeOrmListingRepository } from "./infrastructure/typeorm-listing.repository.js";
import { CatalogListingQueries } from "./public/catalog-listing-queries.js";
import { CatalogListingReservations } from "./public/catalog-listing-reservations.js";
import { ListingQueries } from "./public/listing-queries.js";
import { ListingReservations } from "./public/listing-reservations.js";

@Module({
  // IdentityModule : JwtAuthGuard (routes protégées) et UserQueries (nom du vendeur).
  imports: [TypeOrmModule.forFeature([ListingOrmEntity]), IdentityModule],
  controllers: [
    SearchListingsController,
    GetListingController,
    CreateListingController,
    UpdateListingController,
    PublishListingController,
    ArchiveListingController,
    ListMyListingsController,
  ],
  providers: [
    SearchListingsHandler,
    GetListingHandler,
    CreateListingHandler,
    UpdateListingHandler,
    PublishListingHandler,
    ArchiveListingHandler,
    ListMyListingsHandler,

    { provide: ListingRepository, useClass: TypeOrmListingRepository },

    { provide: ListingQueries, useClass: CatalogListingQueries },
    { provide: ListingReservations, useClass: CatalogListingReservations },
  ],
  exports: [ListingQueries, ListingReservations],
})
export class CatalogModule {}
