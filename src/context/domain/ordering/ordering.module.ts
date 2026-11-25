import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@catalog";
import { IdentityModule } from "@identity";
import { CartRepository } from "./domain/cart.repository.js";
import { OrderRepository } from "./domain/order.repository.js";
import { AddToCartController } from "./features/add-to-cart/add-to-cart.controller.js";
import { AddToCartHandler } from "./features/add-to-cart/add-to-cart.handler.js";
import { CancelOrderController } from "./features/cancel-order/cancel-order.controller.js";
import { CancelOrderHandler } from "./features/cancel-order/cancel-order.handler.js";
import { CheckoutController } from "./features/checkout/checkout.controller.js";
import { CheckoutHandler } from "./features/checkout/checkout.handler.js";
import { ConfirmDeliveryController } from "./features/confirm-delivery/confirm-delivery.controller.js";
import { ConfirmDeliveryHandler } from "./features/confirm-delivery/confirm-delivery.handler.js";
import { GetCartController } from "./features/get-cart/get-cart.controller.js";
import { GetCartHandler } from "./features/get-cart/get-cart.handler.js";
import { GetOrderController } from "./features/get-order/get-order.controller.js";
import { GetOrderHandler } from "./features/get-order/get-order.handler.js";
import { ListMyOrdersController } from "./features/list-my-orders/list-my-orders.controller.js";
import { ListMyOrdersHandler } from "./features/list-my-orders/list-my-orders.handler.js";
import { ListMySalesController } from "./features/list-my-sales/list-my-sales.controller.js";
import { ListMySalesHandler } from "./features/list-my-sales/list-my-sales.handler.js";
import { PayOrderController } from "./features/pay-order/pay-order.controller.js";
import { PayOrderHandler } from "./features/pay-order/pay-order.handler.js";
import { RemoveFromCartController } from "./features/remove-from-cart/remove-from-cart.controller.js";
import { RemoveFromCartHandler } from "./features/remove-from-cart/remove-from-cart.handler.js";
import { ShipOrderController } from "./features/ship-order/ship-order.controller.js";
import { ShipOrderHandler } from "./features/ship-order/ship-order.handler.js";
import { CartItemOrmEntity } from "./infrastructure/cart-item.orm-entity.js";
import { OrderLineOrmEntity, OrderOrmEntity } from "./infrastructure/order.orm-entity.js";
import { TypeOrmCartRepository } from "./infrastructure/typeorm-cart.repository.js";
import { TypeOrmOrderRepository } from "./infrastructure/typeorm-order.repository.js";
import { OrderQueries } from "./public/order-queries.js";
import { OrderingOrderQueries } from "./public/ordering-order-queries.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItemOrmEntity, OrderOrmEntity, OrderLineOrmEntity]),
    IdentityModule, // JwtAuthGuard
    CatalogModule, // ListingQueries, ListingReservations
  ],
  controllers: [
    GetCartController,
    AddToCartController,
    RemoveFromCartController,
    CheckoutController,
    ListMyOrdersController,
    GetOrderController,
    PayOrderController,
    ShipOrderController,
    ConfirmDeliveryController,
    CancelOrderController,
    ListMySalesController,
  ],
  providers: [
    GetCartHandler,
    AddToCartHandler,
    RemoveFromCartHandler,
    CheckoutHandler,
    ListMyOrdersHandler,
    GetOrderHandler,
    PayOrderHandler,
    ShipOrderHandler,
    ConfirmDeliveryHandler,
    CancelOrderHandler,
    ListMySalesHandler,

    { provide: CartRepository, useClass: TypeOrmCartRepository },
    { provide: OrderRepository, useClass: TypeOrmOrderRepository },

    { provide: OrderQueries, useClass: OrderingOrderQueries },
  ],
  exports: [OrderQueries],
})
export class OrderingModule {}
