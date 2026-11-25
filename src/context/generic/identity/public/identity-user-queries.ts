import { Injectable } from "@nestjs/common";
import { UserRepository } from "../domain/user.repository.js";
import type { UserDto } from "./user.dto.js";
import { UserQueries } from "./user-queries.js";

/** Implémentation du contrat public. Privée au contexte : non exportée par public-api.ts. */
@Injectable()
export class IdentityUserQueries extends UserQueries {
  constructor(private readonly users: UserRepository) {
    super();
  }

  async findById(id: string): Promise<UserDto | null> {
    const user = await this.users.findById(id);
    if (!user) return null;

    // Mapping explicite entité -> contrat public, même s'ils se ressemblent aujourd'hui.
    const { id: userId, name, email } = user.toPrimitives();
    return { id: userId, name, email };
  }
}
