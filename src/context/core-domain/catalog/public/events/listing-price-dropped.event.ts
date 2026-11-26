import { DomainEvent } from "@core/events/domain-event.js";

/**
 * Le vendeur a baissé le prix d'une annonce en ligne. `watcherIds` : les users qui l'ont en favori,
 * calculés par catalog au moment du fait, pour que les listeners n'aient pas à interroger catalog.
 */
export class ListingPriceDropped extends DomainEvent {
  constructor(
    readonly listingId: string,
    readonly title: string,
    readonly oldPriceCents: number,
    readonly newPriceCents: number,
    readonly watcherIds: string[],
  ) {
    super();
  }
}
