import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmPaymentDto {
    @IsString()
    @IsNotEmpty()
    readonly cuid: string;

    @IsString()
    @IsNotEmpty()
    readonly paymentId: string;

    @IsString()
    @IsNotEmpty()
    readonly paymentMethodId: string;
}