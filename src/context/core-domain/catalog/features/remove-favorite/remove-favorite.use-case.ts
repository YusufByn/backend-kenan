import { Injectable } from "@nestjs/common";
import { FavoriteRepository } from "../../domain/favorite.repository.js";

/** Idempotent : retirer un favori qui n'existe pas ne lève pas d'erreur. */
@Injectable()
export class RemoveFavoriteUseCase {
  constructor(private readonly favorites: FavoriteRepository) {}

  execute(userId: string, listingId: string): Promise<void> {
    return this.favorites.remove(userId, listingId);
  }
}
