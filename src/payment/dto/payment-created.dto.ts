import { IsNotEmpty, IsString } from 'class-validator';
import { ReturnPaymentDto } from './return-payment.dto';

export class PaymentCreatedDto extends ReturnPaymentDto {
    @IsString()
    @IsNotEmpty()
    readonly clientSecret: string;

    constructor(payment: any) {
    super(payment);

    this.clientSecret = payment.client_secret;
    }
}