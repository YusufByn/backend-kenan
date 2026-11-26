import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { env } from "@core/config/env.js";
import { ApiExceptionFilter } from "@core/http/api-exception.filter.js";
import { ApiResponseInterceptor } from "@core/http/api-response.interceptor.js";
import { RequestValidationError } from "@core/http/request-validation.error.js";
import { setupSwagger } from "@core/http/swagger.js";
import { AppModule } from "./app.module.js";

const app = await NestFactory.create<NestExpressApplication>(AppModule);

// En-têtes de sécurité HTTP (nosniff, HSTS, frameguard...). crossOriginResourcePolicy : les photos
// de /uploads doivent pouvoir s'afficher sur le front, qui est sur une autre origine.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Sans CORS_ORIGINS : toutes les origines (dev). En prod : seulement celles listées.
app.enableCors({ origin: env.corsOrigins.length > 0 ? env.corsOrigins : true });
// Derrière un reverse proxy (TRUST_PROXY=true) : la vraie IP du client, pour la limite de requêtes et les sessions.
if (env.trustProxy) app.set("trust proxy", 1);
// Photos uploadées (POST /uploads), servies telles quelles.
app.useStaticAssets(env.uploadsDir, { prefix: "/uploads/", maxAge: "7d" });

// whitelist + forbidNonWhitelisted : tout champ non déclaré dans un DTO est refusé (400).
// transform : les DTO deviennent de vraies instances, et les query params ("?page=2") sont convertis en nombres via @Type.
// exceptionFactory : les erreurs de validation sortent au format commun, avec le détail par champ dans `fields`.
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new RequestValidationError(errors),
  }),
);
// Succès : emballés en { code, data, meta } par l'intercepteur. Erreurs : { code, message, fields, errcode } par le filtre.
app.useGlobalInterceptors(new ApiResponseInterceptor());
app.useGlobalFilters(new ApiExceptionFilter());
app.enableShutdownHooks();

setupSwagger(app);

await app.listen(env.port);
console.log(`API : ${env.publicUrl}  |  Doc : ${env.publicUrl}/docs`);
