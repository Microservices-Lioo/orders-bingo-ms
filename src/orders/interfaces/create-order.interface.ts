import { OrderStatus } from "@prisma/client";

export interface ICreateOrder {
    orderItems: {
        quantity: number;
        cardId: string;
        priceUnit: number;
    }[];
    totalAmount: number;
    totalItems: number;
    status: OrderStatus;
    paid: boolean;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    id: string;
    eventName: string;
}