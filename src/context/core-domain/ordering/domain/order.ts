import { CannotBuyOwnListingError, InvalidOrderError, OrderActionForbiddenError, OrderStatusError } from "./order.errors.js";

export const ORDER_STATUSES = ["pending_payment", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Titre et prix copiés au checkout : si le vendeur modifie son annonce ensuite, la commande ne change pas. */
export type OrderLine = { listingId: string; title: string; priceCents: number };

export type ShippingAddress = {
  fullName: string;
  line1: string;
  postalCode: string;
  city: string;
  country: string;
};

export type OrderPrimitives = {
  id: string;
  buyerId: string;
  sellerId: string;
  status: OrderStatus;
  lines: OrderLine[];
  totalCents: number;
  shippingAddress: ShippingAddress;
  trackingNumber: string | null;
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
};

type OrderState = Omit<OrderPrimitives, "totalCents">;

/** Une commande = un acheteur, un vendeur, une ou plusieurs annonces de ce vendeur. */
export class Order {
  private constructor(private state: OrderState) {}

  static place(props: {
    id: string;
    buyerId: string;
    sellerId: string;
    lines: OrderLine[];
    shippingAddress: ShippingAddress;
    now: Date;
  }): Order {
    if (props.lines.length === 0) throw new InvalidOrderError("Une commande contient au moins une annonce");
    if (props.buyerId === props.sellerId) throw new CannotBuyOwnListingError();

    return new Order({
      id: props.id,
      buyerId: props.buyerId,
      sellerId: props.sellerId,
      status: "pending_payment",
      lines: props.lines.map((line) => ({ ...line })),
      shippingAddress: Order.checkAddress(props.shippingAddress),
      trackingNumber: null,
      createdAt: props.now,
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
      cancelledAt: null,
    });
  }

  static restore(props: OrderPrimitives): Order {
    const { totalCents: _derived, ...state } = props;
    return new Order({ ...state, lines: state.lines.map((line) => ({ ...line })) });
  }

  get id(): string {
    return this.state.id;
  }

  get status(): OrderStatus {
    return this.state.status;
  }

  get listingIds(): string[] {
    return this.state.lines.map((line) => line.listingId);
  }

  get totalCents(): number {
    return this.state.lines.reduce((sum, line) => sum + line.priceCents, 0);
  }

  /** Seuls l'acheteur et le vendeur voient une commande. */
  isVisibleTo(userId: string): boolean {
    return userId === this.state.buyerId || userId === this.state.sellerId;
  }

  /** Paiement simulé. */
  pay(userId: string, now: Date): void {
    this.assertBuyer(userId, "Seul l'acheteur peut payer cette commande");
    this.transition("payer", ["pending_payment"], "paid");
    this.state.paidAt = now;
  }

  ship(userId: string, trackingNumber: string, now: Date): void {
    if (userId !== this.state.sellerId) throw new OrderActionForbiddenError("Seul le vendeur peut expédier cette commande");
    const tracking = trackingNumber.trim();
    if (!tracking) throw new InvalidOrderError("Le numéro de suivi est requis", "trackingNumber");
    this.transition("expédier", ["paid"], "shipped");
    this.state.trackingNumber = tracking;
    this.state.shippedAt = now;
  }

  confirmDelivery(userId: string, now: Date): void {
    this.assertBuyer(userId, "Seul l'acheteur peut confirmer la réception");
    this.transition("confirmer la réception d'", ["shipped"], "delivered");
    this.state.deliveredAt = now;
  }

  /** Acheteur ou vendeur, tant que le vélo n'est pas parti. Si la commande était payée, le remboursement est simulé. */
  cancel(userId: string, now: Date): void {
    if (!this.isVisibleTo(userId)) throw new OrderActionForbiddenError("Tu ne peux pas annuler cette commande");
    this.transition("annuler", ["pending_payment", "paid"], "cancelled");
    this.state.cancelledAt = now;
  }

  toPrimitives(): OrderPrimitives {
    return {
      ...this.state,
      lines: this.state.lines.map((line) => ({ ...line })),
      shippingAddress: { ...this.state.shippingAddress },
      totalCents: this.totalCents,
    };
  }

  private assertBuyer(userId: string, message: string): void {
    if (userId !== this.state.buyerId) throw new OrderActionForbiddenError(message);
  }

  private transition(action: string, from: OrderStatus[], to: OrderStatus): void {
    if (!from.includes(this.state.status)) throw new OrderStatusError(action, this.state.status);
    this.state.status = to;
  }

  private static checkAddress(address: ShippingAddress): ShippingAddress {
    const checked = {
      fullName: address.fullName.trim(),
      line1: address.line1.trim(),
      postalCode: address.postalCode.trim(),
      city: address.city.trim(),
      country: address.country.trim(),
    };
    const missing = Object.entries(checked).filter(([, value]) => !value);
    if (missing.length > 0) {
      const fields = Object.fromEntries(missing.map(([key]) => [`shippingAddress.${key}`, ["Champ requis"]]));
      throw new InvalidOrderError("Adresse de livraison incomplète", fields);
    }
    return checked;
  }
}
