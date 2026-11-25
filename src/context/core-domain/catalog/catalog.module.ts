import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IdentityModule } from "@identity";
import { ListingRepository } from "./domain/listing.repository.js";
import { AdminArchiveListingController } from "./features/admin-archive-listing/admin-archive-listing.controller.js";
import { AdminArchiveListingUseCase } from "./features/admin-archive-listing/admin-archive-listing.use-case.js";
import { ArchiveListingController } from "./features/archive-listing/archive-listing.controller.js";
import { ArchiveListingUseCase } from "./features/archive-listing/archive-listing.use-case.js";
import { CreateListingController } from "./features/create-listing/create-listing.controller.js";
import { CreateListingUseCase } from "./features/create-listing/create-listing.use-case.js";
import { GetListingController } from "./features/get-listing/get-listing.controller.js";
import { GetListingUseCase } from "./features/get-listing/get-listing.use-case.js";
import { ListMyListingsController } from "./features/list-my-listings/list-my-listings.controller.js";
import { ListMyListingsUseCase } from "./features/list-my-listings/list-my-listings.use-case.js";
import { PublishListingController } from "./features/publish-listing/publish-listing.controller.js";
import { PublishListingUseCase } from "./features/publish-listing/publish-listing.use-case.js";
import { SearchListingsController } from "./features/search-listings/search-listings.controller.js";
import { SearchListingsUseCase } from "./features/search-listings/search-listings.use-case.js";
import { UpdateListingController } from "./features/update-listing/update-listing.controller.js";
import { UpdateListingUseCase } from "./features/update-listing/update-listing.use-case.js";
import { ListingOrmEntity } from "./infrastructure/listing.orm-entity.js";
import { TypeOrmListingRepository } from "./infrastructure/typeorm-listing.repository.js";
import { CatalogListingQueries } from "./public/catalog-listing-queries.js";
import { CatalogListingReservations } from "./public/catalog-listing-reservations.js";
import { ListingQueries } from "./public/listing-queries.js";
import { ListingReservations } from "./public/listing-reservations.js";

@Module({
  // IdentityModule : JwtAuthGuard / RequirePermission (routes protégées) et UserQueries (nom du vendeur).
  imports: [TypeOrmModule.forFeature([ListingOrmEntity]), IdentityModule],
  controllers: [
    SearchListingsController,
    GetListingController,
    CreateListingController,
    UpdateListingController,
    PublishListingController,
    ArchiveListingController,
    ListMyListingsController,
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
    AdminArchiveListingUseCase,

    { provide: ListingRepository, useClass: TypeOrmListingRepository },

    { provide: ListingQueries, useClass: CatalogListingQueries },
    { provide: ListingReservations, useClass: CatalogListingReservations },
  ],
  exports: [ListingQueries, ListingReservations],
})
export class CatalogModule {}
