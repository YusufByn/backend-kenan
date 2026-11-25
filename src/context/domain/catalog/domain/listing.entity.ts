import { InvalidListingError, ListingNotAvailableError, ListingStatusError } from "./listing.errors.js";

export const CATEGORIES = ["road", "mtb", "gravel", "city", "ebike", "kids", "bmx"] as const;
export const FRAME_SIZES = ["XS", "S", "M", "L", "XL"] as const;
export const WHEEL_SIZES = ["16", "20", "24", "26", "27.5", "29", "700c"] as const;
export const CONDITIONS = ["new", "like_new", "very_good", "good", "needs_service"] as const;
export const LISTING_STATUSES = ["draft", "published", "reserved", "sold", "archived"] as const;

export type Category = (typeof CATEGORIES)[number];
export type FrameSize = (typeof FRAME_SIZES)[number];
export type WheelSize = (typeof WHEEL_SIZES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Ce que le vendeur décrit. Le reste (statut, dates) est géré par l'annonce elle-même. */
export type ListingDetails = {
  title: string;
  description: string;
  brand: string;
  model: string;
  category: Category;
  frameSize: FrameSize;
  wheelSize: WheelSize;
  condition: Condition;
  year: number;
  priceCents: number;
  photoUrls: string[];
};

export type ListingPrimitives = ListingDetails & {
  id: string;
  sellerId: string;
  status: ListingStatus;
  createdAt: Date;
  publishedAt: Date | null;
};

const TITLE_MAX_LENGTH = 120;
const MIN_PRICE_CENTS = 100; // 1 €
const MAX_PRICE_CENTS = 5_000_000; // 50 000 €
const MIN_YEAR = 1950;
const MAX_PHOTOS = 10;
const URL_PATTERN = /^https?:\/\/\S+$/;

/** Un vélo d'occasion est unique : une annonce = un vélo, pas de stock. */
export class Listing {
  private constructor(
    readonly id: string,
    readonly sellerId: string,
    private details: ListingDetails,
    private currentStatus: ListingStatus,
    readonly createdAt: Date,
    private publishedAt: Date | null,
    /** Statut tel qu'il est en base (null = jamais enregistrée). Le repository s'en sert pour détecter une écriture concurrente. */
    private storedStatus: ListingStatus | null,
  ) {}

  static create(props: { id: string; sellerId: string; details: ListingDetails; now: Date }): Listing {
    return new Listing(props.id, props.sellerId, Listing.checkDetails(props.details), "draft", props.now, null, null);
  }

  static restore(props: ListingPrimitives): Listing {
    const { id, sellerId, status, createdAt, publishedAt, ...details } = props;
    return new Listing(id, sellerId, details, status, createdAt, publishedAt, status);
  }

  get status(): ListingStatus {
    return this.currentStatus;
  }

  get statusInStore(): ListingStatus | null {
    return this.storedStatus;
  }

  /** Appelé par le repository après une écriture réussie. */
  markStored(): void {
    this.storedStatus = this.currentStatus;
  }

  isOwnedBy(userId: string): boolean {
    return this.sellerId === userId;
  }

  /** Visible par tout le monde : ni brouillon, ni archivée. */
  get isPublic(): boolean {
    return this.currentStatus === "published" || this.currentStatus === "reserved" || this.currentStatus === "sold";
  }

  update(changes: Partial<ListingDetails>): void {
    if (this.currentStatus !== "draft" && this.currentStatus !== "published") {
      throw new ListingStatusError("modifier", this.currentStatus);
    }
    const defined = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
    const details = Listing.checkDetails({ ...this.details, ...defined });
    // Une annonce en ligne doit rester publiable après modification.
    if (this.currentStatus === "published") Listing.assertPublishable(details);
    this.details = details;
  }

  publish(now: Date): void {
    if (this.currentStatus !== "draft") throw new ListingStatusError("publier", this.currentStatus);
    Listing.assertPublishable(this.details);
    this.currentStatus = "published";
    this.publishedAt = now;
  }

  archive(): void {
    if (this.currentStatus !== "draft" && this.currentStatus !== "published") {
      throw new ListingStatusError("archiver", this.currentStatus);
    }
    this.currentStatus = "archived";
  }

  /** Checkout d'un acheteur. */
  reserve(): void {
    if (this.currentStatus !== "published") throw new ListingNotAvailableError();
    this.currentStatus = "reserved";
  }

  /** Commande annulée : l'annonce est de nouveau en vente. */
  release(): void {
    if (this.currentStatus !== "reserved") throw new ListingStatusError("remettre en vente", this.currentStatus);
    this.currentStatus = "published";
  }

  /** Livraison confirmée par l'acheteur. */
  markSold(): void {
    if (this.currentStatus !== "reserved") throw new ListingStatusError("marquer comme vendue", this.currentStatus);
    this.currentStatus = "sold";
  }

  toPrimitives(): ListingPrimitives {
    return {
      id: this.id,
      sellerId: this.sellerId,
      ...this.details,
      photoUrls: [...this.details.photoUrls],
      status: this.currentStatus,
      createdAt: this.createdAt,
      publishedAt: this.publishedAt,
    };
  }

  private static checkDetails(details: ListingDetails): ListingDetails {
    const title = details.title.trim();
    if (!title || title.length > TITLE_MAX_LENGTH) {
      throw new InvalidListingError(`Le titre est requis (${TITLE_MAX_LENGTH} caractères max)`, "title");
    }
    const brand = details.brand.trim();
    if (!brand) throw new InvalidListingError("La marque est requise", "brand");

    const maxYear = new Date().getFullYear() + 1; // les modèles de l'année suivante sortent dès l'automne
    if (!Number.isInteger(details.year) || details.year < MIN_YEAR || details.year > maxYear) {
      throw new InvalidListingError(`L'année doit être comprise entre ${MIN_YEAR} et ${maxYear}`, "year");
    }
    if (!Number.isInteger(details.priceCents) || details.priceCents < MIN_PRICE_CENTS || details.priceCents > MAX_PRICE_CENTS) {
      throw new InvalidListingError("Le prix doit être compris entre 1 € et 50 000 € (en centimes : 100 à 5000000)", "priceCents");
    }
    if (details.photoUrls.length > MAX_PHOTOS) throw new InvalidListingError(`${MAX_PHOTOS} photos maximum`, "photoUrls");
    if (details.photoUrls.some((url) => !URL_PATTERN.test(url))) {
      throw new InvalidListingError("Chaque photo doit être une URL http(s)", "photoUrls");
    }

    return {
      title,
      description: details.description.trim(),
      brand,
      model: details.model.trim(),
      category: oneOf(CATEGORIES, details.category, "category", "Catégorie inconnue"),
      frameSize: oneOf(FRAME_SIZES, details.frameSize, "frameSize", "Taille de cadre inconnue"),
      wheelSize: oneOf(WHEEL_SIZES, details.wheelSize, "wheelSize", "Taille de roue inconnue"),
      condition: oneOf(CONDITIONS, details.condition, "condition", "État inconnu"),
      year: details.year,
      priceCents: details.priceCents,
      photoUrls: [...details.photoUrls],
    };
  }

  private static assertPublishable(details: ListingDetails): void {
    if (!details.description) throw new InvalidListingError("Ajoute une description avant de publier", "description");
    if (details.photoUrls.length === 0) throw new InvalidListingError("Ajoute au moins une photo avant de publier", "photoUrls");
  }
}

function oneOf<T extends string>(allowed: readonly T[], value: string, field: string, message: string): T {
  if (!(allowed as readonly string[]).includes(value)) throw new InvalidListingError(message, field);
  return value as T;
}
