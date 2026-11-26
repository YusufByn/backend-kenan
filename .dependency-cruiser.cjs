/**
 * Règles d'architecture vérifiées automatiquement : `npm run lint:archi`.
 * Ce sont celles d'archi.md (« Règles de dépendance ») : si l'une casse, la commande échoue et dit quel import est en faute.
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "domaine-pur",
      comment:
        "Le domaine ne dépend d'aucun framework ni d'aucune autre couche : ni Nest, ni TypeORM, ni infrastructure/, features/, public/. " +
        "Seulement lui-même et le socle technique sans framework (core/errors, core/bitmask, types de pagination).",
      severity: "error",
      from: { path: "^src/context/[^/]+/[^/]+/domain/" },
      to: {
        pathNot: ["^src/context/[^/]+/[^/]+/domain/", "^src/core/(errors|bitmask)/", "^src/core/http/pagination\\.ts$"],
        dependencyTypesNot: ["core"],
      },
    },
    {
      name: "contexte-via-public-api",
      comment: "Un contexte n'importe jamais l'intérieur d'un autre contexte, seulement sa public-api.ts (alias @catalog, @identity...).",
      severity: "error",
      from: { path: "^src/context/([^/]+)/([^/]+)/" },
      to: { path: "^src/context/", pathNot: ["^src/context/$1/$2/", "^src/context/[^/]+/[^/]+/public-api\\.ts$"] },
    },
    {
      name: "slice-isolee",
      comment: "Une slice n'importe jamais une autre slice : ce qu'elles partagent va dans domain/.",
      severity: "error",
      from: { path: "^src/context/([^/]+)/([^/]+)/features/([^/]+)/" },
      to: { path: "^src/context/$1/$2/features/", pathNot: "^src/context/$1/$2/features/$3/" },
    },
    {
      name: "generic-ignore-le-metier",
      comment: "context/generic ne connaît ni context/core-domain ni context/supporting (ni leurs appels, ni leurs événements).",
      severity: "error",
      from: { path: "^src/context/generic/" },
      to: { path: "^src/context/(core-domain|supporting)/" },
    },
    {
      name: "supporting-ecoute-seulement",
      comment: "context/supporting peut écouter les événements du cœur métier, jamais l'appeler : il n'en importe que la public-api, et pas son module.",
      severity: "error",
      from: { path: "^src/context/supporting/" },
      to: { path: "^src/context/core-domain/[^/]+/[^/]+\\.module\\.ts$" },
    },
    {
      name: "core-sans-metier",
      comment: "src/core est du technique pur : il ne dépend d'aucun contexte.",
      severity: "error",
      from: { path: "^src/core/" },
      to: { path: "^src/context/" },
    },
    {
      name: "pas-de-cycle-entre-contextes",
      comment: "Deux contextes qui s'importent mutuellement : l'un des deux devrait écouter un événement de l'autre.",
      severity: "error",
      from: { path: "^src/context/([^/]+/[^/]+)/" },
      to: { circular: true, path: "^src/context/", pathNot: "^src/context/$1/" },
    },
    {
      name: "import-introuvable",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "^src/seed/" }, // outil de démarrage, au niveau de app.module.ts : il connaît tous les contextes
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      extensions: [".ts", ".js"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
