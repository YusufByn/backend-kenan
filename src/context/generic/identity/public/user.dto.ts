/**
 * Forme publique d'un user, exposée aux autres contextes.
 * Volontairement indépendante de l'entité User : identity peut changer
 * son domaine sans casser ses consommateurs.
 */
export type UserDto = {
  id: string;
  name: string;
  email: string;
};
