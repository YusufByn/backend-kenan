import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";

@Controller()
export class AppController {
  constructor(private readonly db: DataSource) {}

  /** Health check pour un hébergeur ou un monitoring : l'API répond et la base aussi. */
  @Get()
  async health() {
    const startedAt = Date.now();
    await this.db.query("SELECT 1");
    return { status: "ok", database: "ok", databaseLatencyMs: Date.now() - startedAt, uptimeSeconds: Math.round(process.uptime()) };
  }
}
