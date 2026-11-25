/** Ce qu'un autre contexte peut lire d'une annonce. */
export type ListingSummary = {
  id: string;
  sellerId: string;
  title: string;
  priceCents: number;
  photoUrl: string | null;
  /** true si l'annonce est publiée (achetable maintenant). */
  available: boolean;
};

export abstract class ListingQueries {
  /** Les ids inconnus sont simplement absents du résultat. */
  abstract findByIds(ids: string[]): Promise<ListingSummary[]>;
}
