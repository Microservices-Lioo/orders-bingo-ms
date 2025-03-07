import { CheckoutSS, Payment, PaymentStatus } from '@prisma/client';
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { CheckoutSSList, PaymentStatusList } from '../enums';

export class CreatePaymentDto {
    @IsString()
    @IsNotEmpty()
    readonly checkoutSessionId: string;

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

    @IsEnum( PaymentStatusList, {
        message: `Possible status values are  ${PaymentStatusList}`
    } )
    @IsOptional()
    paymentStatus: PaymentStatus = PaymentStatus.UNPAID;

    @IsEnum( CheckoutSSList, {
        message: `Possible status values are  ${CheckoutSSList}`
    } )
    @IsOptional()
    checkoutSessionStatus: CheckoutSS = CheckoutSS.OPEN;

    @IsNumber()
    @IsPositive()
    readonly totalItems: number;

    @IsUUID()
    readonly customerId: string;

    @IsDate()
    @IsNotEmpty()
    paidAt?: Date

    constructor(payment: Payment | any) {
        this.checkoutSessionId = payment.checkoutSessionId;
        this.amount = payment.amount;
        this.currency = payment.currency;
        this.cuid = payment.cuid;
        this.userId = payment.userId;
        this.paymentStatus = payment.paymentStatus;
        this.checkoutSessionStatus = payment.checkoutSessionStatus;
        this.totalItems = payment.totalItems;
        this.customerId = payment.customerId;
        this.paidAt = payment.paidAt ?? undefined;
    }
}