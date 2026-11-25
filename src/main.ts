import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { env } from "@core/config/env.js";
import { ApiExceptionFilter } from "@core/http/api-exception.filter.js";
import { ApiResponseInterceptor } from "@core/http/api-response.interceptor.js";
import { RequestValidationError } from "@core/http/request-validation.error.js";
import { AppModule } from "./app.module.js";

const app = await NestFactory.create(AppModule);

app.enableCors();
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

await app.listen(env.port);
console.log(`http://localhost:${env.port}`);
