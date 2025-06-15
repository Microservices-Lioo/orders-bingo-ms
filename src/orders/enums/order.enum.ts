import { Currency, OrderStatus } from "@prisma/client";

export const OrderStatusList = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.FAILED,
    OrderStatus.REFUNDED,
    OrderStatus.CANCELLED,
];

export const CurrencyList = [
    Currency.USD
];
