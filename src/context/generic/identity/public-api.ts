// Seul point d'entrée du contexte identity pour le reste de l'application
// (importé via l'alias "@identity"). Tout ce qui n'est pas exporté ici est privé au contexte.
export { IdentityModule } from "./identity.module.js";

// Lire un user depuis un autre contexte.
export { UserQueries } from "./public/user-queries.js";
export type { UserDto } from "./public/user.dto.js";

// Protéger une route et savoir qui est connecté :
//   @UseGuards(JwtAuthGuard)  +  @CurrentUserId() userId: string
export { JwtAuthGuard } from "./public/jwt-auth.guard.js";
export { CurrentUserId } from "./public/current-user-id.decorator.js";

// Réserver une route aux users qui ont une ou plusieurs permissions (inclut JwtAuthGuard) :
//   @RequirePermission("ORDER_PLACE")  +  @CurrentUserId() userId: string
// Le catalogue des permissions (noms et bits) est dans domain/permissions.ts.
export { RequirePermission } from "./public/require-permission.decorator.js";
export type { PermissionName } from "./domain/permissions.js";

// Événements publiés par identity (à écouter avec EventBus.subscribe).
export { UserRegistered } from "./public/events/user-registered.event.js";
