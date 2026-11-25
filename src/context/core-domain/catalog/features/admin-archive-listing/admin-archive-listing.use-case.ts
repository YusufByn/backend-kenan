import { Injectable } from "@nestjs/common";
import { ListingRepository } from "../../domain/listing.repository.js";

/**
 * Retrait d'une annonce par la modération, quel que soit son vendeur.
 * Mêmes règles que l'archivage par le vendeur : une annonce réservée ou vendue est liée
 * à une commande et ne peut pas être retirée (409).
 */
@Injectable()
export class AdminArchiveListingUseCase {
  constructor(private readonly listings: ListingRepository) {}

  async execute(id: string): Promise<void> {
    const listing = await this.listings.getById(id);
    listing.archive();
    await this.listings.save(listing);
  }
}
