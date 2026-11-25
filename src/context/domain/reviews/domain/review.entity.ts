import { InvalidReviewError, ReviewAlreadyExistsError, ReviewNotAllowedError } from "./review.errors.js";

export type ReviewPrimitives = {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

const MIN_RATING = 1;
const MAX_RATING = 5;
const COMMENT_MAX_LENGTH = 2000;

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
    });
  }

  static restore(props: ReviewPrimitives): Review {
    return new Review({ ...props });
  }

  toPrimitives(): ReviewPrimitives {
    return { ...this.props };
  }
}

/** Moyenne arrondie à 0,1 près, null sans avis. */
export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.toPrimitives().rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
