import { CannotMessageYourselfError, ConversationNotFoundError } from "./messaging.errors.js";

export type ParticipantRole = "buyer" | "seller";

export type ConversationPrimitives = {
  id: string;
  listingId: string;
  /** Copié à l'ouverture : la conversation reste lisible si l'annonce change ou disparaît. */
  listingTitle: string;
  sellerId: string;
  /** L'acheteur intéressé (celui qui a ouvert la conversation). */
  buyerId: string;
  createdAt: Date;
  lastMessageAt: Date;
  /** Jusqu'où chacun a lu (date du dernier message vu) : les messages de l'autre envoyés après sont "non lus". */
  buyerLastReadAt: Date | null;
  sellerLastReadAt: Date | null;
};

/** Une conversation = un acheteur intéressé + le vendeur, à propos d'une annonce. Une seule par couple (annonce, acheteur). */
export class Conversation {
  private constructor(private readonly props: ConversationPrimitives) {}

  static start(props: { id: string; listing: { id: string; title: string; sellerId: string }; buyerId: string; now: Date }): Conversation {
    if (props.listing.sellerId === props.buyerId) throw new CannotMessageYourselfError();
    return new Conversation({
      id: props.id,
      listingId: props.listing.id,
      listingTitle: props.listing.title,
      sellerId: props.listing.sellerId,
      buyerId: props.buyerId,
      createdAt: props.now,
      lastMessageAt: props.now,
      buyerLastReadAt: null,
      sellerLastReadAt: null,
    });
  }

  static restore(props: ConversationPrimitives): Conversation {
    return new Conversation({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get listingTitle(): string {
    return this.props.listingTitle;
  }

  isParticipant(userId: string): boolean {
    return userId === this.props.buyerId || userId === this.props.sellerId;
  }

  /** 404 et pas 403 pour un tiers : on ne révèle pas que la conversation existe. */
  roleOf(userId: string): ParticipantRole {
    if (userId === this.props.buyerId) return "buyer";
    if (userId === this.props.sellerId) return "seller";
    throw new ConversationNotFoundError(this.props.id);
  }

  otherParticipant(userId: string): string {
    return this.roleOf(userId) === "buyer" ? this.props.sellerId : this.props.buyerId;
  }

  /**
   * Un message vient d'être envoyé par `senderId`. Renvoie sa date d'envoi, strictement après le message
   * précédent (+1 ms si deux messages tombent dans la même milliseconde) : l'ordre et les non-lus restent exacts.
   * Son propre message est forcément lu.
   */
  recordMessage(senderId: string, now: Date): Date {
    const sentAt = new Date(Math.max(now.getTime(), this.props.lastMessageAt.getTime() + 1));
    this.props.lastMessageAt = sentAt;
    this.markReadBy(senderId);
    return sentAt;
  }

  /** Lu jusqu'au dernier message (et pas "lu à telle heure" : pas d'égalité possible avec un message). */
  markReadBy(userId: string): void {
    if (this.roleOf(userId) === "buyer") this.props.buyerLastReadAt = this.props.lastMessageAt;
    else this.props.sellerLastReadAt = this.props.lastMessageAt;
  }

  toPrimitives(): ConversationPrimitives {
    return { ...this.props };
  }
}
