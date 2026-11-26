import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";

/**
 * Documentation interactive sur /docs (JSON brut sur /docs-json).
 * Les DTO sont décrits automatiquement par le plugin @nestjs/swagger (nest-cli.json), à partir des types
 * TypeScript et des décorateurs class-validator : aucune annotation à ajouter dans les slices.
 * Les routes sont regroupées par leur premier segment (/auth, /listings, /orders...).
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Vélo Marketplace API")
    .setDescription(
      "Marketplace de vélos d'occasion entre particuliers.\n\n" +
        "**Authentification** : `POST /auth/login` renvoie un `accessToken` (15 min) et un `refreshToken`. " +
        "Clique sur **Authorize** et colle l'accessToken. Quand il expire (401 `TOKEN_INVALID`), appelle `POST /auth/refresh`.\n\n" +
        "**Réponses** : succès `{ code, data, meta }`, erreurs `{ code, message, fields, errcode }`. " +
        "`errcode` est stable : c'est lui que le front doit tester.\n\n" +
        "**Comptes de démo** (après `npm run seed`) : `admin@velo.test`, `vendeur@velo.test`, `acheteur@velo.test`, mot de passe `password123`.",
    )
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })
    .addSecurityRequirements("bearer")
    .build();

  const document = groupByFirstSegment(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs-json",
    swaggerOptions: { persistAuthorization: true, tagsSorter: "alpha", operationsSorter: "alpha" },
  });
}

/** /admin/users → tag "admin", /me/sessions → "me"... sans écrire @ApiTags dans chaque controller. */
function groupByFirstSegment(document: OpenAPIObject): OpenAPIObject {
  for (const [path, item] of Object.entries(document.paths)) {
    const tag = path.split("/")[1] || "health";
    for (const operation of Object.values(item)) {
      if (operation && typeof operation === "object" && "responses" in operation) operation.tags = [tag];
    }
  }
  return document;
}
