/**
 * Seule façon pour un autre contexte de changer le statut d'une annonce.
 * Chaque méthode est tout ou rien : soit toutes les annonces changent, soit aucune.
 */
export abstract class ListingReservations {
  /** published → reserved. 409 si une seule n'est plus disponible. */
  abstract reserve(listingIds: string[]): Promise<void>;
  /** reserved → published (commande annulée). */
  abstract release(listingIds: string[]): Promise<void>;
  /** reserved → sold (livraison confirmée). */
  abstract markSold(listingIds: string[]): Promise<void>;
}
