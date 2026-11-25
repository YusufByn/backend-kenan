/** Ce qu'un autre contexte peut lire d'une commande. */
export type OrderSummary = {
  id: string;
  buyerId: string;
  sellerId: string;
  delivered: boolean;
};

export abstract class OrderQueries {
  abstract findById(id: string): Promise<OrderSummary | null>;
}
