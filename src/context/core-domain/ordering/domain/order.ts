import { CannotBuyOwnListingError, InvalidOrderError, OrderActionForbiddenError, OrderStatusError } from "./order.errors.js";

export const ORDER_STATUSES = ["pending_payment", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Une commande non payée sous 48 h est annulée d'office : ses vélos ne restent pas bloqués. */
export const PAYMENT_DEADLINE_MS = 48 * 60 * 60 * 1000;
/** Sans confirmation de l'acheteur 14 jours après l'expédition, la livraison est considérée faite. */
export const AUTO_DELIVERY_DELAY_MS = 14 * 24 * 60 * 60 * 1000;

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
  /** Date limite de paiement, tant que la commande attend d'être payée. Calculée, pas stockée. */
  paymentDueAt: Date | null;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
};

type OrderState = Omit<OrderPrimitives, "totalCents" | "paymentDueAt">;

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

  /** paymentDueAt est accepté mais ignoré : il est recalculé à partir de createdAt. */
  static restore(props: Omit<OrderPrimitives, "paymentDueAt"> & { paymentDueAt?: Date | null }): Order {
    const { totalCents: _total, paymentDueAt: _dueAt, ...state } = props;
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

  get paymentDueAt(): Date {
    return new Date(this.state.createdAt.getTime() + PAYMENT_DEADLINE_MS);
  }

  isSoldBy(userId: string): boolean {
    return this.state.sellerId === userId;
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

  /** Tâche planifiée : pas payée à temps. Les vélos doivent être remis en vente par l'appelant. */
  expire(now: Date): void {
    if (this.state.status === "pending_payment" && now < this.paymentDueAt) {
      throw new OrderStatusError("faire expirer avant sa date limite de paiement", this.state.status);
    }
    this.transition("faire expirer", ["pending_payment"], "cancelled");
    this.state.cancelledAt = now;
  }

  /** Tâche planifiée : l'acheteur n'a pas confirmé la réception dans le délai. Même effet que confirmDelivery. */
  confirmDeliveryAutomatically(now: Date): void {
    const shippedAt = this.state.shippedAt;
    if (this.state.status === "shipped" && shippedAt && now.getTime() < shippedAt.getTime() + AUTO_DELIVERY_DELAY_MS) {
      throw new OrderStatusError("confirmer d'office la réception d'", this.state.status);
    }
    this.transition("confirmer d'office la réception d'", ["shipped"], "delivered");
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
      paymentDueAt: this.state.status === "pending_payment" ? this.paymentDueAt : null,
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
