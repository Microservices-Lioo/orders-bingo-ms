import { Payment } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class ReturnPaymentDto {
    @IsString()
    @IsNotEmpty()
    readonly id: string;

    @IsNumber()
    @IsPositive()
    readonly amount: number;

    @IsString()
    @IsNotEmpty()
    readonly currency: string;

    @IsString()
    @IsNotEmpty()
    readonly status: string;

    @IsString()
    @IsNotEmpty()
    readonly paymentMethod: string;

    constructor(payment: Payment | any) {
        this.id = payment.id;
        this.amount = payment.amount;
        this.currency = payment.currency;
        this.status = payment.status;
        this.paymentMethod = payment.payment_method;
    }
}