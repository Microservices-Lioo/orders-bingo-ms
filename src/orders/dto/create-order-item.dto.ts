import { IsNumber, IsPositive } from "class-validator";

export class CreateOrderItemDto {
    @IsNumber()
    @IsPositive()
    orderId: number;

    @IsNumber()
    @IsPositive()
    cardId: number;

    @IsNumber({ maxDecimalPlaces: 2})
    @IsPositive()
    priceUnit: number;

    @IsNumber()
    @IsPositive()
    quantity: number;
}