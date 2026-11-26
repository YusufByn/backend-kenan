import {
  InvalidReviewError,
  ReviewActionForbiddenError,
  ReviewAlreadyExistsError,
  ReviewAlreadyRepliedError,
  ReviewNotAllowedError,
} from "./review.errors.js";

export type ReviewPrimitives = {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  /** Réponse publique du vendeur, une seule fois. */
  sellerReply: string | null;
  repliedAt: Date | null;
  /** Retiré par la modération : n'apparaît plus et ne compte plus dans la moyenne, mais bloque un nouvel avis. */
  removedAt: Date | null;
};

const MIN_RATING = 1;
const MAX_RATING = 5;
const COMMENT_MAX_LENGTH = 2000;
const REPLY_MAX_LENGTH = 1000;

/** Note laissée par l'acheteur sur le vendeur, une fois la commande livrée. */
export class Review {
  private constructor(private readonly props: ReviewPrimitives) {}

  /**
   * Toutes les conditions pour noter sont vérifiées ici.
   * `order` vient d'un autre contexte : le domaine n'en connaît que ce dont il a besoin.
   */
  static write(props: {
    id: string;
    order: { id: string; sellerId: string; delivered: boolean };
    buyerId: string;
    alreadyReviewed: boolean;
    rating: number;
    comment: string;
    now: Date;
  }): Review {
    if (!props.order.delivered) throw new ReviewNotAllowedError();
    if (props.alreadyReviewed) throw new ReviewAlreadyExistsError();
    if (!Number.isInteger(props.rating) || props.rating < MIN_RATING || props.rating > MAX_RATING) {
      throw new InvalidReviewError(`La note doit être un entier de ${MIN_RATING} à ${MAX_RATING}`, "rating");
    }
    const comment = props.comment.trim();
    if (comment.length > COMMENT_MAX_LENGTH) {
      throw new InvalidReviewError(`Commentaire limité à ${COMMENT_MAX_LENGTH} caractères`, "comment");
    }
    return new Review({
      id: props.id,
      orderId: props.order.id,
      sellerId: props.order.sellerId,
      buyerId: props.buyerId,
      rating: props.rating,
      comment,
      createdAt: props.now,
      sellerReply: null,
      repliedAt: null,
      removedAt: null,
    });
  }

  static restore(props: ReviewPrimitives): Review {
    return new Review({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get isRemoved(): boolean {
    return this.props.removedAt !== null;
  }

  /** Le vendeur noté répond publiquement, une seule fois. */
  reply(sellerId: string, text: string, now: Date): void {
    if (sellerId !== this.props.sellerId) throw new ReviewActionForbiddenError("Seul le vendeur noté peut répondre à cet avis");
    if (this.props.sellerReply !== null) throw new ReviewAlreadyRepliedError();
    const reply = text.trim();
    if (!reply || reply.length > REPLY_MAX_LENGTH) {
      throw new InvalidReviewError(`La réponse est requise (${REPLY_MAX_LENGTH} caractères max)`, "reply");
    }
    this.props.sellerReply = reply;
    this.props.repliedAt = now;
  }

  /** Modération (REVIEWS_MODERATE, vérifiée par la route). Idempotent. */
  remove(now: Date): void {
    this.props.removedAt ??= now;
  }

  toPrimitives(): ReviewPrimitives {
    return { ...this.props };
  }
}
