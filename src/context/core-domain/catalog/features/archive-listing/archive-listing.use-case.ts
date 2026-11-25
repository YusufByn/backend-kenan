import { Injectable } from "@nestjs/common";
import { ListingRepository } from "../../domain/listing.repository.js";

@Injectable()
export class ArchiveListingUseCase {
  constructor(private readonly listings: ListingRepository) {}

  /** On archive au lieu de supprimer : une annonce peut être référencée par d'anciennes commandes. */
  async execute(sellerId: string, id: string): Promise<void> {
    const listing = await this.listings.getOwnedBy(id, sellerId);
    listing.archive();
    await this.listings.save(listing);
  }
}
