import { Payment, PaymentStatus } from '@prisma/client';
import { IsDate, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
    @IsString()
    @IsNotEmpty()
    readonly paymentIntentId: string;

    @IsNumber()
    @IsPositive()
    readonly amount: number;

    @IsString()
    @IsNotEmpty()
    readonly currency: string;

    @IsString()
    @IsNotEmpty()
    readonly cuid: string;

    @IsNumber()
    @IsPositive()
    readonly userId: number;

    @IsString()
    @IsNotEmpty()
    readonly status: PaymentStatus;

    @IsString()
    @IsNotEmpty()
    readonly payment_method_id: string;

    @IsNumber()
    @IsPositive()
    readonly totalItems: number;

    @IsUUID()
    readonly customerId: string;

    @IsDate()
    @IsNotEmpty()
    readonly paidAt?: Date

    constructor(payment: Payment | any) {
        this.paymentIntentId = payment.paymentIntentId;
        this.amount = payment.amount;
        this.currency = payment.currency;
        this.cuid = payment.cuid;
        this.userId = payment.userId;
        this.status = payment.status;
        this.payment_method_id = payment.payment_method;
        this.totalItems = payment.totalItems;
        this.customerId = payment.customerId;
        this.paidAt = payment.paidAt ?? undefined;
    }
}