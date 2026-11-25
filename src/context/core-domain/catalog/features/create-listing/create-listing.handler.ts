import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Listing, type ListingDetails, type ListingPrimitives } from "../../domain/listing.entity.js";
import { ListingRepository } from "../../domain/listing.repository.js";

type CreateListingInput = Omit<ListingDetails, "description" | "model" | "photoUrls"> &
  Partial<Pick<ListingDetails, "description" | "model" | "photoUrls">>;

@Injectable()
export class CreateListingHandler {
  constructor(private readonly listings: ListingRepository) {}

  /** L'annonce est créée en brouillon : elle n'apparaît dans la recherche qu'après /publish. */
  async execute(sellerId: string, input: CreateListingInput): Promise<ListingPrimitives> {
    const listing = Listing.create({
      id: randomUUID(),
      sellerId,
      now: new Date(),
      details: {
        ...input,
        description: input.description ?? "",
        model: input.model ?? "",
        photoUrls: input.photoUrls ?? [],
      },
    });
    await this.listings.save(listing);
    return listing.toPrimitives();
  }
}
