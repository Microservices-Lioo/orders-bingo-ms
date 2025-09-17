import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from "class-validator";

export class PaymentSucceededDto {
    @IsString()
    @IsNotEmpty()
    stripePaymentId: string;

    @IsUUID()
    @IsString()
    @IsNotEmpty()
    orderId: string;
    
    @IsString()
    @IsNotEmpty()
    receiptUrl: string;
}