import { Controller, Get, Query } from "@nestjs/common";
import { withMeta } from "@core/http/api-response.js";
import { SearchListingsHandler } from "./search-listings.handler.js";
import { SearchListingsQuery } from "./search-listings.query.js";

@Controller("listings")
export class SearchListingsController {
  constructor(private readonly handler: SearchListingsHandler) {}

  @Get()
  async handle(@Query() query: SearchListingsQuery) {
    const { items, ...pagination } = await this.handler.execute(query);
    return withMeta(items, pagination);
  }
}
