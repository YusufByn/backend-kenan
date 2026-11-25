import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@catalog";
import { IdentityModule } from "@identity";
import { CartRepository } from "./domain/cart.repository.js";
import { OrderRepository } from "./domain/order.repository.js";
import { AdminGetOrderController } from "./features/admin-get-order/admin-get-order.controller.js";
import { AdminGetOrderUseCase } from "./features/admin-get-order/admin-get-order.use-case.js";
import { AdminListOrdersController } from "./features/admin-list-orders/admin-list-orders.controller.js";
import { AdminListOrdersUseCase } from "./features/admin-list-orders/admin-list-orders.use-case.js";
import { AddToCartController } from "./features/add-to-cart/add-to-cart.controller.js";
import { AddToCartUseCase } from "./features/add-to-cart/add-to-cart.use-case.js";
import { CancelOrderController } from "./features/cancel-order/cancel-order.controller.js";
import { CancelOrderUseCase } from "./features/cancel-order/cancel-order.use-case.js";
import { CheckoutController } from "./features/checkout/checkout.controller.js";
import { CheckoutUseCase } from "./features/checkout/checkout.use-case.js";
import { ConfirmDeliveryController } from "./features/confirm-delivery/confirm-delivery.controller.js";
import { ConfirmDeliveryUseCase } from "./features/confirm-delivery/confirm-delivery.use-case.js";
import { GetCartController } from "./features/get-cart/get-cart.controller.js";
import { GetCartUseCase } from "./features/get-cart/get-cart.use-case.js";
import { GetOrderController } from "./features/get-order/get-order.controller.js";
import { GetOrderUseCase } from "./features/get-order/get-order.use-case.js";
import { ListMyOrdersController } from "./features/list-my-orders/list-my-orders.controller.js";
import { ListMyOrdersUseCase } from "./features/list-my-orders/list-my-orders.use-case.js";
import { ListMySalesController } from "./features/list-my-sales/list-my-sales.controller.js";
import { ListMySalesUseCase } from "./features/list-my-sales/list-my-sales.use-case.js";
import { PayOrderController } from "./features/pay-order/pay-order.controller.js";
import { PayOrderUseCase } from "./features/pay-order/pay-order.use-case.js";
import { RemoveFromCartController } from "./features/remove-from-cart/remove-from-cart.controller.js";
import { RemoveFromCartUseCase } from "./features/remove-from-cart/remove-from-cart.use-case.js";
import { ShipOrderController } from "./features/ship-order/ship-order.controller.js";
import { ShipOrderUseCase } from "./features/ship-order/ship-order.use-case.js";
import { CartItemOrmEntity } from "./infrastructure/cart-item.orm-entity.js";
import { OrderLineOrmEntity, OrderOrmEntity } from "./infrastructure/order.orm-entity.js";
import { TypeOrmCartRepository } from "./infrastructure/typeorm-cart.repository.js";
import { TypeOrmOrderRepository } from "./infrastructure/typeorm-order.repository.js";
import { OrderQueries } from "./public/order-queries.js";
import { OrderingOrderQueries } from "./public/ordering-order-queries.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItemOrmEntity, OrderOrmEntity, OrderLineOrmEntity]),
    IdentityModule, // JwtAuthGuard, RequirePermission
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
    AdminListOrdersController,
    AdminGetOrderController,
  ],
  providers: [
    GetCartUseCase,
    AddToCartUseCase,
    RemoveFromCartUseCase,
    CheckoutUseCase,
    ListMyOrdersUseCase,
    GetOrderUseCase,
    PayOrderUseCase,
    ShipOrderUseCase,
    ConfirmDeliveryUseCase,
    CancelOrderUseCase,
    ListMySalesUseCase,
    AdminListOrdersUseCase,
    AdminGetOrderUseCase,

    { provide: CartRepository, useClass: TypeOrmCartRepository },
    { provide: OrderRepository, useClass: TypeOrmOrderRepository },

    { provide: OrderQueries, useClass: OrderingOrderQueries },
  ],
  exports: [OrderQueries],
})
export class OrderingModule {}
