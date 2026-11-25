import { IsNotEmpty, IsString } from "class-validator";

export class ShipOrderDto {
  @IsString()
  @IsNotEmpty()
  trackingNumber!: string;
}
