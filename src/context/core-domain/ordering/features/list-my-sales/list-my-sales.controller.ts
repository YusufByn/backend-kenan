import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ListMySalesUseCase } from "./list-my-sales.use-case.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class ListMySalesController {
  constructor(private readonly useCase: ListMySalesUseCase) {}

  @Get("sales")
  handle(@CurrentUserId() userId: string) {
    return this.useCase.execute(userId);
  }
}
