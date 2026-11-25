import { Controller, Get, Query } from "@nestjs/common";
import { withMeta } from "@core/http/api-response.js";
import { SearchListingsUseCase } from "./search-listings.use-case.js";
import { SearchListingsQuery } from "./search-listings.query.js";

@Controller("listings")
export class SearchListingsController {
  constructor(private readonly useCase: SearchListingsUseCase) {}

  @Get()
  async handle(@Query() query: SearchListingsQuery) {
    const { items, ...pagination } = await this.useCase.execute(query);
    return withMeta(items, pagination);
  }
}
