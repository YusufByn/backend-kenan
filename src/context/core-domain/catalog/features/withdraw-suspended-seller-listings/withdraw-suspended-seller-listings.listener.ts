import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { UserSuspended } from "@identity";
import { EventBus } from "@core/events/event-bus.js";
import { ListingRepository } from "../../domain/listing.repository.js";

/**
 * Déclenché par un événement d'identity, pas par une route : un vendeur suspendu ne doit plus vendre.
 * Ses annonces publiées repassent en brouillon (rien n'est supprimé) ; celles déjà réservées ne bougent pas,
 * pour que les commandes en cours se terminent. identity ne sait pas que catalog écoute.
 */
@Injectable()
export class WithdrawSuspendedSellerListingsListener implements OnModuleInit {
  private readonly logger = new Logger("WithdrawSuspendedSellerListings");

  constructor(
    private readonly events: EventBus,
    private readonly listings: ListingRepository,
  ) {}

  onModuleInit() {
    this.events.subscribe(UserSuspended, (event) => this.handle(event));
  }

  async handle(event: UserSuspended): Promise<void> {
    const listings = await this.listings.findPublishedBySeller(event.userId);
    if (listings.length === 0) return;
    listings.forEach((listing) => listing.withdraw());
    await this.listings.saveAll(listings);
    this.logger.log(`${listings.length} annonce(s) du vendeur suspendu ${event.userId} retirée(s) de la vente`);
  }
}
