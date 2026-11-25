/**
 * Opérations sur un masque de bits (BigInt : pas de limite à 32 bits comme avec `number`).
 * Purement technique : ce que signifie chaque bit est défini par le contexte qui s'en sert.
 */

/** Allume les bits de `flags`. */
export const add = (mask: bigint, flags: bigint): bigint => mask | flags;

/** Éteint les bits de `flags`. */
export const remove = (mask: bigint, flags: bigint): bigint => mask & ~flags;

/** Au moins un des bits de `flags` est allumé. */
export const hasAny = (mask: bigint, flags: bigint): boolean => (mask & flags) !== 0n;

/** Tous les bits de `flags` sont allumés. */
export const hasAll = (mask: bigint, flags: bigint): boolean => (mask & flags) === flags;

/** Tous les bits de `mask` sont aussi dans `other`, et `other` en a au moins un de plus. */
export const isStrictSubset = (mask: bigint, other: bigint): boolean => hasAll(other, mask) && mask !== other;

/** OR de tous les flags : combine([A, B]) === A | B. */
export const combine = (flags: Iterable<bigint>): bigint => [...flags].reduce((mask, flag) => mask | flag, 0n);
