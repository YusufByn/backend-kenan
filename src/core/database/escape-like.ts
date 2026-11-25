/** Échappe % et _ pour qu'une recherche "50%" cherche bien le texte "50%". À utiliser avec `LIKE :x ESCAPE '\'`. */
export const escapeLike = (text: string) => text.replace(/[\\%_]/g, (char) => `\\${char}`);
