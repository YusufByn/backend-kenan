import { Injectable } from "@nestjs/common";
import { UserRepository } from "../../domain/user.repository.js";

/** Ce que tout le monde peut voir d'un user (un vendeur, par exemple). Pas d'email. */
export type PublicProfile = { id: string; name: string; memberSince: Date };

@Injectable()
export class GetPublicProfileUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(id: string): Promise<PublicProfile> {
    const { name, createdAt } = (await this.users.getById(id)).toProfile();
    return { id, name, memberSince: createdAt };
  }
}
